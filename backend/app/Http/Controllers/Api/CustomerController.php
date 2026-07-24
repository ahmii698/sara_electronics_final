<?php
// app/Http/Controllers/Api/CustomerController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Guarantor;
use App\Models\EmployeeAccount;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class CustomerController extends Controller
{
    // ✅ Combined limit across both accounts for the same CNIC
    const MAX_ACCOUNTS_PER_CNIC = 2;
    const MAX_COMBINED_AMOUNT = 100000;

    public function index(Request $request)
    {
        $query = Customer::with(['branch', 'creator', 'accounts', 'employeeAccount', 'employeeAccount.employee']);

        if ($request->search) {
            $query->where('name', 'LIKE', "%{$request->search}%")
                  ->orWhere('cnic', 'LIKE', "%{$request->search}%")
                  ->orWhere('phone', 'LIKE', "%{$request->search}%")
                  ->orWhere('product_name', 'LIKE', "%{$request->search}%");
        }

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $customers = $query->orderBy('id', 'desc')->paginate(20);
        return $this->sendResponse($customers, 'Customers retrieved successfully');
    }

    public function show($id)
    {
        $customer = Customer::with([
            'branch', 'creator', 'guarantors', 'employeeAccount.employee',
            'accounts' => function($q) {
                $q->with(['product', 'installments']);
            }
        ])->find($id);

        if (!$customer) {
            return $this->sendError('Customer not found', 404);
        }

        return $this->sendResponse($customer, 'Customer details retrieved');
    }

    // ============================================
    // ✅ UPGRADED: CNIC check — ab poori account/limit/guarantor report deta hai
    // ============================================
    public function checkCnic(Request $request)
    {
        $request->validate(['cnic' => 'required|string']);

        $cnic = $request->cnic;
        $cleanCnic = preg_replace('/[^0-9]/', '', $cnic);

        // ✅ 1) Kya ye CNIC pehle se ek customer hai (aur uske accounts kya hain)
        $customer = Customer::where('cnic', $cnic)
            ->orWhere('cnic', $cleanCnic)
            ->with([
                'accounts' => function ($q) {
                    $q->orderBy('created_at', 'desc');
                },
                'accounts.installments',
                'accounts.creator',
                'accounts.employeeAccount.employee',
            ])
            ->first();

        // ✅ 2) Kya ye CNIC kisi aur ka guarantor hai
        $guarantorRecords = Guarantor::where('cnic', $cnic)
            ->orWhere('cnic', $cleanCnic)
            ->with('customer')
            ->get();

        $existsAsCustomer = $customer !== null;
        $existsAsGuarantor = $guarantorRecords->isNotEmpty();

        $accountsData = [];
        $accountsCount = 0;
        $totalCombinedAmount = 0;
        $canOpenMore = true;
        $remainingLimit = self::MAX_COMBINED_AMOUNT;

        if ($customer) {
            $accounts = $customer->accounts;
            $accountsCount = $accounts->count();
            $totalCombinedAmount = (float) $accounts->sum('total_amount');
            $canOpenMore = $accountsCount < self::MAX_ACCOUNTS_PER_CNIC
                && $totalCombinedAmount < self::MAX_COMBINED_AMOUNT;
            $remainingLimit = max(0, self::MAX_COMBINED_AMOUNT - $totalCombinedAmount);

            $accountsData = $accounts->map(function ($acc) {
                return [
                    'id' => $acc->id,
                    'case_no' => $acc->case_no,
                    'product_name' => $acc->product_name,
                    'total_amount' => (float) $acc->total_amount,
                    'paid_amount' => (float) $acc->paid_amount,
                    'balance' => (float) $acc->balance,
                    'monthly_installment' => (float) $acc->monthly_installment,
                    'total_installments' => $acc->total_installments,
                    'installments_paid' => $acc->installments_paid,
                    'status' => $acc->status,
                    'branch_id' => $acc->branch_id,
                    'created_at' => $acc->created_at,
                    'creator_name' => $acc->creator->name ?? 'N/A',
                    'employee_name' => $acc->employeeAccount->employee->name ?? 'N/A',
                    'installments' => $acc->installments->map(function ($i) {
                        return [
                            'month' => $i->month,
                            'due_amount' => (float) $i->due_amount,
                            'paid_amount' => (float) $i->paid_amount,
                            'balance' => (float) $i->balance,
                            'status' => $i->status,
                        ];
                    }),
                ];
            });
        }

        return $this->sendResponse([
            'cnic' => $cnic,
            'exists_as_customer' => $existsAsCustomer,
            'exists_as_guarantor' => $existsAsGuarantor,
            'is_available' => !($existsAsCustomer || $existsAsGuarantor),

            // ✅ customer + accounts report
            'customer' => $customer ? [
                'id' => $customer->id,
                'name' => $customer->name,
                'cnic' => $customer->cnic,
                'phone' => $customer->phone,
                'address' => $customer->address,
                'work' => $customer->work,
                'branch_id' => $customer->branch_id,
                'created_at' => $customer->created_at,
            ] : null,
            'accounts' => $accountsData,
            'accounts_count' => $accountsCount,
            'total_combined_amount' => $totalCombinedAmount,
            'can_open_more' => $canOpenMore,
            'remaining_limit' => $remainingLimit,

            // ✅ agar ye CNIC khud kisi ka guarantor hai
            'guarantor_records' => $guarantorRecords->map(function ($g) {
                return [
                    'guarantor_name' => $g->name,
                    'guarantor_cnic' => $g->cnic,
                    'customer_name' => $g->customer->name ?? 'N/A',
                    'customer_cnic' => $g->customer->cnic ?? 'N/A',
                    'customer_id' => $g->customer_id,
                ];
            }),

            'message' => $existsAsCustomer ? 'This CNIC already exists as a customer' :
                        ($existsAsGuarantor ? 'This CNIC already exists as a guarantor' :
                        'CNIC is available')
        ], 'CNIC check completed');
    }

    // ✅ FIXED: Store - created_by = Employee ID (who opened)
    public function store(Request $request)
    {
        try {
            Log::info('========== CUSTOMER STORE REQUEST ==========');
            Log::info('created_by (employee_id):', [$request->created_by]);
            Log::info('product_name:', [$request->product_name]);

            // ============================================
            // ✅ HARD LIMIT CHECK: max 2 accounts per CNIC,
            // combined total_amount max PKR 100,000
            // ============================================
            $cleanCnic = preg_replace('/[^0-9]/', '', $request->cnic ?? '');

            $existingCustomer = Customer::where('cnic', $request->cnic)
                ->orWhere('cnic', $cleanCnic)
                ->with('accounts')
                ->first();

            if ($existingCustomer) {
                $existingAccountsCount = $existingCustomer->accounts->count();
                $existingTotal = (float) $existingCustomer->accounts->sum('total_amount');

                // Naye account ka amount — invoice_price hi total_amount ban ke jayega
                $newAccountAmount = (float) $request->input('invoice_price', 0);

                if ($existingAccountsCount >= self::MAX_ACCOUNTS_PER_CNIC) {
                    return response()->json([
                        'success' => false,
                        'message' => 'This CNIC already has ' . self::MAX_ACCOUNTS_PER_CNIC . ' accounts. Maximum limit reached.'
                    ], 422);
                }

                if (($existingTotal + $newAccountAmount) > self::MAX_COMBINED_AMOUNT) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Combined account amount cannot exceed PKR ' . number_format(self::MAX_COMBINED_AMOUNT) . '. Remaining limit: PKR ' . number_format(self::MAX_COMBINED_AMOUNT - $existingTotal)
                    ], 422);
                }
            }
            // ============================================

            // Get guarantors from request
            $guarantors = [];
            
            if ($request->has('guarantors')) {
                $input = $request->input('guarantors');
                
                if (is_string($input)) {
                    $decoded = json_decode($input, true);
                    if (is_array($decoded)) {
                        $guarantors = $decoded;
                    }
                } 
                elseif (is_array($input)) {
                    $guarantors = $input;
                }
            }
            
            if (empty($guarantors)) {
                $temp = [];
                $index = 0;
                while ($request->has("guarantors.{$index}.name")) {
                    $temp[] = [
                        'name' => $request->input("guarantors.{$index}.name"),
                        'cnic' => $request->input("guarantors.{$index}.cnic"),
                        'phone' => $request->input("guarantors.{$index}.phone"),
                        'address' => $request->input("guarantors.{$index}.address", ''),
                    ];
                    $index++;
                }
                if (!empty($temp)) {
                    $guarantors = $temp;
                }
            }
            
            if (empty($guarantors)) {
                $all = $request->all();
                if (isset($all['guarantors']) && is_array($all['guarantors'])) {
                    $guarantors = $all['guarantors'];
                }
            }

            Log::info('Guarantors extracted:', ['count' => count($guarantors)]);

            // Filter valid guarantors
            $validGuarantors = [];
            foreach ($guarantors as $g) {
                if (!empty($g['name']) && !empty($g['cnic']) && !empty($g['phone'])) {
                    $validGuarantors[] = [
                        'name' => trim($g['name']),
                        'cnic' => trim($g['cnic']),
                        'phone' => trim($g['phone']),
                        'address' => isset($g['address']) ? trim($g['address']) : '',
                    ];
                }
            }

            Log::info('Valid Guarantors count:', ['count' => count($validGuarantors)]);

            // ✅ Validate — "unique:customers,cnic" hata diya gaya hai.
            // Wajah: system 1 CNIC pe 2 accounts allow karta hai (MAX_ACCOUNTS_PER_CNIC),
            // magar ye Laravel rule 2nd account ko hamesha "cnic already taken" keh kar
            // reject kar deta tha — chahe wo 2-account/1-lakh limit ke andar hi kyun na ho.
            // Asli limit-check upar wale custom block mein already ho raha hai, isi liye
            // ye purana unique rule ab zaroori nahi.
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:100',
                'cnic' => 'required|string',
                'phone' => 'required|string|max:20',
                'address' => 'nullable|string',
                'work' => 'nullable|string|max:100',
                'product_name' => 'nullable|string|max:255',
                'branch_id' => 'required|exists:branches,id',
                'status' => 'nullable|in:active,hold,closed',
                'created_by' => 'required|exists:users,id',  // ✅ Employee ID
            ]);

            if ($validator->fails()) {
                Log::error('Validation failed:', $validator->errors()->toArray());
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            // ✅ Get employee_id from request
            $employeeId = $request->created_by;
            
            Log::info('✅ Employee ID from request:', ['employee_id' => $employeeId]);

            // Check guarantors count
            if (count($validGuarantors) < 2) {
                return response()->json([
                    'success' => false,
                    'errors' => [
                        'guarantors' => ['Minimum 2 guarantors are required. Found: ' . count($validGuarantors)]
                    ]
                ], 422);
            }

            if (count($validGuarantors) > 3) {
                return response()->json([
                    'success' => false,
                    'errors' => [
                        'guarantors' => ['Maximum 3 guarantors are allowed. Found: ' . count($validGuarantors)]
                    ]
                ], 422);
            }

            // Check if any CNIC already exists as customer
            foreach ($validGuarantors as $g) {
                if (Customer::where('cnic', $g['cnic'])->exists()) {
                    return response()->json([
                        'success' => false,
                        'message' => "CNIC {$g['cnic']} already exists as a customer"
                    ], 422);
                }
            }

            // Check employee
            $employee = User::find($employeeId);
            
            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found with ID: ' . $employeeId
                ], 422);
            }
            
            $allowedRoles = ['employee', 'admin', 'manager'];
            if (!in_array($employee->role, $allowedRoles)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Selected user is not authorized. Role: ' . $employee->role
                ], 422);
            }

            Log::info('✅ Employee verified:', ['id' => $employeeId, 'name' => $employee->name, 'role' => $employee->role]);

            // Handle file uploads
            $cnicFrontPath = null;
            if ($request->hasFile('cnic_front')) {
                $file = $request->file('cnic_front');
                $destinationPath = public_path('storage/customers/cnic_front');
                if (!file_exists($destinationPath)) {
                    mkdir($destinationPath, 0777, true);
                }
                $filename = time() . '_front_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $file->move($destinationPath, $filename);
                $cnicFrontPath = 'customers/cnic_front/' . $filename;
            }

            $cnicBackPath = null;
            if ($request->hasFile('cnic_back')) {
                $file = $request->file('cnic_back');
                $destinationPath = public_path('storage/customers/cnic_back');
                if (!file_exists($destinationPath)) {
                    mkdir($destinationPath, 0777, true);
                }
                $filename = time() . '_back_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $file->move($destinationPath, $filename);
                $cnicBackPath = 'customers/cnic_back/' . $filename;
            }

            $voiceConsentPath = null;
            if ($request->hasFile('voice_consent')) {
                $file = $request->file('voice_consent');
                $destinationPath = public_path('storage/customers/voice');
                if (!file_exists($destinationPath)) {
                    mkdir($destinationPath, 0777, true);
                }
                $filename = time() . '_voice_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $file->move($destinationPath, $filename);
                $voiceConsentPath = 'customers/voice/' . $filename;
            }

            $additionalImage1Path = null;
            if ($request->hasFile('additional_image_1')) {
                $file = $request->file('additional_image_1');
                $destinationPath = public_path('storage/customers/additional_images');
                if (!file_exists($destinationPath)) {
                    mkdir($destinationPath, 0777, true);
                }
                $filename = time() . '_add1_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $file->move($destinationPath, $filename);
                $additionalImage1Path = 'customers/additional_images/' . $filename;
            }

            $additionalImage2Path = null;
            if ($request->hasFile('additional_image_2')) {
                $file = $request->file('additional_image_2');
                $destinationPath = public_path('storage/customers/additional_images');
                if (!file_exists($destinationPath)) {
                    mkdir($destinationPath, 0777, true);
                }
                $filename = time() . '_add2_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $file->move($destinationPath, $filename);
                $additionalImage2Path = 'customers/additional_images/' . $filename;
            }

            DB::beginTransaction();

            try {
                // ✅ 1. Har account ke liye hamesha ek NAYA, bilkul independent
                // Customer row banega — chahe same CNIC ka pehle se koi customer
                // record maujood ho. Koi reuse/link nahi. (DB ke cnic column se
                // unique constraint migration ke zariye hata diya gaya hai, isi
                // liye ab ye insert "Duplicate entry" error diye bina chalega.)
                $customer = Customer::create([
                    'name' => $request->name,
                    'cnic' => $request->cnic,
                    'phone' => $request->phone,
                    'address' => $request->address ?? '',
                    'work' => $request->work ?? '',
                    'product_name' => $request->product_name ?? '',
                    'branch_id' => $request->branch_id,
                    'status' => $request->status ?? 'active',
                    'created_by' => $employeeId,  // ✅ Employee ID (who opened)
                    'cnic_front' => $cnicFrontPath,
                    'cnic_back' => $cnicBackPath,
                    'voice_consent' => $voiceConsentPath,
                    'additional_image_1' => $additionalImage1Path,
                    'additional_image_2' => $additionalImage2Path,
                ]);

                Log::info('✅ Customer created:', ['id' => $customer->id, 'created_by' => $employeeId]);

                // ✅ 2. Create Employee Account
                $employeeAccount = EmployeeAccount::create([
                    'employee_id' => $employeeId,  // ✅ Employee ID (who opened)
                    'customer_id' => $customer->id,
                    'branch_id' => $request->branch_id,
                    'account_opened_date' => now(),
                    'month' => now()->format('Y-m'),
                    'year' => now()->year,
                    'status' => 'active',
                    'created_by' => $employeeId,  // ✅ Employee ID
                ]);

                Log::info('✅ EmployeeAccount created:', ['id' => $employeeAccount->id, 'employee_id' => $employeeId]);

                // ✅ 3. Guarantors are intentionally NOT created here.
                // GuarantorController@store handles guarantor creation (with cnic_front / cnic_back images).
                // Creating them here too used to cause a duplicate record with NULL images,
                // which then made the frontend's follow-up /guarantors call (with the actual
                // images) get rejected as "already added for this customer".
                Log::info('ℹ️ Skipping guarantor creation in CustomerController — handled by GuarantorController with images', [
                    'valid_guarantors_count' => count($validGuarantors)
                ]);

                DB::commit();
                
                $customer->load(['guarantors', 'employeeAccount', 'employeeAccount.employee', 'branch', 'creator']);
                
                return response()->json([
                    'success' => true,
                    'message' => 'Customer created successfully',
                    'data' => $customer,
                    'employee_account_id' => $employeeAccount->id,
                    'employee_id' => $employeeId
                ], 201);
                
            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('❌ Failed to create customer:', ['error' => $e->getMessage()]);
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage()
                ], 500);
            }
            
        } catch (\Exception $e) {
            Log::error('❌ Customer store error:', [
                'message' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $customer = Customer::find($id);
        if (!$customer) {
            return $this->sendError('Customer not found', 404);
        }

        $request->validate([
            'name' => 'sometimes|string|max:100',
            'phone' => 'sometimes|string|max:20',
            'address' => 'nullable|string',
            'work' => 'nullable|string|max:100',
            'product_name' => 'nullable|string|max:255',
            'status' => 'nullable|in:active,hold,closed'
        ]);

        $customer->update($request->all());
        return $this->sendResponse($customer, 'Customer updated successfully');
    }

    public function destroy($id)
    {
        $customer = Customer::find($id);
        if (!$customer) {
            return $this->sendError('Customer not found', 404);
        }

        if ($customer->employeeAccount) {
            $customer->employeeAccount()->delete();
        }
        $customer->delete();
        
        return $this->sendResponse(null, 'Customer deleted successfully');
    }

    public function searchByCNIC(Request $request)
    {
        $request->validate(['cnic' => 'required|string']);
        
        $customer = Customer::with(['guarantors', 'employeeAccount', 'employeeAccount.employee'])
            ->where('cnic', 'LIKE', "%{$request->cnic}%")
            ->first();
        
        if (!$customer) {
            return $this->sendError('Customer not found', 404);
        }

        return $this->sendResponse($customer, 'Customer found');
    }

    public function sendResponse($data, $message = 'Success', $statusCode = 200)
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data
        ], $statusCode);
    }

    public function sendError($message, $statusCode = 400)
    {
        return response()->json([
            'success' => false,
            'message' => $message
        ], $statusCode);
    }
}
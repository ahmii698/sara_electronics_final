<?php
// app/Http/Controllers/Api/CustomerController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Guarantor;
use App\Models\EmployeeAccount;
use App\Models\Account;
use App\Models\Installment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class CustomerController extends Controller
{
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

    public function checkCnic(Request $request)
    {
        $request->validate(['cnic' => 'required|string']);

        $cnic = $request->cnic;
        $cleanCnic = preg_replace('/[^0-9]/', '', $cnic);

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

        $guarantorRecords = Guarantor::where('cnic', $cnic)
            ->orWhere('cnic', $cleanCnic)
            ->with('customer')
            ->get();

        $existsAsCustomer = $customer !== null;
        $existsAsGuarantor = $guarantorRecords->isNotEmpty();

        $isUnlimited = Customer::where('cnic', $cnic)
            ->orWhere('cnic', $cleanCnic)
            ->where('is_unlimited', true)
            ->exists();

        $accountsData = [];
        $accountsCount = 0;
        $totalCombinedAmount = 0;
        $canOpenMore = true;
        $remainingLimit = self::MAX_COMBINED_AMOUNT;

        if ($customer) {
            $accounts = $customer->accounts;
            $openAccounts = $accounts->where('balance', '>', 0);
            $accountsCount = $openAccounts->count();
            $totalCombinedAmount = (float) $openAccounts->sum('total_amount');

            if ($isUnlimited) {
                $canOpenMore = true;
                $remainingLimit = null;
            } else {
                $canOpenMore = $accountsCount < self::MAX_ACCOUNTS_PER_CNIC
                    && $totalCombinedAmount < self::MAX_COMBINED_AMOUNT;
                $remainingLimit = max(0, self::MAX_COMBINED_AMOUNT - $totalCombinedAmount);
            }

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
            'is_unlimited' => $isUnlimited,
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

    public function store(Request $request)
    {
        try {
            Log::info('========== CUSTOMER STORE REQUEST ==========');
            Log::info('created_by (employee_id):', [$request->created_by]);
            Log::info('product_name:', [$request->product_name]);

            $cleanCnic = preg_replace('/[^0-9]/', '', $request->cnic ?? '');

            $existingCustomer = Customer::where('cnic', $request->cnic)
                ->orWhere('cnic', $cleanCnic)
                ->with('accounts')
                ->first();

            $isUnlimitedCnic = Customer::where('cnic', $request->cnic)
                ->orWhere('cnic', $cleanCnic)
                ->where('is_unlimited', true)
                ->exists();

            if ($existingCustomer && !$isUnlimitedCnic) {
                $openAccounts = $existingCustomer->accounts->where('balance', '>', 0);
                $existingAccountsCount = $openAccounts->count();
                $existingTotal = (float) $openAccounts->sum('total_amount');

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
            } elseif ($isUnlimitedCnic) {
                Log::info('✅ Special/unlimited CNIC — skipping account-count and combined-amount limit checks', ['cnic' => $request->cnic]);
            }

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

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:100',
                'cnic' => 'required|string',
                'phone' => 'required|string|max:20',
                'address' => 'nullable|string',
                'work' => 'nullable|string|max:100',
                'product_name' => 'nullable|string|max:255',
                'branch_id' => 'required|exists:branches,id',
                'status' => 'nullable|in:active,hold,closed',
                'created_by' => 'required|exists:users,id',
                'invoice_price' => 'required|numeric|min:0',
                'advance_payment' => 'nullable|numeric|min:0',
                'number_of_installments' => 'required|integer|min:1',
                'due_date' => 'required|date',
            ]);

            if ($validator->fails()) {
                Log::error('Validation failed:', $validator->errors()->toArray());
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $employeeId = $request->created_by;
            Log::info('✅ Employee ID from request:', ['employee_id' => $employeeId]);

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

            foreach ($validGuarantors as $g) {
                if (Customer::where('cnic', $g['cnic'])->exists()) {
                    return response()->json([
                        'success' => false,
                        'message' => "CNIC {$g['cnic']} already exists as a customer"
                    ], 422);
                }
            }

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
                // ✅ 1. Create Customer
                $customer = Customer::create([
                    'name' => $request->name,
                    'cnic' => $request->cnic,
                    'phone' => $request->phone,
                    'address' => $request->address ?? '',
                    'work' => $request->work ?? '',
                    'product_name' => $request->product_name ?? '',
                    'branch_id' => $request->branch_id,
                    'status' => $request->status ?? 'active',
                    'created_by' => $employeeId,
                    'cnic_front' => $cnicFrontPath,
                    'cnic_back' => $cnicBackPath,
                    'voice_consent' => $voiceConsentPath,
                    'additional_image_1' => $additionalImage1Path,
                    'additional_image_2' => $additionalImage2Path,
                ]);

                Log::info('✅ Customer created:', ['id' => $customer->id, 'created_by' => $employeeId]);

                // ✅ 2. Create Employee Account
                $employeeAccount = EmployeeAccount::create([
                    'employee_id' => $employeeId,
                    'customer_id' => $customer->id,
                    'branch_id' => $request->branch_id,
                    'account_opened_date' => now(),
                    'month' => now()->format('Y-m'),
                    'year' => now()->year,
                    'status' => 'active',
                    'created_by' => $employeeId,
                ]);

                Log::info('✅ EmployeeAccount created:', ['id' => $employeeAccount->id, 'employee_id' => $employeeId]);

                // ✅ 3. Create Account
                $invoicePrice = (float) $request->invoice_price;
                $advancePayment = (float) ($request->advance_payment ?? 0);
                $numberOfInstallments = (int) $request->number_of_installments;
                $dueDate = $request->due_date;

                // Calculate monthly installment
                // ✅ Advance sirf yahan EK dafa invoice_price se minus hoti hai.
                // (90,000 - 12,000) / 10 = 7,800 per installment.
                $remainingAmount = $invoicePrice - $advancePayment;
                $monthlyInstallment = $numberOfInstallments > 0 ? round($remainingAmount / $numberOfInstallments, 0) : 0;

                // Generate case number
                $lastAccount = Account::orderBy('id', 'desc')->first();
                $nextId = $lastAccount ? $lastAccount->id + 1 : 1;
                $caseNo = 'SR-' . str_pad($nextId, 6, '0', STR_PAD_LEFT);

                // ✅ FIX: Account ka paid_amount abhi bhi advance_payment hi hai
                // (Account Summary mein "Total Paid" advance dikhata rahega),
                // lekin installments_paid ab 0 se start hoga — kyunke advance
                // ne koi installment "bhari" nahi, wo sirf total amount
                // (90,000 -> 78,000) kam karne ke liye use hui hai.
                $account = Account::create([
                    'customer_id' => $customer->id,
                    'employee_account_id' => $employeeAccount->id,
                    'branch_id' => $request->branch_id,
                    'case_no' => $caseNo,
                    'product_name' => $request->product_name ?? '',
                    'total_amount' => $invoicePrice,
                    'paid_amount' => $advancePayment, // ✅ Advance payment account-level pe record
                    'balance' => $invoicePrice - $advancePayment, // ✅ Remaining balance
                    'monthly_installment' => $monthlyInstallment,
                    'total_installments' => $numberOfInstallments,
                    'installments_paid' => 0, // ✅ FIX: advance ne koi installment nahi bhari
                    'due_date' => $dueDate,
                    'next_due_date' => date('Y-m-d', strtotime('+1 month', strtotime($dueDate))),
                    'status' => 'active',
                    'created_by' => $employeeId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                Log::info('✅ Account created:', [
                    'id' => $account->id, 
                    'case_no' => $caseNo,
                    'total_amount' => $invoicePrice,
                    'paid_amount' => $advancePayment,
                    'balance' => $invoicePrice - $advancePayment,
                    'due_date' => $dueDate,
                ]);

                // ============================================
                // ✅ FIX: 4. Create Installments — advance payment ab
                // installments ke against DOBARA "paid" mark nahi hoti.
                //
                // Purana bug: advance_payment pehle hi invoice_price se
                // minus ho kar monthlyInstallment (7,800) nikal chuki thi.
                // Lekin phir isi 12,000 advance ko dobara loop mein le kar
                // pehli 1-2 installments ka paid_amount bhi bhar diya jata
                // tha — yani 12,000 do dafa "use" ho rahe thay: ek dafa
                // total kam karne ke liye, doosri dafa installment
                // "already paid" dikhane ke liye. Isi wajah se Payment
                // History mein pehli installment "Paid" aur doosri
                // "Partial" ghalat dikh rahi thi, jab ke customer ne abhi
                // tak koi installment bhari hi nahi thi.
                //
                // Ab har installment apne poore due_amount (monthlyInstallment)
                // ke sath "unpaid" bantay hain. Jo installment ka due date
                // guzar chuka ho, wo aging/overdue logic (agingReport /
                // overdue functions) se khud "Overdue" categorize ho jayegi.
                // Advance sirf account ke total/balance mein reflect hoga.
                //
                // Month calculate karne ke liye DateTime use ho raha hai,
                // base date ko month ke "1st" pe normalize kiya gaya hai
                // taake 29/30/31 tareekh wali due_date short months
                // (Feb) mein month skip/duplicate na kare.
                // ============================================
                $installments = [];
                $firstDueDate = $dueDate;

                for ($i = 0; $i < $numberOfInstallments; $i++) {
                    $baseDate = new \DateTime($firstDueDate);
                    $baseDate->modify('first day of this month'); // normalize — avoids skip/duplicate on day 29-31
                    $baseDate->modify("+{$i} months");
                    $month = $baseDate->format('Y-m');

                    $installments[] = [
                        'account_id' => $account->id,
                        'month' => $month,
                        'due_amount' => $monthlyInstallment,
                        'paid_amount' => 0,          // ✅ FIX: advance yahan dobara nahi lagegi
                        'balance' => $monthlyInstallment, // ✅ FIX: poora due_amount hi balance hai
                        'status' => 'unpaid',        // ✅ FIX: sab installments unpaid se start
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }

                Installment::insert($installments);
                Log::info('✅ Installments created:', [
                    'count' => count($installments),
                    'advance_applied_to' => 'account.paid_amount only (not distributed into installments)',
                    'advance_amount' => $advancePayment,
                ]);

                // ✅ 5. installments_paid ab already 0 hai (koi installment
                // manually paid nahi hui), is liye dobara recalculate karne
                // ki zaroorat nahi — lekin agla explicit rehne dete hain.
                $account->update([
                    'installments_paid' => 0
                ]);

                DB::commit();
                
                $customer->load(['guarantors', 'employeeAccount', 'employeeAccount.employee', 'branch', 'creator', 'accounts']);
                
                return response()->json([
                    'success' => true,
                    'message' => 'Customer and Account created successfully',
                    'data' => $customer,
                    'employee_account_id' => $employeeAccount->id,
                    'employee_id' => $employeeId,
                    'account_id' => $account->id,
                    'case_no' => $caseNo,
                ], 201);
                
            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('❌ Failed to create customer:', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
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
            'status' => 'nullable|in:active,hold,closed',
            'is_unlimited' => 'sometimes|boolean',
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
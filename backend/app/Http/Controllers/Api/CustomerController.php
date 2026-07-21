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
        
        $customerExists = Customer::where('cnic', $cnic)->exists();
        $guarantorExists = Guarantor::where('cnic', $cnic)->exists();

        return $this->sendResponse([
            'cnic' => $cnic,
            'exists_as_customer' => $customerExists,
            'exists_as_guarantor' => $guarantorExists,
            'is_available' => !($customerExists || $guarantorExists),
            'message' => $customerExists ? 'This CNIC already exists as a customer' : 
                        ($guarantorExists ? 'This CNIC already exists as a guarantor' : 
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

            // Validate
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:100',
                'cnic' => 'required|string|unique:customers,cnic',
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
                // ✅ 1. Create Customer with employee_id as created_by
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
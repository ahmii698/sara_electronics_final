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
        $query = Customer::with(['branch', 'creator', 'accounts', 'employeeAccount']);

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

    // ============================================
    // ✅ STORE - WITH IMAGE UPLOAD
    // ============================================
    public function store(Request $request)
    {
        Log::info('========== CUSTOMER STORE REQUEST ==========');
        Log::info('created_by:', [$request->created_by]);
        Log::info('product_name:', [$request->product_name]);
        
        // ============================================
        // ✅ STEP 1: GET GUARANTORS FROM REQUEST
        // ============================================
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

        // ============================================
        // ✅ STEP 2: FILTER VALID GUARANTORS
        // ============================================
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

        Log::info('Valid Guarantors:', ['count' => count($validGuarantors)]);

        // ============================================
        // ✅ STEP 3: VALIDATE
        // ============================================
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100',
            'cnic' => 'required|string|unique:customers,cnic',
            'phone' => 'required|string|max:20',
            'address' => 'nullable|string',
            'work' => 'nullable|string|max:100',
            'product_name' => 'nullable|string|max:255',
            'branch_id' => 'required|exists:branches,id',
            'status' => 'nullable|in:active,hold,closed',
            'created_by' => 'required|exists:users,id',
        ]);

        if ($validator->fails()) {
            Log::error('Validation failed:', $validator->errors()->toArray());
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

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

        // ============================================
        // ✅ STEP 4: CHECK EMPLOYEE
        // ============================================
        $employee = User::find($request->created_by);
        
        Log::info('Employee found:', [
            'id' => $employee ? $employee->id : 'NOT FOUND',
            'role' => $employee ? $employee->role : 'NOT FOUND',
            'name' => $employee ? $employee->name : 'NOT FOUND'
        ]);
        
        if (!$employee) {
            return response()->json([
                'success' => false,
                'message' => 'User not found with ID: ' . $request->created_by
            ], 422);
        }
        
        $allowedRoles = ['employee', 'admin', 'manager'];
        if (!in_array($employee->role, $allowedRoles)) {
            return response()->json([
                'success' => false,
                'message' => 'Selected user is not authorized. Role: ' . $employee->role . '. Allowed: ' . implode(', ', $allowedRoles)
            ], 422);
        }

        // ============================================
        // ✅ STEP 5: HANDLE FILE UPLOADS
        // ============================================
        $cnicFrontPath = null;
        if ($request->hasFile('cnic_front')) {
            $file = $request->file('cnic_front');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $cnicFrontPath = $file->storeAs('customers/cnic_front', $filename, 'public');
        }

        $cnicBackPath = null;
        if ($request->hasFile('cnic_back')) {
            $file = $request->file('cnic_back');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $cnicBackPath = $file->storeAs('customers/cnic_back', $filename, 'public');
        }

        $voiceConsentPath = null;
        if ($request->hasFile('voice_consent')) {
            $file = $request->file('voice_consent');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $voiceConsentPath = $file->storeAs('customers/voice', $filename, 'public');
        }

        // ============================================
        // ✅ STEP 6: CREATE RECORDS
        // ============================================
        DB::beginTransaction();

        try {
            // 1. Create Customer - WITH IMAGES
            $customer = Customer::create([
                'name' => $request->name,
                'cnic' => $request->cnic,
                'phone' => $request->phone,
                'address' => $request->address ?? '',
                'work' => $request->work ?? '',
                'product_name' => $request->product_name ?? '',
                'branch_id' => $request->branch_id,
                'status' => $request->status ?? 'active',
                'created_by' => $request->created_by,
                'cnic_front' => $cnicFrontPath,
                'cnic_back' => $cnicBackPath,
                'voice_consent' => $voiceConsentPath,
            ]);

            Log::info('✅ Customer created:', ['id' => $customer->id, 'product_name' => $customer->product_name]);

            // 2. Create Guarantors - ✅ FIXED
            foreach ($validGuarantors as $g) {
                // Check if CNIC already exists as customer
                if (Customer::where('cnic', $g['cnic'])->exists()) {
                    throw new \Exception("CNIC {$g['cnic']} already exists as a customer");
                }
                
                // Check if CNIC already exists as guarantor (skip if same customer)
                $existingGuarantor = Guarantor::where('cnic', $g['cnic'])
                    ->where('customer_id', $customer->id)
                    ->first();
                
                if ($existingGuarantor) {
                    // Skip if already added for this customer
                    Log::info('⚠️ Guarantor already exists for this customer, skipping:', ['cnic' => $g['cnic']]);
                    continue;
                }

                // Create guarantor with correct customer_id
                Guarantor::create([
                    'customer_id' => $customer->id,  // ✅ This is integer ID
                    'name' => $g['name'],
                    'cnic' => $g['cnic'],
                    'phone' => $g['phone'],
                    'address' => $g['address'],
                ]);
                
                Log::info('✅ Guarantor created:', ['name' => $g['name'], 'cnic' => $g['cnic']]);
            }

            // 3. Create Employee Account Record
            EmployeeAccount::create([
                'employee_id' => $request->created_by,
                'customer_id' => $customer->id,
                'branch_id' => $request->branch_id,
                'account_opened_date' => now(),
                'month' => now()->format('Y-m'),
                'year' => now()->year,
                'status' => 'active',
            ]);

            Log::info('✅ EmployeeAccount created');

            DB::commit();
            
            $customer->load(['guarantors', 'employeeAccount', 'branch', 'creator']);
            
            return response()->json([
                'success' => true,
                'message' => 'Customer created successfully',
                'data' => $customer
            ], 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('❌ Failed to create customer:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
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
        
        $customer = Customer::with(['guarantors', 'employeeAccount'])
            ->where('cnic', 'LIKE', "%{$request->cnic}%")
            ->first();
        
        if (!$customer) {
            return $this->sendError('Customer not found', 404);
        }

        return $this->sendResponse($customer, 'Customer found');
    }
}
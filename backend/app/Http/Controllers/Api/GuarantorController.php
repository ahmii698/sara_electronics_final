<?php
// app/Http/Controllers/Api/GuarantorController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guarantor;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class GuarantorController extends Controller
{
    public function index(Request $request)
    {
        $query = Guarantor::with('customer');
        
        if ($request->customer_id) {
            $query->where('customer_id', $request->customer_id);
        }
        
        $guarantors = $query->orderBy('id', 'desc')->paginate(20);
        return response()->json([
            'success' => true,
            'data' => $guarantors
        ]);
    }

    public function show($id)
    {
        $guarantor = Guarantor::with('customer')->find($id);
        if (!$guarantor) {
            return response()->json([
                'success' => false,
                'message' => 'Guarantor not found'
            ], 404);
        }
        return response()->json([
            'success' => true,
            'data' => $guarantor
        ]);
    }

    public function store(Request $request)
    {
        try {
            Log::info('========== GUARANTOR STORE ==========');
            Log::info('customer_id:', [$request->customer_id]);
            Log::info('cnic:', [$request->cnic]);
            Log::info('Has cnic_front?', [$request->hasFile('cnic_front')]);
            Log::info('Has cnic_back?', [$request->hasFile('cnic_back')]);
            
            $validator = Validator::make($request->all(), [
                'customer_id' => 'required|exists:customers,id',
                'name' => 'required|string|max:100',
                'cnic' => 'required|string',
                'phone' => 'nullable|string|max:20',
                'address' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                Log::error('Validation failed:', $validator->errors()->toArray());
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            // ✅ Check if CNIC already exists as customer
            $customerExists = Customer::where('cnic', $request->cnic)->exists();
            if ($customerExists) {
                return response()->json([
                    'success' => false,
                    'message' => 'This CNIC already exists as a customer',
                    'errors' => ['cnic' => ['This CNIC already exists as a customer']]
                ], 422);
            }

            // ✅ Check if same customer already has this guarantor
            $existingGuarantor = Guarantor::where('cnic', $request->cnic)
                ->where('customer_id', $request->customer_id)
                ->first();
            
            if ($existingGuarantor) {
                return response()->json([
                    'success' => false,
                    'message' => 'This guarantor is already added for this customer',
                    'errors' => ['cnic' => ['This guarantor is already added for this customer']]
                ], 422);
            }

            // ============================================
            // ✅ IMAGE UPLOAD - DIRECT MOVE
            // ============================================
            $cnicFrontPath = null;
            $cnicBackPath = null;
            
            // ✅ CNIC Front Upload
            if ($request->hasFile('cnic_front')) {
                try {
                    $file = $request->file('cnic_front');
                    if ($file && $file->isValid()) {
                        $destinationPath = public_path('storage/guarantors/cnic_front');
                        if (!file_exists($destinationPath)) {
                            mkdir($destinationPath, 0777, true);
                        }
                        
                        $filename = time() . '_front_' . uniqid() . '.' . $file->getClientOriginalExtension();
                        $file->move($destinationPath, $filename);
                        $cnicFrontPath = 'guarantors/cnic_front/' . $filename;
                        Log::info('✅ CNIC Front saved:', ['path' => $cnicFrontPath]);
                    }
                } catch (\Exception $e) {
                    Log::error('❌ CNIC Front upload failed:', ['error' => $e->getMessage()]);
                }
            }

            // ✅ CNIC Back Upload
            if ($request->hasFile('cnic_back')) {
                try {
                    $file = $request->file('cnic_back');
                    if ($file && $file->isValid()) {
                        $destinationPath = public_path('storage/guarantors/cnic_back');
                        if (!file_exists($destinationPath)) {
                            mkdir($destinationPath, 0777, true);
                        }
                        
                        $filename = time() . '_back_' . uniqid() . '.' . $file->getClientOriginalExtension();
                        $file->move($destinationPath, $filename);
                        $cnicBackPath = 'guarantors/cnic_back/' . $filename;
                        Log::info('✅ CNIC Back saved:', ['path' => $cnicBackPath]);
                    }
                } catch (\Exception $e) {
                    Log::error('❌ CNIC Back upload failed:', ['error' => $e->getMessage()]);
                }
            }

            // ✅ Create guarantor
            $guarantor = Guarantor::create([
                'customer_id' => (int) $request->customer_id,
                'name' => $request->name,
                'cnic' => $request->cnic,
                'phone' => $request->phone ?? '',
                'address' => $request->address ?? '',
                'cnic_front' => $cnicFrontPath,
                'cnic_back' => $cnicBackPath,
            ]);
            
            Log::info('✅ Guarantor created:', [
                'id' => $guarantor->id,
                'cnic_front' => $guarantor->cnic_front,
                'cnic_back' => $guarantor->cnic_back
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Guarantor created successfully',
                'data' => $guarantor->load('customer')
            ], 201);
            
        } catch (\Exception $e) {
            Log::error('❌ Guarantor store error:', [
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
        $guarantor = Guarantor::find($id);
        if (!$guarantor) {
            return response()->json([
                'success' => false,
                'message' => 'Guarantor not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:100',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $guarantor->update($request->all());
        return response()->json([
            'success' => true,
            'message' => 'Guarantor updated successfully',
            'data' => $guarantor
        ]);
    }

    public function destroy($id)
    {
        $guarantor = Guarantor::find($id);
        if (!$guarantor) {
            return response()->json([
                'success' => false,
                'message' => 'Guarantor not found'
            ], 404);
        }

        if ($guarantor->cnic_front && file_exists(public_path('storage/' . $guarantor->cnic_front))) {
            @unlink(public_path('storage/' . $guarantor->cnic_front));
        }
        if ($guarantor->cnic_back && file_exists(public_path('storage/' . $guarantor->cnic_back))) {
            @unlink(public_path('storage/' . $guarantor->cnic_back));
        }

        $guarantor->delete();
        return response()->json([
            'success' => true,
            'message' => 'Guarantor deleted successfully'
        ]);
    }

    // ============================================
    // ✅ UPGRADED: ab poori guarantor_records list bhi deta hai
    // (kis kis customer ka guarantor hai)
    // ============================================
    public function checkCnic(Request $request)
    {
        $request->validate(['cnic' => 'required|string']);
        
        $cnic = $request->cnic;
        $cleanCnic = preg_replace('/[^0-9]/', '', $cnic);
        
        $customerExists = Customer::where('cnic', $cnic)->orWhere('cnic', $cleanCnic)->exists();

        $guarantorRecords = Guarantor::where('cnic', $cnic)
            ->orWhere('cnic', $cleanCnic)
            ->with('customer')
            ->get();

        $guarantorExists = $guarantorRecords->isNotEmpty();

        return response()->json([
            'success' => true,
            'data' => [
                'cnic' => $cnic,
                'exists_as_customer' => $customerExists,
                'exists_as_guarantor' => $guarantorExists,
                'is_available' => !($customerExists || $guarantorExists),
                'guarantor_records' => $guarantorRecords->map(function ($g) {
                    return [
                        'guarantor_name' => $g->name,
                        'guarantor_cnic' => $g->cnic,
                        'customer_name' => $g->customer->name ?? 'N/A',
                        'customer_cnic' => $g->customer->cnic ?? 'N/A',
                        'customer_id' => $g->customer_id,
                    ];
                }),
            ]
        ]);
    }
}
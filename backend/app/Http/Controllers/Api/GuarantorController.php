<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guarantor;
use Illuminate\Http\Request;

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
        $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'name' => 'required|string|max:100',
            'cnic' => 'required|string|unique:guarantors,cnic',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string'
        ]);

        $guarantor = Guarantor::create($request->all());
        return response()->json([
            'success' => true,
            'message' => 'Guarantor created successfully',
            'data' => $guarantor
        ], 201);
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

        $guarantor->delete();
        return response()->json([
            'success' => true,
            'message' => 'Guarantor deleted successfully'
        ]);
    }
}
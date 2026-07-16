<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Guarantor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = Customer::with(['branch', 'creator', 'accounts']);

        if ($request->search) {
            $query->where('name', 'LIKE', "%{$request->search}%")
                  ->orWhere('cnic', 'LIKE', "%{$request->search}%")
                  ->orWhere('phone', 'LIKE', "%{$request->search}%");
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
            'branch', 'creator', 'guarantors',
            'accounts' => function($q) {
                $q->with(['product', 'installments']);
            }
        ])->find($id);

        if (!$customer) {
            return $this->sendError('Customer not found', 404);
        }

        return $this->sendResponse($customer, 'Customer details retrieved');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'cnic' => 'required|string|unique:customers,cnic',
            'phone' => 'required|string|max:20',
            'address' => 'nullable|string',
            'work' => 'nullable|string|max:100',
            'branch_id' => 'required|exists:branches,id',
            'status' => 'nullable|in:active,hold,closed',
            'created_by' => 'required|exists:users,id',
            'guarantors' => 'nullable|array|min:2|max:3',
            'guarantors.*.name' => 'required|string|max:100',
            'guarantors.*.cnic' => 'required|string',
            'guarantors.*.phone' => 'required|string|max:20',
            'guarantors.*.address' => 'nullable|string'
        ]);

        DB::beginTransaction();

        try {
            $customer = Customer::create($request->all());

            if ($request->guarantors) {
                foreach ($request->guarantors as $guarantorData) {
                    $guarantorData['customer_id'] = $customer->id;
                    Guarantor::create($guarantorData);
                }
            }

            DB::commit();
            return $this->sendResponse($customer->load('guarantors'), 'Customer created successfully', 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->sendError('Failed to create customer: ' . $e->getMessage(), 500);
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

        $customer->delete();
        return $this->sendResponse(null, 'Customer deleted successfully');
    }

    public function searchByCNIC(Request $request)
    {
        $request->validate(['cnic' => 'required|string']);
        
        $customer = Customer::with('guarantors')->where('cnic', 'LIKE', "%{$request->cnic}%")->first();
        
        if (!$customer) {
            return $this->sendError('Customer not found', 404);
        }

        return $this->sendResponse($customer, 'Customer found');
    }
}
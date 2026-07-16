<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Recovery;
use Illuminate\Http\Request;

class RecoveryController extends Controller
{
    public function index(Request $request)
    {
        $query = Recovery::with(['account', 'customer', 'creator']);

        if ($request->account_id) {
            $query->where('account_id', $request->account_id);
        }

        if ($request->customer_id) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->from_date) {
            $query->where('recovery_date', '>=', $request->from_date);
        }

        if ($request->to_date) {
            $query->where('recovery_date', '<=', $request->to_date);
        }

        return $this->sendResponse($query->orderBy('recovery_date', 'desc')->get(), 'Recovery records retrieved');
    }

    public function store(Request $request)
    {
        $request->validate([
            'account_id' => 'required|exists:accounts,id',
            'customer_id' => 'required|exists:customers,id',
            'recovery_date' => 'nullable|date',
            'amount' => 'required|numeric|min:1',
            'payment_type' => 'nullable|in:cash,installment',
            'month' => 'nullable|string|max:20',
            'description' => 'nullable|string',
            'created_by' => 'required|exists:users,id'
        ]);

        $data = $request->all();
        $data['recovery_date'] = $request->recovery_date ?? date('Y-m-d');

        $recovery = Recovery::create($data);
        return $this->sendResponse($recovery->load(['account', 'customer']), 'Recovery recorded', 201);
    }

    public function destroy($id)
    {
        $recovery = Recovery::find($id);
        if (!$recovery) {
            return $this->sendError('Recovery record not found', 404);
        }

        $recovery->delete();
        return $this->sendResponse(null, 'Recovery record deleted');
    }
}
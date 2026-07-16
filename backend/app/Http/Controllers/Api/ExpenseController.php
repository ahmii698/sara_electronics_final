<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FixedExpense;
use App\Models\ExtraExpense;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    // ===== FIXED EXPENSES =====
    public function fixedExpenses(Request $request)
    {
        $query = FixedExpense::with('branch');

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->paid !== null) {
            $query->where('paid', $request->paid);
        }

        return $this->sendResponse($query->get(), 'Fixed expenses retrieved');
    }

    public function storeFixed(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'amount' => 'required|numeric|min:0',
            'branch_id' => 'required|exists:branches,id',
            'due_date' => 'nullable|string|max:50',
            'paid' => 'nullable|boolean'
        ]);

        $expense = FixedExpense::create($request->all());
        return $this->sendResponse($expense, 'Fixed expense created', 201);
    }

    public function updateFixed(Request $request, $id)
    {
        $expense = FixedExpense::find($id);
        if (!$expense) {
            return $this->sendError('Expense not found', 404);
        }

        $expense->update($request->all());
        return $this->sendResponse($expense, 'Fixed expense updated');
    }

    public function payFixed($id)
    {
        $expense = FixedExpense::find($id);
        if (!$expense) {
            return $this->sendError('Expense not found', 404);
        }

        $expense->update([
            'paid' => true,
            'last_paid' => date('Y-m-d')
        ]);

        return $this->sendResponse($expense, 'Fixed expense paid');
    }

    public function deleteFixed($id)
    {
        $expense = FixedExpense::find($id);
        if (!$expense) {
            return $this->sendError('Expense not found', 404);
        }

        $expense->delete();
        return $this->sendResponse(null, 'Fixed expense deleted');
    }

    // ===== EXTRA EXPENSES =====
    public function extraExpenses(Request $request)
    {
        $query = ExtraExpense::with('branch');

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->month) {
            $query->whereRaw('DATE_FORMAT(date, "%Y-%m") = ?', [$request->month]);
        }

        return $this->sendResponse($query->orderBy('date', 'desc')->get(), 'Extra expenses retrieved');
    }

    public function storeExtra(Request $request)
    {
        $request->validate([
            'description' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'branch_id' => 'required|exists:branches,id',
            'date' => 'nullable|date'
        ]);

        $data = $request->all();
        $data['date'] = $request->date ?? date('Y-m-d');

        $expense = ExtraExpense::create($data);
        return $this->sendResponse($expense, 'Extra expense created', 201);
    }

    public function deleteExtra($id)
    {
        $expense = ExtraExpense::find($id);
        if (!$expense) {
            return $this->sendError('Expense not found', 404);
        }

        $expense->delete();
        return $this->sendResponse(null, 'Extra expense deleted');
    }
}
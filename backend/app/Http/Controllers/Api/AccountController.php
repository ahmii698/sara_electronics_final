<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Installment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AccountController extends Controller
{
    public function index(Request $request)
    {
        $query = Account::with(['customer', 'product', 'branch', 'creator']);

        if ($request->search) {
            $query->where('case_no', 'LIKE', "%{$request->search}%")
                  ->orWhereHas('customer', function($q) use ($request) {
                      $q->where('name', 'LIKE', "%{$request->search}%");
                  });
        }

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->payment_type) {
            $query->where('payment_type', $request->payment_type);
        }

        $accounts = $query->orderBy('id', 'desc')->paginate(20);
        return $this->sendResponse($accounts, 'Accounts retrieved successfully');
    }

    public function show($id)
    {
        $account = Account::with([
            'customer', 'product', 'branch', 'creator',
            'installments' => function($q) {
                $q->orderBy('month', 'desc');
            },
            'recoveries'
        ])->find($id);

        if (!$account) {
            return $this->sendError('Account not found', 404);
        }

        return $this->sendResponse($account, 'Account details retrieved');
    }

    public function store(Request $request)
    {
        $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'product_id' => 'required|exists:products,id',
            'case_no' => 'required|string|unique:accounts,case_no',
            'total_amount' => 'required|numeric|min:1',
            'paid_amount' => 'nullable|numeric|min:0',
            'monthly_installment' => 'required|numeric|min:1',
            'invoice_price' => 'nullable|numeric|min:0',
            'advance_amount' => 'nullable|numeric|min:0',
            'total_installments' => 'required|integer|min:1',
            'due_date' => 'required|date',
            'next_due_date' => 'nullable|date',
            'payment_type' => 'nullable|in:installment,cash',
            'status' => 'nullable|in:active,hold,paid,closed',
            'branch_id' => 'required|exists:branches,id',
            'created_by' => 'required|exists:users,id'
        ]);

        DB::beginTransaction();

        try {
            $balance = $request->total_amount - ($request->paid_amount ?? 0);
            $request->merge(['balance' => $balance]);

            $account = Account::create($request->all());

            // Generate installments
            $monthly = $request->monthly_installment;
            $totalMonths = $request->total_installments;
            $startDate = date('Y-m', strtotime($request->due_date));

            for ($i = 0; $i < $totalMonths; $i++) {
                $month = date('Y-m', strtotime("+{$i} months", strtotime($startDate . '-01')));
                $due = $monthly;
                $paid = 0;
                $status = 'unpaid';

                if ($i == 0 && $request->advance_amount) {
                    $paid = min($request->advance_amount, $due);
                    $status = $paid >= $due ? 'paid' : ($paid > 0 ? 'partial' : 'unpaid');
                }

                Installment::create([
                    'account_id' => $account->id,
                    'month' => $month,
                    'due_amount' => $due,
                    'paid_amount' => $paid,
                    'balance' => $due - $paid,
                    'status' => $status,
                    'payment_date' => $paid > 0 ? date('Y-m-d') : null,
                    'description' => "Installment " . ($i + 1)
                ]);
            }

            DB::commit();
            return $this->sendResponse($account->load('installments'), 'Account created successfully', 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->sendError('Failed to create account: ' . $e->getMessage(), 500);
        }
    }

    public function update(Request $request, $id)
    {
        $account = Account::find($id);
        if (!$account) {
            return $this->sendError('Account not found', 404);
        }

        $request->validate([
            'status' => 'nullable|in:active,hold,paid,closed',
            'paid_amount' => 'nullable|numeric|min:0',
            'installments_paid' => 'nullable|integer|min:0'
        ]);

        if ($request->has('paid_amount')) {
            $balance = $account->total_amount - $request->paid_amount;
            $request->merge(['balance' => $balance]);
        }

        $account->update($request->all());

        if ($account->balance <= 0) {
            $account->update(['status' => 'paid']);
        }

        return $this->sendResponse($account, 'Account updated successfully');
    }

    public function destroy($id)
    {
        $account = Account::find($id);
        if (!$account) {
            return $this->sendError('Account not found', 404);
        }

        $account->delete();
        return $this->sendResponse(null, 'Account deleted successfully');
    }
}
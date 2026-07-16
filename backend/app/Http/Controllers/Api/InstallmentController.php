<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Installment;
use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InstallmentController extends Controller
{
    public function index(Request $request)
    {
        $query = Installment::with('account.customer');

        if ($request->account_id) {
            $query->where('account_id', $request->account_id);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->month) {
            $query->where('month', $request->month);
        }

        $installments = $query->orderBy('month', 'desc')->paginate(50);
        return $this->sendResponse($installments, 'Installments retrieved');
    }

    public function payInstallment(Request $request)
    {
        $request->validate([
            'installment_id' => 'required|exists:installments,id',
            'amount' => 'required|numeric|min:1',
            'payment_date' => 'nullable|date'
        ]);

        DB::beginTransaction();

        try {
            $installment = Installment::find($request->installment_id);
            $account = Account::find($installment->account_id);

            $newPaid = $installment->paid_amount + $request->amount;
            $newBalance = $installment->due_amount - $newPaid;
            $status = $newBalance <= 0 ? 'paid' : 'partial';

            $installment->update([
                'paid_amount' => $newPaid,
                'balance' => $newBalance,
                'status' => $status,
                'payment_date' => $request->payment_date ?? date('Y-m-d')
            ]);

            // Update account
            $accountTotalPaid = Installment::where('account_id', $account->id)->sum('paid_amount');
            $accountBalance = $account->total_amount - $accountTotalPaid;

            $account->update([
                'paid_amount' => $accountTotalPaid,
                'balance' => $accountBalance,
                'status' => $accountBalance <= 0 ? 'paid' : 'active',
                'installments_paid' => Installment::where('account_id', $account->id)
                    ->where('status', 'paid')->count(),
                'last_payment_date' => date('Y-m-d')
            ]);

            DB::commit();
            return $this->sendResponse($installment, 'Installment paid successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->sendError('Payment failed: ' . $e->getMessage(), 500);
        }
    }

    public function overdue()
    {
        $currentMonth = date('Y-m');
        $overdue = Installment::with(['account.customer'])
            ->whereIn('status', ['partial', 'unpaid'])
            ->where('month', '<', $currentMonth)
            ->orderBy('month', 'asc')
            ->get();

        return $this->sendResponse($overdue, 'Overdue installments retrieved');
    }

    public function agingReport(Request $request)
    {
        $branchId = $request->branch_id;
        $currentMonth = date('Y-m');

        $query = Installment::with(['account.customer', 'account.branch'])
            ->whereIn('status', ['partial', 'unpaid'])
            ->where('month', '<', $currentMonth);

        if ($branchId) {
            $query->whereHas('account', function($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
        }

        $installments = $query->get();

        $data = $installments->map(function($item) {
            $monthDate = date('Y-m-01', strtotime($item->month . '-01'));
            $overdueDays = (int) (time() - strtotime($monthDate)) / (60 * 60 * 24);

            $level = 'Low';
            if ($overdueDays >= 180) $level = 'Critical';
            else if ($overdueDays >= 120) $level = 'High';
            else if ($overdueDays >= 60) $level = 'Medium';

            return [
                'customer' => $item->account->customer->name ?? 'N/A',
                'case_no' => $item->account->case_no ?? 'N/A',
                'month' => $item->month,
                'due_amount' => $item->due_amount,
                'paid_amount' => $item->paid_amount,
                'balance' => $item->balance,
                'overdue_days' => $overdueDays,
                'level' => $level
            ];
        });

        return $this->sendResponse($data, 'Aging report generated');
    }
}
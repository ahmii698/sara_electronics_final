<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Installment;
use App\Models\User;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function dashboard()
    {
        $data = [
            'total_customers' => \App\Models\Customer::count(),
            'total_employees' => User::where('role', '!=', 'admin')->count(),
            'total_accounts' => Account::count(),
            'active_accounts' => Account::where('status', 'active')->count(),
            'total_balance' => Account::sum('balance'),
            'total_recovery' => Account::sum('paid_amount'),
            'overdue_installments' => Installment::whereIn('status', ['partial', 'unpaid'])
                ->where('month', '<', date('Y-m'))->count()
        ];

        return $this->sendResponse($data, 'Dashboard stats');
    }

    public function branchWiseRecovery()
    {
        $data = Branch::select(
            'branches.id',
            'branches.name',
            DB::raw('COUNT(DISTINCT accounts.id) as total_accounts'),
            DB::raw('SUM(accounts.total_amount) as total_amount'),
            DB::raw('SUM(accounts.paid_amount) as total_paid'),
            DB::raw('SUM(accounts.balance) as total_balance'),
            DB::raw('AVG(accounts.monthly_installment) as avg_installment')
        )
        ->leftJoin('accounts', 'branches.id', '=', 'accounts.branch_id')
        ->groupBy('branches.id', 'branches.name')
        ->get();

        return $this->sendResponse($data, 'Branch wise recovery');
    }

    public function monthlyInstallmentStatus()
    {
        $data = Installment::select(
            'month',
            DB::raw('COUNT(*) as total_installments'),
            DB::raw('SUM(CASE WHEN status = "paid" THEN 1 ELSE 0 END) as paid_count'),
            DB::raw('SUM(CASE WHEN status = "partial" THEN 1 ELSE 0 END) as partial_count'),
            DB::raw('SUM(CASE WHEN status = "unpaid" THEN 1 ELSE 0 END) as unpaid_count'),
            DB::raw('SUM(paid_amount) as total_paid'),
            DB::raw('SUM(due_amount) as total_due'),
            DB::raw('SUM(balance) as total_balance')
        )
        ->groupBy('month')
        ->orderBy('month', 'desc')
        ->get();

        return $this->sendResponse($data, 'Monthly installment status');
    }

    public function topPerformers()
    {
        $data = User::select(
            'users.id',
            'users.name',
            'users.branch_id',
            DB::raw('COUNT(accounts.id) as accounts_opened'),
            DB::raw('SUM(accounts.total_amount) as total_recovery'),
            DB::raw('SUM(accounts.paid_amount) as total_collected')
        )
        ->leftJoin('accounts', 'users.id', '=', 'accounts.created_by')
        ->where('users.role', 'employee')
        ->groupBy('users.id', 'users.name', 'users.branch_id')
        ->orderBy('accounts_opened', 'desc')
        ->limit(10)
        ->get();

        return $this->sendResponse($data, 'Top performers');
    }

    public function employeePerformance(Request $request)
    {
        $query = User::select(
            'users.id',
            'users.name',
            DB::raw('COUNT(DISTINCT accounts.id) as total_accounts'),
            DB::raw('SUM(accounts.total_amount) as total_amount'),
            DB::raw('SUM(accounts.paid_amount) as total_collected'),
            DB::raw('SUM(accounts.balance) as total_balance'),
            DB::raw('COUNT(DISTINCT customers.id) as total_customers')
        )
        ->leftJoin('accounts', 'users.id', '=', 'accounts.created_by')
        ->leftJoin('customers', 'users.id', '=', 'customers.created_by')
        ->where('users.role', 'employee');

        if ($request->user_id) {
            $query->where('users.id', $request->user_id);
        }

        $data = $query->groupBy('users.id', 'users.name')->get();
        return $this->sendResponse($data, 'Employee performance');
    }

    public function accountStatusSummary()
    {
        $data = Account::select(
            'branch_id',
            'status',
            DB::raw('COUNT(*) as count'),
            DB::raw('SUM(total_amount) as total_amount'),
            DB::raw('SUM(paid_amount) as total_paid'),
            DB::raw('SUM(balance) as total_balance')
        )
        ->groupBy('branch_id', 'status')
        ->orderBy('branch_id')
        ->orderBy('status')
        ->get();

        return $this->sendResponse($data, 'Account status summary');
    }
}
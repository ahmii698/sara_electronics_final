<?php
// app/Http/Controllers/Api/ReportController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Customer;
use App\Models\Account;
use App\Models\Installment;
use App\Models\EmployeeAccount;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    // ✅ Your existing dashboard method
    public function dashboard(Request $request)
    {
        // ... existing code ...
    }

    // ✅ Your existing branch recovery method
    public function branchWiseRecovery(Request $request)
    {
        // ... existing code ...
    }

    // ✅ Your existing monthly installments method
    public function monthlyInstallmentStatus(Request $request)
    {
        // ... existing code ...
    }

    // ✅ Your existing top performers method
    public function topPerformers(Request $request)
    {
        // ... existing code ...
    }

    // ✅ Your existing employee performance method
    public function employeePerformance(Request $request)
    {
        // ... existing code ...
    }

    // ✅ Your existing account status summary method
    public function accountStatusSummary(Request $request)
    {
        // ... existing code ...
    }

    // ============================================
    // ✅ NEW: Employee Account Stats
    // ============================================
    
    /**
     * Get all employees with account stats
     */
    public function getEmployeeStats(Request $request)
    {
        $month = $request->get('month', now()->format('Y-m'));
        $branchId = $request->get('branch_id');

        $query = User::where('role', 'employee')
            ->with(['branch']);

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $employees = $query->get();

        $stats = $employees->map(function($employee) use ($month) {
            // Total accounts
            $totalAccounts = EmployeeAccount::where('employee_id', $employee->id)->count();
            
            // Current month accounts
            $currentMonthAccounts = EmployeeAccount::where('employee_id', $employee->id)
                ->where('month', $month)
                ->count();

            // Monthly breakdown for this employee
            $monthlyBreakdown = EmployeeAccount::where('employee_id', $employee->id)
                ->select('month', DB::raw('count(*) as total'))
                ->groupBy('month')
                ->orderBy('month', 'desc')
                ->limit(6)
                ->get();

            return [
                'employee_id' => $employee->id,
                'name' => $employee->name,
                'email' => $employee->email,
                'phone' => $employee->phone,
                'branch_id' => $employee->branch_id,
                'branch_name' => $employee->branch->name ?? 'N/A',
                'salary' => $employee->salary,
                'is_active' => $employee->is_active == 1,
                'total_accounts' => $totalAccounts,
                'current_month_accounts' => $currentMonthAccounts,
                'monthly_breakdown' => $monthlyBreakdown,
                'performance_score' => $this->calculatePerformance($employee->id, $month),
            ];
        });

        // Summary stats
        $summary = [
            'total_employees' => $stats->count(),
            'active_employees' => $stats->where('is_active', true)->count(),
            'total_accounts_all_time' => $stats->sum('total_accounts'),
            'total_accounts_this_month' => $stats->sum('current_month_accounts'),
            'month' => $month,
        ];

        return $this->sendResponse([
            'summary' => $summary,
            'data' => $stats
        ], 'Employee stats retrieved successfully');
    }

    /**
     * Get single employee details with complete history
     */
    public function getEmployeeDetail($employeeId, Request $request)
    {
        $employee = User::with(['branch'])
            ->where('role', 'employee')
            ->find($employeeId);

        if (!$employee) {
            return $this->sendError('Employee not found', 404);
        }

        $month = $request->get('month', now()->format('Y-m'));

        // Get all accounts with customer details
        $accounts = EmployeeAccount::with(['customer'])
            ->where('employee_id', $employeeId)
            ->orderBy('account_opened_date', 'desc')
            ->get();

        // Monthly summary
        $monthlySummary = EmployeeAccount::where('employee_id', $employeeId)
            ->select('month', 'year', DB::raw('count(*) as total'))
            ->groupBy('month', 'year')
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->get();

        // Current month stats
        $currentMonthAccounts = EmployeeAccount::where('employee_id', $employeeId)
            ->where('month', $month)
            ->count();

        // Account status breakdown
        $statusBreakdown = EmployeeAccount::where('employee_id', $employeeId)
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->get();

        return $this->sendResponse([
            'employee' => [
                'id' => $employee->id,
                'name' => $employee->name,
                'email' => $employee->email,
                'phone' => $employee->phone,
                'branch' => $employee->branch->name ?? 'N/A',
                'salary' => $employee->salary,
                'total_accounts' => $accounts->count(),
                'current_month_accounts' => $currentMonthAccounts,
            ],
            'monthly_summary' => $monthlySummary,
            'status_breakdown' => $statusBreakdown,
            'accounts' => $accounts->map(function($account) {
                return [
                    'id' => $account->id,
                    'customer_name' => $account->customer->name ?? 'N/A',
                    'customer_cnic' => $account->customer->cnic ?? 'N/A',
                    'account_opened_date' => $account->account_opened_date->format('Y-m-d'),
                    'month' => $account->month,
                    'status' => $account->status,
                    'created_at' => $account->created_at->format('Y-m-d H:i:s'),
                ];
            }),
        ], 'Employee details retrieved successfully');
    }

    /**
     * Get branch-wise performance
     */
    public function getBranchPerformance(Request $request)
    {
        $month = $request->get('month', now()->format('Y-m'));

        $branches = Branch::with(['users' => function($q) {
            $q->where('role', 'employee')
              ->where('is_active', 1);
        }])->get();

        $data = $branches->map(function($branch) use ($month) {
            $employees = $branch->users;
            
            // Total accounts for this branch
            $totalAccounts = EmployeeAccount::where('branch_id', $branch->id)->count();
            $currentMonthAccounts = EmployeeAccount::where('branch_id', $branch->id)
                ->where('month', $month)
                ->count();

            // Top performer in this branch
            $topPerformer = EmployeeAccount::where('branch_id', $branch->id)
                ->where('month', $month)
                ->select('employee_id', DB::raw('count(*) as total'))
                ->groupBy('employee_id')
                ->orderBy('total', 'desc')
                ->first();

            $topPerformerName = null;
            if ($topPerformer) {
                $user = User::find($topPerformer->employee_id);
                $topPerformerName = $user ? $user->name : null;
            }

            return [
                'branch_id' => $branch->id,
                'branch_name' => $branch->name,
                'total_employees' => $employees->count(),
                'total_accounts' => $totalAccounts,
                'current_month_accounts' => $currentMonthAccounts,
                'top_performer' => $topPerformerName,
                'top_performer_count' => $topPerformer->total ?? 0,
                'employees' => $employees->map(function($employee) use ($month) {
                    return [
                        'id' => $employee->id,
                        'name' => $employee->name,
                        'total_accounts' => EmployeeAccount::where('employee_id', $employee->id)->count(),
                        'current_month_accounts' => EmployeeAccount::where('employee_id', $employee->id)
                            ->where('month', $month)
                            ->count(),
                    ];
                }),
            ];
        });

        return $this->sendResponse($data, 'Branch performance retrieved successfully');
    }

    /**
     * Get monthly report
     */
    public function getMonthlyReport(Request $request)
    {
        $month = $request->get('month', now()->format('Y-m'));

        // Top employees this month
        $topEmployees = EmployeeAccount::where('month', $month)
            ->select('employee_id', DB::raw('count(*) as total'))
            ->groupBy('employee_id')
            ->orderBy('total', 'desc')
            ->limit(10)
            ->get()
            ->map(function($item) {
                $user = User::find($item->employee_id);
                return [
                    'employee_id' => $item->employee_id,
                    'name' => $user->name ?? 'Unknown',
                    'total' => $item->total,
                    'branch' => $user->branch->name ?? 'N/A',
                ];
            });

        // Branch-wise this month
        $branchWise = EmployeeAccount::where('month', $month)
            ->select('branch_id', DB::raw('count(*) as total'))
            ->groupBy('branch_id')
            ->get()
            ->map(function($item) {
                $branch = Branch::find($item->branch_id);
                return [
                    'branch_id' => $item->branch_id,
                    'branch_name' => $branch->name ?? 'N/A',
                    'total' => $item->total,
                ];
            });

        // Total accounts this month
        $totalAccounts = EmployeeAccount::where('month', $month)->count();

        return $this->sendResponse([
            'month' => $month,
            'total_accounts' => $totalAccounts,
            'top_employees' => $topEmployees,
            'branch_wise' => $branchWise,
        ], 'Monthly report retrieved successfully');
    }

    /**
     * Calculate performance score
     */
    private function calculatePerformance($employeeId, $month)
    {
        // Get this employee's accounts this month
        $thisMonth = EmployeeAccount::where('employee_id', $employeeId)
            ->where('month', $month)
            ->count();

        // Get average accounts per employee this month
        $avg = EmployeeAccount::where('month', $month)
            ->select('employee_id', DB::raw('count(*) as total'))
            ->groupBy('employee_id')
            ->get()
            ->avg('total') ?? 1;

        // Calculate score (percentage)
        if ($avg > 0) {
            $score = ($thisMonth / $avg) * 100;
        } else {
            $score = 0;
        }

        return round(min($score, 100), 2);
    }
}
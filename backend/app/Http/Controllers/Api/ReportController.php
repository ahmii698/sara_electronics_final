<?php
// app/Http/Controllers/Api/ReportController.php
// ============================================================
// ✅ FIXED VERSION
// Problem: getEmployeeReportPublic() aur getEmployeeMonthlyData()
// "recovery" table se totalRecovery nikal rahe thay, jabke
// Installments page ki payments ("Pay Full" aur "Partial Payment")
// asal mein `installments` table ke `paid_amount` column mein
// save hoti hain. Isliye Employee Report mein Recovery hamesha
// 0 (ya galat) show ho raha tha — chahe account full paid ho
// ya partial paid ho.
//
// Fix: ab dono jagah recovery, EmployeeAccount -> Account ->
// Installment (paid_amount) ki chain se calculate hoti hai,
// jaisa getEmployeeStats() aur getEmployeeDetail() mein pehle
// se sahi likha hua tha.
//
// ✅ FIX #2: Commission ab 5% auto-calculate nahi hota — seedha
// `salary` table ke `commission` column se aata hai (jo already
// admin/system database mein per-employee per-month store hai).
// ============================================================

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Customer;
use App\Models\Account;
use App\Models\Installment;
use App\Models\EmployeeAccount;
use App\Models\Recovery;
use App\Models\Branch;
use App\Models\EmployeeLeave;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ReportController extends Controller
{
    /**
     * Send success response
     */
    public function sendResponse($data, $message = 'Success', $code = 200)
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data
        ], $code);
    }

    /**
     * Send error response
     */
    public function sendError($message, $code = 400)
    {
        return response()->json([
            'success' => false,
            'message' => $message
        ], $code);
    }

    // ============================================
    // ✅ TEST METHOD - NO AUTH REQUIRED
    // ============================================
    public function test()
    {
        return response()->json([
            'success' => true,
            'message' => 'API is working!',
            'timestamp' => now()->toDateTimeString()
        ]);
    }

    // ============================================
    // ✅ EMPLOYEE REPORT PUBLIC - NO AUTH REQUIRED
    // (this is the one the Employee Report screen calls)
    // ============================================
    public function getEmployeeReportPublic(Request $request)
    {
        try {
            $month = $request->get('month', now()->format('Y-m'));
            $branchId = $request->get('branch_id');

            // Get all employees
            $query = User::where('role', 'employee');

            if ($branchId) {
                $query->where('branch_id', $branchId);
            }

            $employees = $query->get();

            if ($employees->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'data' => [],
                        'summary' => [
                            'total_employees' => 0,
                            'total_accounts' => 0,
                            'total_recovery' => 0,
                            'total_commission' => 0,
                            'total_leaves' => 0,
                            'month' => $month
                        ]
                    ]
                ]);
            }

            $result = [];

            foreach ($employees as $employee) {
                // ✅ ACCOUNTS: Direct count from employee_accounts table
                $totalAccounts = EmployeeAccount::where('employee_id', $employee->id)->count();

                // Current month accounts
                $currentMonthAccounts = EmployeeAccount::where('employee_id', $employee->id)
                    ->where('month', $month)
                    ->count();

                // ✅ FIX: RECOVERY comes from `installments.paid_amount`,
                // linked through employee_accounts.customer_id -> accounts.customer_id.
                // (The old `recovery` table join never gets populated when a
                // payment is made from the Installments screen, so it always
                // showed 0 — for both full and partial payments.)
                $accountIds = EmployeeAccount::where('employee_id', $employee->id)
                    ->pluck('customer_id')
                    ->toArray();

                $accountRecords = Account::whereIn('customer_id', $accountIds)
                    ->pluck('id')
                    ->toArray();

                $totalRecovery = Installment::whereIn('account_id', $accountRecords)
                    ->sum('paid_amount');

                // ✅ FIX: COMMISSION comes straight from the `salary` table's
                // `commission` column (summed across all salary records for
                // this employee) — NOT an auto-calculated 5% of recovery.
                $totalCommission = DB::table('salary')
                    ->where('user_id', $employee->id)
                    ->sum('commission');

                // ✅ LEAVES: From employee_leaves table
                $totalLeaves = EmployeeLeave::where('user_id', $employee->id)
                    ->where('status', 'approved')
                    ->count();

                // ✅ Monthly breakdown data
                $monthlyData = $this->getEmployeeMonthlyData($employee->id);

                $result[] = [
                    'id' => $employee->id,
                    'name' => $employee->name,
                    'email' => $employee->email,
                    'phone' => $employee->phone,
                    'branch_id' => $employee->branch_id,
                    'role' => $employee->role,
                    'salary' => floatval($employee->salary ?? 0),
                    'totalAccounts' => $totalAccounts,
                    'totalRecovery' => floatval($totalRecovery),
                    'totalCommission' => floatval($totalCommission),
                    'totalLeaves' => $totalLeaves,
                    'monthlyData' => $monthlyData,
                    'created_at' => $employee->created_at,
                ];
            }

            // Summary stats
            $summary = [
                'total_employees' => count($result),
                'total_accounts' => collect($result)->sum('totalAccounts'),
                'total_recovery' => collect($result)->sum('totalRecovery'),
                'total_commission' => collect($result)->sum('totalCommission'),
                'total_leaves' => collect($result)->sum('totalLeaves'),
                'month' => $month,
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'data' => $result,
                    'summary' => $summary
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    // ============================================
    // EXISTING METHODS
    // ============================================

    public function dashboard(Request $request)
    {
        try {
            $branchId = $request->get('branch_id');

            $totalEmployees = User::where('role', 'employee')
                ->when($branchId, function($q) use ($branchId) {
                    return $q->where('branch_id', $branchId);
                })
                ->count();

            $totalAccounts = EmployeeAccount::when($branchId, function($q) use ($branchId) {
                return $q->where('branch_id', $branchId);
            })->count();

            $totalRecovery = Recovery::when($branchId, function($q) use ($branchId) {
                return $q->where('branch_id', $branchId);
            })->sum('amount');

            $pendingRecovery = Recovery::when($branchId, function($q) use ($branchId) {
                return $q->where('branch_id', $branchId);
            })->where('status', 'pending')->sum('amount');

            return $this->sendResponse([
                'total_employees' => $totalEmployees,
                'total_accounts' => $totalAccounts,
                'total_recovery' => $totalRecovery,
                'pending_recovery' => $pendingRecovery,
            ], 'Dashboard data retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage(), 500);
        }
    }

    public function branchWiseRecovery(Request $request)
    {
        try {
            $data = Branch::withCount(['recoveries' => function($q) {
                $q->where('status', 'paid');
            }])->withSum('recoveries', 'amount')->get();

            return $this->sendResponse($data, 'Branch wise recovery retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage(), 500);
        }
    }

    public function monthlyInstallmentStatus(Request $request)
    {
        try {
            $month = $request->get('month', now()->format('Y-m'));

            $data = Installment::where('month', $month)
                ->select('status', DB::raw('count(*) as total'), DB::raw('sum(due_amount) as total_due'))
                ->groupBy('status')
                ->get();

            return $this->sendResponse($data, 'Monthly installment status retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage(), 500);
        }
    }

    public function topPerformers(Request $request)
    {
        try {
            $month = $request->get('month', now()->format('Y-m'));
            $limit = $request->get('limit', 10);

            $data = EmployeeAccount::where('month', $month)
                ->select('employee_id', DB::raw('count(*) as total_accounts'))
                ->groupBy('employee_id')
                ->orderBy('total_accounts', 'desc')
                ->limit($limit)
                ->get()
                ->map(function($item) {
                    $user = User::find($item->employee_id);
                    return [
                        'employee_id' => $item->employee_id,
                        'name' => $user->name ?? 'Unknown',
                        'total_accounts' => $item->total_accounts,
                        'branch' => $user->branch->name ?? 'N/A',
                    ];
                });

            return $this->sendResponse($data, 'Top performers retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage(), 500);
        }
    }

    public function employeePerformance(Request $request)
    {
        try {
            $month = $request->get('month', now()->format('Y-m'));
            $branchId = $request->get('branch_id');

            $query = User::where('role', 'employee');

            if ($branchId) {
                $query->where('branch_id', $branchId);
            }

            $employees = $query->get();
            $data = [];

            foreach ($employees as $employee) {
                $accounts = EmployeeAccount::where('employee_id', $employee->id)
                    ->where('month', $month)
                    ->count();

                $totalAccounts = EmployeeAccount::where('employee_id', $employee->id)->count();

                $data[] = [
                    'employee_id' => $employee->id,
                    'name' => $employee->name,
                    'current_month_accounts' => $accounts,
                    'total_accounts' => $totalAccounts,
                    'branch' => $employee->branch->name ?? 'N/A',
                ];
            }

            return $this->sendResponse($data, 'Employee performance retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage(), 500);
        }
    }

    public function accountStatusSummary(Request $request)
    {
        try {
            $branchId = $request->get('branch_id');

            $query = Account::query();

            if ($branchId) {
                $query->where('branch_id', $branchId);
            }

            $data = [
                'total' => $query->count(),
                'active' => (clone $query)->where('status', 'active')->count(),
                'hold' => (clone $query)->where('status', 'hold')->count(),
                'paid' => (clone $query)->where('status', 'paid')->count(),
                'closed' => (clone $query)->where('status', 'closed')->count(),
            ];

            return $this->sendResponse($data, 'Account status summary retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage(), 500);
        }
    }

    // ============================================
    // ✅ EMPLOYEE REPORT - AUTH REQUIRED (Original)
    // ============================================

    public function getEmployeeReport(Request $request)
    {
        return $this->getEmployeeReportPublic($request);
    }

    // ============================================
    // ✅ OTHER METHODS
    // ============================================

    public function getEmployeeStats(Request $request)
    {
        try {
            $month = $request->get('month', now()->format('Y-m'));
            $branchId = $request->get('branch_id');
            $employeeId = $request->get('employee_id');

            $query = User::whereIn('role', ['employee', 'manager']);

            if ($branchId) {
                $query->where('branch_id', $branchId);
            }

            if ($employeeId) {
                $query->where('id', $employeeId);
            }

            $employees = $query->get();
            $data = [];

            foreach ($employees as $employee) {
                $accountsOpened = EmployeeAccount::where('employee_id', $employee->id)
                    ->where('month', $month)
                    ->count();

                $totalAccounts = EmployeeAccount::where('employee_id', $employee->id)->count();

                $accountIds = EmployeeAccount::where('employee_id', $employee->id)
                    ->pluck('customer_id')
                    ->toArray();

                $accountRecords = Account::whereIn('customer_id', $accountIds)->pluck('id')->toArray();

                $monthlyRecovery = Installment::whereIn('account_id', $accountRecords)
                    ->where('month', $month)
                    ->sum('paid_amount');

                $totalRecovery = Installment::whereIn('account_id', $accountRecords)
                    ->sum('paid_amount');

                $commissionRate = 0.05;
                $monthlyCommission = $monthlyRecovery * $commissionRate;
                $totalCommission = $totalRecovery * $commissionRate;

                $monthlyLeaves = EmployeeLeave::where('user_id', $employee->id)
                    ->where('month', $month)
                    ->where('status', 'approved')
                    ->count();

                $totalLeaves = EmployeeLeave::where('user_id', $employee->id)
                    ->where('status', 'approved')
                    ->count();

                $monthlyData = $this->getEmployeeMonthlyData($employee->id);

                $data[] = [
                    'id' => $employee->id,
                    'name' => $employee->name,
                    'email' => $employee->email,
                    'phone' => $employee->phone,
                    'branch_id' => $employee->branch_id,
                    'role' => $employee->role,
                    'salary' => $employee->salary ?? 0,
                    'joining_date' => $employee->created_at ? $employee->created_at->format('Y-m-d') : null,
                    'accounts_opened' => $accountsOpened,
                    'total_accounts' => $totalAccounts,
                    'monthly_recovery' => $monthlyRecovery,
                    'total_recovery' => $totalRecovery,
                    'monthly_commission' => $monthlyCommission,
                    'total_commission' => $totalCommission,
                    'monthly_leaves' => $monthlyLeaves,
                    'total_leaves' => $totalLeaves,
                    'monthly_data' => $monthlyData,
                ];
            }

            $summary = [
                'total_employees' => count($data),
                'total_accounts' => array_sum(array_column($data, 'total_accounts')),
                'total_recovery' => array_sum(array_column($data, 'total_recovery')),
                'total_commission' => array_sum(array_column($data, 'total_commission')),
                'total_leaves' => array_sum(array_column($data, 'total_leaves')),
                'month' => $month,
            ];

            return $this->sendResponse([
                'data' => $data,
                'summary' => $summary
            ], 'Employee stats retrieved successfully');

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile()
            ], 500);
        }
    }

    public function getEmployeeDetail(Request $request, $id)
    {
        try {
            $employee = User::with(['branch'])->whereIn('role', ['employee', 'manager'])->find($id);

            if (!$employee) {
                return $this->sendError('Employee not found', 404);
            }

            $month = $request->get('month', now()->format('Y-m'));

            $accountsOpened = EmployeeAccount::where('employee_id', $employee->id)
                ->where('month', $month)
                ->count();

            $totalAccounts = EmployeeAccount::where('employee_id', $employee->id)->count();

            $accountIds = EmployeeAccount::where('employee_id', $employee->id)
                ->pluck('customer_id')
                ->toArray();

            $accountRecords = Account::whereIn('customer_id', $accountIds)->pluck('id')->toArray();

            $monthlyRecovery = Installment::whereIn('account_id', $accountRecords)
                ->where('month', $month)
                ->sum('paid_amount');

            $totalRecovery = Installment::whereIn('account_id', $accountRecords)
                ->sum('paid_amount');

            $commissionRate = 0.05;
            $monthlyCommission = $monthlyRecovery * $commissionRate;
            $totalCommission = $totalRecovery * $commissionRate;

            $monthlyLeaves = EmployeeLeave::where('user_id', $employee->id)
                ->where('month', $month)
                ->where('status', 'approved')
                ->count();

            $totalLeaves = EmployeeLeave::where('user_id', $employee->id)
                ->where('status', 'approved')
                ->count();

            $monthlyData = $this->getEmployeeMonthlyData($employee->id);

            $accounts = EmployeeAccount::with(['customer'])
                ->where('employee_id', $employee->id)
                ->orderBy('account_opened_date', 'desc')
                ->get();

            return $this->sendResponse([
                'employee' => [
                    'id' => $employee->id,
                    'name' => $employee->name,
                    'email' => $employee->email,
                    'phone' => $employee->phone,
                    'branch' => $employee->branch->name ?? 'N/A',
                    'salary' => $employee->salary,
                    'total_accounts' => $totalAccounts,
                    'current_month_accounts' => $accountsOpened,
                ],
                'stats' => [
                    'monthly_recovery' => $monthlyRecovery,
                    'total_recovery' => $totalRecovery,
                    'monthly_commission' => $monthlyCommission,
                    'total_commission' => $totalCommission,
                    'monthly_leaves' => $monthlyLeaves,
                    'total_leaves' => $totalLeaves,
                ],
                'accounts_list' => $accounts->map(function($account) {
                    return [
                        'id' => $account->id,
                        'customer_name' => $account->customer->name ?? 'N/A',
                        'account_opened_date' => $account->account_opened_date->format('Y-m-d'),
                        'month' => $account->month,
                        'status' => $account->status,
                    ];
                }),
                'monthly_data' => $monthlyData,
            ], 'Employee details retrieved successfully');

        } catch (\Exception $e) {
            return $this->sendError($e->getMessage(), 500);
        }
    }

    public function getBranchPerformance(Request $request)
    {
        try {
            $month = $request->get('month', now()->format('Y-m'));

            $branches = Branch::all();
            $data = [];

            foreach ($branches as $branch) {
                $employeeIds = User::where('branch_id', $branch->id)
                    ->whereIn('role', ['employee', 'manager'])
                    ->pluck('id')
                    ->toArray();

                $accountsOpened = EmployeeAccount::whereIn('employee_id', $employeeIds)
                    ->where('month', $month)
                    ->count();

                $totalAccounts = EmployeeAccount::whereIn('employee_id', $employeeIds)->count();

                $accountIds = EmployeeAccount::whereIn('employee_id', $employeeIds)
                    ->pluck('customer_id')
                    ->toArray();

                $accountRecords = Account::whereIn('customer_id', $accountIds)->pluck('id')->toArray();

                $recovery = Installment::whereIn('account_id', $accountRecords)
                    ->where('month', $month)
                    ->sum('paid_amount');

                $totalRecovery = Installment::whereIn('account_id', $accountRecords)
                    ->sum('paid_amount');

                $topPerformer = EmployeeAccount::whereIn('employee_id', $employeeIds)
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

                $data[] = [
                    'branch_id' => $branch->id,
                    'branch_name' => $branch->name,
                    'employees' => count($employeeIds),
                    'accounts_opened' => $accountsOpened,
                    'total_accounts' => $totalAccounts,
                    'monthly_recovery' => $recovery,
                    'total_recovery' => $totalRecovery,
                    'top_performer' => $topPerformerName,
                    'top_performer_count' => $topPerformer->total ?? 0,
                ];
            }

            return $this->sendResponse($data, 'Branch performance retrieved successfully');

        } catch (\Exception $e) {
            return $this->sendError($e->getMessage(), 500);
        }
    }

    public function getMonthlyReport(Request $request)
    {
        try {
            $month = $request->get('month', now()->format('Y-m'));
            $branchId = $request->get('branch_id');

            $query = User::whereIn('role', ['employee', 'manager']);

            if ($branchId) {
                $query->where('branch_id', $branchId);
            }

            $employees = $query->get();
            $data = [];

            foreach ($employees as $employee) {
                $accountsOpened = EmployeeAccount::where('employee_id', $employee->id)
                    ->where('month', $month)
                    ->count();

                $accountIds = EmployeeAccount::where('employee_id', $employee->id)
                    ->pluck('customer_id')
                    ->toArray();

                $accountRecords = Account::whereIn('customer_id', $accountIds)->pluck('id')->toArray();

                $recovery = Installment::whereIn('account_id', $accountRecords)
                    ->where('month', $month)
                    ->sum('paid_amount');

                $commission = $recovery * 0.05;

                $leaves = EmployeeLeave::where('user_id', $employee->id)
                    ->where('month', $month)
                    ->where('status', 'approved')
                    ->count();

                $data[] = [
                    'employee_id' => $employee->id,
                    'employee_name' => $employee->name,
                    'branch_id' => $employee->branch_id,
                    'accounts_opened' => $accountsOpened,
                    'recovery' => $recovery,
                    'commission' => $commission,
                    'leaves' => $leaves,
                ];
            }

            $summary = [
                'total_employees' => count($data),
                'total_accounts' => array_sum(array_column($data, 'accounts_opened')),
                'total_recovery' => array_sum(array_column($data, 'recovery')),
                'total_commission' => array_sum(array_column($data, 'commission')),
                'total_leaves' => array_sum(array_column($data, 'leaves')),
                'month' => $month,
            ];

            return $this->sendResponse([
                'data' => $data,
                'summary' => $summary
            ], 'Monthly report retrieved successfully');

        } catch (\Exception $e) {
            return $this->sendError($e->getMessage(), 500);
        }
    }

    // ============================================
    // ✅ PRIVATE HELPER METHODS
    // ============================================

    /**
     * Get monthly breakdown for an employee
     *
     * ✅ FIX: recovery/commission per month now come from
     * `installments` (paid_amount, grouped by `month`) via
     * employee_accounts.customer_id -> accounts.customer_id,
     * instead of the unused `recovery` table.
     */
    private function getEmployeeMonthlyData($employeeId)
    {
        $months = [];
        $currentMonth = now()->format('Y-m');

        // Get accounts by month (last 12 months)
        $accounts = EmployeeAccount::where('employee_id', $employeeId)
            ->select('month', DB::raw('count(*) as total'))
            ->groupBy('month')
            ->orderBy('month', 'desc')
            ->limit(12)
            ->get();

        foreach ($accounts as $account) {
            $monthKey = $account->month;
            $months[$monthKey] = [
                'accountsOpened' => $account->total,
                'recoveryAmount' => 0,
                'commission' => 0,
                'leaves' => 0,
                'salary' => 0,
                'advances' => 0,
                'status' => 'active'
            ];
        }

        // ✅ FIX: Get recovery by month from installments.paid_amount
        $accountIds = EmployeeAccount::where('employee_id', $employeeId)
            ->pluck('customer_id')
            ->toArray();

        $accountRecords = Account::whereIn('customer_id', $accountIds)
            ->pluck('id')
            ->toArray();

        $recoveries = Installment::whereIn('account_id', $accountRecords)
            ->select('month', DB::raw('sum(paid_amount) as total'))
            ->groupBy('month')
            ->get();

        foreach ($recoveries as $recovery) {
            $monthKey = $recovery->month;
            if (!isset($months[$monthKey])) {
                $months[$monthKey] = [
                    'accountsOpened' => 0,
                    'recoveryAmount' => 0,
                    'commission' => 0,
                    'leaves' => 0,
                    'salary' => 0,
                    'advances' => 0,
                    'status' => 'active'
                ];
            }
            $months[$monthKey]['recoveryAmount'] = floatval($recovery->total);
        }

        // ✅ FIX: Commission by month comes from the `salary` table's
        // `commission` column (grouped by `month`), not 5% of recovery.
        $salaryRows = DB::table('salary')
            ->where('user_id', $employeeId)
            ->select('month', DB::raw('sum(commission) as total'))
            ->groupBy('month')
            ->get();

        foreach ($salaryRows as $row) {
            $monthKey = $row->month;
            if (!isset($months[$monthKey])) {
                $months[$monthKey] = [
                    'accountsOpened' => 0,
                    'recoveryAmount' => 0,
                    'commission' => 0,
                    'leaves' => 0,
                    'salary' => 0,
                    'advances' => 0,
                    'status' => 'active'
                ];
            }
            $months[$monthKey]['commission'] = floatval($row->total);
        }

        // Get leaves by month
        $leaves = EmployeeLeave::where('user_id', $employeeId)
            ->where('status', 'approved')
            ->select('month', DB::raw('count(*) as total'))
            ->groupBy('month')
            ->get();

        foreach ($leaves as $leave) {
            $monthKey = $leave->month;
            if (!isset($months[$monthKey])) {
                $months[$monthKey] = [
                    'accountsOpened' => 0,
                    'recoveryAmount' => 0,
                    'commission' => 0,
                    'leaves' => 0,
                    'salary' => 0,
                    'advances' => 0,
                    'status' => 'active'
                ];
            }
            $months[$monthKey]['leaves'] = $leave->total;
        }

        // Ensure current month exists
        if (!isset($months[$currentMonth])) {
            $months[$currentMonth] = [
                'accountsOpened' => 0,
                'recoveryAmount' => 0,
                'commission' => 0,
                'leaves' => 0,
                'salary' => 0,
                'advances' => 0,
                'status' => 'active'
            ];
        }

        return $months;
    }

    private function calculatePerformance($employeeId, $month)
    {
        $thisMonth = EmployeeAccount::where('employee_id', $employeeId)
            ->where('month', $month)
            ->count();

        $avg = EmployeeAccount::where('month', $month)
            ->select('employee_id', DB::raw('count(*) as total'))
            ->groupBy('employee_id')
            ->get()
            ->avg('total') ?? 1;

        if ($avg > 0) {
            $score = ($thisMonth / $avg) * 100;
        } else {
            $score = 0;
        }

        return round(min($score, 100), 2);
    }
}
<?php
// app/Http/Controllers/Api/SalaryController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Salary;
use App\Models\SalaryAdvance;
use App\Models\Loan;
use App\Models\LoanPayment;
use App\Models\EmployeeLeave;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class SalaryController extends Controller
{
    // ============================================
    // GET ALL SALARY RECORDS
    // ============================================
    public function index(Request $request)
    {
        $query = Salary::with(['user', 'leaves']);

        if ($request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->month) {
            $query->where('month', $request->month);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        return response()->json([
            'success' => true,
            'data' => $query->orderBy('month', 'desc')->get()
        ]);
    }

    // ============================================
    // CREATE SALARY RECORD
    // ============================================
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'user_id' => 'required|exists:users,id',
                'month' => 'required|string|max:20',
                'salary_amount' => 'required|numeric|min:0',
                'commission' => 'nullable|numeric|min:0',
                'advances' => 'nullable|numeric|min:0',
                'leave_count' => 'nullable|integer|min:0',
                'status' => 'nullable|in:paid,pending,partial'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check if record already exists for this user and month
            $existing = Salary::where('user_id', $request->user_id)
                ->where('month', $request->month)
                ->first();

            if ($existing) {
                return response()->json([
                    'success' => false,
                    'message' => 'Salary record already exists for this month'
                ], 422);
            }

            $salary = Salary::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Salary record created successfully',
                'data' => $salary->load(['user', 'leaves'])
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create salary record: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // UPDATE SALARY RECORD - COMPLETE RESET SUPPORT
    // ============================================
    public function update(Request $request, $id)
    {
        try {
            $salary = Salary::find($id);
            if (!$salary) {
                return response()->json([
                    'success' => false,
                    'message' => 'Salary record not found'
                ], 404);
            }

            $validated = $request->validate([
                'status' => 'sometimes|in:paid,pending,partial',
                'paid_date' => 'nullable|date',
                'commission' => 'nullable|numeric|min:0',
                'total_paid' => 'nullable|numeric|min:0',
                'leave_count' => 'nullable|integer|min:0',
                'advances' => 'nullable|numeric|min:0',
                'salary_amount' => 'nullable|numeric|min:0',
            ]);

            $salary->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Salary record updated successfully',
                'data' => $salary->load(['user', 'leaves'])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update salary: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // PAY SALARY
    // ✅ Loans ab "running balance" hain — jitni amount
    // available hai utni hi kategi, baaki agle mahine
    // carry hogi. Har deduction loan_payments mein log hota hai.
    // ============================================
    public function paySalary($id)
    {
        try {
            $salary = Salary::find($id);
            if (!$salary) {
                return response()->json([
                    'success' => false,
                    'message' => 'Salary record not found'
                ], 404);
            }

            // ✅ Advances minus karne ke baad jo bacha wahi loans ke liye available hai
            $availableForLoans = $salary->salary_amount + $salary->commission - $salary->advances;
            if ($availableForLoans < 0) {
                $availableForLoans = 0;
            }

            // ✅ Sab pending loans (purani pehle) — partial deduction
            $pendingLoans = Loan::where('user_id', $salary->user_id)
                ->whereColumn('paid_amount', '<', 'amount')
                ->orderBy('date', 'asc')
                ->get();

            $totalLoanDeducted = 0;

            foreach ($pendingLoans as $loan) {
                if ($availableForLoans <= 0) {
                    break;
                }

                $loanRemaining = $loan->amount - $loan->paid_amount;
                $deductNow = min($loanRemaining, $availableForLoans);

                if ($deductNow > 0) {
                    $loan->paid_amount = $loan->paid_amount + $deductNow;
                    $loan->deducted = $loan->paid_amount >= $loan->amount;
                    $loan->save();

                    // ✅ Log entry — full loan history
                    LoanPayment::create([
                        'loan_id' => $loan->id,
                        'user_id' => $salary->user_id,
                        'amount' => $deductNow,
                        'date' => now()
                    ]);

                    $availableForLoans -= $deductNow;
                    $totalLoanDeducted += $deductNow;
                }
            }

            $totalPaid = $salary->salary_amount + $salary->commission - $salary->advances - $totalLoanDeducted;

            $salary->update([
                'status' => 'paid',
                'total_paid' => $totalPaid > 0 ? $totalPaid : 0,
                'paid_date' => date('Y-m-d')
            ]);

            // Mark all advances as deducted
            SalaryAdvance::where('user_id', $salary->user_id)
                ->where('deducted', false)
                ->update(['deducted' => true]);

            return response()->json([
                'success' => true,
                'message' => 'Salary paid successfully',
                'data' => $salary->load(['user', 'leaves']),
                'loan_deducted' => $totalLoanDeducted
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to pay salary: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // GET ALL SALARY ADVANCES
    // ============================================
    public function advances(Request $request)
    {
        try {
            $query = SalaryAdvance::with('user');

            if ($request->user_id) {
                $query->where('user_id', $request->user_id);
            }

            if ($request->deducted !== null) {
                $query->where('deducted', $request->deducted);
            }

            return response()->json([
                'success' => true,
                'data' => $query->orderBy('date', 'desc')->get()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch advances: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // CREATE SALARY ADVANCE
    // ============================================
    public function storeAdvance(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'user_id' => 'required|exists:users,id',
                'amount' => 'required|numeric|min:1',
                'reason' => 'nullable|string',
                'date' => 'nullable|date'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check if user has enough salary remaining
            $user = User::find($request->user_id);

            $totalAdvances = SalaryAdvance::where('user_id', $request->user_id)
                ->where('deducted', false)
                ->sum('amount');

            $remaining = $user->salary - $totalAdvances;

            if ($request->amount > $remaining) {
                return response()->json([
                    'success' => false,
                    'message' => "Amount exceeds remaining salary: PKR " . number_format($remaining, 0)
                ], 422);
            }

            $data = $request->all();
            $data['date'] = $request->date ?? now();
            $data['deducted'] = false;

            $advance = SalaryAdvance::create($data);

            return response()->json([
                'success' => true,
                'message' => 'Salary advance added successfully',
                'data' => $advance
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to add advance: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // DEDUCT ADVANCE
    // ============================================
    public function deductAdvance($id)
    {
        try {
            $advance = SalaryAdvance::find($id);
            if (!$advance) {
                return response()->json([
                    'success' => false,
                    'message' => 'Advance not found'
                ], 404);
            }

            $advance->update(['deducted' => true]);

            return response()->json([
                'success' => true,
                'message' => 'Advance deducted from salary',
                'data' => $advance
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to deduct advance: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // DELETE ADVANCE
    // ============================================
    public function deleteAdvance($id)
    {
        try {
            $advance = SalaryAdvance::find($id);
            if (!$advance) {
                return response()->json([
                    'success' => false,
                    'message' => 'Advance not found'
                ], 404);
            }

            $advance->delete();

            return response()->json([
                'success' => true,
                'message' => 'Advance deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete advance: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // GET ALL LOANS (with full payment log)
    // ============================================
    public function loans(Request $request)
    {
        try {
            $query = Loan::with(['user', 'payments']);

            if ($request->user_id) {
                $query->where('user_id', $request->user_id);
            }

            if ($request->deducted !== null) {
                $query->where('deducted', $request->deducted);
            }

            return response()->json([
                'success' => true,
                'data' => $query->orderBy('date', 'desc')->get()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch loans: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // CREATE LOAN
    // ✅ Koi salary-cap restriction nahi — employee
    // jitni chahe loan amount le sakta hai
    // ============================================
    public function storeLoan(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'user_id' => 'required|exists:users,id',
                'amount' => 'required|numeric|min:1',
                'reason' => 'nullable|string',
                'date' => 'nullable|date'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $request->all();
            $data['date'] = $request->date ?? now();
            $data['paid_amount'] = 0;
            $data['deducted'] = false;

            $loan = Loan::create($data);

            return response()->json([
                'success' => true,
                'message' => 'Loan added successfully',
                'data' => $loan
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to add loan: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // DEDUCT LOAN (manually mark fully paid off)
    // ============================================
    public function deductLoan($id)
    {
        try {
            $loan = Loan::find($id);
            if (!$loan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Loan not found'
                ], 404);
            }

            $remaining = $loan->amount - $loan->paid_amount;

            if ($remaining > 0) {
                LoanPayment::create([
                    'loan_id' => $loan->id,
                    'user_id' => $loan->user_id,
                    'amount' => $remaining,
                    'date' => now()
                ]);
            }

            $loan->update([
                'paid_amount' => $loan->amount,
                'deducted' => true
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Loan deducted from salary',
                'data' => $loan
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to deduct loan: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // DELETE LOAN
    // ============================================
    public function deleteLoan($id)
    {
        try {
            $loan = Loan::find($id);
            if (!$loan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Loan not found'
                ], 404);
            }

            $loan->delete();

            return response()->json([
                'success' => true,
                'message' => 'Loan deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete loan: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // GET EMPLOYEE LEAVES
    // ============================================
    public function getLeaves(Request $request)
    {
        try {
            $query = EmployeeLeave::with('user');

            if ($request->user_id) {
                $query->where('user_id', $request->user_id);
            }

            if ($request->month) {
                $query->where('month', $request->month);
            }

            if ($request->year) {
                $query->where('year', $request->year);
            }

            if ($request->status) {
                $query->where('status', $request->status);
            }

            return response()->json([
                'success' => true,
                'data' => $query->orderBy('leave_date', 'desc')->get()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch leaves: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // ADD EMPLOYEE LEAVE
    // ============================================
    public function storeLeave(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'user_id' => 'required|exists:users,id',
                'leave_date' => 'required|date',
                'reason' => 'nullable|string',
                'status' => 'nullable|in:approved,pending,rejected'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $request->all();
            $date = new \DateTime($request->leave_date);
            $data['month'] = $date->format('Y-m');
            $data['year'] = $date->format('Y');
            $data['status'] = $request->status ?? 'approved';

            $leave = EmployeeLeave::create($data);

            // Update leave count in salary table
            $salary = Salary::where('user_id', $request->user_id)
                ->where('month', $data['month'])
                ->first();

            if ($salary) {
                $leaveCount = EmployeeLeave::where('user_id', $request->user_id)
                    ->where('month', $data['month'])
                    ->where('status', 'approved')
                    ->count();

                $salary->update(['leave_count' => $leaveCount]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Leave added successfully',
                'data' => $leave->load('user')
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to add leave: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // UPDATE EMPLOYEE LEAVE
    // ============================================
    public function updateLeave(Request $request, $id)
    {
        try {
            $leave = EmployeeLeave::find($id);
            if (!$leave) {
                return response()->json([
                    'success' => false,
                    'message' => 'Leave not found'
                ], 404);
            }

            $leave->update($request->all());

            // Update leave count in salary table
            $salary = Salary::where('user_id', $leave->user_id)
                ->where('month', $leave->month)
                ->first();

            if ($salary) {
                $leaveCount = EmployeeLeave::where('user_id', $leave->user_id)
                    ->where('month', $leave->month)
                    ->where('status', 'approved')
                    ->count();

                $salary->update(['leave_count' => $leaveCount]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Leave updated successfully',
                'data' => $leave->load('user')
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update leave: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // DELETE EMPLOYEE LEAVE
    // ============================================
    public function deleteLeave($id)
    {
        try {
            $leave = EmployeeLeave::find($id);
            if (!$leave) {
                return response()->json([
                    'success' => false,
                    'message' => 'Leave not found'
                ], 404);
            }

            $userId = $leave->user_id;
            $month = $leave->month;

            $leave->delete();

            // Update leave count in salary table
            $salary = Salary::where('user_id', $userId)
                ->where('month', $month)
                ->first();

            if ($salary) {
                $leaveCount = EmployeeLeave::where('user_id', $userId)
                    ->where('month', $month)
                    ->where('status', 'approved')
                    ->count();

                $salary->update(['leave_count' => $leaveCount]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Leave deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete leave: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // GET MONTHLY SALARY SUMMARY
    // ============================================
    public function getMonthlySummary(Request $request)
    {
        try {
            $month = $request->month ?? date('Y-m');
            $branchId = $request->branch_id;

            $query = Salary::with(['user', 'leaves'])
                ->where('month', $month);

            if ($branchId) {
                $query->whereHas('user', function($q) use ($branchId) {
                    $q->where('branch_id', $branchId);
                });
            }

            $salaries = $query->get();

            $summary = [
                'month' => $month,
                'total_salary' => $salaries->sum('salary_amount'),
                'total_commission' => $salaries->sum('commission'),
                'total_advances' => $salaries->sum('advances'),
                'total_leaves' => $salaries->sum('leave_count'),
                'total_paid' => $salaries->sum('total_paid'),
                'paid_count' => $salaries->where('status', 'paid')->count(),
                'pending_count' => $salaries->where('status', 'pending')->count(),
                'records' => $salaries
            ];

            return response()->json([
                'success' => true,
                'data' => $summary
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch summary: ' . $e->getMessage()
            ], 500);
        }
    }
}
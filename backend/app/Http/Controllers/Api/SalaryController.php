<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Salary;
use App\Models\SalaryAdvance;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SalaryController extends Controller
{
    // ============================================
    // GET ALL SALARY RECORDS
    // ============================================
    public function index(Request $request)
    {
        $query = Salary::with('user');

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
            $request->validate([
                'user_id' => 'required|exists:users,id',
                'month' => 'required|string|max:20',
                'salary_amount' => 'required|numeric|min:0',
                'commission' => 'nullable|numeric|min:0',
                'advances' => 'nullable|numeric|min:0',
                'status' => 'nullable|in:paid,pending,partial'
            ]);

            $salary = Salary::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Salary record created successfully',
                'data' => $salary
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create salary record: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // UPDATE SALARY RECORD
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

            $salary->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Salary record updated successfully',
                'data' => $salary
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

            $totalPaid = $salary->salary_amount + $salary->commission - $salary->advances;

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
                'data' => $salary
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to pay salary: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // ✅ GET ALL SALARY ADVANCES
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
    // ✅ CREATE SALARY ADVANCE
    // ============================================
    public function storeAdvance(Request $request)
    {
        try {
            $request->validate([
                'user_id' => 'required|exists:users,id',
                'amount' => 'required|numeric|min:1',
                'reason' => 'nullable|string',
                'date' => 'nullable|date'
            ]);

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
    // ✅ DEDUCT ADVANCE
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
}
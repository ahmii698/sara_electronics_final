<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TargetPerformance;
use App\Models\EmployeeAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TargetPerformanceController extends Controller
{
    public function sendResponse($data, $message = 'Success', $code = 200)
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data
        ], $code);
    }

    public function sendError($message, $code = 400)
    {
        return response()->json([
            'success' => false,
            'message' => $message
        ], $code);
    }

    // ============================================
    // ✅ GET EMPLOYEE ACCOUNT COUNT (current month + total)
    // Employee Report jaisa hi tareeqa — EmployeeAccount table use karta hai
    // ============================================
    public function getEmployeeCount(Request $request)
    {
        try {
            $employeeId = $request->get('employee_id');
            $month = $request->get('month', date('Y-m'));

            if (!$employeeId) {
                return $this->sendError('Employee ID is required');
            }

            $currentMonth = EmployeeAccount::where('employee_id', $employeeId)
                ->where('month', $month)
                ->count();

            $total = EmployeeAccount::where('employee_id', $employeeId)->count();

            return response()->json([
                'success' => true,
                'current_month' => $currentMonth,
                'total' => $total
            ]);

        } catch (\Exception $e) {
            return $this->sendError($e->getMessage(), 500);
        }
    }

    // ============================================
    // ✅ GET ALL TARGETS FOR A GIVEN MONTH
    // ============================================
    public function getTargets(Request $request)
    {
        try {
            $month = $request->get('month', date('Y-m'));
            $branchId = $request->get('branch_id');

            $query = TargetPerformance::where('month', $month);

            if ($branchId) {
                $query->whereHas('employee', function ($q) use ($branchId) {
                    $q->where('branch_id', $branchId);
                });
            }

            $targets = $query->get()->keyBy('employee_id');

            return $this->sendResponse($targets, 'Targets retrieved successfully');

        } catch (\Exception $e) {
            return $this->sendError($e->getMessage(), 500);
        }
    }

    // ============================================
    // ✅ SAVE / UPDATE TARGET (upsert)
    // ============================================
    public function saveTarget(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'employee_id' => 'required|exists:users,id',
                'month' => 'required|string',
                'target' => 'required|integer|min:0',
            ]);

            if ($validator->fails()) {
                return $this->sendError($validator->errors()->first(), 422);
            }

            $user = auth()->user();

            $target = TargetPerformance::updateOrCreate(
                ['employee_id' => $request->employee_id, 'month' => $request->month],
                ['target' => $request->target, 'set_by' => $user->id]
            );

            return $this->sendResponse($target, 'Target saved successfully');

        } catch (\Exception $e) {
            return $this->sendError($e->getMessage(), 500);
        }
    }
}
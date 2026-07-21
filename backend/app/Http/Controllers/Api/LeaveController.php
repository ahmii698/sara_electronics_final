<?php
// app/Http/Controllers/Api/LeaveController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmployeeLeave;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class LeaveController extends Controller
{
    public function sendResponse($data, $message = 'Success', $code = 200)
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data
        ], $code);
    }

    public function sendError($message, $code = 400, $errors = null)
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors' => $errors
        ], $code);
    }

    // ============================================
    // GET /api/leaves
    // List leave applications (admin view / branch view)
    // Optional filters: ?status=pending  ?user_id=5  ?branch_id=1
    // ============================================
    public function index(Request $request)
    {
        try {
            $query = EmployeeLeave::with('employee:id,name,branch_id,role')
                ->orderBy('leave_date', 'desc');

            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            if ($request->filled('user_id')) {
                $query->where('user_id', $request->user_id);
            }

            if ($request->filled('branch_id')) {
                $query->whereHas('employee', function ($q) use ($request) {
                    $q->where('branch_id', $request->branch_id);
                });
            }

            $leaves = $query->get();

            return $this->sendResponse($leaves, 'Leaves retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage(), 500);
        }
    }

    // ============================================
    // POST /api/leaves
    // Submit a new leave application.
    // Form only sends: user_id, leave_date, reason.
    // month/year/status are filled in automatically here.
    // ============================================
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id'    => 'required|exists:users,id',
            'leave_date' => 'required|date',
            'reason'     => 'required|string|max:500',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation error', 422, $validator->errors());
        }

        try {
            $date = Carbon::parse($request->leave_date);

            $leave = EmployeeLeave::create([
                'user_id'    => $request->user_id,
                'leave_date' => $date->format('Y-m-d'),
                'month'      => $date->format('Y-m'),   // ✅ auto-derived
                'year'       => $date->format('Y'),       // ✅ auto-derived
                'reason'     => $request->reason,
                'status'     => 'pending',
            ]);

            return $this->sendResponse($leave, 'Leave application submitted successfully', 201);
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage(), 500);
        }
    }

    // ============================================
    // PATCH /api/leaves/{id}/status
    // Approve / reject a leave request (admin action)
    // ============================================
    public function updateStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:approved,rejected,pending',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation error', 422, $validator->errors());
        }

        $leave = EmployeeLeave::find($id);
        if (!$leave) {
            return $this->sendError('Leave record not found', 404);
        }

        $leave->status = $request->status;
        $leave->save();

        return $this->sendResponse($leave, 'Leave status updated successfully');
    }

    // ============================================
    // DELETE /api/leaves/{id}
    // ============================================
    public function destroy($id)
    {
        $leave = EmployeeLeave::find($id);
        if (!$leave) {
            return $this->sendError('Leave record not found', 404);
        }

        $leave->delete();

        return $this->sendResponse(null, 'Leave record deleted successfully');
    }
}
<?php
// app/Http/Controllers/Api/InstallmentController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Installment;
use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class InstallmentController extends Controller
{
    public function index(Request $request)
    {
        // ✅ Load all relations
        $query = Installment::with([
            'account.customer', 
            'account.branch',
            'account.creator',
            'account.employeeAccount',
            'account.employeeAccount.employee'
        ]);

        if ($request->account_id) {
            $query->where('account_id', $request->account_id);
        }

        // ✅ FIX: Agar status 'all' hai toh filter mat lagao, warna status filter lagao
        if ($request->status && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->month) {
            $query->where('month', $request->month);
        }

        if ($request->branch_id) {
            $query->whereHas('account', function($q) use ($request) {
                $q->where('branch_id', $request->branch_id);
            });
        }

        if ($request->employee_id) {
            $query->whereHas('account', function($q) use ($request) {
                $q->where('employee_account_id', $request->employee_id);
            });
        }

        if ($request->search) {
            $search = $request->search;
            $query->whereHas('account.customer', function($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('cnic', 'LIKE', "%{$search}%")
                  ->orWhere('phone', 'LIKE', "%{$search}%");
            })->orWhereHas('account', function($q) use ($search) {
                $q->where('case_no', 'LIKE', "%{$search}%")
                  ->orWhere('product_name', 'LIKE', "%{$search}%");
            });
        }

        // ✅ Date filters
        if ($request->date_from) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // ✅ FIX: paginate(50) hata diya gaya hai.
        // Pehle: orderBy('month','desc') + paginate(50) — jab ek branch ke
        // accounts ki combined installments 50 se zyada ho jaati thi, toh
        // sabse PURANE (earliest) months wale records page 1 se hi cut ho
        // jaate the (kyunke sort DESC tha aur limit 50 thi). Isi wajah se
        // Recovery table mein kisi account ki asal pehli/agli due installment
        // (jaise Jul 2026) ki jagah kahin aagay ka mahina (jaise Dec 2026)
        // dikh raha tha — woh record simply response mein aaya hi nahi tha.
        // Frontend (Installments.jsx) apna client-side pagination khud
        // sambhalta hai (10 per page table mein), isliye yahan backend se
        // MATCHING FILTERS ki poori list bhejna zaroori hai, warna
        // per-account status/next-due calculation ghalat ho jaati hai.
        $installments = $query->orderBy('month', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $installments
        ]);
    }

    public function show($id)
    {
        $installment = Installment::with([
            'account.customer', 
            'account.branch', 
            'account.creator', 
            'account.employeeAccount', 
            'account.employeeAccount.employee'
        ])->find($id);

        if (!$installment) {
            return response()->json([
                'success' => false,
                'message' => 'Installment not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $installment
        ]);
    }

    public function payInstallment(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'installment_id' => 'required|exists:installments,id',
            'amount' => 'nullable|numeric|min:0',
            'payment_date' => 'nullable|date'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();

        try {
            $installment = Installment::find($request->installment_id);

            if ($installment->status === 'paid') {
                return response()->json([
                    'success' => false,
                    'message' => 'This installment is already paid'
                ], 422);
            }

            $amount = $request->amount ?? $installment->balance;

            if ($amount > $installment->balance) {
                return response()->json([
                    'success' => false,
                    'message' => 'Amount cannot exceed balance'
                ], 422);
            }

            $newPaidAmount = $installment->paid_amount + $amount;
            $newBalance = $installment->due_amount - $newPaidAmount;
            
            if ($newBalance <= 0) {
                $status = 'paid';
            } elseif ($newPaidAmount > 0) {
                $status = 'partial';
            } else {
                $status = 'unpaid';
            }

            // ✅ FIX: payment_date save karo
            $paymentDate = $request->payment_date ?? date('Y-m-d');

            $installment->update([
                'paid_amount' => $newPaidAmount,
                'balance' => $newBalance,
                'status' => $status,
                'payment_date' => $paymentDate
            ]);

            $account = Account::find($installment->account_id);
            if ($account) {
                $totalPaid = Installment::where('account_id', $account->id)->sum('paid_amount');
                $accountBalance = $account->total_amount - $totalPaid;

                $account->update([
                    'paid_amount' => $totalPaid,
                    'balance' => $accountBalance,
                    'installments_paid' => Installment::where('account_id', $account->id)
                        ->where('paid_amount', '>', 0)->count(),
                    'last_payment_date' => $paymentDate,
                    'status' => $accountBalance <= 0 ? 'paid' : 'active'
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Installment paid successfully',
                'data' => $installment->load([
                    'account.customer', 
                    'account.branch', 
                    'account.creator', 
                    'account.employeeAccount', 
                    'account.employeeAccount.employee'
                ])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Payment failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function partialPay(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'installment_id' => 'required|exists:installments,id',
            'paid_amount' => 'required|numeric|min:0',
            'month' => 'nullable|string|date_format:Y-m',
            'payment_date' => 'nullable|date'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();

        try {
            $installment = Installment::find($request->installment_id);

            if (!$installment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Installment not found'
                ], 404);
            }

            if ($installment->status === 'paid') {
                return response()->json([
                    'success' => false,
                    'message' => 'This installment is already paid'
                ], 422);
            }

            $amount = $request->paid_amount;

            if ($amount > $installment->balance) {
                return response()->json([
                    'success' => false,
                    'message' => 'Amount cannot exceed remaining balance',
                    'max_payable' => $installment->balance
                ], 422);
            }

            $newPaidAmount = $installment->paid_amount + $amount;
            $newBalance = $installment->due_amount - $newPaidAmount;
            
            if ($newBalance <= 0) {
                $status = 'paid';
            } elseif ($newPaidAmount > 0) {
                $status = 'partial';
            } else {
                $status = 'unpaid';
            }

            // ✅ FIX: payment_date save karo
            $paymentDate = $request->payment_date ?? date('Y-m-d');

            $installment->update([
                'paid_amount' => $newPaidAmount,
                'balance' => $newBalance,
                'status' => $status,
                'payment_date' => $paymentDate
            ]);

            if ($request->month && $request->month !== $installment->month) {
                $existing = Installment::where('account_id', $installment->account_id)
                    ->where('month', $request->month)
                    ->where('id', '!=', $installment->id)
                    ->first();

                if ($existing) {
                    $existing->update([
                        'paid_amount' => $existing->paid_amount + $installment->paid_amount,
                        'balance' => $existing->due_amount - ($existing->paid_amount + $installment->paid_amount),
                        'status' => $existing->balance <= 0 ? 'paid' : 'partial'
                    ]);
                    $installment->delete();
                    $installment = $existing;
                } else {
                    $installment->update(['month' => $request->month]);
                }
            }

            $account = Account::find($installment->account_id);
            if ($account) {
                $totalPaid = Installment::where('account_id', $account->id)->sum('paid_amount');
                $accountBalance = $account->total_amount - $totalPaid;

                $account->update([
                    'paid_amount' => $totalPaid,
                    'balance' => $accountBalance,
                    'installments_paid' => Installment::where('account_id', $account->id)
                        ->where('paid_amount', '>', 0)->count(),
                    'last_payment_date' => $paymentDate,
                    'status' => $accountBalance <= 0 ? 'paid' : 'active'
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Payment recorded successfully',
                'data' => $installment->load([
                    'account.customer', 
                    'account.branch', 
                    'account.creator', 
                    'account.employeeAccount', 
                    'account.employeeAccount.employee'
                ]),
                'amount_paid' => $amount,
                'new_balance' => $newBalance,
                'status' => $status,
                'month_updated' => $request->month ? true : false
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Payment failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function overdue(Request $request)
    {
        $currentMonth = date('Y-m');
        
        $query = Installment::with([
            'account.customer', 
            'account.branch', 
            'account.creator', 
            'account.employeeAccount', 
            'account.employeeAccount.employee'
        ])
        ->whereIn('status', ['unpaid', 'partial'])
        ->where('month', '<', $currentMonth);

        if ($request->branch_id) {
            $query->whereHas('account', function($q) use ($request) {
                $q->where('branch_id', $request->branch_id);
            });
        }

        $overdue = $query->orderBy('month', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $overdue,
            'count' => $overdue->count()
        ]);
    }

    public function agingReport(Request $request)
    {
        $branchId = $request->branch_id;
        $currentMonth = date('Y-m');

        $query = Installment::with([
            'account.customer', 
            'account.branch', 
            'account.creator', 
            'account.employeeAccount', 
            'account.employeeAccount.employee'
        ])
        ->whereIn('status', ['unpaid', 'partial'])
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
            $color = '#22c55e';
            if ($overdueDays >= 180) {
                $level = 'Critical';
                $color = '#ef4444';
            } else if ($overdueDays >= 120) {
                $level = 'High';
                $color = '#f97316';
            } else if ($overdueDays >= 60) {
                $level = 'Medium';
                $color = '#eab308';
            }

            return [
                'id' => $item->id,
                'customer_name' => $item->account->customer->name ?? 'N/A',
                'customer_cnic' => $item->account->customer->cnic ?? 'N/A',
                'customer_phone' => $item->account->customer->phone ?? 'N/A',
                'case_no' => $item->account->case_no ?? 'N/A',
                'month' => $item->month,
                'due_date' => $item->due_date,
                'due_amount' => (float) $item->due_amount,
                'paid_amount' => (float) $item->paid_amount,
                'balance' => (float) $item->balance,
                'overdue_days' => $overdueDays,
                'level' => $level,
                'color' => $color,
                'status' => $item->status,
                'account' => [
                    'id' => $item->account->id,
                    'total_amount' => $item->account->total_amount,
                    'paid_amount' => $item->account->paid_amount,
                    'balance' => $item->account->balance,
                    'product_name' => $item->account->product_name,
                ]
            ];
        });

        $summary = [
            'total_installments' => $data->count(),
            'total_due' => $data->sum('due_amount'),
            'total_paid' => $data->sum('paid_amount'),
            'total_balance' => $data->sum('balance'),
            'critical' => $data->where('level', 'Critical')->count(),
            'high' => $data->where('level', 'High')->count(),
            'medium' => $data->where('level', 'Medium')->count(),
            'low' => $data->where('level', 'Low')->count()
        ];

        return response()->json([
            'success' => true,
            'data' => $data,
            'summary' => $summary
        ]);
    }

    public function getByAccount($accountId)
    {
        $installments = Installment::with([
            'account.customer', 
            'account.branch', 
            'account.creator', 
            'account.employeeAccount', 
            'account.employeeAccount.employee'
        ])
        ->where('account_id', $accountId)
        ->orderBy('month', 'asc')
        ->get();

        return response()->json([
            'success' => true,
            'data' => $installments
        ]);
    }

    public function getAccountDetails($accountId)
    {
        $account = Account::with([
            'customer.guarantors',
            'customer.creator',
            'branch',
            'installments',
            'creator',
            'employeeAccount',
            'employeeAccount.employee'
        ])->find($accountId);

        if (!$account) {
            return response()->json([
                'success' => false,
                'message' => 'Account not found'
            ], 404);
        }

        $response = $account->toArray();
        
        if ($account->employeeAccount && $account->employeeAccount->employee) {
            $response['employee_name'] = $account->employeeAccount->employee->name;
            $response['employee_id'] = $account->employeeAccount->employee_id;
            $response['employee_account_id'] = $account->employeeAccount->id;
        } else {
            $response['employee_name'] = 'N/A';
            $response['employee_id'] = null;
            $response['employee_account_id'] = null;
        }
        
        if ($account->creator) {
            $response['creator_name'] = $account->creator->name;
            $response['creator_role'] = $account->creator->role;
            $response['creator_id'] = $account->creator->id;
        } else {
            $response['creator_name'] = 'N/A';
            $response['creator_role'] = '';
            $response['creator_id'] = null;
        }

        return response()->json([
            'success' => true,
            'data' => $response
        ]);
    }

    public function getStats(Request $request)
    {
        $query = Installment::query();

        if ($request->branch_id) {
            $query->whereHas('account', function($q) use ($request) {
                $q->where('branch_id', $request->branch_id);
            });
        }

        $stats = [
            'total' => $query->count(),
            'paid' => (clone $query)->where('status', 'paid')->count(),
            'unpaid' => (clone $query)->where('status', 'unpaid')->count(),
            'overdue' => (clone $query)->where('status', 'overdue')->count(),
            'partial' => (clone $query)->where('status', 'partial')->count(),
            'total_due' => (clone $query)->sum('due_amount'),
            'total_paid' => (clone $query)->sum('paid_amount'),
            'total_balance' => (clone $query)->sum('balance'),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}
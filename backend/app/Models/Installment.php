<?php
// app/Models/Installment.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Installment extends Model
{
    use HasFactory;

    protected $table = 'installments';
    protected $primaryKey = 'id';
    public $timestamps = true;

    protected $fillable = [
        'account_id', 'month', 'due_amount', 'paid_amount',
        'balance', 'status', 'payment_date', 'description', 'remarks' // ✅ NEW
    ];

    // ✅ due_date ab hamesha response mein automatically shaamil hoga (koi naya column nahi chahiye)
    protected $appends = ['due_date'];

    // ============================================
    // ✅ RELATIONS
    // ============================================

    public function account()
    {
        return $this->belongsTo(Account::class, 'account_id');
    }

    // ✅ Get customer through account
    public function getCustomerAttribute()
    {
        return $this->account ? $this->account->customer : null;
    }

    // ✅ Get branch through account
    public function getBranchAttribute()
    {
        return $this->account ? $this->account->branch : null;
    }

    // ============================================
    // ✅ DUE DATE — schema change ke bagair
    // ============================================
    // Account jis din khula (created_at ka "din"), har mahine wahi din
    // due date banta hai. Installment ka "month" field ("2026-08") is
    // "din" ke saath jod ke exact due date ban jati hai — "2026-08-23".
    public function getDueDateAttribute()
    {
        if (!$this->month) {
            return null;
        }

        $account = $this->account; // eager-loaded honi chahiye (N+1 se bachne ke liye)
        if (!$account || !$account->created_at) {
            // fallback: month ki 1 tareekh
            return $this->month . '-01';
        }

        $openingDay = (int) $account->created_at->format('j'); // din (1-31)

        [$year, $monthNum] = array_map('intval', explode('-', $this->month));

        // us mahine mein us din tak dinon ki max ginti (e.g. Feb mein 28/29)
        $daysInMonth = cal_days_in_month(CAL_GREGORIAN, $monthNum, $year);
        $day = min($openingDay, $daysInMonth);

        return sprintf('%04d-%02d-%02d', $year, $monthNum, $day);
    }

    // ============================================
    // ✅ SCOPES
    // ============================================

    public function scopeUnpaid($query)
    {
        return $query->where('status', 'unpaid');
    }

    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    public function scopeOverdue($query)
    {
        return $query->where('status', 'overdue');
    }

    public function scopePartial($query)
    {
        return $query->where('status', 'partial');
    }

    public function scopeByAccount($query, $accountId)
    {
        return $query->where('account_id', $accountId);
    }

    public function scopeByMonth($query, $month)
    {
        return $query->where('month', $month);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    // ============================================
    // ✅ HELPER METHODS
    // ============================================

    public function isPaid()
    {
        return $this->status === 'paid';
    }

    public function isOverdue()
    {
        return $this->status === 'overdue';
    }

    public function getBalance()
    {
        return $this->due_amount - $this->paid_amount;
    }

    public function getProgressPercentage()
    {
        if ($this->due_amount > 0) {
            return round(($this->paid_amount / $this->due_amount) * 100, 2);
        }
        return 0;
    }

    public function getFormattedMonth()
    {
        return date('F Y', strtotime($this->month . '-01'));
    }

    public function getFormattedDueAmount()
    {
        return number_format($this->due_amount, 2);
    }

    public function getFormattedPaidAmount()
    {
        return number_format($this->paid_amount, 2);
    }

    public function getFormattedBalance()
    {
        return number_format($this->getBalance(), 2);
    }

    // ============================================
    // ✅ ACCESSORS / MUTATORS
    // ============================================

    public function getStatusBadgeAttribute()
    {
        $badges = [
            'paid' => '<span class="badge badge-success">Paid</span>',
            'unpaid' => '<span class="badge badge-warning">Unpaid</span>',
            'overdue' => '<span class="badge badge-danger">Overdue</span>',
            'partial' => '<span class="badge badge-info">Partial</span>',
        ];
        return $badges[$this->status] ?? '<span class="badge badge-secondary">' . $this->status . '</span>';
    }
}
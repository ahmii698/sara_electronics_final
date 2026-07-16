<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Account extends Model
{
    use HasFactory;

    protected $table = 'accounts';
    protected $primaryKey = 'id';
    public $timestamps = true;

    protected $fillable = [
        'customer_id', 'product_id', 'case_no', 'total_amount',
        'paid_amount', 'balance', 'monthly_installment',
        'invoice_price', 'advance_amount', 'total_installments',
        'installments_paid', 'due_date', 'next_due_date',
        'last_payment_date', 'payment_type', 'status',
        'branch_id', 'created_by'
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function installments()
    {
        return $this->hasMany(Installment::class, 'account_id');
    }

    public function recoveries()
    {
        return $this->hasMany(Recovery::class, 'account_id');
    }
}
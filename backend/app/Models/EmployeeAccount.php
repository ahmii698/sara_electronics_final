<?php
// app/Models/EmployeeAccount.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeeAccount extends Model
{
    use HasFactory;

    protected $table = 'employee_accounts';
    
    protected $fillable = [
        'employee_id', 
        'customer_id', 
        'branch_id', 
        'account_opened_date', 
        'month', 
        'year', 
        'status',
        'created_by'  // ✅ ADD THIS
    ];

    protected $casts = [
        'account_opened_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relations
    public function employee()
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    // Account relation - One EmployeeAccount has one Account
    public function account()
    {
        return $this->hasOne(Account::class, 'employee_account_id');
    }

    // ✅ ADD THIS - Who created this record
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Scopes for easy filtering
    public function scopeCurrentMonth($query)
    {
        return $query->where('month', now()->format('Y-m'));
    }

    public function scopeForMonth($query, $month)
    {
        return $query->where('month', $month);
    }

    public function scopeForEmployee($query, $employeeId)
    {
        return $query->where('employee_id', $employeeId);
    }

    public function scopeForBranch($query, $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
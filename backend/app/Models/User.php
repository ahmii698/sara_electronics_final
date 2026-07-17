<?php
// app/Models/User.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;

class User extends Model
{
    use HasFactory, HasApiTokens;

    protected $table = 'users';
    protected $primaryKey = 'id';
    public $timestamps = true;

    protected $fillable = [
        'name', 'email', 'password', 'phone', 'cnic', 'address',
        'role', 'branch_id', 'salary', 'is_active',
        'cnic_front', 'cnic_back', 'agreement_form'
    ];

    protected $hidden = [
        'password'
    ];

    // Relations
    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function customers()
    {
        return $this->hasMany(Customer::class, 'created_by');
    }

    public function accounts()
    {
        return $this->hasMany(Account::class, 'created_by');
    }

    public function salaries()
    {
        return $this->hasMany(Salary::class, 'user_id');
    }

    public function salaryAdvances()
    {
        return $this->hasMany(SalaryAdvance::class, 'user_id');
    }

    public function recoveries()
    {
        return $this->hasMany(Recovery::class, 'created_by');
    }

    // ✅ NEW: Employee Account relations
    public function employeeAccounts()
    {
        return $this->hasMany(EmployeeAccount::class, 'employee_id');
    }

    // ✅ Helper methods for account counts
    public function getTotalAccountsAttribute()
    {
        return $this->employeeAccounts()->count();
    }

    public function getCurrentMonthAccountsAttribute()
    {
        return $this->employeeAccounts()
            ->where('month', now()->format('Y-m'))
            ->count();
    }

    public function getAccountsByMonth($month = null)
    {
        $month = $month ?? now()->format('Y-m');
        return $this->employeeAccounts()
            ->where('month', $month)
            ->count();
    }
}
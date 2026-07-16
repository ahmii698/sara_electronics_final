<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;  // ✅ YEH LINE ADD KAREIN

class User extends Model
{
    use HasFactory, HasApiTokens;  // ✅ HasApiTokens ADD KAREIN

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
}
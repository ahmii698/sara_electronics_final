<?php
// app/Models/User.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Facades\Storage;

class User extends Model
{
    use HasFactory, HasApiTokens;

    protected $table = 'users';
    protected $primaryKey = 'id';
    public $timestamps = true;

    protected $fillable = [
        'name', 'email', 'password', 'phone', 'cnic', 'address',
        'role', 'branch_id', 'salary', 'is_active',
        'cnic_front', 'cnic_back', 'agreement_form',
        'voice_consent'  // ✅ ADD THIS
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

    public function employeeAccounts()
    {
        return $this->hasMany(EmployeeAccount::class, 'employee_id');
    }

    // ✅ Accessor for Voice Consent URL
    public function getVoiceConsentUrlAttribute()
    {
        if ($this->voice_consent && Storage::disk('public')->exists($this->voice_consent)) {
            return asset('storage/' . $this->voice_consent);
        }
        return null;
    }

    // ✅ Accessor for CNIC Front URL
    public function getCnicFrontUrlAttribute()
    {
        if ($this->cnic_front && Storage::disk('public')->exists($this->cnic_front)) {
            return asset('storage/' . $this->cnic_front);
        }
        return null;
    }

    // ✅ Accessor for CNIC Back URL
    public function getCnicBackUrlAttribute()
    {
        if ($this->cnic_back && Storage::disk('public')->exists($this->cnic_back)) {
            return asset('storage/' . $this->cnic_back);
        }
        return null;
    }

    // ✅ Accessor for Agreement Form URL
    public function getAgreementFormUrlAttribute()
    {
        if ($this->agreement_form && Storage::disk('public')->exists($this->agreement_form)) {
            return asset('storage/' . $this->agreement_form);
        }
        return null;
    }

    // Helper methods for account counts
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

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByBranch($query, $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    public function scopeByRole($query, $role)
    {
        return $query->where('role', $role);
    }

    public function scopeEmployees($query)
    {
        return $query->whereIn('role', ['employee', 'manager']);
    }
}
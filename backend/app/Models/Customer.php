<?php
// app/Models/Customer.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Customer extends Model
{
    use HasFactory;

    protected $table = 'customers';
    protected $primaryKey = 'id';
    public $timestamps = true;

    protected $fillable = [
        'name', 'cnic', 'phone', 'address', 'work',
        'product_name',
        'branch_id',
        'cnic_front', 'cnic_back', 'voice_consent',
        'status', 'created_by'  // ✅ is_verified removed
    ];

    // Relations
    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function guarantors()
    {
        return $this->hasMany(Guarantor::class, 'customer_id');
    }

    public function accounts()
    {
        return $this->hasMany(Account::class, 'customer_id');
    }

    public function recoveries()
    {
        return $this->hasMany(Recovery::class, 'customer_id');
    }

    public function employeeAccount()
    {
        return $this->hasOne(EmployeeAccount::class);
    }

    // ✅ Helper methods for CNIC checks
    public static function existsByCnic($cnic)
    {
        return self::where('cnic', $cnic)->exists();
    }

    public static function isGuarantor($cnic)
    {
        return Guarantor::where('cnic', $cnic)->exists();
    }

    public static function checkCnic($cnic)
    {
        return [
            'exists' => self::existsByCnic($cnic),
            'is_guarantor' => self::isGuarantor($cnic),
        ];
    }

    // ✅ Accessor for product name
    public function getProductNameAttribute($value)
    {
        return $value ?? 'N/A';
    }

    // ✅ Get full URL for CNIC Front
    public function getCnicFrontUrlAttribute()
    {
        if ($this->cnic_front && Storage::disk('public')->exists($this->cnic_front)) {
            return asset('storage/' . $this->cnic_front);
        }
        return null;
    }

    // ✅ Get full URL for CNIC Back
    public function getCnicBackUrlAttribute()
    {
        if ($this->cnic_back && Storage::disk('public')->exists($this->cnic_back)) {
            return asset('storage/' . $this->cnic_back);
        }
        return null;
    }

    // ✅ Get full URL for Voice Consent
    public function getVoiceConsentUrlAttribute()
    {
        if ($this->voice_consent && Storage::disk('public')->exists($this->voice_consent)) {
            return asset('storage/' . $this->voice_consent);
        }
        return null;
    }

    // ✅ Scope for product name search
    public function scopeByProductName($query, $productName)
    {
        return $query->where('product_name', 'LIKE', "%{$productName}%");
    }
}
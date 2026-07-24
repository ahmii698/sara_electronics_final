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
        'additional_image_1',
        'additional_image_2',
        'status', 'created_by'
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
        return $this->hasOne(EmployeeAccount::class, 'customer_id');
    }

    // ✅ Helper methods
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

    // ✅ Accessors
    public function getProductNameAttribute($value)
    {
        return $value ?? 'N/A';
    }

    public function getCnicFrontUrlAttribute()
    {
        if ($this->cnic_front && Storage::disk('public')->exists($this->cnic_front)) {
            return asset('storage/' . $this->cnic_front);
        }
        return null;
    }

    public function getCnicBackUrlAttribute()
    {
        if ($this->cnic_back && Storage::disk('public')->exists($this->cnic_back)) {
            return asset('storage/' . $this->cnic_back);
        }
        return null;
    }

    public function getVoiceConsentUrlAttribute()
    {
        if ($this->voice_consent && Storage::disk('public')->exists($this->voice_consent)) {
            return asset('storage/' . $this->voice_consent);
        }
        return null;
    }

    public function getAdditionalImage1UrlAttribute()
    {
        if ($this->additional_image_1 && Storage::disk('public')->exists($this->additional_image_1)) {
            return asset('storage/' . $this->additional_image_1);
        }
        return null;
    }

    public function getAdditionalImage2UrlAttribute()
    {
        if ($this->additional_image_2 && Storage::disk('public')->exists($this->additional_image_2)) {
            return asset('storage/' . $this->additional_image_2);
        }
        return null;
    }

    // ✅ Scopes
    public function scopeByProductName($query, $productName)
    {
        return $query->where('product_name', 'LIKE', "%{$productName}%");
    }
}
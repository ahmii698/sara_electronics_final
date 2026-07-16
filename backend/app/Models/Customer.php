<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $table = 'customers';
    protected $primaryKey = 'id';
    public $timestamps = true;

    protected $fillable = [
        'name', 'cnic', 'phone', 'address', 'work', 'branch_id',
        'cnic_front', 'cnic_back', 'voice_consent',
        'status', 'is_verified', 'created_by'
    ];

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
}
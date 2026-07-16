<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Guarantor extends Model
{
    use HasFactory;

    protected $table = 'guarantors';
    protected $primaryKey = 'id';
    public $timestamps = true;

    protected $fillable = [
        'customer_id', 'name', 'cnic', 'phone', 'address',
        'cnic_front', 'cnic_back'
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }
}
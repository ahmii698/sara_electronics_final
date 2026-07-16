<?php

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
        'balance', 'status', 'payment_date', 'description'
    ];

    public function account()
    {
        return $this->belongsTo(Account::class, 'account_id');
    }
}
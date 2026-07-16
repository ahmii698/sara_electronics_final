<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Salary extends Model
{
    use HasFactory;

    protected $table = 'salary';
    protected $primaryKey = 'id';
    public $timestamps = true;

    protected $fillable = [
        'user_id', 'month', 'salary_amount', 'commission',
        'advances', 'total_paid', 'status', 'paid_date'
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
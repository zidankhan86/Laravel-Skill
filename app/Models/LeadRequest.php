<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class LeadRequest extends Model
{
    use HasUuids;

    protected $table = 'requests';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'kind',
        'name',
        'email',
        'phone',
        'service',
        'message',
        'requested_at',
        'timezone',
        'status',
        'notes',
        'dedup_key',
        'version',
    ];

    protected function casts(): array
    {
        return [
            'requested_at' => 'datetime',
            'version' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }
}

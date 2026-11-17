<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Setting extends Model
{
    protected $table = 'settings';
    public $incrementing = false;
    protected $keyType = 'string';

    const CREATED_AT = null;
    const UPDATED_AT = 'updated_at';

    protected $fillable = [
        'id',
        'value',
        'version',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'array',
            'version' => 'integer',
            'updated_at' => 'datetime',
        ];
    }

    public function media(): BelongsToMany
    {
        return $this->belongsToMany(Media::class, 'settings_media', 'settings_id', 'media_id');
    }
}

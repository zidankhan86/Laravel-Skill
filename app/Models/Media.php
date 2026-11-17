<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Media extends Model
{
    use HasUuids;

    protected $table = 'media';
    public $incrementing = false;
    protected $keyType = 'string';

    const CREATED_AT = 'created_at';
    const UPDATED_AT = null;

    protected $fillable = [
        'id',
        'name',
        'mime',
        'alt',
        'size',
        'bytes',
        'version',
    ];

    protected $hidden = [
        'bytes',
    ];

    protected function casts(): array
    {
        return [
            'size' => 'integer',
            'version' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    public function contents(): BelongsToMany
    {
        return $this->belongsToMany(Content::class, 'content_media', 'media_id', 'content_id');
    }

    public function settings(): BelongsToMany
    {
        return $this->belongsToMany(Setting::class, 'settings_media', 'media_id', 'settings_id');
    }
}

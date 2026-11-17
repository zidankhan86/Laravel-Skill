<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Content extends Model
{
    use HasUuids;

    protected $table = 'content';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'collection',
        'slug',
        'title',
        'summary',
        'body',
        'status',
        'featured',
        'sort_order',
        'fields',
        'seo_title',
        'seo_description',
        'published_at',
        'deleted_at',
        'version',
    ];

    protected function casts(): array
    {
        return [
            'featured' => 'boolean',
            'sort_order' => 'integer',
            'fields' => 'array',
            'version' => 'integer',
            'published_at' => 'datetime',
            'deleted_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published')
            ->whereNull('deleted_at')
            ->where(function (Builder $q) {
                $q->whereNull('published_at')
                    ->orWhere('published_at', '<=', now());
            });
    }

    public function media(): BelongsToMany
    {
        return $this->belongsToMany(Media::class, 'content_media', 'content_id', 'media_id');
    }
}

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

    /**
     * Default brand profile so fresh installations and frontend hydration always have a valid brand object.
     */
    public static function defaultBrand(): array
    {
        return [
            'name' => 'Md Tanvir Hossain',
            'email' => 'devtanvirhossain@gmail.com',
            'phone' => '01774338612',
            'aboutBio' => 'আমি গত ৫ বছর ধরে বাংলাদেশের ই-কমার্স ইন্ডাস্ট্রিতে কাজ করছি। আমার মূল লক্ষ্য হলো উদ্যোক্তাদের এমন একটি সিস্টেম উপহার দেওয়া যা তাদের ব্যবসার জটিলতা কমিয়ে দেয় এবং অটোমেশনের মাধ্যমে প্রফিট নিশ্চিত করে। টেকনোলজি যখন সঠিক সাইকোলজির সাথে যুক্ত হয়, তখনই একটি বিজনেস স্কেল করা সম্ভব।',
            'whatsapp' => '8801774338612',
            'founderOf' => 'Fast IT Care',
            'founderUrl' => 'https://fastitcare.com.bd',
            'social_github' => 'https://github.com/m-tanvir-hossain',
            'social_twitter' => 'https://x.com/mTanvirHossain',
            'social_youtube' => 'https://www.youtube.com/@m.tanvir.hossain',
            'social_facebook' => 'https://www.facebook.com/its.tanvir.hossain',
            'social_linkedin' => 'https://www.linkedin.com/in/md-tanvir-hossain/',
            'social_instagram' => 'https://www.instagram.com/m.tanvir.hossain/',
        ];
    }

    /**
     * Return all settings mapped by id => value with safe required baselines
     * so frontend hydration never crashes if a setting row is missing.
     */
    public static function allMapped(): \Illuminate\Support\Collection
    {
        $mapped = static::all()->mapWithKeys(function (self $s) {
            return [$s->id => is_array($s->value) ? $s->value : []];
        });

        if (!$mapped->has('brand') || !is_array($mapped->get('brand'))) {
            $mapped->put('brand', static::defaultBrand());
        }

        foreach (['navigation', 'homepage', 'appearance', 'settings', 'about', 'logos', 'integrations', 'customCode'] as $key) {
            if (!$mapped->has($key) || !is_array($mapped->get($key))) {
                $mapped->put($key, []);
            }
        }

        return $mapped;
    }
}

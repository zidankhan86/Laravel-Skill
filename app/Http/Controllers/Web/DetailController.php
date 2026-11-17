<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Content;
use App\Models\Setting;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class DetailController extends Controller
{
    protected static array $collections = [
        'gallery',
        'services',
        'projects',
        'blog',
        'resources',
        'videos',
        'deals',
        'testimonials',
    ];

    public function show(string $collection, string $slug): Response
    {
        if (!in_array($collection, self::$collections, true)) {
            throw new NotFoundHttpException('Collection not found');
        }

        $record = Content::published()
            ->where('collection', $collection)
            ->where('slug', $slug)
            ->first();

        if (!$record) {
            throw new NotFoundHttpException('Content not found');
        }

        $content = Content::published()
            ->orderBy('sort_order')
            ->orderBy('created_at')
            ->get();

        $settings = Setting::all()->mapWithKeys(function (Setting $s) {
            return [$s->id => $s->value];
        });

        return Inertia::render('Detail', [
            'record' => $record,
            'collection' => $collection,
            'slug' => $slug,
            'content' => $content,
            'settings' => $settings,
        ]);
    }
}

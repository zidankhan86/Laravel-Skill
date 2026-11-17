<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Content;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PublicController extends Controller
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

    /**
     * Health check endpoint.
     */
    public function health(): JsonResponse
    {
        try {
            DB::select('SELECT 1');
            return response()->json(['status' => 'ok']);
        } catch (\Throwable $e) {
            return response()->json(['status' => 'unavailable'], 503);
        }
    }

    /**
     * Get appearance settings.
     */
    public function appearance(): JsonResponse
    {
        $setting = Setting::find('appearance');
        return response()->json($setting ? $setting->value : (object)[]);
    }

    /**
     * Site bootstrap data: published content and all settings.
     */
    public function site(): JsonResponse
    {
        $content = Content::published()
            ->orderBy('sort_order')
            ->orderBy('created_at')
            ->get()
            ->map(function (Content $item) {
                return $this->formatPublicRecord($item);
            });

        $settings = Setting::all()->mapWithKeys(function (Setting $setting) {
            return [$setting->id => $setting->value];
        });

        return response()->json([
            'content' => $content,
            'settings' => $settings,
        ]);
    }

    /**
     * Get a specific published item by collection and slug.
     */
    public function detail(string $collection, string $slug): JsonResponse
    {
        if (!in_array($collection, self::$collections, true)) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $item = Content::published()
            ->where('collection', $collection)
            ->where('slug', $slug)
            ->first();

        if (!$item) {
            return response()->json(['error' => 'Not found'], 404);
        }

        return response()->json($this->formatPublicRecord($item));
    }

    /**
     * Format a record for public display, stripping sensitive metadata and private download URLs.
     */
    protected function formatPublicRecord(Content $item): array
    {
        $data = $item->toArray();
        unset($data['deleted_at'], $data['version']);

        if ($item->collection === 'resources' && !empty($item->fields['private'])) {
            $fields = $item->fields;
            $fields['fileId'] = null;
            $fields['downloadUrl'] = '';
            $data['fields'] = $fields;
        }

        return $data;
    }

    /**
     * Generate robots.txt.
     */
    public function robots(): \Illuminate\Http\Response
    {
        $origin = rtrim(config('app.url', 'http://127.0.0.1:8000'), '/');
        $content = "User-agent: *\nDisallow: /admin\nDisallow: /api/\nSitemap: {$origin}/sitemap.xml\n";

        return response($content, 200, ['Content-Type' => 'text/plain']);
    }

    /**
     * Generate dynamic sitemap.xml for all published content pages.
     */
    public function sitemap(): \Illuminate\Http\Response
    {
        $origin = rtrim(config('app.url', 'http://127.0.0.1:8000'), '/');
        $rows = Content::published()->select('collection', 'slug')->get();

        $paths = [
            '/',
            '/about',
            '/services',
            '/projects',
            '/deals',
            '/resources',
            '/blog',
        ];

        foreach ($rows as $r) {
            $paths[] = "/{$r->collection}/{$r->slug}";
        }

        $xml = '<?xml version="1.0" encoding="UTF-8"?>';
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
        foreach ($paths as $p) {
            $xml .= "<url><loc>{$origin}{$p}</loc><changefreq>weekly</changefreq></url>";
        }
        $xml .= '</urlset>';

        return response($xml, 200, ['Content-Type' => 'application/xml']);
    }
}

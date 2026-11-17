<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Content;
use App\Services\ContentSanitizer;
use App\Services\MediaReferenceService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ContentController extends Controller
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
     * List content items in a collection with pagination and filtering.
     */
    public function index(string $collection, Request $request): JsonResponse
    {
        if (!in_array($collection, self::$collections, true)) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $limit = min(100, max(1, (int) $request->query('limit', 20)));
        $page = max(1, (int) $request->query('page', 1));
        $offset = ($page - 1) * $limit;

        $query = Content::where('collection', $collection);

        if ($request->query('deleted') === 'true') {
            $query->whereNotNull('deleted_at');
        } else {
            $query->whereNull('deleted_at');
        }

        if (in_array($request->query('status'), ['draft', 'published'], true)) {
            $query->where('status', $request->query('status'));
        }

        if ($q = $request->query('q')) {
            $query->where('title', 'like', '%' . substr($q, 0, 200) . '%');
        }

        $total = $query->count();
        $items = $query->orderBy('sort_order')
            ->orderBy('created_at')
            ->offset($offset)
            ->limit($limit)
            ->get();

        return response()->json([
            'items' => $items,
            'total' => $total,
        ]);
    }

    /**
     * Create a new content item.
     */
    public function store(string $collection, Request $request): JsonResponse
    {
        if (!in_array($collection, self::$collections, true)) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $validated = $request->validate([
            'title' => 'required|string|min:1|max:255',
            'slug' => 'required|string|max:180|regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
            'summary' => 'nullable|string|max:5000',
            'body' => 'nullable|string|max:100000',
            'status' => 'nullable|in:draft,published',
            'featured' => 'nullable|boolean',
            'sort_order' => 'nullable|integer|between:-10000,10000',
            'fields' => 'nullable|array',
            'seo_title' => 'nullable|string|max:255',
            'seo_description' => 'nullable|string|max:500',
            'published_at' => 'nullable|date',
        ]);

        $id = (string) Str::uuid();
        $cleanBody = ContentSanitizer::clean($validated['body'] ?? '');

        try {
            DB::transaction(function () use ($id, $collection, $validated, $cleanBody) {
                Content::create([
                    'id' => $id,
                    'collection' => $collection,
                    'slug' => $validated['slug'],
                    'title' => trim($validated['title']),
                    'summary' => trim($validated['summary'] ?? ''),
                    'body' => $cleanBody,
                    'status' => $validated['status'] ?? 'draft',
                    'featured' => (bool) ($validated['featured'] ?? false),
                    'sort_order' => (int) ($validated['sort_order'] ?? 0),
                    'fields' => $validated['fields'] ?? [],
                    'seo_title' => trim($validated['seo_title'] ?? ''),
                    'seo_description' => trim($validated['seo_description'] ?? ''),
                    'published_at' => !empty($validated['published_at']) ? Carbon::parse($validated['published_at']) : null,
                    'version' => 1,
                ]);

                MediaReferenceService::sync($id, $validated['fields'] ?? []);
            });
        } catch (\Illuminate\Database\UniqueConstraintViolationException $e) {
            return response()->json(['error' => 'Slug already exists'], 409);
        }

        return response()->json(['id' => $id], 201);
    }

    /**
     * Update an existing content item with optimistic version control.
     */
    public function update(string $collection, string $id, Request $request): JsonResponse
    {
        if (!in_array($collection, self::$collections, true)) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $validated = $request->validate([
            'title' => 'required|string|min:1|max:255',
            'slug' => 'required|string|max:180|regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
            'summary' => 'nullable|string|max:5000',
            'body' => 'nullable|string|max:100000',
            'status' => 'nullable|in:draft,published',
            'featured' => 'nullable|boolean',
            'sort_order' => 'nullable|integer|between:-10000,10000',
            'fields' => 'nullable|array',
            'seo_title' => 'nullable|string|max:255',
            'seo_description' => 'nullable|string|max:500',
            'published_at' => 'nullable|date',
            'version' => 'nullable|integer',
        ]);

        $cleanBody = ContentSanitizer::clean($validated['body'] ?? '');
        $version = (int) ($validated['version'] ?? 0);

        try {
            $updated = DB::transaction(function () use ($collection, $id, $validated, $cleanBody, $version) {
                $affected = Content::where('id', $id)
                    ->where('collection', $collection)
                    ->whereNull('deleted_at')
                    ->where('version', $version)
                    ->update([
                        'slug' => $validated['slug'],
                        'title' => trim($validated['title']),
                        'summary' => trim($validated['summary'] ?? ''),
                        'body' => $cleanBody,
                        'status' => $validated['status'] ?? 'draft',
                        'featured' => (bool) ($validated['featured'] ?? false),
                        'sort_order' => (int) ($validated['sort_order'] ?? 0),
                        'fields' => $validated['fields'] ?? [],
                        'seo_title' => trim($validated['seo_title'] ?? ''),
                        'seo_description' => trim($validated['seo_description'] ?? ''),
                        'published_at' => !empty($validated['published_at']) ? Carbon::parse($validated['published_at']) : null,
                        'version' => DB::raw('version + 1'),
                    ]);

                if (!$affected) {
                    return false;
                }

                MediaReferenceService::sync($id, $validated['fields'] ?? []);
                return true;
            });

            if (!$updated) {
                return response()->json(['error' => 'Record changed. Reload before saving.'], 409);
            }
        } catch (\Illuminate\Database\UniqueConstraintViolationException $e) {
            return response()->json(['error' => 'Slug already exists'], 409);
        }

        return response()->json(['ok' => true]);
    }

    /**
     * Soft delete or restore a content item.
     */
    public function action(string $collection, string $id, string $action): JsonResponse
    {
        if (!in_array($collection, self::$collections, true) || !in_array($action, ['delete', 'restore'], true)) {
            return response()->json(['error' => 'Not found'], 404);
        }

        Content::where('id', $id)
            ->where('collection', $collection)
            ->update([
                'deleted_at' => $action === 'delete' ? now() : null,
                'version' => DB::raw('version + 1'),
            ]);

        return response()->json(['ok' => true]);
    }
}

<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MediaAdminController extends Controller
{
    protected static array $allowedMimes = [
        'image/png' => ['png'],
        'image/jpeg' => ['jpg', 'jpeg'],
        'image/webp' => ['webp'],
        'application/pdf' => ['pdf'],
    ];

    /**
     * List uploaded media with pagination, search, and type filtering.
     */
    public function index(Request $request): JsonResponse
    {
        $limit = min(100, max(1, (int) $request->query('limit', 20)));
        $page = max(1, (int) $request->query('page', 1));
        $offset = ($page - 1) * $limit;

        $query = Media::select('id', 'name', 'mime', 'alt', 'size', 'created_at', 'version');

        if ($type = $request->query('type')) {
            if ($type === 'image') {
                $query->where('mime', 'like', 'image/%');
            } elseif ($type === 'document') {
                $query->where('mime', 'application/pdf');
            }
        }

        if ($q = $request->query('q')) {
            $query->where(function ($sub) use ($q) {
                $sub->where('name', 'like', "%{$q}%")
                    ->orWhere('alt', 'like', "%{$q}%");
            });
        }

        $total = $query->count();
        $items = $query->orderBy('created_at', 'desc')
            ->orderBy('id')
            ->offset($offset)
            ->limit($limit)
            ->get();

        return response()->json([
            'items' => $items,
            'total' => $total,
        ]);
    }

    /**
     * Upload a new media asset (PNG, JPEG, WebP, or PDF, up to 5 MB).
     */
    public function store(Request $request): JsonResponse
    {
        if (!$request->hasFile('file')) {
            return response()->json(['error' => 'Select a file'], 400);
        }

        $file = $request->file('file');
        if (!$file->isValid() || $file->getSize() > 5 * 1024 * 1024) {
            return response()->json(['error' => 'File exceeds 5 MB'], 413);
        }

        $path = $file->getRealPath();
        $bytes = file_get_contents($path);

        // Magic byte inspection for true MIME verification
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $detectedMime = $finfo->buffer($bytes);
        $ext = strtolower($file->getClientOriginalExtension());

        if (!isset(self::$allowedMimes[$detectedMime]) || !in_array($ext, self::$allowedMimes[$detectedMime], true)) {
            return response()->json(['error' => 'Only verified PNG, JPEG, WebP and PDF files are allowed'], 400);
        }

        $id = (string) Str::uuid();
        $name = substr($file->getClientOriginalName(), 0, 255);
        $alt = substr((string) $request->input('alt', ''), 0, 500);

        Media::create([
            'id' => $id,
            'name' => $name,
            'mime' => $detectedMime,
            'alt' => $alt,
            'size' => strlen($bytes),
            'bytes' => $bytes,
            'version' => 1,
        ]);

        return response()->json([
            'id' => $id,
            'url' => '/media/' . $id,
        ], 201);
    }

    /**
     * Update media name or alternative text.
     */
    public function update(string $id, Request $request): JsonResponse
    {
        $media = Media::find($id);
        if (!$media) {
            return response()->json(['error' => 'Media not found'], 404);
        }

        $alt = $request->input('alt');
        $name = $request->input('name');
        $version = $request->input('version');

        if (!is_string($alt) || strlen($alt) > 500) {
            return response()->json(['error' => 'Invalid alternative text'], 400);
        }

        $updateData = ['alt' => $alt];
        if ($name !== null) {
            if (!is_string($name) || empty(trim($name)) || strlen($name) > 255) {
                return response()->json(['error' => 'Invalid name'], 400);
            }
            $updateData['name'] = trim($name);
        }

        $query = Media::where('id', $id);
        if ($version !== null) {
            $query->where('version', (int) $version);
        }

        $updateData['version'] = DB::raw('version + 1');
        $affected = $query->update($updateData);

        if (!$affected) {
            return response()->json(['error' => 'Media changed or was deleted. Reload before saving.'], 409);
        }

        return response()->json(['ok' => true]);
    }

    /**
     * Replace binary file for an existing media asset.
     */
    public function replace(string $id, Request $request): JsonResponse
    {
        $version = (int) $request->input('version');
        if ($version < 1) {
            return response()->json(['error' => 'Media version is required'], 400);
        }

        if (!$request->hasFile('file')) {
            return response()->json(['error' => 'Select a file'], 400);
        }

        $file = $request->file('file');
        if (!$file->isValid() || $file->getSize() > 5 * 1024 * 1024) {
            return response()->json(['error' => 'File exceeds 5 MB'], 413);
        }

        $path = $file->getRealPath();
        $bytes = file_get_contents($path);

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $detectedMime = $finfo->buffer($bytes);
        $ext = strtolower($file->getClientOriginalExtension());

        if (!isset(self::$allowedMimes[$detectedMime]) || !in_array($ext, self::$allowedMimes[$detectedMime], true)) {
            return response()->json(['error' => 'Only verified PNG, JPEG, WebP and PDF files are allowed'], 400);
        }

        $updated = DB::transaction(function () use ($id, $version, $bytes, $detectedMime) {
            $media = Media::where('id', $id)->lockForUpdate()->first();
            if (!$media) {
                return 404;
            }
            if ($media->version !== $version) {
                return 409;
            }

            $isImageBefore = str_starts_with($media->mime, 'image/');
            $isImageAfter = str_starts_with($detectedMime, 'image/');
            if ($isImageBefore !== $isImageAfter) {
                return 400;
            }

            $media->update([
                'mime' => $detectedMime,
                'size' => strlen($bytes),
                'bytes' => $bytes,
                'version' => $media->version + 1,
            ]);

            return 200;
        });

        if ($updated === 404) {
            return response()->json(['error' => 'Media not found'], 404);
        }
        if ($updated === 409) {
            return response()->json(['error' => 'Media changed. Reload before replacing.'], 409);
        }
        if ($updated === 400) {
            return response()->json(['error' => 'Replace an image with an image, or a PDF with a PDF.'], 400);
        }

        return response()->json(['ok' => true]);
    }

    /**
     * Inspect usages of a media asset across content and settings.
     */
    public function usage(string $id): JsonResponse
    {
        $content = DB::table('content as c')
            ->join('content_media as m', 'c.id', '=', 'm.content_id')
            ->where('m.media_id', $id)
            ->select('c.id', 'c.title', 'c.collection')
            ->get();

        $settings = DB::table('settings_media')
            ->where('media_id', $id)
            ->pluck('settings_id');

        return response()->json([
            'content' => $content,
            'settings' => $settings,
        ]);
    }

    /**
     * Delete an unreferenced media asset.
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            Media::where('id', $id)->delete();
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() === '23000') {
                return response()->json(['error' => 'Asset is referenced; inspect usage first'], 409);
            }
            throw $e;
        }

        return response()->json(['ok' => true]);
    }
}

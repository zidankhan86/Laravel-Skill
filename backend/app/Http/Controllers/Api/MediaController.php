<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Content;
use App\Models\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class MediaController extends Controller
{
    /**
     * Public media streaming with privacy verification.
     */
    public function show(string $id): Response|JsonResponse
    {
        $media = Media::find($id);
        if (!$media) {
            return response()->json(['error' => 'Not found'], 404);
        }

        // Verify if media is referenced by published content or settings
        $hasPublishedContent = Content::published()
            ->whereHas('media', function ($q) use ($id) {
                $q->where('media_id', $id);
            })
            ->get();

        $hasSettings = DB::table('settings_media')->where('media_id', $id)->exists();

        // Check if referenced by a private resource
        $isPrivateResource = Content::where('collection', 'resources')
            ->where('fields->fileId', $id)
            ->where('fields->private', true)
            ->exists();

        $publicUse = $hasPublishedContent->contains(function ($c) use ($id) {
            return !($c->collection === 'resources' && !empty($c->fields['private']) && ($c->fields['fileId'] ?? null) === $id);
        });

        if ($isPrivateResource || (!$publicUse && !$hasSettings)) {
            return response()->json(['error' => 'Not found'], 404);
        }

        return $this->sendMediaResponse($media);
    }

    /**
     * Admin media streaming (bypasses public restrictions).
     */
    public function file(string $id): Response|JsonResponse
    {
        $media = Media::find($id);
        if (!$media) {
            return response()->json(['error' => 'Not found'], 404);
        }

        return $this->sendMediaResponse($media);
    }

    /**
     * Build the binary streaming HTTP response.
     */
    protected function sendMediaResponse(Media $media): Response
    {
        $extension = $media->mime === 'image/jpeg' ? 'jpg' : explode('/', $media->mime)[1] ?? 'bin';
        $disposition = $media->mime === 'application/pdf' ? 'attachment' : 'inline';

        return response($media->bytes)
            ->header('Content-Type', $media->mime)
            ->header('Content-Length', (string) $media->size)
            ->header('Cache-Control', 'private, no-store')
            ->header('Content-Disposition', "{$disposition}; filename=\"{$media->id}.{$extension}\"");
    }
}

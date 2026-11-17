<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class MediaReferenceService
{
    /**
     * Walks JSON or arrays and extracts all referenced media UUIDs.
     * Matches /media/{uuid} and fileId: "{uuid}".
     *
     * @return array<string>
     */
    public static function collect(mixed $value): array
    {
        $ids = [];
        self::walk($value, '', $ids);
        return array_values(array_unique($ids));
    }

    protected static function walk(mixed $v, string $k, array &$ids): void
    {
        if (is_string($v)) {
            if (preg_match_all('/\/media\/([a-f0-9-]{36})/i', $v, $matches)) {
                foreach ($matches[1] as $id) {
                    $ids[] = strtolower($id);
                }
            }
            if ($k === 'fileId' && preg_match('/^[a-f0-9-]{36}$/i', $v)) {
                $ids[] = strtolower($v);
            }
        } elseif (is_array($v)) {
            foreach ($v as $key => $item) {
                self::walk($item, (string)$key, $ids);
            }
        } elseif (is_object($v)) {
            foreach (get_object_vars($v) as $key => $item) {
                self::walk($item, (string)$key, $ids);
            }
        }
    }

    /**
     * Synchronizes media references in content_media or settings_media.
     */
    public static function sync(string $id, mixed $value, bool $isSettings = false): void
    {
        $table = $isSettings ? 'settings_media' : 'content_media';
        $key = $isSettings ? 'settings_id' : 'content_id';

        DB::table($table)->where($key, $id)->delete();

        $mediaIds = self::collect($value);
        if (!empty($mediaIds)) {
            // Verify media records exist in media table to prevent foreign key errors
            $existingMedia = DB::table('media')->whereIn('id', $mediaIds)->pluck('id')->toArray();
            $inserts = [];
            foreach ($existingMedia as $mediaId) {
                $inserts[] = [
                    $key => $id,
                    'media_id' => $mediaId,
                ];
            }
            if (!empty($inserts)) {
                DB::table($table)->insertOrIgnore($inserts);
            }
        }
    }
}

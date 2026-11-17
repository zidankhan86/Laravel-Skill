<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Content;
use App\Models\Setting;
use App\Services\ContentSanitizer;
use App\Services\MediaReferenceService;
use App\Services\UrlValidator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class EditorController extends Controller
{
    /**
     * Get editor snapshot of all settings and published content.
     */
    public function snapshot(): JsonResponse
    {
        $settings = Setting::all()->mapWithKeys(function (Setting $s) {
            return [
                $s->id => [
                    'value' => $s->value,
                    'version' => $s->version,
                ],
            ];
        });

        $content = Content::published()
            ->orderBy('sort_order')
            ->orderBy('created_at')
            ->get();

        return response()->json([
            'settings' => $settings,
            'content' => $content,
        ]);
    }

    /**
     * Atomic batch save for visual in-place editor changes.
     */
    public function batchSave(Request $request): JsonResponse
    {
        $changes = $request->input('changes');
        if (!is_array($changes) || empty($changes) || count($changes) > 500) {
            return response()->json(['error' => 'Provide 1–500 changes'], 400);
        }

        $definitionPath = config_path('settings-definition.json');
        if (!File::exists($definitionPath)) {
            $definitionPath = base_path('../server/settings-definition.json');
        }
        if (!File::exists($definitionPath)) {
            return response()->json(['error' => 'Settings definition file missing'], 500);
        }
        $rules = json_decode(File::get($definitionPath), true);

        $groups = [];
        foreach ($changes as $change) {
            if (
                !is_array($change) ||
                !isset($change['kind'], $change['id'], $change['path'], $change['value'], $change['version']) ||
                !in_array($change['kind'], ['settings', 'content'], true) ||
                !is_string($change['id']) ||
                !is_string($change['path']) ||
                !is_string($change['value']) ||
                strlen($change['value']) > 10000 ||
                !is_int($change['version'])
            ) {
                return response()->json(['error' => 'Invalid edit'], 400);
            }

            $key = $change['kind'] . '/' . $change['id'];
            $groups[$key][] = $change;
        }

        // Deterministic lock order to prevent deadlocks
        ksort($groups);

        try {
            DB::transaction(function () use ($groups, $rules) {
                foreach ($groups as $key => $edits) {
                    $first = $edits[0];

                    if ($first['kind'] === 'settings') {
                        $allowedSettings = ['homepage', 'about', 'navigation', 'brand', 'settings', 'ui'];
                        if (!in_array($first['id'], $allowedSettings, true)) {
                            throw new \Exception('Use Appearance to change design settings', 400);
                        }

                        $row = Setting::where('id', $first['id'])->lockForUpdate()->first();
                        if (!$row) {
                            throw new \Exception('Setting not found', 404);
                        }

                        foreach ($edits as $e) {
                            if ($e['version'] !== $row->version) {
                                throw new \Exception('Content changed in another window. Reload before saving; your draft has not been published.', 409);
                            }
                        }

                        $value = $row->value;
                        foreach ($edits as $e) {
                            $path = $e['path'];
                            $val = $e['value'];
                            $rule = $rules[$first['id']][$path] ?? null;

                            if (!$rule || str_contains($path, '.') || in_array($path, ['sections', 'sectionOrder', 'socialOrder', 'canonicalDomain'], true)) {
                                throw new \Exception('This field is managed in admin', 400);
                            }

                            if (strlen($val) > ($rule['max'] ?? 10000)) {
                                throw new \Exception("Invalid value length for {$path}", 400);
                            }

                            if (!empty($rule['url']) && !UrlValidator::isSafe($val, true)) {
                                throw new \Exception("Invalid URL for {$path}", 400);
                            }

                            if (!empty($rule['image']) && $val !== '' && !(UrlValidator::isSafe($val) && (str_starts_with($val, '/') || preg_match('/^https?:/', $val)))) {
                                throw new \Exception("Invalid image value for {$path}", 400);
                            }

                            $value[$path] = $val;
                        }

                        $row->update([
                            'value' => $value,
                            'version' => $row->version + 1,
                        ]);

                        MediaReferenceService::sync($first['id'], $value, true);

                    } else {
                        // Content item
                        $row = Content::where('id', $first['id'])->whereNull('deleted_at')->lockForUpdate()->first();
                        if (!$row || $row->status !== 'published') {
                            throw new \Exception('A record changed. Reload before saving; your draft has not been published.', 409);
                        }

                        foreach ($edits as $e) {
                            if ($e['version'] !== $row->version) {
                                throw new \Exception('A record changed. Reload before saving; your draft has not been published.', 409);
                            }
                        }

                        $title = $row->title;
                        $summary = $row->summary;
                        $fields = $row->fields;

                        foreach ($edits as $e) {
                            $path = $e['path'];
                            $val = $e['value'];

                            if ($path === 'title') {
                                $title = trim($val);
                            } elseif ($path === 'summary') {
                                $summary = trim($val);
                            } elseif (str_starts_with($path, 'fields.')) {
                                $subPath = substr($path, 7);
                                $keys = explode('.', $subPath);
                                $target = &$fields;
                                while (count($keys) > 1) {
                                    $k = array_shift($keys);
                                    if (!isset($target[$k]) || !is_array($target[$k])) {
                                        $target[$k] = [];
                                    }
                                    $target = &$target[$k];
                                }
                                $target[array_shift($keys)] = $val;
                            } else {
                                throw new \Exception('Unsupported content field', 400);
                            }
                        }

                        $row->update([
                            'title' => $title,
                            'summary' => $summary,
                            'fields' => $fields,
                            'version' => $row->version + 1,
                        ]);

                        MediaReferenceService::sync($row->id, $fields);
                    }
                }
            });
        } catch (\Exception $e) {
            $code = $e->getCode();
            $status = ($code >= 400 && $code <= 503) ? $code : 400;
            return response()->json(['error' => $e->getMessage()], $status);
        }

        return response()->json(['ok' => true]);
    }
}

<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\MediaReferenceService;
use App\Services\UrlValidator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class SettingController extends Controller
{
    /**
     * Get all module settings.
     */
    public function index(): JsonResponse
    {
        if (!Setting::find('brand')) {
            Setting::create([
                'id' => 'brand',
                'value' => Setting::defaultBrand(),
                'version' => 1,
            ]);
        }

        $settings = Setting::all()->mapWithKeys(function (Setting $s) {
            return [
                $s->id => [
                    'value' => $s->value,
                    'version' => $s->version,
                ],
            ];
        });

        return response()->json($settings);
    }

    /**
     * Update module setting with strict allowlist validation and version matching.
     */
    public function update(string $id, Request $request): JsonResponse
    {
        $definitionPath = config_path('settings-definition.json');
        if (!File::exists($definitionPath)) {
            $definitionPath = base_path('../server/settings-definition.json');
        }
        if (!File::exists($definitionPath)) {
            return response()->json(['error' => 'Settings definition file missing'], 500);
        }

        $allDefinitions = json_decode(File::get($definitionPath), true);
        $rules = $allDefinitions[$id] ?? null;

        if (!$rules) {
            return response()->json(['error' => 'Unknown settings'], 404);
        }

        $value = $request->input('value');
        $version = (int) $request->input('version');

        if (!is_array($value)) {
            return response()->json(['error' => 'Invalid settings'], 400);
        }

        // Validate each field in definition
        foreach ($rules as $key => $rule) {
            if (!array_key_exists($key, $value)) {
                continue;
            }
            $v = (string) $value[$key];

            if (strlen($v) > ($rule['max'] ?? 10000)) {
                return response()->json(['error' => "Field '{$key}' exceeds maximum length"], 400);
            }

            if (!empty($rule['color']) && !preg_match('/^#[0-9a-fA-F]{6}$/', $v)) {
                return response()->json(['error' => "Field '{$key}' must be a valid hex color"], 400);
            }

            if (!empty($rule['enum']) && !in_array($v, $rule['enum'], true)) {
                return response()->json(['error' => "Invalid choice for '{$key}'"], 400);
            }

            if (!empty($rule['url']) && !UrlValidator::isSafe($v, true)) {
                return response()->json(['error' => "Field '{$key}' must be a safe URL"], 400);
            }

            if (!empty($rule['image']) && $v !== '' && !(UrlValidator::isSafe($v) && (str_starts_with($v, '/') || preg_match('/^https?:/', $v)))) {
                return response()->json(['error' => "Field '{$key}' must be a valid image path or URL"], 400);
            }
        }

        // Specific module validations
        if ($id === 'integrations') {
            $patterns = [
                'facebook' => '/^\d{5,25}$/',
                'gtm' => '/^GTM-[A-Z0-9]{4,20}$/',
                'tiktok' => '/^[A-Z0-9]{10,30}$/',
            ];
            foreach ($patterns as $type => $pattern) {
                $enabled = ($value[$type . 'Enabled'] ?? '') === 'on';
                $idVal = $value[$type . 'Id'] ?? '';
                if (($idVal || $enabled) && !preg_match($pattern, $idVal)) {
                    return response()->json(['error' => "Invalid {$type} ID"], 400);
                }
            }
        }

        if ($id === 'logos') {
            foreach (['header', 'footer'] as $loc) {
                if (($value[$loc . 'Mode'] ?? '') === 'image' && empty($value[$loc . 'Image'])) {
                    return response()->json(['error' => "Select the {$loc} logo image"], 400);
                }
            }
        }

        if ($id === 'settings') {
            $domain = $value['canonicalDomain'] ?? '';
            if (!empty($domain)) {
                if (!preg_match('/^https?:\/\//', $domain) || (parse_url($domain, PHP_URL_PATH) ?? '/') !== '/') {
                    return response()->json(['error' => 'Canonical domain must be an http(s) origin'], 400);
                }
            }
        }

        if ($id === 'navigation') {
            foreach (['menu', 'footerMenu'] as $menuKey) {
                $lines = array_filter(explode("\n", $value[$menuKey] ?? ''));
                foreach ($lines as $line) {
                    $parts = explode('|', trim($line));
                    if (count($parts) !== 2 || empty(trim($parts[0])) || !UrlValidator::isSafe(trim($parts[1]), true)) {
                        return response()->json(['error' => 'Menu rows must be Label|safe URL'], 400);
                    }
                }
            }

            if (!empty($value['socialOrder'])) {
                $allowedSocial = ['facebook', 'linkedin', 'twitter', 'youtube', 'instagram', 'github'];
                $items = array_filter(array_map('trim', explode(',', $value['socialOrder'])));
                foreach ($items as $item) {
                    if (!in_array($item, $allowedSocial, true)) {
                        return response()->json(['error' => 'Unknown social icon'], 400);
                    }
                }
            }
        }

        if ($id === 'homepage') {
            $allowedSections = [
                'gallery', 'closingCta', 'blog', 'navigation', 'footer', 'floatingActions',
                'hero', 'trust', 'about', 'journey', 'services', 'videos',
                'projects', 'deals', 'resources', 'testimonials', 'booking',
            ];
            $sectionsString = ($value['sections'] ?? '') . ',' . ($value['sectionOrder'] ?? '');
            $items = array_filter(array_map('trim', explode(',', $sectionsString)));
            foreach ($items as $item) {
                if (!in_array($item, $allowedSections, true)) {
                    return response()->json(['error' => 'Unknown homepage section'], 400);
                }
            }
        }

        $updated = DB::transaction(function () use ($id, $value, $version) {
            $affected = Setting::where('id', $id)
                ->where('version', $version)
                ->update([
                    'value' => $value,
                    'version' => DB::raw('version + 1'),
                ]);

            if (!$affected) {
                return false;
            }

            MediaReferenceService::sync($id, $value, true);
            return true;
        });

        if (!$updated) {
            return response()->json(['error' => 'Settings changed; reload before saving'], 409);
        }

        return response()->json(['ok' => true]);
    }
}

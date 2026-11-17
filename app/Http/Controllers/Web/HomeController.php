<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Content;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    /**
     * Render the main homepage with Inertia.js.
     */
    public function index(Request $request): Response
    {
        $content = Content::published()
            ->orderBy('sort_order')
            ->orderBy('created_at')
            ->get();

        $settings = Setting::all()->mapWithKeys(function (Setting $s) {
            return [$s->id => $s->value];
        });

        $userId = $request->session()->get('userId') ?? $request->user()?->id;
        $isEditing = $request->query('edit') === '1' && !empty($userId);

        $editorSnapshot = null;
        if ($isEditing) {
            $editorSettings = Setting::all()->mapWithKeys(function (Setting $s) {
                return [
                    $s->id => [
                        'value' => $s->value,
                        'version' => $s->version,
                    ],
                ];
            });

            $editorSnapshot = [
                'settings' => $editorSettings,
                'content' => $content,
            ];
        }

        return Inertia::render('Home', [
            'content' => $content,
            'settings' => $settings,
            'isEditing' => $isEditing,
            'editorSnapshot' => $editorSnapshot,
        ]);
    }
}

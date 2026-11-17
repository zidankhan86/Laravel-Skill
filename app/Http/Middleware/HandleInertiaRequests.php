<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $installed = (new \App\Installer\InstallationLock())->isInstalled();

        $settings = collect();
        if ($installed) {
            try {
                $settings = Setting::all()->mapWithKeys(function (Setting $s) {
                    return [$s->id => $s->value];
                });
            } catch (\Throwable $e) {
                $settings = collect();
            }
        }

        $userId = $installed ? ($request->session()->get('userId') ?? $request->user()?->id) : null;

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $userId ? [
                    'id' => $userId,
                    'email' => $request->user()?->email ?? 'admin@portfolio.local',
                ] : null,
            ],
            'settings' => $settings,
            'flash' => [
                'message' => fn () => $request->session()->get('message'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'csrf_token' => csrf_token(),
        ];
    }
}

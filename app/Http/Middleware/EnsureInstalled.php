<?php

namespace App\Http\Middleware;

use App\Installer\InstallationLock;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureInstalled
{
    protected InstallationLock $lock;

    public function __construct(?InstallationLock $lock = null)
    {
        $this->lock = $lock ?: new InstallationLock();
    }

    /**
     * Handle an incoming request.
     * Redirects to the installer if the application is not installed yet.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // 1. If application is already installed, continue normally
        if ($this->lock->isInstalled()) {
            return $next($request);
        }

        // Force safe file/array session & cache drivers and ephemeral APP_KEY while uninstalled
        InstallationLock::configurePreInstallRuntime();
        if (!$request->isSecure()) {
            config(['session.secure' => false]);
        }

        // 2. Allow installer routes, health checks, and static assets
        if (
            $request->is('install*') ||
            $request->is('api/installer*') ||
            $request->is('up') ||
            $request->is('build*') ||
            $request->is('favicon.ico')
        ) {
            return $next($request);
        }

        // 3. If API request when uninstalled, return informative JSON
        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'error' => 'Application is not installed yet.',
                'installer_url' => url('/install'),
            ], 503);
        }

        // 4. Redirect browser to installer wizard
        return redirect('/install');
    }
}

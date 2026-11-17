<?php

namespace App\Http\Middleware;

use App\Installer\InstallationLock;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RedirectIfInstalled
{
    protected InstallationLock $lock;

    public function __construct(?InstallationLock $lock = null)
    {
        $this->lock = $lock ?: new InstallationLock();
    }

    /**
     * Handle an incoming request.
     * Prevents access to the installer once the application has been locked as installed.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($this->lock->isInstalled()) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'error' => 'Application is already installed and the installer is locked.',
                ], 403);
            }

            return redirect('/');
        }

        return $next($request);
    }
}

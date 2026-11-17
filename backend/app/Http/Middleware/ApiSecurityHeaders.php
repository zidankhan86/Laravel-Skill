<?php

namespace App\Http\Middleware;

use App\Services\CspService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiSecurityHeaders
{
    public function __construct(
        protected CspService $cspService
    ) {}

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $isAdmin = $request->is('api/admin*');

        // 1. Standard enterprise security headers
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', $isAdmin ? 'DENY' : 'SAMEORIGIN');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        $response->headers->set('X-XSS-Protection', '0');
        $response->headers->set('Cache-Control', 'no-store');

        // 2. Dynamic Content Security Policy
        $csp = $this->cspService->generatePolicy($isAdmin);
        $response->headers->set('Content-Security-Policy', $csp);

        // 3. Strict Transport Security (HSTS) when secure or production
        if ($request->isSecure() || app()->isProduction()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
        }

        // 4. Admin search engine blocking
        if ($isAdmin) {
            $response->headers->set('X-Robots-Tag', 'noindex, nofollow');
        }

        return $response;
    }
}

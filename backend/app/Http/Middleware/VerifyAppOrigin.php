<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyAppOrigin
{
    /**
     * Handle an incoming request and enforce Origin matching for CSRF/CORS safety.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true)) {
            return $next($request);
        }

        $appOrigin = config('app.app_origin', env('APP_ORIGIN', 'http://localhost:3000,http://localhost:3002'));
        $rawOrigins = array_map('trim', explode(',', (string) $appOrigin));
        $allowedOrigins = [];

        foreach ($rawOrigins as $o) {
            if ($o === '') {
                continue;
            }
            $scheme = parse_url($o, PHP_URL_SCHEME);
            $host = parse_url($o, PHP_URL_HOST);
            $port = parse_url($o, PHP_URL_PORT);
            if ($scheme && $host) {
                $allowedOrigins[] = rtrim($scheme . '://' . $host . ($port ? ':' . $port : ''), '/');
            }
        }

        $origin = $request->header('Origin');
        if ($origin) {
            $normalizedOrigin = rtrim($origin, '/');
            if (!in_array($normalizedOrigin, $allowedOrigins, true)) {
                return response()->json(['error' => 'Origin rejected'], 403);
            }
        }

        return $next($request);
    }
}

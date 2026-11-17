<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCsrfToken
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true)) {
            return $next($request);
        }

        $token = (string) $request->header('x-csrf-token', '');
        $expected = (string) $request->session()->get('csrf', '');

        if ($expected === '' || !hash_equals($expected, $token)) {
            return response()->json(['error' => 'Invalid security token'], 403);
        }

        return $next($request);
    }
}

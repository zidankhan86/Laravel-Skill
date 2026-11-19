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

        $token = (string) ($request->header('x-csrf-token') ?? $request->header('X-CSRF-TOKEN') ?? $request->input('_token') ?? '');
        $expectedCustom = (string) $request->session()->get('csrf', '');
        $expectedLaravel = (string) $request->session()->token();

        if (
            ($expectedCustom !== '' && hash_equals($expectedCustom, $token)) ||
            ($expectedLaravel !== '' && hash_equals($expectedLaravel, $token))
        ) {
            return $next($request);
        }

        return response()->json(['error' => 'Invalid security token'], 403);
    }
}

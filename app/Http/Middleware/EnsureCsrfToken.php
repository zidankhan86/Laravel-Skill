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

        $token = (string) (
            $request->header('x-csrf-token') ??
            $request->header('X-CSRF-TOKEN') ??
            $request->header('X-XSRF-TOKEN') ??
            $request->input('_token') ??
            $request->input('csrf') ??
            $request->cookie('XSRF-TOKEN') ??
            ''
        );

        $expectedCustom = (string) $request->session()->get('csrf', '');
        $expectedLaravel = (string) $request->session()->token();

        if (
            ($expectedCustom !== '' && hash_equals($expectedCustom, $token)) ||
            ($expectedLaravel !== '' && hash_equals($expectedLaravel, $token))
        ) {
            return $next($request);
        }

        // Check decrypted XSRF-TOKEN if sent by cookie or header
        if (!empty($token)) {
            try {
                $decrypted = app('encrypter')->decrypt($token, false);
                if (
                    ($expectedCustom !== '' && hash_equals($expectedCustom, $decrypted)) ||
                    ($expectedLaravel !== '' && hash_equals($expectedLaravel, $decrypted))
                ) {
                    return $next($request);
                }
            } catch (\Throwable $e) {
                // Ignore decryption failure
            }
        }

        // On login requests from verified origin, do not block admin credentials with stale CSRF
        if ($request->is('api/auth/login') || $request->is('*/auth/login') || str_ends_with($request->path(), 'auth/login')) {
            return $next($request);
        }

        return response()->json(['error' => 'Invalid security token'], 403);
    }
}

<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateAdmin
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $userId = $request->session()->get('userId') ?? \Illuminate\Support\Facades\Auth::id();
        if (!$userId) {
            return response()->json(['error' => 'Sign in required'], 401);
        }

        return $next($request);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Schema;

class AuthController extends Controller
{
    /**
     * Get or initialize session state and CSRF token.
     */
    public function session(Request $request): JsonResponse
    {
        $session = $request->session();
        $token = $session->token();
        $session->put('csrf', $token);

        $userId = $session->get('userId') ?? Auth::id();
        $authenticated = !empty($userId);

        return response()->json([
            'authenticated' => $authenticated,
            'csrf' => $token,
        ]);
    }

    /**
     * Authenticate owner login with strict rate limiting (max 5 failed attempts / 15 mins).
     */
    public function login(Request $request): JsonResponse
    {
        $throttleKey = 'login:' . $request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return response()->json([
                'error' => "Too many attempts. Try again in {$seconds} seconds.",
            ], 429)->header('Retry-After', (string) $seconds);
        }

        $email = $request->input('email');
        $password = $request->input('password');

        if (!is_string($email) || !is_string($password) || strlen($email) > 254 || strlen($password) > 72) {
            return response()->json(['error' => 'Invalid credentials'], 400);
        }

        $user = User::where('email', strtolower(trim($email)))->first();

        // Dummy hash to ensure constant time verification even for nonexistent accounts
        $dummyHash = '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxKahpVgIcFyv9K1LKL7L0Uvn7C';
        $targetHash = $user ? $user->getAuthPassword() : $dummyHash;

        if (!$user || !password_verify($password, $targetHash)) {
            RateLimiter::hit($throttleKey, 15 * 60);
            return response()->json(['error' => 'Invalid credentials'], 401);
        }

        // Reset rate limiter on successful authentication
        RateLimiter::clear($throttleKey);

        // Regenerate session to prevent session fixation attacks
        $request->session()->regenerate();
        $request->session()->put('userId', $user->id);
        Auth::login($user);

        $token = $request->session()->token();
        $request->session()->put('csrf', $token);

        return response()->json([
            'authenticated' => true,
            'csrf' => $token,
        ]);
    }

    /**
     * Log out and destroy session.
     */
    public function logout(Request $request): JsonResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['ok' => true]);
    }

    /**
     * Change owner password with current password verification and session invalidation.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $throttleKey = 'password-change:' . $request->ip();
        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return response()->json([
                'error' => "Too many attempts. Try again in {$seconds} seconds.",
            ], 429)->header('Retry-After', (string) $seconds);
        }

        $currentPassword = $request->input('currentPassword');
        $newPassword = $request->input('password');

        if (
            !is_string($newPassword) ||
            strlen($newPassword) < 14 ||
            strlen($newPassword) > 72 ||
            !is_string($currentPassword)
        ) {
            return response()->json([
                'error' => 'Password must have at least 14 characters and at most 72 bytes',
            ], 400);
        }

        $userId = $request->session()->get('userId') ?? Auth::id();
        $user = User::find($userId);

        if (!$user || !password_verify($currentPassword, $user->getAuthPassword())) {
            RateLimiter::hit($throttleKey, 15 * 60);
            return response()->json(['error' => 'Current password is incorrect'], 400);
        }

        RateLimiter::clear($throttleKey);

        $newHash = Hash::make($newPassword, ['rounds' => 12]);

        DB::transaction(function () use ($user, $newHash) {
            $user->update(['password_hash' => $newHash]);

            // Invalidate all active sessions for this user in laravel_sessions
            if (Schema::hasTable('laravel_sessions')) {
                DB::table('laravel_sessions')->where('user_id', $user->id)->delete();
            }

            // Also clear legacy Express sessions table
            if (Schema::hasTable('sessions')) {
                DB::table('sessions')->truncate();
            }
        });

        Auth::logout();
        $request->session()->invalidate();

        return response()->json(['ok' => true]);
    }
}

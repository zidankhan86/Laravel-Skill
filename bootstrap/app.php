<?php

use App\Http\Middleware\ApiSecurityHeaders;
use App\Http\Middleware\AuthenticateAdmin;
use App\Http\Middleware\EnsureCsrfToken;
use App\Http\Middleware\EnsureInstalled;
use App\Http\Middleware\RedirectIfInstalled;
use App\Http\Middleware\VerifyAppOrigin;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->trustProxies(at: env('TRUSTED_PROXIES', '*'));

        $middleware->alias([
            'origin' => VerifyAppOrigin::class,
            'custom.csrf' => EnsureCsrfToken::class,
            'auth.custom' => AuthenticateAdmin::class,
            'installed' => EnsureInstalled::class,
            'not.installed' => RedirectIfInstalled::class,
        ]);

        $middleware->web(append: [
            EnsureInstalled::class,
            \App\Http\Middleware\HandleInertiaRequests::class,
            ApiSecurityHeaders::class,
        ]);

        $middleware->api(prepend: [
            EnsureInstalled::class,
            StartSession::class,
            ApiSecurityHeaders::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (ValidationException $e, Request $request) {
            $issues = [];
            foreach ($e->errors() as $field => $messages) {
                foreach ($messages as $msg) {
                    $issues[] = [
                        'path' => $field,
                        'message' => $msg,
                    ];
                }
            }
            return response()->json([
                'error' => 'Validation failed',
                'issues' => $issues,
            ], 400);
        });

        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['error' => 'Not found'], 404);
            }
        });
    })->create();

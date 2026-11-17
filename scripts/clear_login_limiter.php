<?php

require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

Illuminate\Support\Facades\RateLimiter::clear('login:127.0.0.1');
Illuminate\Support\Facades\RateLimiter::clear('login:::1');
echo "Cleared login rate limiter\n";

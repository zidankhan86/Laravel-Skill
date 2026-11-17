<?php

$autoload = file_exists(__DIR__ . '/../vendor/autoload.php') ? __DIR__ . '/../vendor/autoload.php' : __DIR__ . '/../backend/vendor/autoload.php';
$bootstrap = file_exists(__DIR__ . '/../bootstrap/app.php') ? __DIR__ . '/../bootstrap/app.php' : __DIR__ . '/../backend/bootstrap/app.php';
require $autoload;
$app = require_once $bootstrap;
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

Illuminate\Support\Facades\RateLimiter::clear('login:127.0.0.1');
Illuminate\Support\Facades\RateLimiter::clear('login:::1');
echo "Cleared login rate limiter\n";

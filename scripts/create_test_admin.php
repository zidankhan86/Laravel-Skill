<?php

$autoload = file_exists(__DIR__ . '/../vendor/autoload.php') ? __DIR__ . '/../vendor/autoload.php' : __DIR__ . '/../backend/vendor/autoload.php';
$bootstrap = file_exists(__DIR__ . '/../bootstrap/app.php') ? __DIR__ . '/../bootstrap/app.php' : __DIR__ . '/../backend/bootstrap/app.php';
require $autoload;
$app = require_once $bootstrap;
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$id = $argv[1] ?? null;
$email = $argv[2] ?? null;
$password = $argv[3] ?? null;

if (!$id || !$email || !$password) {
    echo "Missing arguments\n";
    exit(1);
}

App\Models\User::create([
    'id' => $id,
    'email' => $email,
    'password_hash' => Illuminate\Support\Facades\Hash::make($password),
]);

echo "Created\n";

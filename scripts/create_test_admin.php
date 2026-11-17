<?php

require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
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

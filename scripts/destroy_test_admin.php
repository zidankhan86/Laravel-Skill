<?php

$autoload = file_exists(__DIR__ . '/../vendor/autoload.php') ? __DIR__ . '/../vendor/autoload.php' : __DIR__ . '/../backend/vendor/autoload.php';
$bootstrap = file_exists(__DIR__ . '/../bootstrap/app.php') ? __DIR__ . '/../bootstrap/app.php' : __DIR__ . '/../backend/bootstrap/app.php';
require $autoload;
$app = require_once $bootstrap;
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$id = $argv[1] ?? null;

if ($id) {
    App\Models\User::destroy($id);
    echo "Destroyed\n";
}

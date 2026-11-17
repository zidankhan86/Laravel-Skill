<?php

$autoload = file_exists(__DIR__ . '/../vendor/autoload.php') ? __DIR__ . '/../vendor/autoload.php' : __DIR__ . '/../backend/vendor/autoload.php';
$bootstrap = file_exists(__DIR__ . '/../bootstrap/app.php') ? __DIR__ . '/../bootstrap/app.php' : __DIR__ . '/../backend/bootstrap/app.php';
require $autoload;
$app = require_once $bootstrap;
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$target = $argv[1] ?? null;

if ($target) {
    if (filter_var($target, FILTER_VALIDATE_EMAIL)) {
        App\Models\LeadRequest::where('email', $target)->delete();
        echo "Deleted lead by email: $target\n";
    } else {
        App\Models\LeadRequest::destroy($target);
        echo "Deleted lead by ID: $target\n";
    }
}

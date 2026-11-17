<?php

require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
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

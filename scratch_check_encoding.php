<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$ui = App\Models\Setting::find('ui');
echo "=== UI SETTING ===\n";
echo json_encode($ui->value, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n\n";

$homepage = App\Models\Setting::find('homepage');
echo "=== HOMEPAGE SETTING ===\n";
echo json_encode($homepage->value, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n\n";

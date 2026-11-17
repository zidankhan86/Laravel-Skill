<?php

$autoload = file_exists(__DIR__ . '/../vendor/autoload.php') ? __DIR__ . '/../vendor/autoload.php' : __DIR__ . '/../backend/vendor/autoload.php';
$bootstrap = file_exists(__DIR__ . '/../bootstrap/app.php') ? __DIR__ . '/../bootstrap/app.php' : __DIR__ . '/../backend/bootstrap/app.php';
require $autoload;
$app = require_once $bootstrap;
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$pdo = Illuminate\Support\Facades\DB::connection()->getPdo();
$testPdo = new PDO('mysql:host=127.0.0.1;dbname=tanvir_portfolio_test', 'root', '');

foreach (['appearance', 'homepage', 'integrations', 'ui'] as $k) {
    $t = $testPdo->query("SELECT * FROM settings WHERE id='$k'")->fetch(PDO::FETCH_ASSOC);
    $stmt = $pdo->prepare("UPDATE settings SET value = ?, version = ? WHERE id = ?");
    $stmt->execute([$t['value'], $t['version'], $k]);
    echo "Synced $k to version {$t['version']}\n";
}

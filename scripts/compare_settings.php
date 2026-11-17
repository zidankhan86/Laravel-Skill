<?php

require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$pdo = Illuminate\Support\Facades\DB::connection()->getPdo();
$testPdo = new PDO('mysql:host=127.0.0.1;dbname=tanvir_portfolio_test', 'root', '');

foreach (['appearance', 'homepage', 'integrations', 'ui'] as $k) {
    $l = $pdo->query("SELECT * FROM settings WHERE id='$k'")->fetch(PDO::FETCH_ASSOC);
    $t = $testPdo->query("SELECT * FROM settings WHERE id='$k'")->fetch(PDO::FETCH_ASSOC);
    echo "$k: L_ver={$l['version']}, T_ver={$t['version']}\n";
    $jl = json_decode($l['value'], true);
    $jt = json_decode($t['value'], true);
    $diff1 = array_diff_assoc($jl, $jt);
    $diff2 = array_diff_assoc($jt, $jl);
    if ($diff1 || $diff2) {
        echo "  diff L: " . json_encode($diff1) . "\n";
        echo "  diff T: " . json_encode($diff2) . "\n";
    } else {
        echo "  JSON identical\n";
    }
}

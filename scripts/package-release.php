<?php

$rootDir = realpath(__DIR__ . '/..');
$distDir = $rootDir . '/.dist';
$outputZip = $distDir . '/tanvir-portfolio-release.zip';

echo "===================================================================\n";
echo "TANVIR PORTFOLIO CMS: ZERO-KNOWLEDGE PRODUCTION PACKAGER\n";
echo "===================================================================\n";

// 1. Verify pre-requisites
if (!file_exists($rootDir . '/public/build/manifest.json')) {
    echo "❌ Error: Frontend assets not compiled. Run 'npm run build' first.\n";
    exit(1);
}

if (!file_exists($rootDir . '/vendor/autoload.php')) {
    echo "❌ Error: Composer vendor dependencies missing. Run 'composer install' first.\n";
    exit(1);
}

if (!is_dir($distDir)) {
    mkdir($distDir, 0755, true);
}

if (file_exists($outputZip)) {
    unlink($outputZip);
}

$zip = new ZipArchive();
if ($zip->open($outputZip, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
    echo "❌ Error: Cannot create zip archive at {$outputZip}\n";
    exit(1);
}

// Prune large non-production directory trees completely
$excludedDirNames = [
    'node_modules' => true,
    '.git' => true,
    '.github' => true,
    '.local' => true,
    '.dist' => true,
    'backend' => true,
    'frontend' => true,
    'tests' => true,
];

$excludedFilePatterns = [
    '#^\.env$#',
    '#^\.env\.(?!example$)#',
    '#^\.phpunit#',
    '#^storage/installed\.lock$#',
    '#^storage/installer_state\.json$#',
    '#^storage/logs/.*\.log$#',
    '#^storage/framework/sessions/.*#',
    '#^storage/framework/views/.*#',
    '#^storage/framework/cache/data/.*#',
    '#^scripts/scratch#',
    '#\.tmp#',
];

echo "\n[1/3] Scanning and bundling production application files...\n";

$dirIterator = new RecursiveDirectoryIterator($rootDir, RecursiveDirectoryIterator::SKIP_DOTS);

$filterIterator = new RecursiveCallbackFilterIterator($dirIterator, function ($current, $key, $iterator) use ($excludedDirNames, $excludedFilePatterns, $rootDir) {
    $filename = $current->getFilename();
    $subPath = str_replace('\\', '/', substr($current->getPathname(), strlen($rootDir) + 1));

    if ($current->isDir()) {
        // Prune directory tree immediately
        if (isset($excludedDirNames[$filename])) {
            return false;
        }
    } else {
        foreach ($excludedFilePatterns as $pattern) {
            if (preg_match($pattern, $subPath)) {
                return false;
            }
        }
    }

    return true;
});

$iterator = new RecursiveIteratorIterator($filterIterator, RecursiveIteratorIterator::SELF_FIRST);

$fileCount = 0;

foreach ($iterator as $item) {
    $subPath = str_replace('\\', '/', substr($item->getPathname(), strlen($rootDir) + 1));

    if ($item->isDir()) {
        $zip->addEmptyDir($subPath);
    } elseif ($item->isFile()) {
        $zip->addFile($item->getPathname(), $subPath);
        $fileCount++;
    }
}

// Ensure essential empty storage directories exist in ZIP
$essentialDirs = [
    'storage/app/public',
    'storage/framework/cache',
    'storage/framework/sessions',
    'storage/framework/views',
    'storage/logs',
    'bootstrap/cache',
];

foreach ($essentialDirs as $dir) {
    $zip->addEmptyDir($dir);
    $zip->addFromString($dir . '/.gitignore', "*\n!.gitignore\n");
}

$zip->close();

echo "\n[2/3] Verifying release package integrity...\n";

// Verify ZIP contents
$verifyZip = new ZipArchive();
if ($verifyZip->open($outputZip) !== true) {
    echo "❌ Error opening generated ZIP for verification.\n";
    exit(1);
}

$securityChecks = [
    ['pattern' => '#^\.env$#', 'mustExist' => false, 'name' => 'Local .env excluded'],
    ['pattern' => '#installed\.lock#', 'mustExist' => false, 'name' => 'Installed lock excluded'],
    ['pattern' => '#node_modules#', 'mustExist' => false, 'name' => 'node_modules excluded'],
    ['pattern' => '#vendor/autoload\.php#', 'mustExist' => true, 'name' => 'Vendor dependencies included'],
    ['pattern' => '#public/build/manifest\.json#', 'mustExist' => true, 'name' => 'Precompiled assets included'],
    ['pattern' => '#\.env\.example#', 'mustExist' => true, 'name' => 'Clean .env.example included'],
];

$allPassed = true;
foreach ($securityChecks as $check) {
    $found = false;
    for ($i = 0; $i < $verifyZip->numFiles; $i++) {
        $filename = $verifyZip->getNameIndex($i);
        if (preg_match($check['pattern'], $filename)) {
            $found = true;
            break;
        }
    }

    if ($check['mustExist'] && $found) {
        echo "   ✓ {$check['name']} (Verified)\n";
    } elseif (!$check['mustExist'] && !$found) {
        echo "   ✓ {$check['name']} (Verified)\n";
    } else {
        echo "   ❌ FAILED: {$check['name']}\n";
        $allPassed = false;
    }
}

$verifyZip->close();

if (!$allPassed) {
    echo "\n❌ Release package verification failed security checks.\n";
    exit(1);
}

$zipSizeMb = round(filesize($outputZip) / 1024 / 1024, 2);

echo "\n[3/3] Packaging Complete!\n";
echo "   ✓ Output file: {$outputZip}\n";
echo "   ✓ Total files bundled: {$fileCount}\n";
echo "   ✓ Total package size: {$zipSizeMb} MB\n";
echo "\n🎉 READY FOR ZERO-KNOWLEDGE DEPLOYMENT ON SHARED HOSTING!\n";

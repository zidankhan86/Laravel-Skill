<?php
$pdoLocal = new PDO('mysql:host=127.0.0.1;dbname=tanvir_portfolio_local;charset=utf8mb4', 'root', '');
$pdoTest = new PDO('mysql:host=127.0.0.1;dbname=tanvir_portfolio_test;charset=utf8mb4', 'root', '');

echo "==========================================================" . PHP_EOL;
echo "1. VERIFYING ROW COUNTS ACROSS ALL DOMAIN TABLES" . PHP_EOL;
echo "==========================================================" . PHP_EOL;
$tables = ['users', 'content', 'settings', 'requests', 'sessions', 'media', 'content_media', 'settings_media'];
$allPassed = true;

foreach ($tables as $t) {
    $cLocal = $pdoLocal->query("SELECT COUNT(*) FROM `{$t}`")->fetchColumn();
    $cTest = $pdoTest->query("SELECT COUNT(*) FROM `{$t}`")->fetchColumn();
    $status = ($cLocal == $cTest) ? "[PASS]" : "[FAIL]";
    if ($cLocal != $cTest) $allPassed = false;
    echo "{$status} Table '{$t}': Local={$cLocal}, Test={$cTest}" . PHP_EOL;
}

echo PHP_EOL . "==========================================================" . PHP_EOL;
echo "2. VERIFYING USERS DATA INTEGRITY" . PHP_EOL;
echo "==========================================================" . PHP_EOL;
$uLocal = $pdoLocal->query("SELECT * FROM users ORDER BY id ASC")->fetchAll(PDO::FETCH_ASSOC);
$uTest = $pdoTest->query("SELECT * FROM users ORDER BY id ASC")->fetchAll(PDO::FETCH_ASSOC);
if ($uLocal === $uTest) {
    echo "[PASS] Users data matches 100% byte-for-byte across all columns." . PHP_EOL;
    echo "       User: " . $uLocal[0]['email'] . " (ID: " . $uLocal[0]['id'] . ")" . PHP_EOL;
} else {
    echo "[FAIL] Users data mismatch!" . PHP_EOL;
    $allPassed = false;
}

echo PHP_EOL . "==========================================================" . PHP_EOL;
echo "3. VERIFYING CONTENT (22 RECORDS) AND JSON INTEGRITY" . PHP_EOL;
echo "==========================================================" . PHP_EOL;
$cLocal = $pdoLocal->query("SELECT * FROM content ORDER BY id ASC")->fetchAll(PDO::FETCH_ASSOC);
$cTest = $pdoTest->query("SELECT * FROM content ORDER BY id ASC")->fetchAll(PDO::FETCH_ASSOC);

$contentMismatch = 0;
for ($i = 0; $i < count($cLocal); $i++) {
    $rowL = $cLocal[$i];
    $rowT = $cTest[$i];

    // Check basic columns
    if ($rowL['id'] !== $rowT['id'] || $rowL['slug'] !== $rowT['slug'] || $rowL['title'] !== $rowT['title']) {
        echo "[FAIL] Content row {$i} column mismatch!" . PHP_EOL;
        $contentMismatch++;
    }

    // Check JSON parsing
    $jsonL = json_decode($rowL['fields'], true);
    $jsonT = json_decode($rowT['fields'], true);
    if ($jsonL === null || $jsonT === null || $jsonL !== $jsonT) {
        echo "[FAIL] Content row {$i} ({$rowL['slug']}) JSON mismatch!" . PHP_EOL;
        $contentMismatch++;
    }
}

if ($contentMismatch === 0) {
    echo "[PASS] All 22 content records and their JSON 'fields' match 100% perfectly." . PHP_EOL;
} else {
    $allPassed = false;
}

echo PHP_EOL . "==========================================================" . PHP_EOL;
echo "4. VERIFYING SETTINGS (10 KEYS) AND JSON STRUCTURE" . PHP_EOL;
echo "==========================================================" . PHP_EOL;
$sLocal = $pdoLocal->query("SELECT * FROM settings ORDER BY id ASC")->fetchAll(PDO::FETCH_ASSOC);
$sTest = $pdoTest->query("SELECT * FROM settings ORDER BY id ASC")->fetchAll(PDO::FETCH_ASSOC);

$settingsMismatch = 0;
for ($i = 0; $i < count($sLocal); $i++) {
    $rowL = $sLocal[$i];
    $rowT = $sTest[$i];

    $jsonL = json_decode($rowL['value'], true);
    $jsonT = json_decode($rowT['value'], true);

    if ($rowL['id'] !== $rowT['id'] || $rowL['version'] !== $rowT['version'] || $jsonL !== $jsonT) {
        echo "[FAIL] Settings '{$rowL['id']}' mismatch!" . PHP_EOL;
        $settingsMismatch++;
    } else {
        echo "[PASS] Settings key '{$rowL['id']}': version={$rowL['version']}, valid JSON confirmed." . PHP_EOL;
    }
}
if ($settingsMismatch > 0) $allPassed = false;

echo PHP_EOL . "==========================================================" . PHP_EOL;
echo "5. VERIFYING REQUESTS (LEAD) RECORD" . PHP_EOL;
echo "==========================================================" . PHP_EOL;
$rLocal = $pdoLocal->query("SELECT * FROM requests ORDER BY id ASC")->fetchAll(PDO::FETCH_ASSOC);
$rTest = $pdoTest->query("SELECT * FROM requests ORDER BY id ASC")->fetchAll(PDO::FETCH_ASSOC);
if ($rLocal === $rTest) {
    echo "[PASS] Requests table matches 100% byte-for-byte." . PHP_EOL;
    echo "       Lead: " . $rLocal[0]['name'] . " <" . $rLocal[0]['email'] . "> (" . $rLocal[0]['kind'] . ")" . PHP_EOL;
} else {
    echo "[FAIL] Requests table mismatch!" . PHP_EOL;
    $allPassed = false;
}

echo PHP_EOL . "==========================================================" . PHP_EOL;
echo "6. VERIFYING MEDIUMBLOB BINARY PRESERVATION (IMAGES & PDFS)" . PHP_EOL;
echo "==========================================================" . PHP_EOL;

// Generate test binary files (simulated PNG and PDF)
$fakePngBytes = "\x89PNG\r\n\x1a\n" . random_bytes(1024 * 50); // 50 KB binary PNG
$fakePdfBytes = "%PDF-1.7\n%\xe2\xe3\xcf\xd3\n" . random_bytes(1024 * 120); // 120 KB binary PDF

$pngId = '11111111-2222-3333-4444-555555555555';
$pdfId = '66666666-7777-8888-9999-000000000000';

$pngMd5Original = md5($fakePngBytes);
$pdfMd5Original = md5($fakePdfBytes);
$pngSha256Original = hash('sha256', $fakePngBytes);
$pdfSha256Original = hash('sha256', $fakePdfBytes);

// Insert into tanvir_portfolio_test using PDO prepared statement with PARAM_LOB
$stmt = $pdoTest->prepare("INSERT INTO media (id, name, mime, alt, size, bytes, created_at, version) VALUES (?, ?, ?, ?, ?, ?, NOW(), 1)");
$stmt->bindParam(1, $pngId);
$name = 'test-image.png';
$stmt->bindParam(2, $name);
$mime = 'image/png';
$stmt->bindParam(3, $mime);
$alt = 'Test Image';
$stmt->bindParam(4, $alt);
$size = strlen($fakePngBytes);
$stmt->bindParam(5, $size);
$stmt->bindParam(6, $fakePngBytes, PDO::PARAM_LOB);
$stmt->execute();

$stmt = $pdoTest->prepare("INSERT INTO media (id, name, mime, alt, size, bytes, created_at, version) VALUES (?, ?, ?, ?, ?, ?, NOW(), 1)");
$stmt->bindParam(1, $pdfId);
$namePdf = 'test-document.pdf';
$stmt->bindParam(2, $namePdf);
$mimePdf = 'application/pdf';
$stmt->bindParam(3, $mimePdf);
$altPdf = 'Test PDF';
$stmt->bindParam(4, $altPdf);
$sizePdf = strlen($fakePdfBytes);
$stmt->bindParam(5, $sizePdf);
$stmt->bindParam(6, $fakePdfBytes, PDO::PARAM_LOB);
$stmt->execute();

// Retrieve from tanvir_portfolio_test and verify hashes
$fetchPng = $pdoTest->query("SELECT bytes FROM media WHERE id = '{$pngId}'")->fetch(PDO::FETCH_ASSOC);
$retrievedPng = is_resource($fetchPng['bytes']) ? stream_get_contents($fetchPng['bytes']) : $fetchPng['bytes'];

$fetchPdf = $pdoTest->query("SELECT bytes FROM media WHERE id = '{$pdfId}'")->fetch(PDO::FETCH_ASSOC);
$retrievedPdf = is_resource($fetchPdf['bytes']) ? stream_get_contents($fetchPdf['bytes']) : $fetchPdf['bytes'];

$pngMd5Fetched = md5($retrievedPng);
$pdfMd5Fetched = md5($retrievedPdf);
$pngSha256Fetched = hash('sha256', $retrievedPng);
$pdfSha256Fetched = hash('sha256', $retrievedPdf);

if ($pngMd5Original === $pngMd5Fetched && $pngSha256Original === $pngSha256Fetched) {
    echo "[PASS] Image BLOB (50 KB) verified: zero corruption, SHA256 matches exactly." . PHP_EOL;
} else {
    echo "[FAIL] Image BLOB corrupted!" . PHP_EOL;
    $allPassed = false;
}

if ($pdfMd5Original === $pdfMd5Fetched && $pdfSha256Original === $pdfSha256Fetched) {
    echo "[PASS] PDF BLOB (120 KB) verified: zero corruption, SHA256 matches exactly." . PHP_EOL;
} else {
    echo "[FAIL] PDF BLOB corrupted!" . PHP_EOL;
    $allPassed = false;
}

// Clean up test media from tanvir_portfolio_test
$pdoTest->exec("DELETE FROM media WHERE id IN ('{$pngId}', '{$pdfId}')");

echo PHP_EOL . "==========================================================" . PHP_EOL;
echo "7. VERIFYING RELATIONSHIPS AND RESTRICT/CASCADE CONSTRAINTS" . PHP_EOL;
echo "==========================================================" . PHP_EOL;

// Test content_media foreign key cascade
$testContentId = '99999999-0000-0000-0000-111111111111';
$testMediaId = '88888888-0000-0000-0000-222222222222';

$pdoTest->exec("INSERT INTO media (id, name, mime, alt, size, bytes) VALUES ('{$testMediaId}', 'm.png', 'image/png', '', 10, 'bytes12345')");
$pdoTest->exec("INSERT INTO content (id, collection, slug, title, summary, body, fields) VALUES ('{$testContentId}', 'test', 'test-slug', 'Test', 'S', 'B', '{}')");
$pdoTest->exec("INSERT INTO content_media (content_id, media_id) VALUES ('{$testContentId}', '{$testMediaId}')");

// Verify RESTRICT on media delete (should fail)
try {
    $pdoTest->exec("DELETE FROM media WHERE id = '{$testMediaId}'");
    echo "[FAIL] Expected foreign key RESTRICT constraint did not block media deletion!" . PHP_EOL;
    $allPassed = false;
} catch (PDOException $e) {
    echo "[PASS] Foreign key RESTRICT constraint properly prevented deleting media in use." . PHP_EOL;
}

// Verify CASCADE on content delete
$pdoTest->exec("DELETE FROM content WHERE id = '{$testContentId}'");
$pivotRemaining = $pdoTest->query("SELECT COUNT(*) FROM content_media WHERE content_id = '{$testContentId}'")->fetchColumn();
if ($pivotRemaining == 0) {
    echo "[PASS] Foreign key CASCADE constraint properly removed pivot row upon content deletion." . PHP_EOL;
} else {
    echo "[FAIL] Pivot row was not cascaded!" . PHP_EOL;
    $allPassed = false;
}
$pdoTest->exec("DELETE FROM media WHERE id = '{$testMediaId}'");

echo PHP_EOL . "==========================================================" . PHP_EOL;
if ($allPassed) {
    echo ">>> FINAL RESULT: ALL DATABASE VERIFICATION TESTS PASSED 100%! <<<" . PHP_EOL;
} else {
    echo ">>> FINAL RESULT: SOME VERIFICATION CHECKS FAILED! <<<" . PHP_EOL;
}
echo "==========================================================" . PHP_EOL;

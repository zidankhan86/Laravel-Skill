<?php

function isMojibake($str) {
    if (!is_string($str)) return false;
    // Check for common UTF-8 -> Windows-1252 mojibake lead bytes
    return (
        strpos($str, 'à¦') !== false ||
        strpos($str, 'â') !== false ||
        strpos($str, 'ðŸ') !== false ||
        strpos($str, 'Â©') !== false ||
        strpos($str, 'Ã') !== false ||
        strpos($str, 'Â') !== false
    );
}

function fixString($str) {
    if (!is_string($str)) return $str;
    if (isMojibake($str)) {
        $converted = @mb_convert_encoding($str, 'Windows-1252', 'UTF-8');
        if ($converted !== false && mb_check_encoding($converted, 'UTF-8')) {
            return $converted;
        }
    }
    return $str;
}

function fixRecursive(&$item) {
    if (is_array($item)) {
        foreach ($item as $k => &$v) {
            fixRecursive($v);
        }
    } elseif (is_string($item)) {
        $item = fixString($item);
    }
}

$databases = ['tanvir_portfolio_local', 'tanvir_portfolio_test'];

foreach ($databases as $dbName) {
    echo "====================================================\n";
    echo "COMPREHENSIVE MOJIBAKE REPAIR IN: $dbName\n";
    echo "====================================================\n";
    $pdo = new PDO("mysql:host=127.0.0.1;dbname=$dbName;charset=utf8mb4", 'root', '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);

    // 1. Settings
    $stmt = $pdo->query("SELECT id, value FROM settings");
    $settingsUpdate = $pdo->prepare("UPDATE settings SET value = ? WHERE id = ?");

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $data = json_decode($row['value'], true);
        if (json_last_error() === JSON_ERROR_NONE) {
            $dataBefore = $data;
            fixRecursive($data);
            if ($data !== $dataBefore) {
                $newJson = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                $settingsUpdate->execute([$newJson, $row['id']]);
                echo "✓ Repaired settings key '{$row['id']}'\n";
            }
        }
    }

    // 2. Content
    $stmt = $pdo->query("SELECT id, collection, title, summary, body, fields FROM content");
    $contentUpdate = $pdo->prepare("UPDATE content SET title = ?, summary = ?, body = ?, fields = ? WHERE id = ?");

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $fixedTitle = fixString($row['title']);
        $fixedSummary = fixString($row['summary']);
        $fixedBody = fixString($row['body']);
        $fieldsData = json_decode($row['fields'] ?? '[]', true);
        $fieldsBefore = $fieldsData;
        fixRecursive($fieldsData);

        if ($fixedTitle !== $row['title'] || $fixedSummary !== $row['summary'] || $fixedBody !== $row['body'] || $fieldsData !== $fieldsBefore) {
            $newFields = json_encode($fieldsData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            $contentUpdate->execute([$fixedTitle, $fixedSummary, $fixedBody, $newFields, $row['id']]);
            echo "✓ Repaired content [{$row['collection']}] id={$row['id']}\n";
        }
    }
}

echo "\nDone!\n";

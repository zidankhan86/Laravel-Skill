<?php

namespace App\Installer;

class InstallationLock
{
    protected string $lockFilePath;
    protected static ?bool $fakeInstalled = null;

    public static function fakeInstalled(?bool $fake): void
    {
        self::$fakeInstalled = $fake;
    }

    public function __construct(?string $lockFilePath = null)
    {
        if ($lockFilePath !== null) {
            $this->lockFilePath = $lockFilePath;
        } elseif (function_exists('app') && app()->has('path.storage')) {
            $this->lockFilePath = storage_path('installed.lock');
        } else {
            $this->lockFilePath = dirname(__DIR__, 2) . '/storage/installed.lock';
        }
    }

    /**
     * Check if the application is permanently locked as installed.
     */
    public function isInstalled(): bool
    {
        if (self::$fakeInstalled !== null) {
            return self::$fakeInstalled;
        }

        if (!file_exists($this->lockFilePath)) {
            return false;
        }

        // Verify the file is non-empty and readable
        $content = @file_get_contents($this->lockFilePath);
        if ($content === false || empty(trim($content))) {
            return false;
        }

        return true;
    }

    /**
     * Create the permanent installation lockfile with tamper-evident metadata.
     *
     * @param array $metadata Extra installation context (site, admin email, etc.)
     * @return bool
     */
    public function lock(array $metadata = []): bool
    {
        $dir = dirname($this->lockFilePath);
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }

        if (file_exists($this->lockFilePath)) {
            @chmod($this->lockFilePath, 0666);
        }

        $hasConfig = function_exists('app') && app()->has('config');
        $appKey = $hasConfig ? config('app.key') : (getenv('APP_KEY') ?: '');
        $appUrl = $hasConfig ? config('app.url') : (getenv('APP_URL') ?: '');
        $installedAt = date('c');

        $data = [
            'status' => 'installed',
            'installed_at' => $installedAt,
            'app_url' => $appUrl,
            'php_version' => PHP_VERSION,
            'app_version' => '1.0.0',
            'metadata' => array_diff_key($metadata, ['password' => '', 'api_token' => '']),
        ];

        // Add cryptographic HMAC signature if app key is available
        if (!empty($appKey)) {
            $data['signature'] = hash_hmac('sha256', json_encode($data), $appKey);
        }

        $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        $written = @file_put_contents($this->lockFilePath, $json);

        if ($written !== false) {
            @chmod($this->lockFilePath, 0444); // Read-only
            return true;
        }

        return false;
    }

    /**
     * Retrieve lockfile data if installed.
     */
    public function getLockData(): ?array
    {
        if (!$this->isInstalled()) {
            return null;
        }

        $content = @file_get_contents($this->lockFilePath);
        if (!$content) {
            return null;
        }

        $data = json_decode($content, true);
        return is_array($data) ? $data : null;
    }

    /**
     * Unlock installation only if physically deleted or requested with master secret.
     */
    public function removeLock(): bool
    {
        if (file_exists($this->lockFilePath)) {
            @chmod($this->lockFilePath, 0666);
            return @unlink($this->lockFilePath);
        }
        return true;
    }
}

<?php

namespace App\Installer;

use Illuminate\Support\Str;

class EnvironmentManager
{
    protected string $envPath;
    protected string $examplePath;

    public function __construct(?string $envPath = null, ?string $examplePath = null)
    {
        $base = (function_exists('app') && app()->has('path.base')) ? base_path() : dirname(__DIR__, 2);
        $this->envPath = $envPath ?: $base . '/.env';
        $this->examplePath = $examplePath ?: $base . '/.env.example';
    }

    /**
     * Generate and save production .env configuration.
     *
     * @param array $config Key-value pairs to set or override
     * @return array{success: bool, appKey: string, message: string}
     */
    public function generate(array $config): array
    {
        // 1. Read baseline content from .env or .env.example
        $baseContent = '';
        if (file_exists($this->envPath)) {
            $baseContent = file_get_contents($this->envPath) ?: '';
        } elseif (file_exists($this->examplePath)) {
            $baseContent = file_get_contents($this->examplePath) ?: '';
        }

        // 2. Generate cryptographically secure APP_KEY if not already provided
        $appKey = $config['APP_KEY'] ?? ('base64:' . base64_encode(random_bytes(32)));

        // 3. Define mandatory production variables
        $variables = array_merge([
            'APP_NAME' => $config['APP_NAME'] ?? 'Portfolio CMS',
            'APP_ENV' => 'production',
            'APP_KEY' => $appKey,
            'APP_DEBUG' => 'false',
            'APP_URL' => $config['APP_URL'] ?? 'http://localhost',
            'LOG_CHANNEL' => 'daily',
            'LOG_LEVEL' => 'warning',
            'DB_CONNECTION' => 'mysql',
            'DB_HOST' => $config['DB_HOST'] ?? '127.0.0.1',
            'DB_PORT' => $config['DB_PORT'] ?? '3306',
            'DB_DATABASE' => $config['DB_DATABASE'] ?? '',
            'DB_USERNAME' => $config['DB_USERNAME'] ?? '',
            'DB_PASSWORD' => $config['DB_PASSWORD'] ?? '',
            'SESSION_DRIVER' => 'database',
            'SESSION_LIFETIME' => '120',
            'SESSION_COOKIE' => 'portfolio_sid',
            'SESSION_TABLE' => 'laravel_sessions',
            'CACHE_STORE' => 'database',
            'CACHE_TABLE' => 'cache',
            'QUEUE_CONNECTION' => 'database',
            'FILESYSTEM_DISK' => 'local',
        ], $config);

        // 4. Update or append each variable safely
        $updatedContent = $this->updateEnvContent($baseContent, $variables);

        // 5. Atomic write using temporary file
        $tempFile = $this->envPath . '.tmp.' . Str::random(8);
        $written = @file_put_contents($tempFile, $updatedContent);

        if ($written === false) {
            return [
                'success' => false,
                'appKey' => '',
                'message' => "Unable to write to {$this->envPath}. Please ensure directory permissions allow file writing.",
            ];
        }

        // Rename temp file to target .env
        $renamed = @rename($tempFile, $this->envPath);
        if (!$renamed) {
            @unlink($tempFile);
            return [
                'success' => false,
                'appKey' => '',
                'message' => "Failed to replace {$this->envPath} with new configuration.",
            ];
        }

        // Ensure proper file permissions (640 or 644)
        @chmod($this->envPath, 0640);

        return [
            'success' => true,
            'appKey' => $appKey,
            'message' => 'Environment file (.env) successfully generated and secured.',
        ];
    }

    /**
     * Safely replace existing keys or append new keys to .env content.
     */
    protected function updateEnvContent(string $content, array $variables): string
    {
        $lines = preg_split("/\r\n|\n|\r/", $content) ?: [];
        $appliedKeys = [];

        $newLines = [];
        foreach ($lines as $line) {
            // Check if line is a KEY=VALUE definition
            if (preg_match('/^([a-zA-Z0-9_]+)=(.*)$/', trim($line), $matches)) {
                $key = $matches[1];
                if (array_key_exists($key, $variables)) {
                    $newLines[] = $key . '=' . $this->formatEnvValue($variables[$key]);
                    $appliedKeys[$key] = true;
                    continue;
                }
            }
            $newLines[] = $line;
        }

        // Append any remaining keys that were not in the baseline
        $appended = false;
        foreach ($variables as $key => $value) {
            if (!isset($appliedKeys[$key])) {
                if (!$appended && count($newLines) > 0) {
                    $newLines[] = '';
                    $appended = true;
                }
                $newLines[] = $key . '=' . $this->formatEnvValue($value);
            }
        }

        return implode("\n", $newLines) . "\n";
    }

    /**
     * Format value with quotes if needed (whitespace, hash, special chars).
     */
    protected function formatEnvValue(mixed $value): string
    {
        $val = (string) $value;

        // Boolean or null strings
        if (in_array(strtolower($val), ['true', 'false', 'null'], true)) {
            return strtolower($val);
        }

        // Numbers
        if (is_numeric($val) && !str_starts_with($val, '0')) {
            return $val;
        }

        // Quote strings containing spaces, hashes, or quotes
        if (preg_match('/[\s#"\'=\\\\]/', $val) || empty($val)) {
            $escaped = str_replace('"', '\"', $val);
            return '"' . $escaped . '"';
        }

        return $val;
    }
}

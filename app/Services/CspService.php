<?php

namespace App\Services;

use App\Models\Setting;

class CspService
{
    /**
     * Build the dynamic Content Security Policy string.
     */
    public function generatePolicy(bool $isAdmin = false): string
    {
        if ($isAdmin) {
            // Strict admin policy with frame-ancestors 'none' to prevent clickjacking/framing
            $directives = [
                'default-src' => ["'self'"],
                'script-src' => ["'self'"],
                'style-src' => ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                'font-src' => ["'self'", "https://fonts.gstatic.com"],
                'img-src' => ["'self'", "https:", "data:"],
                'connect-src' => ["'self'"],
                'frame-ancestors' => ["'none'"],
            ];

            return $this->formatDirectives($directives);
        }

        // Base public policy
        $directives = [
            'default-src' => ["'self'"],
            'script-src' => ["'self'"],
            'style-src' => ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            'font-src' => ["'self'", "https://fonts.gstatic.com"],
            'img-src' => ["'self'", "https:", "data:"],
            'connect-src' => ["'self'"],
            'frame-src' => ["'self'", "https://www.youtube-nocookie.com"],
            'frame-ancestors' => ["'self'"],
        ];

        // Fetch dynamic integration and custom code settings
        $integrations = $this->getSettingValue('integrations');
        $customCode = $this->getSettingValue('customCode');

        // Facebook Pixel
        if (($integrations['facebookEnabled'] ?? 'off') === 'on') {
            $this->addValue($directives, 'script-src', 'https://connect.facebook.net');
            $this->addValue($directives, 'connect-src', 'https://www.facebook.com');
            $this->addValue($directives, 'connect-src', 'https://connect.facebook.net');
        }

        // TikTok Pixel
        if (($integrations['tiktokEnabled'] ?? 'off') === 'on') {
            $this->addValue($directives, 'script-src', 'https://analytics.tiktok.com');
            $this->addValue($directives, 'connect-src', 'https://analytics.tiktok.com');
            $this->addValue($directives, 'connect-src', 'https://*.tiktok.com');
            $this->addValue($directives, 'connect-src', 'https://*.tiktokv.com');
        }

        // Google Tag Manager
        if (($integrations['gtmEnabled'] ?? 'off') === 'on') {
            $this->addValue($directives, 'script-src', 'https:');
            $this->addValue($directives, 'connect-src', 'https:');
            $this->addValue($directives, 'frame-src', 'https:');
        }

        // Custom Code Injection
        if (($customCode['enabled'] ?? 'off') === 'on') {
            $this->addValue($directives, 'script-src', "'unsafe-inline'", 'https:');
            $this->addValue($directives, 'connect-src', 'https:', 'wss:');
            $this->addValue($directives, 'style-src', 'https:');
            $this->addValue($directives, 'font-src', 'https:', 'data:');
            $this->addValue($directives, 'frame-src', 'https:');
        }

        return $this->formatDirectives($directives);
    }

    /**
     * Retrieve and cache setting values.
     */
    protected function getSettingValue(string $id): array
    {
        try {
            $row = Setting::find($id);
            if ($row && is_array($row->value)) {
                return $row->value;
            }
        } catch (\Throwable $e) {
            // Fallback gracefully during tests or early migrations
        }
        return [];
    }

    /**
     * Add values uniquely to a directive.
     */
    protected function addValue(array &$directives, string $directive, string ...$values): void
    {
        if (!isset($directives[$directive])) {
            $directives[$directive] = ["'self'"];
        }

        foreach ($values as $val) {
            if (!in_array($val, $directives[$directive], true)) {
                $directives[$directive][] = $val;
            }
        }
    }

    /**
     * Format directive map into standard CSP header string.
     */
    protected function formatDirectives(array $directives): string
    {
        $parts = [];
        foreach ($directives as $directive => $values) {
            $parts[] = $directive . ' ' . implode(' ', $values);
        }
        return implode('; ', $parts);
    }
}

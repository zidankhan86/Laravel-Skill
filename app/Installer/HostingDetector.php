<?php

namespace App\Installer;

class HostingDetector
{
    /**
     * Attempt to detect the current hosting environment.
     * Always treats detection as a hint/recommendation, allowing user override.
     *
     * @return array{
     *     provider: 'hostinger'|'cpanel'|'generic',
     *     name: string,
     *     confidence: 'high'|'medium'|'low',
     *     details: string
     * }
     */
    public function detect(): array
    {
        $serverDocRoot = $_SERVER['DOCUMENT_ROOT'] ?? '';
        $basePath = base_path();
        $serverAdmin = $_SERVER['SERVER_ADMIN'] ?? '';
        $serverSoftware = $_SERVER['SERVER_SOFTWARE'] ?? '';

        // 1. Check for Hostinger indicators
        // Hostinger shared hosting typically assigns paths like /home/u[0-9]+/domains/.../public_html
        if (
            preg_match('#/home/u\d+/#i', $basePath) ||
            preg_match('#/home/u\d+/#i', $serverDocRoot) ||
            str_contains(strtolower($serverAdmin), 'hostinger') ||
            str_contains(strtolower($serverSoftware), 'litespeed') && preg_match('#/domains/#i', $basePath)
        ) {
            return [
                'provider' => 'hostinger',
                'name' => 'Hostinger hPanel',
                'confidence' => 'high',
                'details' => 'Detected Hostinger directory hierarchy (/home/u.../domains).',
            ];
        }

        // 2. Check for cPanel indicators
        // Standard cPanel shared paths: /home/[a-z0-9]+/public_html
        if (
            file_exists('/usr/local/cpanel') ||
            isset($_SERVER['CPANEL']) ||
            (preg_match('#/home/[a-zA-Z0-9_-]+/public_html#i', $basePath) && !preg_match('#/home/u\d+/#i', $basePath)) ||
            str_contains(strtolower($_SERVER['HTTP_HOST'] ?? ''), 'cpanel.')
        ) {
            return [
                'provider' => 'cpanel',
                'name' => 'cPanel',
                'confidence' => 'medium',
                'details' => 'Detected standard cPanel account directory structure.',
            ];
        }

        // 3. Fallback to Generic
        return [
            'provider' => 'generic',
            'name' => 'Generic Shared Hosting',
            'confidence' => 'low',
            'details' => 'Standard PHP shared hosting environment.',
        ];
    }
}

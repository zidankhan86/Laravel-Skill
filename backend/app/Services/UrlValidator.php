<?php

namespace App\Services;

class UrlValidator
{
    /**
     * Replicates the exact behavior of safeUrl from server/validation.mjs.
     */
    public static function isSafe(mixed $value, bool $contact = false): bool
    {
        if ($value === '' || $value === null) {
            return true;
        }

        if (!is_string($value) || preg_match('/[\x00-\x20\\\\]/', $value)) {
            return false;
        }

        // Relative path starting with / but not //
        if (preg_match('/^\/(?!\/)/', $value)) {
            return true;
        }

        // Anchor like #booking or #testimonials
        if (preg_match('/^#[\w-]+$/', $value)) {
            return true;
        }

        $parts = parse_url($value);
        if ($parts === false || !isset($parts['scheme'])) {
            return false;
        }

        $allowedSchemes = ['https', 'http'];
        if ($contact) {
            $allowedSchemes[] = 'mailto';
            $allowedSchemes[] = 'tel';
        }

        $scheme = strtolower($parts['scheme']);
        if (!in_array($scheme, $allowedSchemes, true)) {
            return false;
        }

        // Disallow embedded user:pass in URLs
        if (isset($parts['user']) || isset($parts['pass'])) {
            return false;
        }

        return true;
    }
}

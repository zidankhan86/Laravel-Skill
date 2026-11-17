<?php

namespace App\Services;

use DOMDocument;
use DOMElement;

class ContentSanitizer
{
    protected static array $allowedTags = [
        'p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h2', 'h3', 'blockquote', 'a',
    ];

    /**
     * Sanitizes rich text HTML, preserving safe tags and attributes while stripping scripts and event handlers.
     */
    public static function clean(?string $html): string
    {
        if (empty($html)) {
            return '';
        }

        // Quick strip of dangerous script/style tags and on* attributes
        $html = preg_replace('/<(script|style|iframe|object|embed|applet)\b[^>]*>(.*?)<\/\1>/is', '', $html);
        $html = preg_replace('/<(script|style|iframe|object|embed|applet)\b[^>]*>/is', '', $html);
        $html = preg_replace('/\s+on[a-z]+="[^"]*"/i', '', $html);
        $html = preg_replace('/\s+on[a-z]+=\'[^\']*\'/i', '', $html);
        $html = preg_replace('/\s+on[a-z]+=[^\s>]+/i', '', $html);

        $dom = new DOMDocument();
        libxml_use_internal_errors(true);
        // UTF-8 wrapper for DOMDocument
        $dom->loadHTML('<?xml encoding="utf-8"?><div>' . $html . '</div>', LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();

        $container = $dom->getElementsByTagName('div')->item(0);
        if (!$container) {
            return '';
        }

        self::sanitizeNode($container);

        $result = '';
        foreach ($container->childNodes as $child) {
            $result .= $dom->saveHTML($child);
        }

        return $result;
    }

    protected static function sanitizeNode(\DOMNode $node): void
    {
        for ($i = $node->childNodes->length - 1; $i >= 0; $i--) {
            $child = $node->childNodes->item($i);
            if ($child instanceof DOMElement) {
                $tagName = strtolower($child->tagName);
                if (!in_array($tagName, self::$allowedTags, true)) {
                    // Replace element with its text content
                    $text = $child->ownerDocument->createTextNode($child->textContent);
                    $node->replaceChild($text, $child);
                    continue;
                }

                // Clean attributes
                $attrsToRemove = [];
                foreach ($child->attributes as $attr) {
                    $attrName = strtolower($attr->name);
                    if ($tagName === 'a' && in_array($attrName, ['href', 'title'], true)) {
                        if ($attrName === 'href' && !UrlValidator::isSafe($attr->value, true)) {
                            $attrsToRemove[] = $attr->name;
                        }
                    } else {
                        $attrsToRemove[] = $attr->name;
                    }
                }

                foreach ($attrsToRemove as $remove) {
                    $child->removeAttribute($remove);
                }

                if ($tagName === 'a') {
                    $child->setAttribute('rel', 'noopener noreferrer');
                }

                // Recursively clean children
                self::sanitizeNode($child);
            }
        }
    }
}

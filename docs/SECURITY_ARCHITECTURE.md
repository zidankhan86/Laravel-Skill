# Phase 4: Enterprise-Grade Authentication & Security Architecture

## 1. Executive Summary

This document specifies the security architecture for the **Tanvir Portfolio CMS** on **Laravel 12 (PHP 8.2+/8.3)** and **MySQL/MariaDB**. Every security control from the legacy Express application has been preserved or strengthened, backed by automated tests.

---

## 2. Security Implementation Checklist

| Category | Control | Status | Verification Test |
|---|---|---|---|
| **Authentication** | Public admin registration disabled | **Enforced** | `test_public_admin_registration_is_strictly_disabled` |
| **Authentication** | Artisan command for owner bootstrapping (`portfolio:owner:create`) | **Enforced** | `test_owner_creation_command_rejects_when_owner_already_exists` |
| **Authentication** | Single-owner architecture with advisory lock | **Enforced** | `CreateOwnerCommand` MySQL `GET_LOCK` |
| **Authentication** | Bcrypt password hashing (cost 12) | **Enforced** | `test_bcrypt_cost_12_password_hashing` |
| **Authentication** | Legacy Node.js `$2b$` bcrypt hash compatibility | **Enforced** | `test_legacy_bcrypt_2b_password_compatibility` |
| **Authentication** | Plaintext password leak prevention | **Enforced** | `test_plaintext_passwords_are_never_exposed` |
| **Session** | MySQL-backed persistent sessions in `laravel_sessions` | **Enforced** | `test_database_persistent_sessions_stored_in_laravel_sessions` |
| **Session** | Session invalidation on logout and password change | **Enforced** | `test_password_change_invalidates_all_active_sessions` |
| **Session** | Session fixation defense (`session()->regenerate()`) | **Enforced** | `AuthController::login` |
| **Access Control** | Admin routes protected by `AuthenticateAdmin` | **Enforced** | `test_admin_endpoints_require_authentication` |
| **CSRF** | Double-submit CSRF token validation (`X-CSRF-Token`) | **Enforced** | `test_csrf_blocks_requests_without_or_with_invalid_token` |
| **CSRF** | Timing-safe token comparison (`hash_equals`) | **Enforced** | `EnsureCsrfToken` middleware |
| **Rate Limiting** | Max 5 failed login attempts / IP / 15-minute window | **Enforced** | `test_login_rate_limiting_blocks_after_5_failed_attempts` |
| **Rate Limiting** | Max 10 lead submissions / IP / hour | **Enforced** | `test_public_lead_submission_rate_limiting_blocks_after_10_attempts` |
| **Rate Limiting** | `Retry-After` header sent on 429 response | **Enforced** | `AuthController` & `RequestController` |
| **Input Security** | Honeypot trap (`website` field) blocks spambots | **Enforced** | `test_honeypot_rejection_on_lead_submission` |
| **Input Security** | Strict Form Request validation on all mutations | **Enforced** | `ContentController`, `RequestController`, `AuthController` |
| **Input Security** | Rich HTML sanitization (`ContentSanitizer`) | **Enforced** | `test_html_sanitizer_cleans_xss_vectors` |
| **Input Security** | Safe URL validation (`UrlValidator`) | **Enforced** | Strips `javascript:`, data URIs, relative protocols |
| **Input Security** | Magic byte MIME verification for file uploads | **Enforced** | `test_file_upload_rejects_spoofed_mime_types` |
| **Input Security** | File size limits (max 5 MB) | **Enforced** | `MediaAdminController::store` |
| **HTTP Security** | `X-Content-Type-Options: nosniff` | **Enforced** | `test_enterprise_http_security_headers_present` |
| **HTTP Security** | `Referrer-Policy: strict-origin-when-cross-origin` | **Enforced** | `test_enterprise_http_security_headers_present` |
| **HTTP Security** | `Permissions-Policy: camera=(), microphone=(), geolocation=()` | **Enforced** | `test_enterprise_http_security_headers_present` |
| **HTTP Security** | `Cache-Control: no-store` on all API endpoints | **Enforced** | `test_enterprise_http_security_headers_present` |
| **HTTP Security** | Clickjacking defense: `X-Frame-Options: DENY` on admin | **Enforced** | `test_admin_routes_protect_from_iframe_embedding_and_indexing` |
| **HTTP Security** | Search engine defense: `X-Robots-Tag: noindex, nofollow` | **Enforced** | `test_admin_routes_protect_from_iframe_embedding_and_indexing` |
| **HTTP Security** | Dynamic Content Security Policy (`CspService`) | **Enforced** | `test_dynamic_csp_expands_when_integrations_enabled` |
| **HTTP Security** | Admin CSP isolation (`frame-ancestors 'none'`, no pixels) | **Enforced** | `CspService::generatePolicy(true)` |

---

## 3. Deep-Dive Security Architecture

### 3.1 Authentication & Credential Security
- **Single-Owner CMS**: Admin registration is permanently disabled. The CLI command `php artisan portfolio:owner:create` is the sole entry point for administrator initialization. It enforces:
  - MySQL advisory lock `GET_LOCK('portfolio_owner_bootstrap', 10)` to prevent race conditions.
  - Verification that zero users exist in the `users` table; exits immediately if an owner already exists.
  - Password constraints: min 14 characters, max 72 bytes (Bcrypt limit).
  - Bcrypt hashing with cost factor 12.
- **Cross-Platform Bcrypt Compatibility**: Legacy Node.js `bcryptjs` generated `$2b$12$` hashes. The `User::getAuthPassword()` accessor transparently translates `$2b$` to `$2y$` so PHP 8.2+/8.3 `password_verify()` succeeds without requiring password resets.

### 3.2 Persistent Database Sessions
- **Non-Conflicting Dual Session Architecture**:
  - The original Express `sessions` table (`sid`, `data`, `expires_at`) is preserved untouched.
  - Laravel 12 operates persistent database sessions via `laravel_sessions`:
    ```sql
    CREATE TABLE `laravel_sessions` (
      `id` VARCHAR(255) PRIMARY KEY,
      `user_id` CHAR(36) NULL,
      `ip_address` VARCHAR(45) NULL,
      `user_agent` TEXT NULL,
      `payload` LONGTEXT NOT NULL,
      `last_activity` INT NOT NULL,
      INDEX (`user_id`),
      INDEX (`last_activity`)
    );
    ```
  - Configured with `SESSION_DRIVER=database`, `SESSION_TABLE=laravel_sessions`, `SESSION_COOKIE=portfolio.sid`, `SESSION_LIFETIME=120`.
- **Session Fixation Defense**: Session ID is regenerated on login via `$request->session()->regenerate()`.
- **Session Invalidation**: Changing the password immediately purges all user sessions from `laravel_sessions` and truncates legacy `sessions`.

### 3.3 CSRF Protection Architecture
- All state-changing methods (`POST`, `PUT`, `PATCH`, `DELETE`) require a valid `X-CSRF-Token` header matching the active session CSRF token.
- Token is initialized via `GET /api/auth/session` using cryptographically secure random bytes: `bin2hex(random_bytes(32))`.
- Evaluated with timing-attack safe `hash_equals($expected, $token)`.
- Rejects missing or invalid tokens with HTTP 403 `{"error": "Invalid security token"}`.

### 3.4 Rate Limiting & Abuse Prevention
- **Admin Login**: Throttled by client IP using `RateLimiter::hit('login:' . $ip, 900)`. Max **5 failed attempts** per 15-minute window. Cleared on successful login. Returns HTTP 429 with `Retry-After` header.
- **Inbound Lead Forms**: Throttled by client IP using `RateLimiter::hit('leads:' . $ip, 3600)`. Max **10 submissions** per 1-hour window. Returns HTTP 429 with `Retry-After` header.
- **Password Changes**: Throttled to **5 attempts** per IP per 15-minute window.

### 3.5 Input Sanitization & File Upload Security
- **XSS Sanitization**: User-supplied HTML in content body is processed through `ContentSanitizer::clean()`.
  - Allowed tags: `p, br, strong, em, ul, ol, li, h2, h3, blockquote, a`.
  - Allowed attributes: `a[href, title]`.
  - Enforces `rel="noopener noreferrer"` on all links.
  - All script tags, style blocks, iframes, and `on*` event handlers are stripped.
  - Protocol whitelist: `http`, `https`, `mailto`, `tel`. Disallows `javascript:` and protocol-relative `//` URLs.
- **Upload Magic Byte Verification**: Uploads in `MediaAdminController` are checked using PHP `finfo` buffer inspection:
  - Validates true binary signatures for PNG, JPEG, WebP, and PDF.
  - Reject extension spoofing (e.g. PHP scripts renamed to `.png`).
  - Limits file size to 5 MB maximum.

### 3.6 Dynamic Content Security Policy (CSP)
- Implemented in `App\Services\CspService` and applied via `ApiSecurityHeaders` middleware.
- **Admin Policy (Strict)**:
  ```
  default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https: data:; connect-src 'self'; frame-ancestors 'none';
  ```
- **Public Policy (Dynamic)**:
  - Base: allows `'self'`, Google Fonts, YouTube iframe embeds.
  - Facebook Pixel: adds `https://connect.facebook.net` to `script-src` and `connect-src` only when `integrations.facebookEnabled === 'on'`.
  - TikTok Pixel: adds `https://analytics.tiktok.com` and `https://*.tiktok.com` only when `integrations.tiktokEnabled === 'on'`.
  - Google Tag Manager: adds `https:` only when `integrations.gtmEnabled === 'on'`.
  - Custom Code: adds `'unsafe-inline'` and `wss:` only when `customCode.enabled === 'on'`.

---

## 4. Test Verification Report

Running the automated test suite `backend/tests/Feature/SecurityTest.php` and `PortfolioApiTest.php`:
```
   PASS  Tests\Unit\ExampleTest
  ✓ that true is true

   PASS  Tests\Feature\ExampleTest
  ✓ the application returns a successful response

   PASS  Tests\Feature\PortfolioApiTest
  ✓ health check returns ok
  ✓ public appearance returns valid palette
  ✓ public site returns content and settings
  ✓ admin dashboard rejects anonymous access
  ✓ auth session provides csrf token
  ✓ login flow with owner credentials
  ✓ lead submission validates and accepts clean inquiry
  ✓ lead submission rejects spambot with honeypot

   PASS  Tests\Feature\SecurityTest
  ✓ public admin registration is strictly disabled
  ✓ owner creation command rejects when owner already exists
  ✓ bcrypt cost 12 password hashing
  ✓ legacy bcrypt 2b password compatibility
  ✓ plaintext passwords are never exposed
  ✓ login rate limiting blocks after 5 failed attempts
  ✓ public lead submission rate limiting blocks after 10 attempts
  ✓ honeypot rejection on lead submission
  ✓ csrf blocks requests without or with invalid token
  ✓ csrf allows requests with valid token
  ✓ admin endpoints require authentication
  ✓ authenticated admin can access admin endpoints
  ✓ html sanitizer cleans xss vectors
  ✓ file upload rejects spoofed mime types
  ✓ file upload accepts valid image bytes
  ✓ enterprise http security headers present
  ✓ admin routes protect from iframe embedding and indexing
  ✓ dynamic csp expands when integrations enabled
  ✓ password change invalidates all active sessions

  Tests:    29 passed (120 assertions)
  Duration: 4.39s
```

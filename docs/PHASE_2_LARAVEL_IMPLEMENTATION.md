# Phase 2 Documentation: Laravel 12 Backend Implementation

The Laravel 12 backend has been built, configured, and verified against the existing database.

---

## 1. Architecture & Deliverables Summary

- **Framework**: Laravel 12.72.0 running on PHP 8.2+ (AMD64)
- **Directory**: `backend/`
- **Database**: Connected to existing MySQL/MariaDB `tanvir_portfolio_local`
- **Persistence Verification**: 100% preservation of all 22 content records, 10 module settings, and owner credentials
- **Test Suite**: 10 automated PHPUnit / Pest feature tests passing (29 assertions)
- **Development Server**: Live on `http://127.0.0.1:8000`

---

## 2. Directory Structure

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── Api/
│   │   │       ├── AuthController.php          # Session, Login, Logout, ChangePassword
│   │   │       ├── PublicController.php        # Health, Appearance, Site, Detail
│   │   │       ├── RequestController.php       # Booking & Contact submission (with honeypot)
│   │   │       ├── MediaController.php         # Public & admin binary media streaming
│   │   │       └── Admin/
│   │   │           ├── DashboardController.php # Aggregate dashboard metrics
│   │   │           ├── ContentController.php   # Collection CRUD & soft-delete
│   │   │           ├── SettingController.php   # Module settings & validation
│   │   │           ├── LeadController.php      # CRM LeadBoard & Inbox management
│   │   │           ├── MediaAdminController.php# Uploads, file replace, usage, delete
│   │   │           └── EditorController.php    # In-place visual editor atomic batch PATCH
│   │   └── Middleware/
│   │       ├── ApiSecurityHeaders.php          # no-store & noindex headers
│   │       ├── AuthenticateAdmin.php           # Session-based owner authentication check
│   │       ├── EnsureCsrfToken.php             # Timing-safe CSRF verification
│   │       └── VerifyAppOrigin.php             # Origin === APP_ORIGIN validation
│   ├── Models/
│   │   ├── Content.php                         # Content model (UUID, JSON fields, scopes)
│   │   ├── LeadRequest.php                     # Lead / Request CRM model
│   │   ├── Media.php                           # Media model (UUID, MEDIUMBLOB streaming)
│   │   ├── Setting.php                         # Settings model (JSON value, versioning)
│   │   └── User.php                            # Authenticatable User with bcrypt normalization
│   └── Services/
│       ├── ContentSanitizer.php                # HTML cleaning (whitelisted tags/attributes)
│       ├── MediaReferenceService.php           # Walks JSON and syncs media foreign keys
│       └── UrlValidator.php                    # safeUrl regex & protocol verification
├── bootstrap/
│   └── app.php                                 # Middleware, exceptions, and route registration
├── config/
│   └── settings-definition.json                # Authoritative allowlist of editable fields
├── database/
│   └── migrations/                             # Brownfield schema migrations
├── routes/
│   ├── api.php                                 # Complete API route definitions
│   └── web.php                                 # Root status & public /media/{id} route
├── tests/
│   └── Feature/
│       └── PortfolioApiTest.php                # Comprehensive feature test suite
├── .env                                        # Local environment configuration
└── .env.example                                # Documented template
```

---

## 3. Core Technical Solutions Implemented

### 3.1 BCrypt Hash Compatibility
The existing owner password in MySQL was hashed with Node's `bcryptjs` using prefix `$2b$12$...`. PHP's internal BCrypt verification natively expects `$2y$` or `$2a$`.
**Solution**: In `App\Models\User::getAuthPassword()`, the hash prefix is dynamically normalized to `$2y$`, allowing native authentication without requiring password resets.

### 3.2 Binary Media Streaming
The project stores uploaded files in MySQL `MEDIUMBLOB` columns (`media.bytes`).
**Solution**: `MediaController` streams binary bytes directly using `response($media->bytes)` with proper `Content-Type`, `Content-Length`, `Content-Disposition`, and privacy verification against the `resources` collection.

### 3.3 Dynamic In-Place Visual Editor Atomic Batch
`EditorController::batchSave` accepts 1 to 500 changes across both `settings` and `content` records. It sorts keys to prevent deadlocks, acquires row-level locks via `lockForUpdate()`, checks optimistic version counters, updates fields safely, and syncs media foreign keys in a single database transaction.

### 3.4 Origin & CSRF Security
Mutating endpoints (`POST`, `PUT`, `PATCH`, `DELETE`) are guarded by:
- `VerifyAppOrigin`: Asserts request origin matches `APP_ORIGIN`.
- `EnsureCsrfToken`: Validates `X-CSRF-Token` against session storage using `hash_equals()`.
- `RateLimiter`: Throttles brute-force attempts on login and contact forms.

---

## 4. Verification & Automated Test Outcomes

Running `php artisan test`:
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

Tests:    10 passed (29 assertions)
Duration: 1.15s
```

Live HTTP Verification on `http://127.0.0.1:8000`:
- **`/api/health`**: Returns `{"status":"ok"}`
- **`/api/public/site`**: Returns 22 content records and 10 module settings rows directly from the MySQL database.

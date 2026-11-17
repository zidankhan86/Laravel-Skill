# Tanvir Portfolio CMS: Automated Web Installer Security Architecture

## 1. Security Overview

Because a web-based installer has write access to server configuration and the database, it represents a high-priority attack surface. The Tanvir Portfolio CMS web installer enforces defense-in-depth security principles across all layers.

---

## 2. Key Security Mechanisms

### A. Permanent Immutable Lockout
- **Lockfile:** Located at `storage/installed.lock`.
- **HMAC Cryptographic Signature:** Generated using the application's unique `APP_KEY` combined with timestamp and installation metadata.
- **Enforcement:**
  - `RedirectIfInstalled` middleware intercepts all web traffic to `/install` and redirects to `/`.
  - API endpoints under `/api/installer/*` immediately return `HTTP 403 Forbidden`.
  - The lockfile is marked read-only (`chmod 0444`) on the server.
- **Recovery Policy:** The installer cannot be re-run unless server-level access is used to remove or rename `storage/installed.lock`.

### B. Single-Owner Protection & Advisory Locking
- The administrator creation pipeline enforces a strict **single-owner invariant**.
- Bootstrap operations utilize a MySQL advisory lock: `GET_LOCK('portfolio_owner_bootstrap', 10)`.
- If a user already exists in the `users` table, subsequent admin creation requests are blocked.
- Passwords must be between 14 characters and 72 bytes, hashed with bcrypt (cost 12 salt rounds).

### C. Rate Limiting & Denial-of-Service Defense
- Installer API endpoints are throttled via Laravel's rate limiter (`throttle:60,1`).
- Repeated failed attempts to guess database credentials or brute-force step endpoints are blocked with `HTTP 429 Too Many Requests`.

### D. Zero-Leakage Credential Policy
- Database passwords and hosting API tokens are used only in transient server-side memory to establish the connection or call provider APIs.
- API tokens and database passwords are **never** returned in API JSON responses, never stored in browser `localStorage`, and never written to debug logs.
- PDO connection errors are sanitized using regular expressions to strip out passwords before returning error messages to the client.

### E. Atomic File Operations & Path Traversal Prevention
- `.env` generation uses atomic write semantics: configuration is written to a temporary file (`.env.tmp.XXXXX`), permissions are set to `0640`, and the file is atomically renamed to `.env`.
- User input never dictates file system paths. Path generation is strictly constrained to `storage_path()` and `base_path()`.

### F. Shared Hosting Directory Traversal Protection
- On standard shared hosts where the web root cannot be pointed to `public/`, sensitive files are protected by `.htaccess` directives:
  - All direct requests to `.env`, `vendor/`, `storage/`, `database/`, and `bootstrap/` return `403 Forbidden`.
  - Only `public/` assets (compiled JS/CSS, images, icons) are web-accessible.

---

## 3. Threat Model & Mitigation Matrix

| Threat | Impact | Mitigation |
| :--- | :--- | :--- |
| **Reinstallation Attack** | Attacker tries to re-run `/install` to overwrite admin or `.env` | Blocked by `RedirectIfInstalled` and immutable `storage/installed.lock`. Returns 403. |
| **Database Overwrite** | User selects DB with existing data | `DatabaseManager` detects existing domain tables and preserves them without dropping. |
| **Brute-Force Installer** | Attacker spams database test endpoint | Blocked by `throttle:60,1` rate limiter. |
| **Token Theft / Snooping** | Third-party script steals Hostinger/cPanel token | Tokens are processed transiently via POST and never serialized to HTML/storage. |
| **Weak Admin Passwords** | Dictionary or default admin credentials | Minimum 14 characters enforced; bcrypt cost 12 hashing applied; no default public admin. |
| **PHP Timeout Interruption** | Shared host kills long install script | Chunked into short sub-steps with persistent progress state. |

# Tanvir Portfolio CMS: Automated Web Installer Documentation

## 1. Overview & Vision

The **Automated Web Installer** is an enterprise-grade, zero-knowledge installation system built inside Laravel 12. It enables non-technical end customers to deploy the Tanvir Portfolio CMS on standard shared hosting environments (such as **Hostinger hPanel**, **cPanel**, or any standard Linux/PHP shared host) with an experience as effortless as installing WordPress.

### Zero-Knowledge Guarantee:
The customer never needs:
- SSH or terminal access
- Composer commands (`composer install`)
- Node.js or npm builds (`npm run build`)
- Manual SQL database imports via phpMyAdmin
- Manual editing of `.env` files or application keys

---

## 2. Supported Hosting Environments & Integration Details

### A. Hostinger hPanel Integration
- **Detection:** Automatically identifies Hostinger filesystem hierarchies (`/home/u.../domains/.../public_html`) and LiteSpeed server environment variables.
- **Official API Support:**
  - Base URL: `https://api.hostinger.com/v1`
  - Authorization: `Bearer <token>`
  - Auto-provisions MySQL database and dedicated database user using official Hostinger API endpoints.
  - Returns actual database host, prefixed name, and user.
- **Fallback:** Seamless switch to manual database credentials if the customer does not have an API token.

### B. cPanel UAPI Integration
- **Detection:** Automatically identifies cPanel account directory conventions (`/home/<user>/public_html`) and server markers.
- **UAPI Modules:**
  - `Mysql::create_database`: Creates MySQL database with cPanel account prefix (`{cpanel_user}_{name}`).
  - `Mysql::create_user`: Creates database user with cPanel account prefix (`{cpanel_user}_{user}`).
  - `Mysql::set_privileges_on_database`: Automatically assigns `ALL PRIVILEGES` to the database user.
- **Security:** Never requests or logs cPanel account passwords. Uses secure cPanel API tokens.

### C. Generic Shared Hosting (Universal Manual Fallback)
- Step-by-step beginner guidance with built-in connection tester.
- Supports `localhost`, `127.0.0.1`, remote database hosts, and custom ports.
- Verifies connection, user privileges, and detects existing database tables before proceeding.

---

## 3. The 7-Step Installation Wizard

1. **Step 1: Welcome**
   - Brand introduction, overview of steps, and reassurance that no technical skills are needed.
2. **Step 2: Server Requirements**
   - Live audit of PHP version ($\ge$ 8.2), 14 essential PHP extensions, directory write permissions (`storage/`, `bootstrap/cache/`, `.env`), and PHP limits.
   - Clear Pass / Warning / Fail indicators with troubleshooting advice.
3. **Step 3: Hosting Selection**
   - Visual cards for Hostinger hPanel, cPanel, and Generic Shared Hosting, highlighting the auto-detected provider.
4. **Step 4: Database Configuration**
   - Automated API provisioning for Hostinger/cPanel or manual credential input with live **Test Connection** button.
5. **Step 5: Website & Administrator Setup**
   - Website name, public URL, administrator full name, email, strong password (minimum 14 characters with live strength meter), and timezone.
6. **Step 6: Real-Time Automatic Installation**
   - Real-time progress bar (0%–100%) executing granular AJAX steps to prevent shared hosting PHP timeouts:
     1. Server requirements verification
     2. Environment configuration (`.env` generation & 32-byte cryptographic `APP_KEY`)
     3. Database migrations execution (idempotent, no `migrate:fresh`)
     4. Default portfolio content & system settings seeding
     5. Administrator account creation (bcrypt cost 12, UUID, advisory lock)
     6. Storage directory optimization & storage symlinking (with graceful fallback)
     7. Post-install database and routing health verification
     8. Permanent installer locking
7. **Step 7: Installation Complete**
   - Summary card with live links to public site (`/`) and administrative CRM dashboard (`/admin`).
   - Security confirmation that the installer is permanently locked.

---

## 4. Architecture & Service Components

```
app/
  Installer/
    RequirementsChecker.php        # PHP version, extensions, write permissions, limits
    HostingDetector.php            # Environment detection (Hostinger, cPanel, Generic)
    DatabaseManager.php             # Connection testing, privilege checks, table audits
    EnvironmentManager.php          # Atomic .env generation and APP_KEY creation
    InstallationManager.php         # Step-by-step orchestrator with state persistence
    InstallationLock.php            # storage/installed.lock management and HMAC signing
    Hosting/
      HostingProviderInterface.php  # Provider contract
      HostingerAdapter.php          # Hostinger official API adapter
      CpanelAdapter.php             # cPanel UAPI database adapter
      GenericHostingAdapter.php     # Manual credentials adapter
  Http/
    Controllers/
      Installer/
        InstallerController.php     # Wizard Inertia page & AJAX endpoints
    Middleware/
      EnsureInstalled.php           # Redirects uninstalled requests to /install
      RedirectIfInstalled.php       # Blocks /install once permanently locked
```

---

## 5. Verification & Testing Runbook

To run the full suite of automated installer tests:
```bash
# Run unit and feature installer tests
php artisan test --filter=Installer

# Run real Chrome headless browser verification
node scripts/verify-installer-chrome.mjs

# Run full application test suite (64 tests, 311 assertions)
php artisan test
```

# Tanvir Portfolio CMS: Production Deployment Package Guide

## 1. Overview

This guide explains how to generate, distribute, and install the prebuilt zero-knowledge deployment ZIP package for end customers on shared hosting platforms.

---

## 2. Generating the Prebuilt Release Package

Before distributing to customers, the application must be bundled into a production-ready package.

### Build and Package Command:
```bash
# 1. Compile production frontend assets
npm run build

# 2. Package the release ZIP
php scripts/package-release.php
# OR: npm run package
```

### Output Location:
```
.dist/tanvir-portfolio-release.zip  (~41 MB)
```

---

## 3. Package Inclusions & Exclusions

### Included in the Customer ZIP:
- **Full Laravel 12 Application Source:** `app/`, `bootstrap/`, `config/`, `database/`, `public/`, `resources/`, `routes/`, `server/`.
- **Precompiled Composer Dependencies:** Full `vendor/` directory with all production PHP packages. Customers do **not** need Composer.
- **Precompiled Frontend Assets:** `public/build/` with compiled React 19 chunks, CSS stylesheets, and asset manifest. Customers do **not** need Node.js or npm.
- **Automated Web Installer:** Complete 7-step wizard and backend engine (`app/Installer/`).
- **Clean Configuration Baseline:** Default `.env.example` without local developer secrets or passwords.
- **Empty Storage Hierarchy:** Prepared directory structure for `storage/` and `bootstrap/cache/` with `.gitignore` markers.

### Excluded from the Customer ZIP:
- `.git/` & `.github/` (Git version control history)
- `node_modules/` (Development Node packages)
- `.env` & `.env.local` (Local developer secrets and database credentials)
- `storage/installed.lock` (Installer lock is omitted so customer sees the setup wizard)
- `storage/logs/*.log` (Local debug and error logs)
- `tests/` & `.phpunit.result.cache` (Test suites and cache files)
- `.local/` (Local test screenshots and temporary validation artifacts)

---

## 4. End-Customer Installation Guide (Beginner Friendly)

### Scenario A: Deploying on Hostinger hPanel

1. **Log in to Hostinger hPanel:**
   - Go to **Websites** &rarr; Select your domain &rarr; Click **File Manager**.
2. **Upload the ZIP:**
   - Navigate to `public_html` (or your domain's root folder).
   - Click **Upload** and select `tanvir-portfolio-release.zip`.
3. **Extract:**
   - Right-click the uploaded ZIP and click **Extract**.
   - Ensure the files are placed inside your website directory.
4. **Configure Document Root (Recommended):**
   - In Hostinger hPanel, set the website document root to `public_html/public` (or create a standard `.htaccess` redirect).
5. **Open Your Domain in Browser:**
   - Visit `https://yourdomain.com`.
   - The installer wizard will automatically appear!
6. **Complete the Wizard:**
   - Follow the 7 simple steps on screen.
   - Enter your Hostinger API token to auto-create the database, or enter manual credentials.
   - Set your administrator password.
   - Click **Install Application Now**.
7. **Done!**
   - Click **Open Admin Workspace** to log in to your CMS.

---

### Scenario B: Deploying on cPanel Shared Hosting

1. **Log in to cPanel:**
   - Open **File Manager** &rarr; Open `public_html`.
2. **Upload & Extract:**
   - Upload `tanvir-portfolio-release.zip` into `public_html` (or a dedicated folder outside `public_html` if custom document roots are supported).
   - Extract the ZIP archive.
3. **Open Domain:**
   - Visit your website in any browser.
   - The setup wizard will greet you automatically.
4. **Database Step:**
   - Choose **cPanel** and provide your cPanel username & API token to auto-provision the database, OR choose **Generic Shared Hosting** and enter credentials created under **cPanel &rarr; MySQL Databases**.
5. **Install & Launch:**
   - Click **Install** and watch the real-time setup progress bar complete in seconds!

---

## 5. Security & Recovery Procedures

- Once installation completes, the installer is permanently locked by `storage/installed.lock`.
- If an administrator ever needs to reset the installation on a fresh server, simply remove `storage/installed.lock` via hosting File Manager and re-open the domain.

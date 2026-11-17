import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const OUTPUT_DIR = path.resolve(process.cwd(), ".local/installer-validation");

async function runInstallerChromeVerification() {
  console.log("===================================================================");
  console.log("AUTOMATED WEB INSTALLER: REAL CHROME E2E VERIFICATION");
  console.log("===================================================================");

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 1. Temporarily unlock installer
  console.log("\n[SETUP] Unlocking installer for browser verification...");
  execSync("php -r \"require 'vendor/autoload.php'; (new App\\Installer\\InstallationLock())->removeLock();\"");

  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

    page.on("console", (msg) => {
      if (msg.type() === "error") console.log("   [BROWSER ERROR]", msg.text());
    });

    console.log("\n[1/3] Navigating to http://127.0.0.1:8000/install...");
    const res = await page.goto("http://127.0.0.1:8000/install", {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    assert.equal(res.status(), 200, "Installer page must return HTTP 200 OK");

    await page.waitForTimeout(500);

    const step1Title = await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      return h1 ? h1.textContent.trim() : null;
    });

    console.log("   ✓ Step 1 Title:", step1Title);
    assert(step1Title.includes("Welcome to Tanvir Portfolio CMS"));

    const s1Path = path.join(OUTPUT_DIR, "step1-welcome.png");
    await page.screenshot({ path: s1Path });
    console.log(`   ✓ Step 1 Screenshot saved: ${s1Path}`);

    // Click "Start Installation" to move to Step 2
    console.log("\n[2/3] Advancing to Step 2: Server Requirements...");
    await page.click("button:has-text('Start Installation')");
    await page.waitForTimeout(600);

    const step2Title = await page.evaluate(() => {
      const h2 = document.querySelector("h2");
      return h2 ? h2.textContent.trim() : null;
    });
    console.log("   ✓ Step 2 Title:", step2Title);
    assert(step2Title.includes("Server Requirements"));

    const s2Path = path.join(OUTPUT_DIR, "step2-requirements.png");
    await page.screenshot({ path: s2Path });
    console.log(`   ✓ Step 2 Screenshot saved: ${s2Path}`);

    // Click "Continue to Hosting Selection" to move to Step 3
    console.log("\n[3/3] Advancing to Step 3: Hosting Selection...");
    await page.click("button:has-text('Continue to Hosting Selection')");
    await page.waitForTimeout(600);

    const step3Title = await page.evaluate(() => {
      const h2 = document.querySelector("h2");
      return h2 ? h2.textContent.trim() : null;
    });
    console.log("   ✓ Step 3 Title:", step3Title);
    assert(step3Title.includes("Select Hosting Provider"));

    const s3Path = path.join(OUTPUT_DIR, "step3-hosting.png");
    await page.screenshot({ path: s3Path });
    console.log(`   ✓ Step 3 Screenshot saved: ${s3Path}`);

    console.log("\n===================================================================");
    console.log("🎉 INSTALLER REAL CHROME BROWSER VERIFICATION PASSED 100%!");
    console.log("===================================================================");

  } finally {
    await browser.close();
    // Re-lock installer for local development
    console.log("\n[TEARDOWN] Re-locking installer...");
    execSync("php -r \"require 'vendor/autoload.php'; (new App\\Installer\\InstallationLock())->lock(['site_name' => 'Md Tanvir Hossain Portfolio CMS']);\"");
    console.log("   ✓ Installation lock restored cleanly.");
  }
}

runInstallerChromeVerification().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

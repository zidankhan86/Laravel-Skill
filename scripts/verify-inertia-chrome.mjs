import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), ".local/inertia-validation");

async function runInertiaChromeVerification() {
  console.log("===================================================================");
  console.log("INERTIA.JS + LARAVEL 12 REAL CHROME VERIFICATION");
  console.log("===================================================================");

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });

  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 800 },
    });

    page.on("console", (msg) => console.log("   [BROWSER LOG]", msg.type(), msg.text()));
    page.on("pageerror", (err) => console.error("   [BROWSER ERROR STACK]", err.stack || err.message));

    console.log("\n[1/4] Navigating to http://127.0.0.1:8000/...");
    const response = await page.goto("http://127.0.0.1:8000/", {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    assert.equal(response.status(), 200, "Homepage must return 200 OK");
    console.log("   ✓ HTTP 200 OK received");

    // Wait for Framer Motion entrance animation to settle
    await page.waitForTimeout(1000);

    console.log("\n[2/4] Inspecting DOM and Computed Styles...");
    const metrics = await page.evaluate(() => {
      const body = document.body;
      const bodyStyle = window.getComputedStyle(body);
      const h1 = document.querySelector("h1");
      const h1Style = h1 ? window.getComputedStyle(h1) : null;
      const navLinks = Array.from(document.querySelectorAll("nav a, header a")).map(
        (a) => a.textContent.trim()
      );
      const hasInertiaRoot = Boolean(document.getElementById("app"));

      return {
        hasInertiaRoot,
        bodyBg: bodyStyle.backgroundColor,
        bodyColor: bodyStyle.color,
        h1Text: h1 ? h1.textContent.trim() : null,
        h1FontSize: h1Style ? h1Style.fontSize : null,
        h1Color: h1Style ? h1Style.color : null,
        linksCount: navLinks.length,
      };
    });

    console.log("   ✓ Inertia Mount Root (#app):", metrics.hasInertiaRoot);
    console.log("   ✓ Body Background:", metrics.bodyBg);
    console.log("   ✓ H1 Text:", metrics.h1Text?.slice(0, 50) + "...");
    console.log("   ✓ H1 Font Size:", metrics.h1FontSize);
    console.log("   ✓ H1 Color:", metrics.h1Color);
    console.log(`   ✓ Navigation links rendered: ${metrics.linksCount} links`);

    assert.equal(metrics.hasInertiaRoot, true, "Inertia root (#app) must be mounted");
    assert.equal(metrics.bodyBg, "rgb(10, 10, 10)", "Body background must be #0a0a0a");
    assert(metrics.linksCount > 0, "Navbar must render links");

    const screenshotPath = path.join(OUTPUT_DIR, "inertia-home-desktop.png");
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`   ✓ Desktop screenshot saved: ${screenshotPath}`);

    console.log("\n[3/4] Testing Admin Page (/admin)...");
    await page.goto("http://127.0.0.1:8000/admin", { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(500);

    const adminMetrics = await page.evaluate(() => {
      const heading = document.querySelector("h1, h2");
      return {
        title: document.title,
        heading: heading ? heading.textContent.trim() : null,
        hasPasswordField: Boolean(document.querySelector('input[type="password"]')),
      };
    });

    console.log("   ✓ Admin Page Title:", adminMetrics.title);
    console.log("   ✓ Admin Sign-In Heading:", adminMetrics.heading);
    console.log("   ✓ Admin Password Field Present:", adminMetrics.hasPasswordField);

    assert(adminMetrics.hasPasswordField, "Admin page must show password login form for unauthenticated visitor");

    const adminScreenshot = path.join(OUTPUT_DIR, "inertia-admin-login.png");
    await page.screenshot({ path: adminScreenshot });
    console.log(`   ✓ Admin screenshot saved: ${adminScreenshot}`);

    console.log("\n[4/4] Testing Mobile Viewport (375x667)...");
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("http://127.0.0.1:8000/", { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(500);

    const mobileScreenshot = path.join(OUTPUT_DIR, "inertia-home-mobile.png");
    await page.screenshot({ path: mobileScreenshot });
    console.log(`   ✓ Mobile screenshot saved: ${mobileScreenshot}`);

    console.log("\n===================================================================");
    console.log("🎉 ALL INERTIA.JS + LARAVEL 12 VERIFICATIONS PASSED 100%!");
    console.log("===================================================================");
  } finally {
    await browser.close();
  }
}

runInertiaChromeVerification().catch((err) => {
  console.error("\n❌ Inertia verification failed:", err);
  process.exit(1);
});

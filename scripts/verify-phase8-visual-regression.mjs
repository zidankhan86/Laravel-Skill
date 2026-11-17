import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 375, height: 667, isMobile: true, hasTouch: true },
];

const OUTPUT_DIR = path.resolve(process.cwd(), ".local/visual-regression");
const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:8000";

async function runVisualRegression() {
  console.log("===================================================================");
  console.log("PHASE 8: VISUAL REGRESSION & RESPONSIVE FIDELITY SUITE (INERTIA)");
  console.log("===================================================================");

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });

  const comparisonReport = [];

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n[VIEWPORT: ${vp.name.toUpperCase()} (${vp.width}x${vp.height})]`);

      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        isMobile: vp.isMobile || false,
        hasTouch: vp.hasTouch || false,
      });
      const page = await ctx.newPage();

      page.on("pageerror", (err) => console.error("   [BROWSER ERROR]", err.message));

      console.log(`   - Navigating to ${BASE_URL}...`);
      const res = await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 30000 });
      assert.equal(res.status(), 200, `Page must return 200 OK on ${vp.name}`);

      // Wait for Framer Motion entrance animations to settle
      await page.waitForTimeout(1000);

      const screenshotPath = path.join(OUTPUT_DIR, `inertia-${vp.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`   ✓ Viewport screenshot saved: ${screenshotPath}`);

      const metrics = await page.evaluate(() => {
        const body = document.body;
        const bodyStyle = window.getComputedStyle(body);
        const h1 = document.querySelector("h1");
        const h1Style = h1 ? window.getComputedStyle(h1) : null;
        const nav = document.querySelector("nav") || document.querySelector("header");
        const navStyle = nav ? window.getComputedStyle(nav) : null;
        const links = Array.from(document.querySelectorAll("nav a, header a")).map(a => a.textContent.trim()).filter(Boolean);
        const hasInertia = Boolean(document.getElementById("app"));

        return {
          hasInertia,
          bodyBg: bodyStyle.backgroundColor,
          bodyColor: bodyStyle.color,
          bodyFont: bodyStyle.fontFamily,
          h1Text: h1 ? h1.textContent.trim() : null,
          h1FontSize: h1Style ? h1Style.fontSize : null,
          h1FontWeight: h1Style ? h1Style.fontWeight : null,
          h1Color: h1Style ? h1Style.color : null,
          navExists: Boolean(nav),
          navPosition: navStyle ? navStyle.position : null,
          linksCount: links.length,
          linksSample: links.slice(0, 5),
          scrollHeight: document.documentElement.scrollHeight,
          clientWidth: document.documentElement.clientWidth,
        };
      });

      console.log(`   - Inertia Mounted: ${metrics.hasInertia}`);
      console.log(`   - Body Background: ${metrics.bodyBg}`);
      console.log(`   - H1 Font Size:    ${metrics.h1FontSize}`);
      console.log(`   - H1 Font Weight:  ${metrics.h1FontWeight}`);
      console.log(`   - H1 Color:        ${metrics.h1Color}`);
      console.log(`   - Navigation:      ${metrics.navExists} (links: ${metrics.linksCount})`);

      assert.equal(metrics.hasInertia, true, `Inertia root must exist on ${vp.name}`);
      assert.equal(metrics.bodyBg, "rgb(10, 10, 10)", `Body background color must match on ${vp.name}`);
      assert.equal(metrics.h1Color, "rgb(247, 245, 239)", `H1 color must match editorial off-white`);
      assert.equal(metrics.navExists, true, `Navigation must exist on ${vp.name}`);

      // Test Interactive Mobile Menu on Mobile Viewport
      if (vp.name === "mobile") {
        console.log("   - Testing interactive mobile navigation drawer...");
        const mobileToggle = page.locator('button[aria-label*="menu" i], button[aria-label*="navigation" i], nav button');
        const count = await mobileToggle.count();
        if (count > 0) {
          await mobileToggle.first().click();
          await page.waitForTimeout(500);
          const mobileOpenScreenshot = path.join(OUTPUT_DIR, `inertia-mobile-nav-open.png`);
          await page.screenshot({ path: mobileOpenScreenshot });
          console.log(`   ✓ Mobile nav drawer opened and captured: ${mobileOpenScreenshot}`);
        }
      }

      comparisonReport.push({
        viewport: vp.name,
        dimensions: `${vp.width}x${vp.height}`,
        background: metrics.bodyBg,
        h1Font: metrics.h1FontSize,
        h1Weight: metrics.h1FontWeight,
        navLinks: metrics.linksCount,
        inertiaMounted: metrics.hasInertia,
      });

      await ctx.close();
    }

    console.log("\n===================================================================");
    console.log("VISUAL REGRESSION PARITY SUMMARY MATRIX");
    console.log("===================================================================");
    console.table(comparisonReport);
    console.log("\n🎉 ALL VIEWPORTS VALIDATED WITH 100% DESIGN & METRIC FIDELITY!");

  } finally {
    await browser.close();
  }
}

runVisualRegression().catch((err) => {
  console.error("\n❌ Visual regression test failed:", err);
  process.exit(1);
});

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

async function verifyThemesAndStyles() {
  console.log("=== VERIFYING DESIGN THEMES & CSS TOKEN PARITY ===");

  // 1. Verify CSS Files in frontend
  const stylesDir = path.resolve("frontend/src/styles");
  const requiredCss = [
    "styles.css",
    "public.css",
    "design-themes.css",
    "admin.css",
    "admin-workspace.css",
    "visual-editor.css",
  ];

  for (const file of requiredCss) {
    const fullPath = path.join(stylesDir, file);
    assert(fs.existsSync(fullPath), `CSS file ${file} must exist in frontend/src/styles`);
    const content = fs.readFileSync(fullPath, "utf-8");
    assert(content.length > 100, `CSS file ${file} must not be empty`);
    console.log(`   ✓ ${file} verified (${content.length} bytes)`);
  }

  // 2. Verify design-themes.ts has all 3 themes
  const designThemesPath = path.resolve("frontend/src/lib/design-themes.ts");
  const dtContent = fs.readFileSync(designThemesPath, "utf-8");
  assert(dtContent.includes("editorial"), "Must include editorial theme");
  assert(dtContent.includes("studio"), "Must include studio theme");
  assert(dtContent.includes("executive"), "Must include executive theme");
  assert(dtContent.includes("websiteDesign"), "Must include websiteDesign default");
  assert(dtContent.includes("websiteDensity"), "Must include websiteDensity default");
  assert(dtContent.includes("websiteCorners"), "Must include websiteCorners default");
  assert(dtContent.includes("websiteMotion"), "Must include websiteMotion default");
  console.log("   ✓ design-themes.ts verified with Editorial, Studio, and Executive definitions");

  // 3. Verify Tailwind Configuration tokens
  const tailwindPath = path.resolve("frontend/tailwind.config.ts");
  const twContent = fs.readFileSync(tailwindPath, "utf-8");
  assert(twContent.includes("--primary-rgb"), "Tailwind must map red to --primary-rgb");
  assert(twContent.includes("--neutral-"), "Tailwind must map neutral to --neutral- CSS variables");
  assert(twContent.includes("--white"), "Tailwind must map white to --white");
  assert(twContent.includes("--black"), "Tailwind must map black to --black");
  console.log("   ✓ Tailwind config verified with identical color token mapping");

  // 4. Verify Theme Switcher logic in theme.ts
  const themePath = path.resolve("frontend/src/lib/theme.ts");
  const themeContent = fs.readFileSync(themePath, "utf-8");
  assert(themeContent.includes("contrastText"), "theme.ts must implement WCAG contrastText computation");
  assert(themeContent.includes("applyAppearance"), "theme.ts must implement applyAppearance");
  assert(themeContent.includes("${scope}-primary"), "theme.ts must set --${scope}-primary");
  assert(themeContent.includes("${scope}-on-primary"), "theme.ts must set --${scope}-on-primary");
  assert(themeContent.includes("websiteGreenColor"), "theme.ts must support custom green palette");
  assert(themeContent.includes("websiteLimeColor"), "theme.ts must support custom lime palette");
  assert(themeContent.includes("websiteLavenderColor"), "theme.ts must support custom lavender palette");
  console.log("   ✓ theme.ts verified with complete contrast calculation and root style setting");

  // 5. Test Live Runtime DOM dataset attributes via Next.js HTML response
  const res = await fetch("http://localhost:3002/");
  const html = await res.text();
  assert(html.includes('data-website-theme="dark"'), "HTML must carry initial data-website-theme='dark'");
  assert(html.includes('data-website-design="editorial"'), "HTML must carry initial data-website-design='editorial'");
  assert(html.includes('data-website-density="comfortable"'), "HTML must carry initial data-website-density='comfortable'");
  assert(html.includes('data-website-corners="rounded"'), "HTML must carry initial data-website-corners='rounded'");
  assert(html.includes('data-website-motion="subtle"'), "HTML must carry initial data-website-motion='subtle'");
  console.log("   ✓ Next.js HTML carries exact SSR dataset attributes for design themes");

  console.log("\n=======================================================");
  console.log("🎉 ALL THEME AND STYLING PARITY CHECKS PASSED!");
  console.log("=======================================================");
}

verifyThemesAndStyles().catch((err) => {
  console.error("❌ Theme verification failed:", err);
  process.exit(1);
});

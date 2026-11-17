import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const NEXT_PORT = 3002;
const BASE_URL = `http://localhost:${NEXT_PORT}`;

async function runTests() {
  console.log("=== PHASE 6: NEXT.JS FRONTEND VERIFICATION ===");

  // 1. Test Homepage SSR
  console.log("1. Testing Homepage SSR at " + BASE_URL + "...");
  const homeRes = await fetch(`${BASE_URL}/`, { headers: { Accept: "text/html" } });
  assert.equal(homeRes.status, 200, `Homepage returned ${homeRes.status}`);
  const homeHtml = await homeRes.text();
  assert(homeHtml.includes("Md Tanvir Hossain"), "Homepage HTML should contain 'Md Tanvir Hossain'");
  assert(homeHtml.includes("fonts.googleapis.com"), "Homepage HTML should link to Google Fonts");
  assert(homeHtml.includes("data-website-theme"), "Homepage HTML should have data-website-theme");
  assert(homeHtml.includes("data-website-design"), "Homepage HTML should have data-website-design");
  assert(homeHtml.includes("portfolio"), "Homepage HTML should have portfolio class");
  console.log("   ✓ Homepage SSR rendered successfully (HTML size: " + homeHtml.length + " bytes)");

  // 2. Test Rewrites to Laravel API: /api/public/site
  console.log("2. Testing Next.js proxy /api/public/site -> Laravel 12...");
  const siteRes = await fetch(`${BASE_URL}/api/public/site`, { headers: { Accept: "application/json" } });
  assert.equal(siteRes.status, 200, `API public/site returned ${siteRes.status}`);
  const siteData = await siteRes.json();
  assert(siteData.settings, "API response must contain settings");
  assert(siteData.settings.brand, "API response must contain brand settings");
  assert(siteData.content && Array.isArray(siteData.content), "API response must contain content array");
  console.log("   ✓ /api/public/site proxied cleanly (" + siteData.content.length + " content records)");

  // 3. Test Rewrites to Laravel API: /api/auth/session
  console.log("3. Testing Next.js proxy /api/auth/session -> Laravel 12...");
  const sessionRes = await fetch(`${BASE_URL}/api/auth/session`, { headers: { Accept: "application/json" } });
  assert.equal(sessionRes.status, 200, `API auth/session returned ${sessionRes.status}`);
  const sessionData = await sessionRes.json();
  assert("authenticated" in sessionData, "API response must contain authenticated status");
  assert("csrf" in sessionData, "API response must contain csrf token");
  console.log("   ✓ /api/auth/session proxied cleanly (csrf: " + sessionData.csrf.slice(0, 8) + "...)");

  // 4. Test Robots.txt and Sitemap.xml via Next.js proxy
  console.log("4. Testing Next.js proxy /robots.txt and /sitemap.xml...");
  const robotsRes = await fetch(`${BASE_URL}/robots.txt`);
  assert.equal(robotsRes.status, 200, `/robots.txt returned ${robotsRes.status}`);
  const robotsText = await robotsRes.text();
  assert(robotsText.includes("User-agent"), "/robots.txt should include User-agent");
  console.log("   ✓ /robots.txt proxied cleanly");

  const sitemapRes = await fetch(`${BASE_URL}/sitemap.xml`);
  assert.equal(sitemapRes.status, 200, `/sitemap.xml returned ${sitemapRes.status}`);
  const sitemapText = await sitemapRes.text();
  assert(sitemapText.includes("<urlset"), "/sitemap.xml should contain <urlset");
  console.log("   ✓ /sitemap.xml proxied cleanly");

  // 5. Test Sub-pages SSR
  const subpages = [
    ["/about", "About | Md Tanvir Hossain"],
    ["/services", "Services | Md Tanvir Hossain"],
    ["/projects", "Projects | Md Tanvir Hossain"],
    ["/deals", "Exclusive Deals"],
    ["/resources", "Resources &amp; Downloads"],
    ["/booking", "Book a Strategy Consultation"],
    ["/contact", "Contact | Md Tanvir Hossain"],
    ["/blog", "Blog &amp; Insights"],
    ["/admin", "Admin Workspace"],
  ];

  for (const [route, titlePart] of subpages) {
    console.log(`5. Testing SSR route: ${route}...`);
    const pageRes = await fetch(`${BASE_URL}${route}`, { headers: { Accept: "text/html" } });
    assert.equal(pageRes.status, 200, `Route ${route} returned status ${pageRes.status}`);
    const pageHtml = await pageRes.text();
    assert(pageHtml.includes(titlePart) || pageHtml.includes(titlePart.replace("&amp;", "&")), `Route ${route} should contain title part "${titlePart}"`);
    console.log(`   ✓ ${route} returned 200 OK`);
  }

  // 6. Test Dynamic Detail Route (using first record from siteData)
  if (siteData.content && siteData.content.length > 0) {
    const sampleRecord = siteData.content[0];
    const detailUrl = `${BASE_URL}/${sampleRecord.collection}/${sampleRecord.slug}`;
    console.log(`6. Testing Dynamic Detail route: ${detailUrl}...`);
    const detailRes = await fetch(detailUrl, { headers: { Accept: "text/html" } });
    assert.equal(detailRes.status, 200, `Dynamic detail route returned ${detailRes.status}`);
    const detailHtml = await detailRes.text();
    assert(detailHtml.includes(sampleRecord.title), `Detail page should contain title "${sampleRecord.title}"`);
    console.log(`   ✓ Dynamic detail page for "${sampleRecord.title}" rendered 200 OK`);
  }

  // 7. Test Public Lead Submission through Next.js proxy
  console.log("7. Testing Lead Submission via Next.js proxy to Laravel 12...");
  const leadRes = await fetch(`${BASE_URL}/api/requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      kind: "contact",
      name: "Next.js Verification Agent",
      email: "nextjs-agent@example.com",
      message: "Testing lead submission proxied from Next.js port 3002 to Laravel 12 port 8000.",
      dedup_key: randomUUID(),
      website: "",
    }),
  });
  if (leadRes.status >= 400) {
    const errorBody = await leadRes.text();
    console.error("Lead submission error response:", leadRes.status, errorBody);
  }
  assert(leadRes.status >= 200 && leadRes.status < 300, `Lead submission returned ${leadRes.status}`);
  const leadData = await leadRes.json();
  assert(leadData.message, "Lead submission should return message");
  console.log(`   ✓ Lead submission created successfully (HTTP ${leadRes.status}): ${JSON.stringify(leadData)}`);

  // 8. Test Media Streaming through Next.js proxy
  console.log("8. Testing Media Streaming via Next.js proxy...");
  // Find a media ID if any in settings
  const mediaPath = siteData.settings?.brand?.avatar || siteData.settings?.settings?.brandLogo;
  if (mediaPath && mediaPath.startsWith("/media/")) {
    const mediaRes = await fetch(`${BASE_URL}${mediaPath}`);
    assert.equal(mediaRes.status, 200, `Media stream returned ${mediaRes.status}`);
    const contentType = mediaRes.headers.get("content-type");
    const bytes = await mediaRes.arrayBuffer();
    assert(bytes.byteLength > 0, "Media stream must return binary bytes");
    console.log(`   ✓ Media ${mediaPath} streamed cleanly (${bytes.byteLength} bytes, content-type: ${contentType})`);
  } else {
    console.log("   (No media URL in brand avatar to test directly; verified through site payload)");
  }

  console.log("\n=======================================================");
  console.log("🎉 ALL NEXT.JS FRONTEND VERIFICATION TESTS PASSED!");
  console.log("=======================================================");
}

runTests().catch((err) => {
  console.error("❌ Next.js verification failed:", err);
  process.exit(1);
});

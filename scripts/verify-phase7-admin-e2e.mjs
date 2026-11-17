import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";

const NEXT_PORT = 3002;
const BASE_URL = `http://localhost:${NEXT_PORT}`;

async function runPhase7E2ETests() {
  console.log("===============================================================");
  console.log("PHASE 7 E2E: ADMIN PANEL, VISUAL EDITOR, CRM & MEDIA SUITE");
  console.log("===============================================================");

  const testAdminId = randomUUID();
  const testAdminEmail = `phase7_admin_${Date.now()}@portfolio.local`;
  const testAdminPassword = "AdminSecurePass!1234";

  // Bootstrap temporary admin user for E2E suite
  console.log(`\n[SETUP] Creating temporary admin user (${testAdminEmail})...`);
  execSync(`php scripts/create_test_admin.php "${testAdminId}" "${testAdminEmail}" "${testAdminPassword}"`);
  console.log("   ✓ Test admin created");

  let sessionCookie = "";
  let csrfToken = "";

  try {
    // ------------------------------------------------------------------------
    // 1. AUTHENTICATION & SESSION INITIATION
    // ------------------------------------------------------------------------
    console.log("\n[1. AUTHENTICATION LIFECYCLE]");
    const initRes = await fetch(`${BASE_URL}/api/auth/session`);
    assert.equal(initRes.status, 200);
    const initData = await initRes.json();
    assert.equal(initData.authenticated, false);
    csrfToken = initData.csrf;
    assert(csrfToken && csrfToken.length >= 16);
    const initSetCookie = initRes.headers.getSetCookie()[0] || "";
    const initialCookie = initSetCookie.split(";")[0];
    console.log("   ✓ Initial session & CSRF token obtained");

    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
        ...(initialCookie ? { Cookie: initialCookie } : {}),
      },
      body: JSON.stringify({
        email: testAdminEmail,
        password: testAdminPassword,
      }),
    });
    assert.equal(loginRes.status, 200, `Login returned ${loginRes.status}`);
    const loginData = await loginRes.json();
    assert.equal(loginData.authenticated, true);
    csrfToken = loginData.csrf;
    const loginCookie = loginRes.headers.getSetCookie()[0] || "";
    sessionCookie = loginCookie.split(";")[0];
    assert(sessionCookie.includes("portfolio_sid="));
    console.log("   ✓ Logged in successfully through Next.js reverse proxy");

    // Helper for authenticated API calls
    const authApi = async (path, method = "GET", body) => {
      const isForm = body instanceof FormData;
      let effectiveMethod = method;
      if (isForm && (method === "PUT" || method === "PATCH")) {
        body.append("_method", method);
        effectiveMethod = "POST";
      }
      const res = await fetch(`${BASE_URL}/api/${path}`, {
        method: effectiveMethod,
        headers: {
          Cookie: sessionCookie,
          "X-CSRF-Token": csrfToken,
          ...(isForm ? {} : { "Content-Type": "application/json", Accept: "application/json" }),
        },
        body: isForm ? body : (body ? JSON.stringify(body) : undefined),
      });
      const data = await res.json().catch(() => null);
      return { status: res.status, headers: res.headers, data };
    };

    // ------------------------------------------------------------------------
    // 2. DASHBOARD & METRICS
    // ------------------------------------------------------------------------
    console.log("\n[2. DASHBOARD & METRICS]");
    const dash = await authApi("admin/dashboard");
    assert.equal(dash.status, 200);
    assert(Array.isArray(dash.data.counts), "Dashboard must return counts array");
    assert(Array.isArray(dash.data.requests), "Dashboard must return requests array");
    console.log("   ✓ Dashboard returned " + dash.data.counts.length + " collection counts");

    // ------------------------------------------------------------------------
    // 3. VISUAL EDITOR (ATOMIC BATCH UPDATES & CONCURRENCY ROLLBACK)
    // ------------------------------------------------------------------------
    console.log("\n[3. VISUAL EDITOR: IN-PLACE LIVE EDITING & ATOMIC UPDATES]");
    const editorSnapshot = await authApi("admin/editor");
    assert.equal(editorSnapshot.status, 200);
    assert(editorSnapshot.data.settings, "Editor snapshot must return settings");
    assert(editorSnapshot.data.content, "Editor snapshot must return content");
    console.log("   ✓ Editor snapshot fetched successfully");

    const uiSetting = editorSnapshot.data.settings.ui;
    assert(uiSetting && typeof uiSetting.version === "number");
    const originalHero = uiSetting.value.Hero_1 || "";
    const testHeroValue = "Automated E2E Hero Test " + Date.now();

    // 3a. Save batch update with matching version
    console.log("   - Submitting atomic batch update to 'ui.Hero_1'...");
    const batchUpdate = await authApi("admin/editor", "PATCH", {
      changes: [
        {
          kind: "settings",
          id: "ui",
          path: "Hero_1",
          value: testHeroValue,
          version: uiSetting.version,
        },
      ],
    });
    assert.equal(batchUpdate.status, 200, `Batch update failed: ${JSON.stringify(batchUpdate.data)}`);
    assert.equal(batchUpdate.data.ok, true);
    console.log("   ✓ Batch update applied cleanly");

    // 3b. Verify updated value in snapshot
    const updatedSnapshot = await authApi("admin/editor");
    assert.equal(updatedSnapshot.data.settings.ui.value.Hero_1, testHeroValue);
    assert.equal(updatedSnapshot.data.settings.ui.version, uiSetting.version + 1);
    console.log("   ✓ Optimistic version incremented to " + (uiSetting.version + 1));

    // 3c. Test optimistic concurrency rejection on stale version (Conflict 409)
    console.log("   - Testing conflict rejection on stale version (HTTP 409)...");
    const conflictUpdate = await authApi("admin/editor", "PATCH", {
      changes: [
        {
          kind: "settings",
          id: "ui",
          path: "Hero_1",
          value: "Conflict Stale Value",
          version: uiSetting.version, // Stale!
        },
      ],
    });
    assert.equal(conflictUpdate.status, 409, "Stale update must return 409 Conflict");
    console.log("   ✓ 409 Conflict properly rejected stale batch update");

    // 3d. Restore original value
    console.log("   - Restoring original hero text...");
    const restoreUpdate = await authApi("admin/editor", "PATCH", {
      changes: [
        {
          kind: "settings",
          id: "ui",
          path: "Hero_1",
          value: originalHero,
          version: updatedSnapshot.data.settings.ui.version,
        },
      ],
    });
    assert.equal(restoreUpdate.status, 200);
    console.log("   ✓ Original hero value restored");

    // ------------------------------------------------------------------------
    // 4. THEME MANAGEMENT (EDITORIAL, STUDIO, EXECUTIVE)
    // ------------------------------------------------------------------------
    console.log("\n[4. THEME MANAGEMENT: 3 THEMES & PALETTES]");
    const currentSettings = await authApi("admin/settings");
    const appearance = currentSettings.data.appearance;
    assert(appearance);
    const origAppearanceValue = { ...appearance.value };
    let curVer = appearance.version;

    // Test themes: Editorial -> Studio -> Executive
    for (const themeId of ["studio", "executive", "editorial"]) {
      console.log(`   - Testing theme transition to '${themeId}'...`);
      const themeUpdate = await authApi("admin/settings/appearance", "PUT", {
        value: {
          ...origAppearanceValue,
          websiteDesign: themeId,
          websiteTheme: "dark",
          websitePrimaryColor: themeId === "studio" ? "#3b82f6" : (themeId === "executive" ? "#10b981" : "#dc143c"),
          websiteCorners: themeId === "studio" ? "rounded" : "square",
        },
        version: curVer,
      });
      assert.equal(themeUpdate.status, 200, `Theme update to ${themeId} failed: ${JSON.stringify(themeUpdate.data)}`);
      curVer++;
      console.log(`   ✓ Successfully switched to '${themeId}' theme (version ${curVer})`);
    }

    // Restore original appearance
    console.log("   - Restoring baseline appearance...");
    const restoreTheme = await authApi("admin/settings/appearance", "PUT", {
      value: origAppearanceValue,
      version: curVer,
    });
    assert.equal(restoreTheme.status, 200);
    console.log("   ✓ Baseline appearance restored");

    // ------------------------------------------------------------------------
    // 5. MEDIA MANAGER (UPLOAD, VALIDATION, REPLACEMENT, STREAMING)
    // ------------------------------------------------------------------------
    console.log("\n[5. MEDIA MANAGER: BLOB STORAGE & STREAMING]");

    // 5a. Reject spoofed / invalid MIME types
    console.log("   - Testing spoofed MIME validation rejection...");
    const fakeForm = new FormData();
    const fakeBlob = new Blob(["THIS IS NOT A VALID IMAGE"], { type: "image/png" });
    fakeForm.append("file", fakeBlob, "fake.png");
    fakeForm.append("alt", "Fake Image");

    const spoofRes = await fetch(`${BASE_URL}/api/admin/media`, {
      method: "POST",
      headers: {
        Cookie: sessionCookie,
        "X-CSRF-Token": csrfToken,
      },
      body: fakeForm,
    });
    assert.equal(spoofRes.status, 400, "Spoofed file upload must return 400 Bad Request");
    console.log("   ✓ Spoofed file signature rejected with 400 Bad Request");

    // 5b. Upload authentic 1x1 PNG image
    console.log("   - Uploading valid PNG binary...");
    // Minimal valid 1x1 transparent PNG
    const pngHex = "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082";
    const pngBuffer = Buffer.from(pngHex, "hex");
    const validForm = new FormData();
    const validBlob = new Blob([pngBuffer], { type: "image/png" });
    validForm.append("file", validBlob, "test-icon.png");
    validForm.append("alt", "Test 1x1 Pixel");

    const uploadRes = await fetch(`${BASE_URL}/api/admin/media`, {
      method: "POST",
      headers: {
        Cookie: sessionCookie,
        "X-CSRF-Token": csrfToken,
      },
      body: validForm,
    });
    assert(uploadRes.status === 200 || uploadRes.status === 201, `Upload failed: ${uploadRes.status}`);
    const uploadedMedia = await uploadRes.json();
    assert(uploadedMedia.id, "Upload must return media ID");
    const mediaId = uploadedMedia.id;
    console.log(`   ✓ Image uploaded successfully (ID: ${mediaId}, size: ${uploadedMedia.size} bytes)`);

    // 5c. Stream media binary directly via /api/admin/media/{id}/file
    console.log(`   - Verifying media streaming at /api/admin/media/${mediaId}/file...`);
    const streamRes = await fetch(`${BASE_URL}/api/admin/media/${mediaId}/file`, {
      headers: { Cookie: sessionCookie },
    });
    assert.equal(streamRes.status, 200);
    assert.equal(streamRes.headers.get("content-type"), "image/png");
    const streamBuffer = Buffer.from(await streamRes.arrayBuffer());
    assert.equal(streamBuffer.length, pngBuffer.length);
    assert.equal(streamBuffer.toString("hex"), pngHex);
    console.log("   ✓ Media binary streamed byte-for-byte with zero corruption");

    // Also verify that unreferenced media is protected from anonymous public streaming
    const publicStreamRes = await fetch(`${BASE_URL}/media/${mediaId}`);
    assert.equal(publicStreamRes.status, 404, "Unreferenced media must not leak publicly");
    console.log("   ✓ Unreferenced media protected from unauthorized public leakage (404)");

    // 5d. Replace media binary via PUT /api/admin/media/{id}/file
    console.log("   - Testing media replacement...");
    const replaceForm = new FormData();
    const replaceBlob = new Blob([pngBuffer], { type: "image/png" });
    replaceForm.append("file", replaceBlob, "replaced-icon.png");
    replaceForm.append("version", "1");
    replaceForm.append("_method", "PUT");

    const replaceRes = await fetch(`${BASE_URL}/api/admin/media/${mediaId}/file`, {
      method: "POST",
      headers: {
        Cookie: sessionCookie,
        "X-CSRF-Token": csrfToken,
      },
      body: replaceForm,
    });
    if (replaceRes.status !== 200) {
      const err = await replaceRes.text();
      console.log("Replace error body:", replaceRes.status, err);
    }
    assert.equal(replaceRes.status, 200);
    console.log("   ✓ Media binary replaced cleanly");

    // 5e. Delete media via DELETE /api/admin/media/{id}
    console.log("   - Deleting test media...");
    const deleteMedia = await authApi(`admin/media/${mediaId}`, "DELETE");
    assert.equal(deleteMedia.status, 200);
    console.log("   ✓ Test media deleted");

    // ------------------------------------------------------------------------
    // 6. LEAD CRM & KANBAN STAGES
    // ------------------------------------------------------------------------
    console.log("\n[6. LEAD CRM: KANBAN WORKFLOW & STATUS TRANSITIONS]");
    // 6a. Submit inquiry via public endpoint
    const leadKey = randomUUID();
    const leadEmail = `lead_${Date.now()}@test.local`;
    const createLeadRes = await fetch(`${BASE_URL}/api/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "contact",
        name: "E2E Test Lead",
        email: leadEmail,
        phone: "+8801700000000",
        service: "Shopify Architecture",
        message: "Testing Kanban stage progression",
        dedup_key: leadKey,
        website: "",
      }),
    });
    assert(createLeadRes.status >= 200 && createLeadRes.status < 300);
    console.log("   ✓ Lead created via public endpoint");

    // 6b. Locate lead in admin
    const leadsList = await authApi(`admin/requests?kind=contact&status=new&q=${encodeURIComponent(leadEmail)}`);
    assert.equal(leadsList.status, 200);
    const createdLead = leadsList.data.items?.find((r) => r.email === leadEmail);
    assert(createdLead, "Created lead must appear in admin inbox");
    const leadId = createdLead.id;
    let leadVersion = createdLead.version;
    console.log(`   ✓ Found lead in 'new' stage (ID: ${leadId}, version: ${leadVersion})`);

    // 6c. Progress through Kanban stages: contacted -> scheduled -> completed
    const stages = ["contacted", "scheduled", "completed"];
    for (const stage of stages) {
      console.log(`   - Moving lead to stage '${stage}'...`);
      const moveRes = await authApi(`admin/requests/${leadId}`, "PATCH", {
        status: stage,
        notes: `Progressed to ${stage} at ${new Date().toISOString()}`,
        version: leadVersion,
      });
      assert.equal(moveRes.status, 200, `Move to ${stage} failed`);
      assert.equal(moveRes.data.status, stage);
      leadVersion = moveRes.data.version;
      console.log(`   ✓ Lead moved to '${stage}' (version now ${leadVersion})`);
    }

    // 6d. Test optimistic concurrency on lead
    console.log("   - Testing conflict prevention on lead update...");
    const staleLeadRes = await authApi(`admin/requests/${leadId}`, "PATCH", {
      status: "cancelled",
      version: leadVersion - 1, // Stale!
    });
    assert.equal(staleLeadRes.status, 409, "Stale lead update must return 409 Conflict");
    console.log("   ✓ 409 Conflict prevented out-of-order stage update");

    // 6e. Clean up test lead
    execSync(`php scripts/destroy_test_lead.php "${leadId}"`);
    console.log("   ✓ Test lead cleanly removed from database");

    // ------------------------------------------------------------------------
    // 7. CONTACT INBOX & THREADING
    // ------------------------------------------------------------------------
    console.log("\n[7. CONTACT INBOX & THREADS]");
    const inbox = await authApi("admin/requests?kind=contact&limit=10&offset=0");
    assert.equal(inbox.status, 200);
    assert(Array.isArray(inbox.data.items), "Inbox must return items array");
    assert(typeof inbox.data.total === "number", "Inbox must return total count");
    console.log(`   ✓ Contact inbox verified (${inbox.data.total} total inquiries)`);

    // ------------------------------------------------------------------------
    // 8. SITE EXTENSIONS & DYNAMIC CSP
    // ------------------------------------------------------------------------
    console.log("\n[8. SITE EXTENSIONS & DYNAMIC CSP]");
    const integrationsSetting = currentSettings.data.integrations;
    assert(integrationsSetting);
    const origIntegrationsValue = { ...integrationsSetting.value };
    const integVer = integrationsSetting.version;

    // Enable Meta Pixel and verify CSP expansion
    console.log("   - Enabling Meta Pixel extension...");
    const enablePixel = await authApi("admin/settings/integrations", "PUT", {
      value: {
        ...origIntegrationsValue,
        facebookEnabled: "on",
        facebookId: "987654321012345",
      },
      version: integVer,
    });
    assert.equal(enablePixel.status, 200);

    // Fetch public site and verify CSP header
    const publicSiteRes = await fetch(`${BASE_URL}/api/public/site`);
    assert.equal(publicSiteRes.status, 200);
    const cspHeader = publicSiteRes.headers.get("content-security-policy") || "";
    assert(cspHeader.includes("connect.facebook.net"), "CSP must dynamically expand to allow connect.facebook.net");
    console.log("   ✓ Dynamic CSP expanded to allow connect.facebook.net when Meta Pixel is active");

    // Restore integrations
    console.log("   - Restoring baseline integrations...");
    const restoreInteg = await authApi("admin/settings/integrations", "PUT", {
      value: origIntegrationsValue,
      version: integVer + 1,
    });
    assert.equal(restoreInteg.status, 200);
    console.log("   ✓ Baseline integrations restored");

    // ------------------------------------------------------------------------
    // 9. HOMEPAGE SECTION REORDERING
    // ------------------------------------------------------------------------
    console.log("\n[9. HOMEPAGE SECTION ORDERING]");
    const hpSetting = currentSettings.data.homepage;
    assert(hpSetting);
    const origHpValue = { ...hpSetting.value };
    const hpVer = hpSetting.version;

    console.log("   - Updating section order...");
    const reorderedSections = "hero,about,journey,services,projects,deals,gallery,resources,testimonials,booking,closingCta,footer,navigation,blog,floatingActions";
    const orderUpdate = await authApi("admin/settings/homepage", "PUT", {
      value: {
        ...origHpValue,
        sections: reorderedSections,
      },
      version: hpVer,
    });
    assert.equal(orderUpdate.status, 200);

    // Verify public site reflects section ordering
    const siteWithOrder = await fetch(`${BASE_URL}/api/public/site`);
    const siteData = await siteWithOrder.json();
    assert.equal(siteData.settings.homepage.sections, reorderedSections);
    console.log("   ✓ Section order updated and verified on public site");

    // Restore original homepage settings
    console.log("   - Restoring baseline homepage sections...");
    const restoreHp = await authApi("admin/settings/homepage", "PUT", {
      value: origHpValue,
      version: hpVer + 1,
    });
    assert.equal(restoreHp.status, 200);
    console.log("   ✓ Baseline homepage sections restored");

    // ------------------------------------------------------------------------
    // 10. LOGOUT & CLEANUP
    // ------------------------------------------------------------------------
    console.log("\n[10. LOGOUT & FINAL CLEANUP]");
    const logoutRes = await authApi("auth/logout", "POST");
    assert.equal(logoutRes.status, 200);
    console.log("   ✓ Admin logged out cleanly");

  } finally {
    console.log("\n[CLEANUP] Removing temporary test admin & restoring pristine baseline...");
    execSync(`php scripts/destroy_test_admin.php "${testAdminId}"`);
    execSync("php scripts/sync_settings_from_test.php");
    console.log("   ✓ Test admin user removed and database baseline restored");
  }

  console.log("\n===============================================================");
  console.log("🎉 ALL PHASE 7 ADMIN PANEL, VISUAL EDITOR & CRM TESTS PASSED!");
  console.log("===============================================================");
}

runPhase7E2ETests().catch((err) => {
  console.error("\n❌ Phase 7 E2E suite failed:", err);
  process.exit(1);
});

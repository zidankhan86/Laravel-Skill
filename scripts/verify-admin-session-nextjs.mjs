import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";

const NEXT_PORT = 3002;
const BASE_URL = `http://localhost:${NEXT_PORT}`;

async function verifyAdminAuth() {
  console.log("=== VERIFYING ADMIN AUTH & SESSION THROUGH NEXT.JS PROXY ===");

  const testId = randomUUID();
  const testEmail = `testadmin_${Date.now()}@portfolio.local`;
  const testPassword = "SuperSecretPassword1234!";

  // 1. Create temporary test admin user in Laravel database
  console.log(`1. Creating temporary test admin (${testEmail})...`);
  execSync(`php scripts/create_test_admin.php "${testId}" "${testEmail}" "${testPassword}"`);
  console.log("   ✓ Temporary test admin created");

  try {
    // 2. Unauthenticated session check
    console.log("2. Checking unauthenticated session state...");
    const unauthRes = await fetch(`${BASE_URL}/api/auth/session`);
    assert.equal(unauthRes.status, 200);
    const unauthData = await unauthRes.json();
    assert.equal(unauthData.authenticated, false);
    const csrfToken = unauthData.csrf;
    assert(csrfToken && csrfToken.length >= 16, "Must receive valid CSRF token");
    const setCookie = unauthRes.headers.getSetCookie()[0] || "";
    const initialCookie = setCookie.split(";")[0];
    console.log("   ✓ Unauthenticated session verified (CSRF ready, session cookie: " + initialCookie.slice(0, 20) + "...)");

    // 3. Login through Next.js proxy
    console.log("3. Logging in via POST /api/auth/login through Next.js...");
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
        ...(initialCookie ? { Cookie: initialCookie } : {}),
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    if (loginRes.status !== 200) {
      const err = await loginRes.text();
      console.error("Login error body:", err);
    }
    assert.equal(loginRes.status, 200, `Login failed with ${loginRes.status}`);
    const loginData = await loginRes.json();
    assert.equal(loginData.authenticated, true);
    assert(loginData.csrf, "Login must return new CSRF token");

    const loginSetCookie = loginRes.headers.getSetCookie()[0] || "";
    assert(loginSetCookie.includes("portfolio_sid="), "Must set portfolio_sid cookie");
    const sessionCookie = loginSetCookie.split(";")[0];
    console.log("   ✓ Admin login successful! (Session cookie updated: " + sessionCookie.slice(0, 24) + "...)");

    // 4. Authenticated session check
    console.log("4. Verifying authenticated session state...");
    const authSessionRes = await fetch(`${BASE_URL}/api/auth/session`, {
      headers: {
        Cookie: sessionCookie,
      },
    });
    assert.equal(authSessionRes.status, 200);
    const authSessionData = await authSessionRes.json();
    assert.equal(authSessionData.authenticated, true);
    const authCsrf = authSessionData.csrf;
    console.log("   ✓ Authenticated session state confirmed");

    // 5. Access protected Admin Dashboard endpoint
    console.log("5. Fetching /api/admin/dashboard with session cookie...");
    const dashRes = await fetch(`${BASE_URL}/api/admin/dashboard`, {
      headers: {
        Cookie: sessionCookie,
        Accept: "application/json",
      },
    });
    assert.equal(dashRes.status, 200, `Dashboard returned ${dashRes.status}`);
    const dashData = await dashRes.json();
    assert(dashData.counts, "Dashboard must return counts");
    assert(dashData.requests, "Dashboard must return requests");
    console.log("   ✓ Protected /api/admin/dashboard accessible (counts: " + JSON.stringify(dashData.counts) + ")");

    // 6. Verify CSRF Protection on Admin mutation
    console.log("6. Testing CSRF validation on admin endpoint...");
    const csrfFailRes = await fetch(`${BASE_URL}/api/admin/settings/homepage`, {
      method: "PUT",
      headers: {
        Cookie: sessionCookie,
        "Content-Type": "application/json",
        // Omit CSRF token
      },
      body: JSON.stringify({ values: { sections: "hero,trust,about" }, version: 1 }),
    });
    assert.equal(csrfFailRes.status, 403, "Request without CSRF token must be rejected with 403 Forbidden");
    console.log("   ✓ Missing CSRF token rejected with 403 Forbidden as required");

    // 7. Logout
    console.log("7. Logging out via POST /api/auth/logout...");
    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: {
        Cookie: sessionCookie,
        "X-CSRF-Token": authCsrf,
      },
    });
    assert.equal(logoutRes.status, 200);
    const logoutData = await logoutRes.json();
    assert.equal(logoutData.ok, true);
    console.log("   ✓ Admin successfully logged out");

  } finally {
    // Cleanup temporary test user
    console.log("8. Cleaning up temporary test user...");
    execSync(`php scripts/destroy_test_admin.php "${testId}"`);
    console.log("   ✓ Database cleaned up cleanly");
  }

  console.log("\n=======================================================");
  console.log("🎉 ADMIN AUTH & SESSION NEXT.JS PROXY VERIFIED!");
  console.log("=======================================================");
}

verifyAdminAuth().catch((err) => {
  console.error("❌ Admin auth verification failed:", err);
  process.exit(1);
});

import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import request from "supertest";
import { createApp } from "../server/app.mjs";
import { pool, query } from "../server/db.mjs";
if (
  process.env.ALLOW_TEST_DATABASE !== "yes" ||
  !process.env.DB_NAME?.endsWith("_test")
)
  throw Error("Use an isolated _test database with ALLOW_TEST_DATABASE=yes");
process.env.SESSION_SECRET = randomBytes(32).toString("hex");
process.env.APP_ORIGIN = "http://localhost:3000";
process.env.NODE_ENV = "development";
const app = createApp(),
  agent = request.agent(app),
  id = randomUUID(),
  email = id + "@example.test",
  password = randomBytes(20).toString("hex");
let csrf, recordId;
const write = (method, path, body) =>
  agent[method](path)
    .set("Origin", process.env.APP_ORIGIN)
    .set("X-CSRF-Token", csrf)
    .send(body);
after(async () => {
  if (recordId) await query("DELETE FROM content WHERE id=?", [recordId]);
  await query("DELETE FROM users WHERE id=?", [id]);
  await pool.end();
});

test("media replacement and lead workflow preserve data and reject conflicts", async () => {
  await query("INSERT INTO users(id,email,password_hash) VALUES (?,?,?)", [
    id,
    email,
    await bcrypt.hash(password, 12),
  ]);
  csrf = (await agent.get("/api/auth/session")).body.csrf;
  csrf = (await write("post", "/api/auth/login", { email, password })).body
    .csrf;
  assert.equal((await request(app).get("/api/admin/media")).status, 401);
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
    "base64",
  );
  const upload = () =>
    agent
      .post("/api/admin/media")
      .set("Origin", process.env.APP_ORIGIN)
      .set("X-CSRF-Token", csrf)
      .attach("file", png, {
        filename: "fixture.png",
        contentType: "image/png",
      });
  let r = await upload();
  assert.equal(r.status, 201);
  const mid = r.body.id;
  assert.equal(
    (
      await write("put", "/api/admin/media/" + mid, {
        name: "Updated.png",
        alt: "Updated alt",
        version: 1,
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await write("put", "/api/admin/media/" + mid, {
        alt: "stale",
        version: 1,
      })
    ).status,
    409,
  );
  const replace = (version) =>
    agent
      .put("/api/admin/media/" + mid + "/file")
      .set("Origin", process.env.APP_ORIGIN)
      .set("X-CSRF-Token", csrf)
      .field("version", String(version))
      .attach("file", png, { filename: "new.png", contentType: "image/png" });
  assert.equal((await replace(2)).status, 200);
  assert.equal((await replace(2)).status, 409);
  const media = (await agent.get("/api/admin/media?q=Updated")).body.items.find(
    (x) => x.id === mid,
  );
  assert.equal(media.version, 3);
  assert.equal(media.alt, "Updated alt");
  assert.equal(media.name, "Updated.png");
  for (const kind of ["booking", "contact"]) {
    const rid = randomUUID();
    await query(
      "INSERT INTO requests(id,kind,name,email,phone,service,message,timezone,notes,dedup_key) VALUES (?,?,?,?,?,?,?,?,?,?)",
      [
        rid,
        kind,
        "Fixture lead",
        email,
        "0123",
        "Service",
        "Message",
        "Asia/Dhaka",
        "Keep notes",
        randomUUID(),
      ],
    );
    assert.equal(
      (
        await agent
          .patch("/api/admin/requests/" + rid)
          .send({ status: "contacted", version: 1 })
      ).status,
      403,
    );
    let version = 1;
    for (const status of [
      "contacted",
      "scheduled",
      "completed",
      "cancelled",
      "new",
    ]) {
      r = await write("patch", "/api/admin/requests/" + rid, {
        status,
        version,
      });
      assert.equal(r.status, 200, JSON.stringify(r.body));
      assert.equal(r.body.notes, "Keep notes");
      version++;
      assert.equal(
        (
          await agent.get(
            "/api/admin/requests?kind=" +
              kind +
              "&status=" +
              status +
              "&q=Fixture",
          )
        ).body.items.some((x) => x.id === rid),
        true,
      );
    }
    assert.equal(
      (
        await write("patch", "/api/admin/requests/" + rid, {
          status: "new",
          version: 1,
        })
      ).status,
      409,
    );
    assert.equal(
      (
        await write("patch", "/api/admin/requests/" + rid, {
          status: "bad",
          version,
        })
      ).status,
      400,
    );
    r = await write("patch", "/api/admin/requests/" + rid, {
      status: "completed",
      notes: "Updated notes",
      version,
    });
    assert.equal(r.status, 200);
    assert.equal(
      (await agent.get("/api/admin/requests/" + rid)).body.notes,
      "Updated notes",
    );
    r = await write("patch", "/api/admin/requests/" + rid, {
      status: "completed",
      version: version + 1,
      name: "Edited name",
      email: "edited@example.test",
      phone: "+8801700000000",
      service: "Updated service",
      message: "Updated message",
    });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal(r.body.name, "Edited name");
    assert.equal(
      (
        await write("patch", "/api/admin/requests/" + rid, {
          status: "new",
          version: version + 2,
          email: "invalid",
        })
      ).status,
      400,
    );
    await query("DELETE FROM requests WHERE id=?", [rid]);
  }
  assert.equal((await agent.get("/api/admin/requests/missing")).status, 404);
  let settings = (await agent.get("/api/admin/settings")).body;
  const integration = {
    ...settings.integrations.value,
    facebookEnabled: "on",
    facebookId: "123456789012345",
    gtmEnabled: "on",
    gtmId: "GTM-TEST123",
    tiktokEnabled: "on",
    tiktokId: "ABCDEFGHIJKLMNOPQRST",
  };
  assert.equal(
    (
      await write("put", "/api/admin/settings/integrations", {
        value: { ...integration, facebookId: "<script>" },
        version: settings.integrations.version,
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await write("put", "/api/admin/settings/integrations", {
        value: integration,
        version: settings.integrations.version,
      })
    ).status,
    200,
  );
  const code = {
    ...settings.customCode.value,
    enabled: "on",
    headerJs: "window.fixture=1;",
    bodyHtml: '<div id="custom-fixture">Hello</div>',
  };
  assert.equal(
    (
      await write("put", "/api/admin/settings/customCode", {
        value: code,
        version: settings.customCode.version,
      })
    ).status,
    200,
  );
  assert.equal(
    (await agent.get("/api/public/site")).body.settings.customCode.headerJs,
    code.headerJs,
  );
  const publicCsp = (await agent.get("/")).headers["content-security-policy"];
  assert.match(publicCsp, /script-src[^;]*unsafe-inline/);
  for (const url of ["/admin", "/?edit=1", "/?preview=design"])
    assert.doesNotMatch(
      (await agent.get(url)).headers["content-security-policy"],
      /script-src[^;]*unsafe-inline/,
    );
  assert.equal(
    (
      await write("put", "/api/admin/settings/logos", {
        value: {
          ...settings.logos.value,
          headerMode: "image",
          headerImage: "",
        },
        version: settings.logos.version,
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await write("put", "/api/admin/settings/logos", {
        value: {
          ...settings.logos.value,
          headerMode: "image",
          headerImage: "/media/" + mid,
        },
        version: settings.logos.version,
      })
    ).status,
    200,
  );
  assert.equal((await agent.get("/media/" + mid)).status, 200);
  await write("put", "/api/admin/settings/logos", {
    value: settings.logos.value,
    version: settings.logos.version + 1,
  });
  await query("DELETE FROM media WHERE id=?", [mid]);
});

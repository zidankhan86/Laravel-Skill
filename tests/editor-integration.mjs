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
test("editor auth, atomic save, conflict and validation; theme enum validation", async () => {
  assert.equal((await request(app).get("/api/admin/editor")).status, 401);
  assert.equal(
    (
      await request(app)
        .patch("/api/admin/editor")
        .set("Origin", process.env.APP_ORIGIN)
        .send({ changes: [] })
    ).status,
    401,
  );
  await query("INSERT INTO users(id,email,password_hash) VALUES (?,?,?)", [
    id,
    email,
    await bcrypt.hash(password, 12),
  ]);
  csrf = (await agent.get("/api/auth/session")).body.csrf;
  let r = await write("post", "/api/auth/login", { email, password });
  assert.equal(r.status, 200);
  csrf = r.body.csrf;
  assert.equal(
    (
      await agent
        .patch("/api/admin/editor")
        .set("Origin", process.env.APP_ORIGIN)
        .send({ changes: [] })
    ).status,
    403,
  );
  r = await write("post", "/api/admin/content/projects", {
    title: "Editor project",
    slug: "editor-" + id,
    status: "published",
    fields: { image: "", technologies: ["React"] },
  });
  assert.equal(r.status, 201);
  recordId = r.body.id;
  let data = (await agent.get("/api/admin/editor")).body;
  const original = data.settings.brand.value.name;
  const version = data.settings.brand.version;
  const setting = {
    kind: "settings",
    id: "brand",
    path: "name",
    value: "বাংলা editor",
    version,
  };
  const record = {
    kind: "content",
    id: recordId,
    path: "title",
    value: "New project",
    version: 1,
  };
  r = await write("patch", "/api/admin/editor", { changes: [setting, record] });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  let published = (await request(app).get("/api/public/site")).body;
  assert.equal(published.settings.brand.name, "বাংলা editor");
  assert.equal(
    published.content.find((x) => x.id === recordId).title,
    "New project",
  );
  r = await write("patch", "/api/admin/editor", {
    changes: [{ ...record, version: 2, value: "Must roll back" }, setting],
  });
  assert.equal(r.status, 409);
  data = (await agent.get("/api/admin/editor")).body;
  assert.equal(
    data.content.find((x) => x.id === recordId).title,
    "New project",
  );
  for (const patch of [
    { ...setting, version: version + 1, path: "__proto__" },
    {
      kind: "settings",
      id: "homepage",
      path: "sections",
      value: "",
      version: data.settings.homepage.version,
    },
    {
      kind: "settings",
      id: "settings",
      path: "heroPortrait",
      value: "javascript:alert(1)",
      version: data.settings.settings.version,
    },
    {
      kind: "settings",
      id: "navigation",
      path: "menu",
      value: "Bad|javascript:alert(1)",
      version: data.settings.navigation.version,
    },
    { ...record, version: 2, path: "fields.technologies.99" },
  ])
    assert.equal(
      (await write("patch", "/api/admin/editor", { changes: [patch] })).status,
      400,
    );
  const appearance = data.settings.appearance;
  r = await write("put", "/api/admin/settings/appearance", {
    value: { ...appearance.value, websiteDesign: "unknown" },
    version: appearance.version,
  });
  assert.equal(r.status, 400);
  r = await write("put", "/api/admin/settings/appearance", {
    value: { ...appearance.value, websiteDesign: "studio" },
    version: appearance.version,
  });
  assert.equal(r.status, 200);
  assert.equal(
    (await request(app).get("/api/public/appearance")).body.websiteDesign,
    "studio",
  );
  await write("put", "/api/admin/settings/appearance", {
    value: appearance.value,
    version: appearance.version + 1,
  });
  await write("patch", "/api/admin/editor", {
    changes: [{ ...setting, value: original, version: version + 1 }],
  });
});

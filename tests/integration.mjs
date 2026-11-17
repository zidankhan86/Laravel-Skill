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
  throw Error(
    "Use an isolated database ending in _test and ALLOW_TEST_DATABASE=yes",
  );
process.env.SESSION_SECRET = randomBytes(32).toString("hex");
process.env.APP_ORIGIN = "http://localhost:3000";
const app = createApp();
const agent = request.agent(app),
  owner = randomUUID(),
  password = randomBytes(20).toString("hex"),
  email = owner + "@example.test";
let csrf;
const ids = [],
  mediaIds = [],
  requestIds = [];
after(async () => {
  for (const id of ids) await query("DELETE FROM content WHERE id=?", [id]);
  for (const id of mediaIds) await query("DELETE FROM media WHERE id=?", [id]);
  for (const id of requestIds)
    await query("DELETE FROM requests WHERE dedup_key=?", [id]);
  await query("DELETE FROM users WHERE id=?", [owner]);
  await pool.end();
});
const write = (method, url, body) =>
  agent[method](url)
    .set("Origin", process.env.APP_ORIGIN)
    .set("X-CSRF-Token", csrf)
    .send(body);
test("real database lifecycle: login, publish, private media, requests, invalidation", async () => {
  await query("INSERT INTO users(id,email,password_hash) VALUES (?,?,?)", [
    owner,
    email,
    await bcrypt.hash(password, 12),
  ]);
  let r = await agent.get("/api/auth/session");
  csrf = r.body.csrf;
  r = await write("post", "/api/auth/login", { email, password });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  csrf = r.body.csrf;
  const payload = {
    title: "Integration Service",
    slug: "test-" + randomUUID(),
    summary: "বাংলা service",
    body: "<p>Safe <script>bad()</script>body</p>",
    status: "draft",
    featured: true,
    sort_order: 2,
    fields: { features: ["One"], icon: "Code" },
  };
  r = await write("post", "/api/admin/content/services", payload);
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const id = r.body.id;
  ids.push(id);
  r = await request(app).get("/api/public/services/" + payload.slug);
  assert.equal(r.status, 404);
  r = await agent.get("/api/admin/content/services?q=Integration");
  const stored = r.body.items.find((x) => x.id === id);
  assert.ok(stored);
  assert.doesNotMatch(stored.body, /script|bad/);
  r = await write("put", "/api/admin/content/services/" + id, {
    ...payload,
    status: "published",
    version: stored.version,
  });
  assert.equal(r.status, 200);
  r = await request(app).get("/api/public/services/" + payload.slug);
  assert.equal(r.status, 200);
  assert.equal(r.body.summary, payload.summary);
  r = await write("put", "/api/admin/content/services/" + id, {
    ...payload,
    status: "draft",
    version: stored.version,
  });
  assert.equal(r.status, 409, "stale edit rejected");
  r = await write("post", "/api/admin/content/services", payload);
  assert.equal(r.status, 409, "duplicate slug rejected");
  r = await write("post", `/api/admin/content/services/${id}/delete`, {});
  assert.equal(r.status, 200);
  assert.equal(
    (await request(app).get("/api/public/services/" + payload.slug)).status,
    404,
  );
  r = await write("post", `/api/admin/content/services/${id}/restore`, {});
  assert.equal(r.status, 200);
  assert.equal(
    (await request(app).get("/api/public/services/" + payload.slug)).status,
    200,
  );
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=",
    "base64",
  );
  r = await agent
    .post("/api/admin/media")
    .set("Origin", process.env.APP_ORIGIN)
    .set("X-CSRF-Token", csrf)
    .attach("file", png, { filename: "test.png", contentType: "image/png" });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const media = r.body.id;
  mediaIds.push(media);
  assert.equal(
    (await request(app).get("/media/" + media)).status,
    404,
    "unreferenced upload is private",
  );
  r = await write("post", "/api/admin/content/resources", {
    title: "Private resource",
    slug: "private-" + randomUUID(),
    status: "published",
    fields: { type: "free", private: true, fileId: media },
  });
  assert.equal(r.status, 201);
  ids.push(r.body.id);
  assert.equal(
    (await request(app).get("/media/" + media)).status,
    404,
    "private file blocked",
  );
  assert.equal(
    (await agent.get("/api/admin/media/" + media + "/file")).status,
    200,
    "owner can inspect private file",
  );
  assert.equal(
    (await write("delete", "/api/admin/media/" + media, {})).status,
    409,
    "referenced media protected",
  );
  r = await agent
    .post("/api/admin/media")
    .set("Origin", process.env.APP_ORIGIN)
    .set("X-CSRF-Token", csrf)
    .attach("file", Buffer.from("<script>bad()</script>"), {
      filename: "bad.png",
      contentType: "image/png",
    });
  assert.equal(r.status, 400);
  const key = randomUUID();
  requestIds.push(key);
  const lead = {
    kind: "booking",
    name: "Test visitor",
    email: "visitor@example.test",
    message: "Test only",
    requested_at: new Date(Date.now() + 86400000).toISOString(),
    timezone: "Asia/Dhaka",
    dedup_key: key,
  };
  for (let n = 0; n < 2; n++) {
    r = await request(app)
      .post("/api/requests")
      .set("Origin", process.env.APP_ORIGIN)
      .send(lead);
    assert.equal(r.status, 202, JSON.stringify(r.body));
    assert.match(r.body.message, /not a confirmed/);
  }
  assert.equal(
    (
      await query("SELECT COUNT(*) AS n FROM requests WHERE dedup_key=?", [key])
    )[0].n,
    1,
  );
  // Reuse the uploaded asset as a public image only after removing its private resource reference.
  await query("DELETE FROM content WHERE id=?", [ids[1]]);
  let current = (
    await agent.get("/api/admin/content/services?q=Integration")
  ).body.items.find((x) => x.id === id);
  r = await write("put", "/api/admin/content/services/" + id, {
    ...payload,
    status: "published",
    version: current.version,
    fields: { ...payload.fields, image: "/media/" + media },
  });
  assert.equal(r.status, 200);
  assert.equal((await request(app).get("/media/" + media)).status, 200);
  const secondApp = createApp();
  assert.equal(
    (await request(secondApp).get("/media/" + media)).status,
    200,
    "uploaded bytes survive application recreation",
  );
  assert.equal(
    (await request(secondApp).get("/api/public/services/" + payload.slug))
      .status,
    200,
    "content survives application recreation",
  );
  r = await write("post", "/api/auth/logout", {});
  assert.equal(r.status, 200);
  assert.equal((await agent.get("/api/admin/dashboard")).status, 401);
});

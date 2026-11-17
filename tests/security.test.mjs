import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import session from "express-session";
import {
  safeUrl,
  cleanHtml,
  parseContent,
  requestSchema,
  youtubeId,
  collectMedia,
} from "../server/validation.mjs";
import { createApp } from "../server/app.mjs";
process.env.SESSION_SECRET =
  "isolated-test-session-secret-at-least-32-characters";
process.env.APP_ORIGIN = "http://localhost:3000";
const app = createApp({ store: new session.MemoryStore() });
test("URLs reject active protocols, protocol-relative paths and obfuscated schemes", () => {
  for (const value of [
    "javascript:alert(1)",
    "data:text/html,x",
    "//evil.test",
    "/\\evil.test",
    "java\nscript:alert(1)",
    "https://u:p@example.com",
  ])
    assert.equal(safeUrl(value), false, value);
  for (const value of [
    "https://example.com",
    "/#booking",
    "/media/abc",
    "#booking",
  ])
    assert.equal(safeUrl(value), true, value);
});
test("Rich content strips scripts, handlers and dangerous links while retaining Bangla", () => {
  const html = cleanHtml(
    '<p onclick="bad()">বাংলা <strong>Hello</strong><script>bad()</script><a href="javascript:bad()">X</a><img src=x onerror=bad()></p>',
  );
  assert.match(html, /বাংলা/);
  assert.match(html, /<strong>Hello<\/strong>/);
  assert.doesNotMatch(html, /script|onclick|onerror|javascript|<img/);
});
test("Typed collection validation rejects unknown fields, invalid slugs and URLs", () => {
  assert.throws(() =>
    parseContent("services", {
      title: "X",
      slug: "x",
      fields: { unknown: "x" },
    }),
  );
  assert.throws(() =>
    parseContent("projects", {
      title: "X",
      slug: "x",
      fields: { liveUrl: "javascript:bad()" },
    }),
  );
  assert.throws(() =>
    parseContent("blog", { title: "X", slug: "../draft", fields: {} }),
  );
  const v = parseContent("services", {
    title: "Service",
    slug: "service",
    fields: { features: ["One"] },
  });
  assert.equal(v.status, "draft");
  assert.equal(v.fields.features.length, 1);
});
test("YouTube validation accepts real URL patterns only", () => {
  assert.equal(youtubeId("https://youtu.be/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(youtubeId("https://evil.test/?v=dQw4w9WgXcQ"), null);
  assert.equal(youtubeId("v1"), null);
});
test("Requests require explicit valid timezone and idempotency key", () => {
  assert.throws(() =>
    requestSchema.parse({
      kind: "booking",
      name: "N",
      email: "a@b.com",
      message: "Hi",
      timezone: "Unknown",
      dedup_key: "bad",
    }),
  );
});
test("Asset references include structured image and file links", () => {
  const id = "11111111-1111-4111-a111-111111111111";
  assert.deepEqual(collectMedia({ image: "/media/" + id, fileId: id }), [id]);
});
test("Every admin collection and upload rejects anonymous direct requests", async () => {
  for (const path of [
    "dashboard",
    "content/services",
    "content/blog",
    "settings",
    "requests",
    "media",
    "media/id/file",
  ]) {
    const res = await request(app).get("/api/admin/" + path);
    assert.equal(res.status, 401, path);
  }
  for (const method of ["post", "put", "delete"]) {
    const res = await request(app)
      [method]("/api/admin/media")
      .set("Origin", "http://localhost:3000")
      .send({});
    assert.equal(res.status, 401);
  }
});
test("Cookie writes require same origin and CSRF including login", async () => {
  const agent = request.agent(app);
  let res = await agent.get("/api/auth/session");
  assert.equal(res.status, 200);
  assert.equal(res.body.authenticated, false);
  assert.ok(res.headers["set-cookie"][0].includes("HttpOnly"));
  res = await agent
    .post("/api/auth/login")
    .set("Origin", "http://evil.test")
    .send({});
  assert.equal(res.status, 403);
  res = await agent
    .post("/api/auth/login")
    .set("Origin", "http://localhost:3000")
    .send({});
  assert.equal(res.status, 403);
});

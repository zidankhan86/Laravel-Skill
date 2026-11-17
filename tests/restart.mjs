import { test, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { query, pool } from "../server/db.mjs";
if (
  process.env.ALLOW_TEST_DATABASE !== "yes" ||
  !process.env.DB_NAME?.endsWith("_test")
)
  throw Error("Isolated test database required");
const id = randomUUID(),
  asset = randomUUID(),
  slug = "restart-" + id;
let child;
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=",
  "base64",
);
async function start() {
  child = spawn(process.execPath, ["server/index.mjs"], {
    env: { ...process.env, PORT: "3310", APP_ORIGIN: "http://127.0.0.1:3310" },
    stdio: "ignore",
  });
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch("http://127.0.0.1:3310/api/health")).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw Error("Server did not become healthy");
}
async function stop() {
  if (child) {
    const current = child;
    child = null;
    await new Promise((resolve) => {
      current.once("exit", resolve);
      current.kill("SIGTERM");
    });
  }
}
after(async () => {
  await stop();
  await query("DELETE FROM content WHERE id=?", [id]);
  await query("DELETE FROM media WHERE id=?", [asset]);
  await pool.end();
});
test("fresh production server start preserves DB content/media and returns crawlable detail HTML", async () => {
  await query(
    "INSERT INTO media(id,name,mime,alt,size,bytes) VALUES (?,?,?,?,?,?)",
    [asset, "restart.png", "image/png", "Test", png.length, png],
  );
  await query(
    "INSERT INTO content(id,collection,slug,title,summary,body,status,fields) VALUES (?,?,?,?,?,?,?,?)",
    [
      id,
      "blog",
      slug,
      "Restart proof",
      "বাংলা",
      "<p>Crawlable body</p>",
      "published",
      JSON.stringify({ image: "/media/" + asset, author: "Test" }),
    ],
  );
  await query("INSERT INTO content_media(content_id,media_id) VALUES (?,?)", [
    id,
    asset,
  ]);
  for (let n = 0; n < 2; n++) {
    await start();
    let r = await fetch("http://127.0.0.1:3310/blog/" + slug);
    assert.equal(r.status, 200);
    const html = await r.text();
    assert.match(html, /<h1>Restart proof<\/h1>/);
    assert.match(html, /Crawlable body/);
    r = await fetch("http://127.0.0.1:3310/media/" + asset);
    assert.equal(r.status, 200);
    assert.deepEqual(Buffer.from(await r.arrayBuffer()), png);
    assert.equal(
      (await fetch("http://127.0.0.1:3310/api/admin/dashboard")).status,
      401,
    );
    await stop();
  }
});

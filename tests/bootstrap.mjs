import { test, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID, randomBytes } from "node:crypto";
import { query, pool } from "../server/db.mjs";
if (
  process.env.ALLOW_TEST_DATABASE !== "yes" ||
  !process.env.DB_NAME?.endsWith("_test")
)
  throw Error("Isolated test database required");
const email = randomUUID() + "@example.test",
  password = randomBytes(20).toString("hex");
after(async () => {
  await query("DELETE FROM users WHERE email=?", [email]);
  await pool.end();
});
function run() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["scripts/bootstrap.mjs"], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    let output = "",
      sentEmail = false,
      sentPassword = false;
    const timer = setTimeout(() => {
      child.kill();
      reject(Error("Bootstrap timed out"));
    }, 10000);
    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
      if (!sentEmail && output.includes("Owner email:")) {
        sentEmail = true;
        child.stdin.write(email + "\n");
      }
      if (!sentPassword && output.includes("Password (hidden")) {
        sentPassword = true;
        child.stdin.write(password + "\n");
      }
    });
    child.stderr.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.on("exit", (code) => {
      clearTimeout(timer);
      resolve({ code, output });
    });
  });
}
test("owner bootstrap creates once, hides password and refuses a second owner", async () => {
  assert.equal(
    (await query("SELECT COUNT(*) AS n FROM users"))[0].n,
    0,
    "Test database must contain no owner",
  );
  let r = await run();
  assert.equal(r.code, 0);
  assert.doesNotMatch(r.output, new RegExp(password));
  assert.equal(
    (await query("SELECT COUNT(*) AS n FROM users WHERE email=?", [email]))[0]
      .n,
    1,
  );
  r = await run();
  assert.equal(r.code, 1);
  assert.match(r.output, /Owner already exists/);
});

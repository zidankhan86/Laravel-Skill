import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { pool, query } from "../server/db.mjs";
let muted = false;
const output = new Writable({
  write(chunk, encoding, callback) {
    if (!muted) process.stdout.write(chunk, encoding);
    callback();
  },
});
const rl = createInterface({ input: process.stdin, output, terminal: true });
try {
  const email = (await rl.question("Owner email: ")).trim().toLowerCase();
  process.stdout.write("Password (hidden, minimum 14 characters): ");
  muted = true;
  const password = await rl.question("");
  muted = false;
  process.stdout.write("\n");
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    password.length < 14 ||
    Buffer.byteLength(password) > 72
  )
    throw Error("Invalid email or password length (14 characters to 72 bytes)");
  const c = await pool.getConnection();
  try {
    const locks = await query(
      "SELECT GET_LOCK('portfolio_owner_bootstrap',10) AS acquired",
      [],
      c,
    );
    if (Number(locks[0].acquired) !== 1)
      throw Error("Bootstrap already running");
    if ((await query("SELECT id FROM users LIMIT 1", [], c)).length)
      throw Error("Owner already exists; bootstrap is disabled");
    await query(
      "INSERT INTO users(id,email,password_hash) VALUES (?,?,?)",
      [randomUUID(), email, await bcrypt.hash(password, 12)],
      c,
    );
    console.log("Owner created.");
  } finally {
    await query("SELECT RELEASE_LOCK('portfolio_owner_bootstrap')", [], c);
    c.release();
  }
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  rl.close();
  await pool.end();
}

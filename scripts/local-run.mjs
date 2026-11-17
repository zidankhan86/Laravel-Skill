import { spawn } from "node:child_process";
import { mkdirSync, openSync, closeSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);
dotenv.config({ quiet: true });
if (
  process.env.DB_NAME !== "tanvir_portfolio_local" ||
  process.env.DB_PORT !== "3308"
) {
  throw Error(
    "This launcher requires the local database configuration in .env.",
  );
}
mkdirSync(".local/logs", { recursive: true });
const children = [];
let stopping = false;
function launch(name, command, args) {
  const fd = openSync(`.local/logs/${name}.log`, "a", 0o600);
  const child = spawn(command, args, {
    cwd: root,
    env: process.env,
    stdio: ["ignore", fd, fd],
  });
  closeSync(fd);
  children.push(child);
  child.on("error", () => {
    console.error(`${name} could not start. Check .local/logs.`);
    stop(1);
  });
  child.on("exit", () => {
    if (!stopping) {
      console.error(`${name} stopped. Check .local/logs/${name}.log.`);
      stop(1);
    }
  });
  return child;
}
async function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children.reverse())
    if (child.exitCode === null && child.signalCode === null)
      child.kill("SIGTERM");
  await Promise.race([
    Promise.all(
      children.map((child) =>
        child.exitCode !== null || child.signalCode !== null
          ? Promise.resolve()
          : new Promise((resolve) => child.once("exit", resolve)),
      ),
    ),
    new Promise((resolve) => setTimeout(resolve, 10000)),
  ]);
  process.exit(code);
}
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
const dbOptions = {
  host: "127.0.0.1",
  port: 3308,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectTimeout: 1000,
};
// Refuse an already running instance; never attach to or stop someone else's database.
try {
  const c = await mysql.createConnection(dbOptions);
  await c.end();
  console.error(
    "Local database is already running. Use the existing preview or stop it first.",
  );
  process.exit(1);
} catch (e) {
  if (e.code !== "ECONNREFUSED")
    throw Error(
      "Port 3308 is occupied or local database access is unavailable.",
    );
}
launch("mysql", path.join(root, ".local/runtime/mysql/bin/mysqld"), [
  "--no-defaults",
  `--basedir=${root}/.local/runtime/mysql`,
  `--datadir=${root}/.local/mysql-data`,
  "--bind-address=127.0.0.1",
  "--port=3308",
  "--socket=/tmp/tanvir-portfolio-local.sock",
  "--mysqlx=OFF",
  `--log-error=${root}/.local/logs/mysql.log`,
  `--pid-file=${root}/.local/mysql.pid`,
]);
let connected = false;
for (let i = 0; i < 100 && !stopping; i++) {
  try {
    const c = await mysql.createConnection(dbOptions);
    await c.end();
    connected = true;
    break;
  } catch {}
  await new Promise((resolve) => setTimeout(resolve, 100));
}
if (!connected) {
  console.error("Database did not start. Check .local/logs/mysql.log.");
  await stop(1);
}
launch("api", process.execPath, ["server/index.mjs"]);
launch("frontend", process.execPath, [
  "node_modules/vite/bin/vite.js",
  "--host",
  "127.0.0.1",
  "--port",
  "3000",
  "--strictPort",
]);
let ready = false;
for (let i = 0; i < 100 && !stopping; i++) {
  try {
    const [a, b] = await Promise.all([
      fetch("http://localhost:3000"),
      fetch("http://127.0.0.1:3001/api/health"),
    ]);
    if (a.ok && b.ok) {
      ready = true;
      break;
    }
  } catch {}
  await new Promise((resolve) => setTimeout(resolve, 100));
}
if (!ready) {
  console.error("Preview did not become ready. Check .local/logs.");
  await stop(1);
}
console.log(
  "Website: http://localhost:3000\nAdmin:   http://localhost:3000/admin\nPress Ctrl+C to stop the website and database.",
);

import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const label = "com.tanvir.portfolio.local";
const domain = `gui/${process.getuid()}`;
const target = `${domain}/${label}`;
const plist = path.join(root, ".local", `${label}.plist`);
const action = process.argv[2] || "start";
const xml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c],
  );
const ctl = (...args) =>
  spawnSync("/bin/launchctl", args, { encoding: "utf8" });
const installed = () => ctl("print", target).status === 0;
if (!["start", "stop", "status"].includes(action))
  throw Error("Use start, stop or status");
if (action === "stop") {
  if (installed()) {
    const result = ctl("bootout", target);
    if (result.status !== 0)
      throw Error(result.stderr.trim() || "Could not stop local service");
  }
  // bootout can return before launchd has finished removing the job.
  for (let i = 0; i < 100 && installed(); i++) {
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  if (installed())
    throw Error("Local service is still shutting down; try again shortly.");
  console.log("Local website service stopped. Database files are preserved.");
} else if (action === "status") {
  const result = ctl("print", target);
  if (result.status !== 0) {
    console.log("Local service is not running.");
    process.exitCode = 1;
  } else
    console.log(
      result.stdout
        .split("\n")
        .filter((line) => /^\s*(state|pid|last exit code) =/.test(line))
        .map((s) => s.trim())
        .join("\n"),
    );
} else {
  if (!installed()) {
    mkdirSync(path.join(root, ".local/logs"), { recursive: true });
    writeFileSync(
      plist,
      `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>${label}</string>
<key>ProgramArguments</key><array><string>${xml(path.join(root, ".local/runtime/node/bin/node"))}</string><string>${xml(path.join(root, "scripts/local-run.mjs"))}</string></array>
<key>WorkingDirectory</key><string>${xml(root)}</string>
<key>EnvironmentVariables</key><dict><key>PATH</key><string>${xml(path.join(root, ".local/runtime/node/bin"))}:/usr/bin:/bin:/usr/sbin:/sbin</string></dict>
<key>RunAtLoad</key><true/>
<key>KeepAlive</key><dict><key>SuccessfulExit</key><false/></dict>
<key>ThrottleInterval</key><integer>10</integer>
<key>ExitTimeOut</key><integer>20</integer>
<key>StandardOutPath</key><string>${xml(path.join(root, ".local/logs/service.log"))}</string>
<key>StandardErrorPath</key><string>${xml(path.join(root, ".local/logs/service-error.log"))}</string>
</dict></plist>`,
      { mode: 0o600 },
    );
    const result = ctl("bootstrap", domain, plist);
    if (result.status !== 0)
      throw Error(result.stderr.trim() || "Could not start local service");
  }
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try {
      const responses = await Promise.all([
        fetch("http://localhost:3000", { signal: AbortSignal.timeout(1500) }),
        fetch("http://localhost:3000/api/health", {
          signal: AbortSignal.timeout(1500),
        }),
      ]);
      if (responses.every((r) => r.ok)) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  if (!ready)
    throw Error(
      "Service did not become ready. Inspect .local/logs/service-error.log and mysql.log.",
    );
  console.log(
    "Running independently of this terminal:\nWebsite: http://localhost:3000\nAdmin: http://localhost:3000/admin",
  );
}

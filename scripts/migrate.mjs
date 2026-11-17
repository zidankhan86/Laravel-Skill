import { readFile, readdir } from "node:fs/promises";
import { pool, query } from "../server/db.mjs";
const c = await pool.getConnection();
try {
  const lock = await query(
    "SELECT GET_LOCK('portfolio_migrations', 10) AS acquired",
    [],
    c,
  );
  if (Number(lock[0].acquired) !== 1)
    throw Error("Another migration is running");
  await query(
    "CREATE TABLE IF NOT EXISTS schema_migrations (name VARCHAR(255) PRIMARY KEY, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
    [],
    c,
  );
  for (const name of (
    await readdir(new URL("../server/migrations/", import.meta.url))
  )
    .filter((n) => n.endsWith(".sql"))
    .sort()) {
    if (
      (
        await query(
          "SELECT name FROM schema_migrations WHERE name=?",
          [name],
          c,
        )
      ).length
    )
      continue;
    const sql = await readFile(
      new URL("../server/migrations/" + name, import.meta.url),
      "utf8",
    );
    for (const statement of sql
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean))
      await query(statement, [], c);
    await query("INSERT INTO schema_migrations(name) VALUES (?)", [name], c);
    console.log("Applied", name);
  }
} finally {
  await query("SELECT RELEASE_LOCK('portfolio_migrations')", [], c);
  c.release();
  await pool.end();
}

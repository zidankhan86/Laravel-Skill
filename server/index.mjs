import { createApp } from "./app.mjs";
import { pool } from "./db.mjs";
const server = createApp().listen(
  Number(process.env.PORT || 3001),
  process.env.HOST || "0.0.0.0",
  () => console.log("Portfolio server listening"),
);
async function close() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}
process.on("SIGTERM", close);
process.on("SIGINT", close);

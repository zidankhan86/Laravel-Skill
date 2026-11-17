import session from "express-session";
import { query } from "./db.mjs";
export class MysqlStore extends session.Store {
  get(sid, cb) {
    query("SELECT data FROM sessions WHERE sid=? AND expires_at>?", [
      sid,
      Date.now(),
    ])
      .then((rows) => cb(null, rows[0] ? JSON.parse(rows[0].data) : null))
      .catch(cb);
  }
  set(sid, data, cb) {
    query(
      "INSERT INTO sessions(sid,data,expires_at) VALUES (?,?,?) ON DUPLICATE KEY UPDATE data=VALUES(data),expires_at=VALUES(expires_at)",
      [sid, JSON.stringify(data), new Date(data.cookie.expires).getTime()],
    )
      .then(() => cb?.())
      .catch((e) => cb?.(e));
  }
  destroy(sid, cb) {
    query("DELETE FROM sessions WHERE sid=?", [sid])
      .then(() => cb?.())
      .catch((e) => cb?.(e));
  }
  touch(sid, data, cb) {
    query("UPDATE sessions SET expires_at=? WHERE sid=?", [
      new Date(data.cookie.expires).getTime(),
      sid,
    ])
      .then(() => cb?.())
      .catch((e) => cb?.(e));
  }
}

import { extensionCsp } from "./public-extensions.mjs";
import { registerEditor } from "./editor.mjs";
import "dotenv/config";
import express from "express";
import session from "express-session";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import bcrypt from "bcryptjs";
import multer from "multer";
import { fileTypeFromBuffer } from "file-type";
import { randomUUID, randomBytes, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool, query, transaction } from "./db.mjs";
import { MysqlStore } from "./session-store.mjs";
import {
  collections,
  parseContent,
  requestSchema,
  collectMedia,
  safeUrl,
} from "./validation.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const published =
  "status='published' AND deleted_at IS NULL AND (published_at IS NULL OR published_at<=UTC_TIMESTAMP())";
const decode = (row) =>
  row
    ? {
        ...row,
        fields:
          typeof row.fields === "string" ? JSON.parse(row.fields) : row.fields,
        featured: !!row.featured,
      }
    : null;
const jsonValue = (row) =>
  typeof row.value === "string" ? JSON.parse(row.value) : row.value;
const date = (v) =>
  v ? new Date(v).toISOString().slice(0, 19).replace("T", " ") : null;
const err = (status, message) => Object.assign(Error(message), { status });
const page = (req) => ({
  limit: Math.min(100, Math.max(1, Number(req.query.limit) || 20)),
  offset:
    Math.max(0, (Number(req.query.page) || 1) - 1) *
    Math.min(100, Math.max(1, Number(req.query.limit) || 20)),
});
async function refs(c, id, value, settings = false) {
  const table = settings ? "settings_media" : "content_media",
    key = settings ? "settings_id" : "content_id";
  await query(`DELETE FROM ${table} WHERE ${key}=?`, [id], c);
  for (const mediaId of collectMedia(value))
    await query(
      `INSERT INTO ${table}(${key},media_id) VALUES (?,?)`,
      [id, mediaId],
      c,
    );
}
export function createApp({ store = new MysqlStore() } = {}) {
  const app = express();
  const production = process.env.NODE_ENV === "production";
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)
    throw Error("SESSION_SECRET must contain at least 32 characters");
  if (!process.env.APP_ORIGIN) throw Error("APP_ORIGIN is required");
  const origin = new URL(process.env.APP_ORIGIN).origin;
  app.disable("x-powered-by");
  app.set("trust proxy", Number(process.env.TRUST_PROXY || 0));
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com",
          ],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "https:", "data:"],
          connectSrc: ["'self'"],
          frameSrc: ["'self'", "https://www.youtube-nocookie.com"],
          upgradeInsecureRequests: production ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(express.json({ limit: "300kb" }));
  app.use("/api", (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
  app.use("/api/admin", (_req, res, next) => {
    res.set("X-Robots-Tag", "noindex, nofollow");
    next();
  });
  const sessions = session({
    name: "portfolio.sid",
    secret: process.env.SESSION_SECRET,
    store,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: production,
      sameSite: "lax",
      maxAge: 8 * 60 * 60 * 1000,
    },
  });
  app.use("/api/auth", sessions);
  app.use("/api/admin", sessions);
  app.use(["/api/auth", "/api/admin", "/api/requests"], (req, res, next) => {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
    if (req.get("origin") !== origin) return next(err(403, "Origin rejected"));
    next();
  });
  const auth = (req, _res, next) =>
    req.session?.userId ? next() : next(err(401, "Sign in required"));
  const csrf = (req, _res, next) => {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
    const token = req.get("x-csrf-token") || "";
    const expected = req.session?.csrf || "";
    if (
      !expected ||
      Buffer.byteLength(token) !== Buffer.byteLength(expected) ||
      !timingSafeEqual(Buffer.from(token), Buffer.from(expected))
    )
      return next(err(403, "Invalid security token"));
    next();
  };
  app.get("/api/health", async (_req, res) => {
    try {
      await query("SELECT 1");
      res.json({ status: "ok" });
    } catch {
      res.status(503).json({ status: "unavailable" });
    }
  });
  app.get("/api/auth/session", (req, res) => {
    req.session.csrf ||= randomBytes(32).toString("hex");
    res.json({ authenticated: !!req.session.userId, csrf: req.session.csrf });
  });
  app.post(
    "/api/auth/login",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 10,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
    csrf,
    async (req, res) => {
      const { email, password } = req.body || {};
      if (
        typeof email !== "string" ||
        typeof password !== "string" ||
        email.length > 254 ||
        Buffer.byteLength(password) > 72
      )
        throw err(400, "Invalid credentials");
      const users = await query("SELECT * FROM users WHERE email=?", [
        email.trim().toLowerCase(),
      ]);
      // A valid fixed hash makes unknown-user verification perform the same work.
      const hash =
        users[0]?.password_hash ||
        "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxKahpVgIcFyv9K1LKL7L0Uvn7C";
      const valid = await bcrypt.compare(password, hash);
      if (!users[0] || !valid) throw err(401, "Invalid credentials");
      await new Promise((resolve, reject) =>
        req.session.regenerate((e) => (e ? reject(e) : resolve())),
      );
      req.session.userId = users[0].id;
      req.session.csrf = randomBytes(32).toString("hex");
      res.json({ authenticated: true, csrf: req.session.csrf });
    },
  );
  app.post("/api/auth/logout", auth, csrf, async (req, res) => {
    await new Promise((resolve, reject) =>
      req.session.destroy((e) => (e ? reject(e) : resolve())),
    );
    res
      .clearCookie("portfolio.sid", {
        httpOnly: true,
        secure: production,
        sameSite: "lax",
      })
      .json({ ok: true });
  });
  app.post("/api/auth/password", auth, csrf, async (req, res) => {
    const { currentPassword, password } = req.body || {};
    if (
      typeof password !== "string" ||
      password.length < 14 ||
      Buffer.byteLength(password) > 72 ||
      typeof currentPassword !== "string"
    )
      throw err(
        400,
        "Password must have at least 14 characters and at most 72 bytes",
      );
    const user = (
      await query("SELECT * FROM users WHERE id=?", [req.session.userId])
    )[0];
    if (!(await bcrypt.compare(currentPassword, user.password_hash)))
      throw err(400, "Current password is incorrect");
    await transaction(async (c) => {
      await query(
        "UPDATE users SET password_hash=? WHERE id=?",
        [await bcrypt.hash(password, 12), user.id],
        c,
      );
      await query("DELETE FROM sessions", [], c);
    });
    res.clearCookie("portfolio.sid").json({ ok: true });
  });
  app.get("/api/public/appearance", async (_req, res) => {
    const rows = await query("SELECT * FROM settings WHERE id = 'appearance'");
    res.json(rows[0] ? jsonValue(rows[0]) : {});
  });
  app.get("/api/public/site", async (_req, res) => {
    const content = (
      await query(
        `SELECT * FROM content WHERE ${published} ORDER BY sort_order,created_at`,
      )
    ).map(decode);
    const settings = Object.fromEntries(
      (await query("SELECT * FROM settings")).map((row) => [
        row.id,
        jsonValue(row),
      ]),
    );
    res.json({ content: content.map(publicRecord), settings });
  });
  app.get("/api/public/:collection/:slug", async (req, res) => {
    if (!collections.includes(req.params.collection))
      throw err(404, "Not found");
    const rows = await query(
      `SELECT * FROM content WHERE collection=? AND slug=? AND ${published}`,
      [req.params.collection, req.params.slug],
    );
    if (!rows[0]) throw err(404, "Not found");
    res.json(publicRecord(decode(rows[0])));
  });
  app.post(
    "/api/requests",
    rateLimit({
      windowMs: 60 * 60 * 1000,
      limit: 10,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
    async (req, res) => {
      const v = requestSchema.parse(req.body);
      if (
        v.kind === "booking" &&
        (!v.requested_at || new Date(v.requested_at) <= new Date())
      )
        throw err(400, "Choose a future requested time");
      try {
        await query(
          "INSERT INTO requests(id,kind,name,email,phone,service,message,requested_at,timezone,notes,dedup_key) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
          [
            randomUUID(),
            v.kind,
            v.name,
            v.email,
            v.phone,
            v.service,
            v.message,
            date(v.requested_at),
            v.timezone,
            "",
            v.dedup_key,
          ],
        );
      } catch (e) {
        if (e.code !== "ER_DUP_ENTRY") throw e;
      }
      res.status(202).json({
        message:
          v.kind === "booking"
            ? "Request received. This is not a confirmed appointment."
            : "Message received. Thank you.",
      });
    },
  );
  app.use("/api/admin", auth, csrf);
  registerEditor(app, refs);
  app.get("/api/admin/dashboard", async (_req, res) => {
    const counts = await query(
      "SELECT collection,status,COUNT(*) AS count FROM content WHERE deleted_at IS NULL GROUP BY collection,status",
    );
    const requests = await query(
      "SELECT kind,status,COUNT(*) AS count FROM requests GROUP BY kind,status",
    );
    const recent = await query(
      "SELECT id,kind,name,status,created_at FROM requests ORDER BY created_at DESC LIMIT 8",
    );
    res.json({ counts, requests, recent });
  });
  app.get("/api/admin/content/:collection", async (req, res) => {
    if (!collections.includes(req.params.collection))
      throw err(404, "Not found");
    const { limit, offset } = page(req);
    const args = [
      req.params.collection,
      `%${String(req.query.q || "").slice(0, 200)}%`,
    ];
    let where = "collection=? AND title LIKE ?";
    where +=
      req.query.deleted === "true"
        ? " AND deleted_at IS NOT NULL"
        : " AND deleted_at IS NULL";
    if (["draft", "published"].includes(req.query.status)) {
      where += " AND status=?";
      args.push(req.query.status);
    }
    const rows = await query(
      `SELECT * FROM content WHERE ${where} ORDER BY sort_order,created_at LIMIT ${Math.floor(limit)} OFFSET ${Math.floor(offset)}`,
      args,
    );
    const total = await query(
      `SELECT COUNT(*) AS count FROM content WHERE ${where}`,
      args,
    );
    res.json({ items: rows.map(decode), total: total[0].count });
  });
  app.post("/api/admin/content/:collection", async (req, res) => {
    const v = parseContent(req.params.collection, req.body);
    const id = randomUUID();
    await transaction(async (c) => {
      await query(
        "INSERT INTO content(id,collection,slug,title,summary,body,status,featured,sort_order,fields,seo_title,seo_description,published_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
        [
          id,
          req.params.collection,
          v.slug,
          v.title,
          v.summary,
          v.body,
          v.status,
          v.featured,
          v.sort_order,
          JSON.stringify(v.fields),
          v.seo_title,
          v.seo_description,
          date(v.published_at),
        ],
        c,
      );
      await refs(c, id, v);
    });
    res.status(201).json({ id });
  });
  app.put("/api/admin/content/:collection/:id", async (req, res) => {
    const v = parseContent(req.params.collection, req.body);
    await transaction(async (c) => {
      const result = await query(
        "UPDATE content SET slug=?,title=?,summary=?,body=?,status=?,featured=?,sort_order=?,fields=?,seo_title=?,seo_description=?,published_at=?,version=version+1 WHERE id=? AND collection=? AND version=? AND deleted_at IS NULL",
        [
          v.slug,
          v.title,
          v.summary,
          v.body,
          v.status,
          v.featured,
          v.sort_order,
          JSON.stringify(v.fields),
          v.seo_title,
          v.seo_description,
          date(v.published_at),
          req.params.id,
          req.params.collection,
          v.version || 0,
        ],
        c,
      );
      if (!result.affectedRows)
        throw err(409, "Record changed. Reload before saving.");
      await refs(c, req.params.id, v);
    });
    res.json({ ok: true });
  });
  app.post("/api/admin/content/:collection/:id/:action", async (req, res) => {
    if (
      !collections.includes(req.params.collection) ||
      !["delete", "restore"].includes(req.params.action)
    )
      throw err(404, "Not found");
    await query(
      `UPDATE content SET deleted_at=${req.params.action === "delete" ? "UTC_TIMESTAMP()" : "NULL"},version=version+1 WHERE id=? AND collection=?`,
      [req.params.id, req.params.collection],
    );
    res.json({ ok: true });
  });
  app.get("/api/admin/settings", async (_req, res) =>
    res.json(
      Object.fromEntries(
        (await query("SELECT * FROM settings")).map((r) => [
          r.id,
          { value: jsonValue(r), version: r.version },
        ]),
      ),
    ),
  );
  app.put("/api/admin/settings/:id", async (req, res) => {
    const definition = JSON.parse(
      await readFile(
        path.join(root, "server/settings-definition.json"),
        "utf8",
      ),
    )[req.params.id];
    if (!definition) throw err(404, "Unknown settings");
    const { value, version } = req.body;
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value) ||
      Object.keys(value).some((k) => !Object.hasOwn(definition, k))
    )
      throw err(400, "Invalid settings");
    for (const [key, rule] of Object.entries(definition)) {
      const v = value[key];
      if (
        typeof v !== "string" ||
        v.length > rule.max ||
        (rule.color && !/^#[0-9a-fA-F]{6}$/.test(v)) ||
        (rule.enum && !rule.enum.includes(v)) ||
        (rule.url && !safeUrl(v, { contact: true })) ||
        (rule.image &&
          v &&
          !(safeUrl(v) && (v.startsWith("/") || /^https?:/.test(v))))
      )
        throw err(400, `Invalid field: ${key}`);
    }
    if (req.params.id === "integrations") {
      for (const [key, pattern] of Object.entries({
        facebook: /^\d{5,25}$/,
        gtm: /^GTM-[A-Z0-9]{4,20}$/,
        tiktok: /^[A-Z0-9]{10,30}$/,
      })) {
        if (
          (value[key + "Id"] || value[key + "Enabled"] === "on") &&
          !pattern.test(value[key + "Id"])
        )
          throw err(400, "Invalid " + key + " ID");
      }
    }
    if (req.params.id === "logos")
      for (const loc of ["header", "footer"])
        if (value[loc + "Mode"] === "image" && !value[loc + "Image"])
          throw err(400, "Select the " + loc + " logo image");
    if (
      req.params.id === "settings" &&
      (!/^https?:\/\//.test(value.canonicalDomain) ||
        new URL(value.canonicalDomain).pathname !== "/")
    )
      throw err(400, "Canonical domain must be an http(s) origin");
    if (
      req.params.id === "navigation" &&
      [value.menu, value.footerMenu]
        .join("\n")
        .split("\n")
        .filter(Boolean)
        .some((line) => {
          const parts = line.split("|");
          return (
            parts.length !== 2 ||
            !parts[0].trim() ||
            !parts[1] ||
            !safeUrl(parts[1], { contact: true })
          );
        })
    )
      throw err(400, "Menu rows must be Label|safe URL");
    if (
      req.params.id === "navigation" &&
      value.socialOrder
        .split(",")
        .some(
          (k) =>
            ![
              "facebook",
              "linkedin",
              "twitter",
              "youtube",
              "instagram",
              "github",
            ].includes(k),
        )
    )
      throw err(400, "Unknown social icon");
    if (
      req.params.id === "homepage" &&
      [value.sections, value.sectionOrder]
        .join(",")
        .split(",")
        .filter((k) => k.trim())
        .some(
          (k) =>
            ![
              "gallery",
              "closingCta",
              "blog",
              "navigation",
              "footer",
              "floatingActions",
              "hero",
              "trust",
              "about",
              "journey",
              "services",
              "videos",
              "projects",
              "deals",
              "resources",
              "testimonials",
              "booking",
            ].includes(k.trim()),
        )
    )
      throw err(400, "Unknown homepage section");
    await transaction(async (c) => {
      const result = await query(
        "UPDATE settings SET value=?,version=version+1 WHERE id=? AND version=?",
        [JSON.stringify(value), req.params.id, version],
        c,
      );
      if (!result.affectedRows)
        throw err(409, "Settings changed; reload before saving");
      await refs(c, req.params.id, value, true);
    });
    res.json({ ok: true });
  });
  app.get("/api/admin/requests", async (req, res) => {
    const { limit, offset } = page(req);
    let where = "1=1";
    const args = [];
    if (["booking", "contact"].includes(req.query.kind)) {
      where += " AND kind=?";
      args.push(req.query.kind);
    }
    if (
      ["new", "contacted", "scheduled", "completed", "cancelled"].includes(
        req.query.status,
      )
    ) {
      where += " AND status=?";
      args.push(req.query.status);
    }
    if (req.query.q) {
      where += " AND (name LIKE ? OR email LIKE ?)";
      args.push(
        `%${String(req.query.q).slice(0, 200)}%`,
        `%${String(req.query.q).slice(0, 200)}%`,
      );
    }
    res.json({
      items: await query(
        `SELECT * FROM requests WHERE ${where} ORDER BY created_at DESC LIMIT ${Math.floor(limit)} OFFSET ${Math.floor(offset)}`,
        args,
      ),
      total: (
        await query(
          `SELECT COUNT(*) AS count FROM requests WHERE ${where}`,
          args,
        )
      )[0].count,
    });
  });
  app.get("/api/admin/requests/:id", async (req, res) => {
    const [row] = await query("SELECT * FROM requests WHERE id=?", [
      req.params.id,
    ]);
    if (!row) throw err(404, "Lead not found");
    res.json(row);
  });
  const updateRequest = async (req, res) => {
    const { status, notes, version } = req.body;
    if (
      !["new", "contacted", "scheduled", "completed", "cancelled"].includes(
        status,
      ) ||
      (notes !== undefined &&
        (typeof notes !== "string" || notes.length > 10000)) ||
      (req.method === "PATCH" && !Number.isInteger(version)) ||
      (req.method === "PUT" && typeof notes !== "string")
    )
      throw err(400, "Invalid status or notes");
    const details = {};
    const detailRules = {
      name: 150,
      email: 254,
      phone: 50,
      service: 255,
      message: 5000,
    };
    for (const [key, max] of Object.entries(detailRules)) {
      if (req.body[key] === undefined) continue;
      const v = req.body[key];
      if (
        typeof v !== "string" ||
        v.length > max ||
        (["name", "message"].includes(key) && !v.trim()) ||
        (key === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
      )
        throw err(400, "Invalid " + key);
      details[key] = v.trim();
    }
    const updated = await transaction(async (c) => {
      const [row] = await query(
        "SELECT * FROM requests WHERE id=? FOR UPDATE",
        [req.params.id],
        c,
      );
      if (!row) throw err(404, "Lead not found");
      if (version !== undefined && row.version !== version)
        throw err(
          409,
          "This lead changed in another window. Reload it before saving.",
        );
      await query(
        "UPDATE requests SET status=?,notes=?,version=version+1 WHERE id=?",
        [status, notes === undefined ? row.notes : notes, req.params.id],
        c,
      );
      if (Object.keys(details).length)
        await query(
          "UPDATE requests SET " +
            Object.keys(details)
              .map((k) => k + "=?")
              .join(",") +
            " WHERE id=?",
          [...Object.values(details), req.params.id],
          c,
        );
      return {
        ...row,
        ...details,
        status,
        notes: notes === undefined ? row.notes : notes,
        version: row.version + 1,
      };
    });
    res.json(updated);
  };
  app.put("/api/admin/requests/:id", updateRequest);
  app.patch("/api/admin/requests/:id", updateRequest);
  app.get("/api/admin/media", async (req, res) => {
    const { limit, offset } = page(req);
    const args = [
      `%${String(req.query.q || "").slice(0, 200)}%`,
      `%${String(req.query.q || "").slice(0, 200)}%`,
    ];
    let where = "(name LIKE ? OR alt LIKE ?)";
    if (req.query.type === "image") where += " AND mime LIKE 'image/%'";
    if (req.query.type === "document") where += " AND mime='application/pdf'";
    res.json({
      items: await query(
        `SELECT id,name,mime,alt,size,created_at,version FROM media WHERE ${where} ORDER BY created_at DESC,id LIMIT ${Math.floor(limit)} OFFSET ${Math.floor(offset)}`,
        args,
      ),
      total: (
        await query(`SELECT COUNT(*) AS count FROM media WHERE ${where}`, args)
      )[0].count,
    });
  });
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 2 },
  });
  const checkedUpload = async (req) => {
    const f = req.file;
    if (!f) throw err(400, "Select a file");
    const type = await fileTypeFromBuffer(f.buffer);
    const allowed = {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/webp": [".webp"],
      "application/pdf": [".pdf"],
    };
    if (
      !type ||
      !allowed[type.mime]?.includes(
        path.extname(f.originalname).toLowerCase(),
      ) ||
      f.mimetype !== type.mime
    )
      throw err(400, "Only verified PNG, JPEG, WebP and PDF files are allowed");
    return { f, type };
  };
  app.post("/api/admin/media", upload.single("file"), async (req, res) => {
    const { f, type } = await checkedUpload(req);
    const id = randomUUID();
    await query(
      "INSERT INTO media(id,name,mime,alt,size,bytes) VALUES (?,?,?,?,?,?)",
      [
        id,
        path.basename(f.originalname).slice(0, 255),
        type.mime,
        String(req.body.alt || "").slice(0, 500),
        f.size,
        f.buffer,
      ],
    );
    res.status(201).json({ id, url: "/media/" + id });
  });
  app.put("/api/admin/media/:id", async (req, res) => {
    const { alt, name, version } = req.body;
    if (
      typeof alt !== "string" ||
      alt.length > 500 ||
      (name !== undefined &&
        (typeof name !== "string" || !name.trim() || name.length > 255))
    )
      throw err(400, "Invalid name or alternative text");
    const args = [
      alt,
      ...(name === undefined ? [] : [path.basename(name.trim())]),
      req.params.id,
      ...(version === undefined ? [] : [version]),
    ];
    const result = await query(
      `UPDATE media SET alt=?,${name === undefined ? "" : "name=?,"}version=version+1 WHERE id=?${version === undefined ? "" : " AND version=?"}`,
      args,
    );
    if (!result.affectedRows)
      throw err(409, "Media changed or was deleted. Reload before saving.");
    res.json({ ok: true });
  });
  app.put(
    "/api/admin/media/:id/file",
    upload.single("file"),
    async (req, res) => {
      const { f, type } = await checkedUpload(req);
      const version = Number(req.body.version);
      if (!Number.isInteger(version) || version < 1)
        throw err(400, "Media version is required");
      await transaction(async (c) => {
        const [row] = await query(
          "SELECT id,mime,version FROM media WHERE id=? FOR UPDATE",
          [req.params.id],
          c,
        );
        if (!row) throw err(404, "Media not found");
        if (row.version !== version)
          throw err(409, "Media changed. Reload before replacing.");
        if (row.mime.startsWith("image/") !== type.mime.startsWith("image/"))
          throw err(
            400,
            "Replace an image with an image, or a PDF with a PDF.",
          );
        await query(
          "UPDATE media SET mime=?,size=?,bytes=?,version=version+1 WHERE id=?",
          [type.mime, f.size, f.buffer, req.params.id],
          c,
        );
      });
      res.json({ ok: true });
    },
  );
  app.get("/api/admin/media/:id/usage", async (req, res) => {
    res.json({
      content: await query(
        "SELECT c.id,c.title,c.collection FROM content c JOIN content_media m ON c.id=m.content_id WHERE m.media_id=?",
        [req.params.id],
      ),
      settings: await query(
        "SELECT settings_id FROM settings_media WHERE media_id=?",
        [req.params.id],
      ),
    });
  });
  app.delete("/api/admin/media/:id", async (req, res) => {
    await query("DELETE FROM media WHERE id=?", [req.params.id]);
    res.json({ ok: true });
  });
  app.get("/api/admin/media/:id/file", async (req, res) =>
    sendMedia(req.params.id, res),
  );
  app.get("/media/:id", async (req, res) => {
    const content = (
      await query(
        `SELECT c.* FROM content c JOIN content_media m ON c.id=m.content_id WHERE m.media_id=? AND ${published}`,
        [req.params.id],
      )
    ).map(decode);
    const settings = await query(
      "SELECT settings_id FROM settings_media WHERE media_id=?",
      [req.params.id],
    );
    const publicUse = content.some(
      (c) =>
        !(
          c.collection === "resources" &&
          c.fields.private &&
          c.fields.fileId === req.params.id
        ),
    );
    // A protected resource always takes precedence, even if another record references the asset.
    const protectedUse = await query(
      "SELECT id FROM content WHERE collection='resources' AND JSON_UNQUOTE(JSON_EXTRACT(fields,'$.fileId'))=? AND JSON_EXTRACT(fields,'$.private')=true",
      [req.params.id],
    );
    if (protectedUse.length || (!publicUse && !settings.length))
      throw err(404, "Not found");
    await sendMedia(req.params.id, res);
  });
  app.get("/robots.txt", (_req, res) =>
    res
      .type("text")
      .send(
        `User-agent: *\nDisallow: /admin\nDisallow: /api/\nSitemap: ${origin}/sitemap.xml\n`,
      ),
  );
  app.get("/sitemap.xml", async (_req, res) => {
    const rows = await query(
      `SELECT collection,slug FROM content WHERE ${published}`,
    );
    const paths = [
      "/",
      "/about",
      "/services",
      "/projects",
      "/deals",
      "/resources",
      "/blog",
      ...rows.map((r) => `/${r.collection}/${r.slug}`),
    ];
    res
      .type("xml")
      .send(
        '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
          paths
            .map((p) => `<url><loc>${escapeHtml(origin + p)}</loc></url>`)
            .join("") +
          "</urlset>",
      );
  });
  app.use("/api", (_req, _res, next) => next(err(404, "Not found")));
  app.use(
    express.static(path.join(root, "dist"), { index: false, maxAge: "1h" }),
  );
  app.get("/{*path}", async (req, res) => {
    let html = await readFile(path.join(root, "dist/index.html"), "utf8");
    if (
      !req.path.startsWith("/admin") &&
      !Object.hasOwn(req.query, "edit") &&
      !Object.hasOwn(req.query, "preview")
    ) {
      const extensions = Object.fromEntries(
        (
          await query(
            "SELECT * FROM settings WHERE id IN ('integrations','customCode')",
          )
        ).map((r) => [r.id, jsonValue(r)]),
      );
      res.set(
        "Content-Security-Policy",
        extensionCsp(String(res.get("Content-Security-Policy")), extensions),
      );
    }
    const settingsRows = await query(
      "SELECT value FROM settings WHERE id='settings'",
    );
    const seo = settingsRows[0] ? jsonValue(settingsRows[0]) : {};
    let title = seo.siteTitle || "Md Tanvir Hossain",
      description = seo.description || "",
      article = "";
    const parts = req.path.split("/").filter(Boolean);
    if (parts[0] === "admin") {
      res.set("X-Robots-Tag", "noindex, nofollow");
    } else if (parts.length === 2 && collections.includes(parts[0])) {
      const rows = await query(
        `SELECT * FROM content WHERE collection=? AND slug=? AND ${published}`,
        [parts[0], parts[1]],
      );
      if (!rows[0]) return res.status(404).send("Not found");
      const r = decode(rows[0]);
      title = r.seo_title || r.title;
      description = r.seo_description || r.summary;
      article = `<article><h1>${escapeHtml(r.title)}</h1><p>${escapeHtml(r.summary)}</p>${r.body}</article>`;
    } else if (
      ![
        "/",
        "/about",
        "/services",
        "/projects",
        "/deals",
        "/resources",
        "/blog",
        "/videos",
        "/testimonials",
        "/booking",
        "/contact",
      ].includes(req.path) &&
      parts[0] !== "admin"
    )
      return res.status(404).send("Not found");
    const canonicalBase =
      seo.canonicalDomain && /^https?:\/\//.test(seo.canonicalDomain)
        ? new URL(seo.canonicalDomain).origin
        : origin;
    const socialImage =
      seo.sharingImage && safeUrl(seo.sharingImage)
        ? new URL(seo.sharingImage, origin).href
        : "";
    html = html
      .replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(title)}</title>`)
      .replace(
        "</head>",
        `<meta name="description" content="${escapeHtml(description)}"><link rel="canonical" href="${escapeHtml(canonicalBase + req.path)}"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${escapeHtml(canonicalBase + req.path)}"><meta property="og:type" content="${article ? "article" : "website"}">${socialImage ? `<meta property="og:image" content="${escapeHtml(socialImage)}">` : ""}</head>`,
      )
      .replace('<div id="root"></div>', `<div id="root">${article}</div>`);
    res.set("Cache-Control", "no-store").type("html").send(html);
  });
  app.use((e, _req, res, _next) => {
    const validation = e.name === "ZodError";
    const status =
      e.status ||
      (validation
        ? 400
        : e.code === "ER_DUP_ENTRY"
          ? 409
          : e.code === "ER_ROW_IS_REFERENCED_2"
            ? 409
            : e.code === "ER_NO_REFERENCED_ROW_2"
              ? 400
              : e.code === "LIMIT_FILE_SIZE"
                ? 413
                : 503);
    res.status(status).json({
      error: validation
        ? "Validation failed"
        : status === 503
          ? "Service temporarily unavailable"
          : e.code === "ER_DUP_ENTRY"
            ? "Slug already exists"
            : e.code === "ER_ROW_IS_REFERENCED_2"
              ? "Asset is referenced; inspect usage first"
              : e.code === "ER_NO_REFERENCED_ROW_2"
                ? "Referenced media does not exist"
                : e.code === "LIMIT_FILE_SIZE"
                  ? "File exceeds 5 MB"
                  : e.message,
      issues: validation
        ? e.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          }))
        : undefined,
    });
  });
  return app;
}
function publicRecord(r) {
  const v = { ...r };
  delete v.deleted_at;
  delete v.version;
  if (v.collection === "resources" && v.fields.private)
    v.fields = { ...v.fields, fileId: null, downloadUrl: "" };
  return v;
}
async function sendMedia(id, res) {
  const rows = await query("SELECT * FROM media WHERE id=?", [id]);
  if (!rows[0]) throw err(404, "Not found");
  const m = rows[0];
  res
    .set({
      "Content-Type": m.mime,
      "Content-Length": String(m.size),
      "Cache-Control": "private, no-store",
      "Content-Disposition": `${m.mime === "application/pdf" ? "attachment" : "inline"}; filename="${m.id}.${m.mime === "image/jpeg" ? "jpg" : m.mime.split("/")[1]}"`,
    })
    .send(m.bytes);
}
export function escapeHtml(v) {
  return String(v).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}

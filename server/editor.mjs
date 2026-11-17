import { readFile } from "node:fs/promises";
import { query, transaction } from "./db.mjs";
import { parseContent, safeUrl } from "./validation.mjs";
const fail = (status, message) => Object.assign(new Error(message), { status });
const json = (row) =>
  typeof row.value === "string" ? JSON.parse(row.value) : row.value;
const definition = async () =>
  JSON.parse(
    await readFile(
      new URL("./settings-definition.json", import.meta.url),
      "utf8",
    ),
  );
const forbidden = new Set(["__proto__", "constructor", "prototype"]);
export function assignEditorValue(object, path, value) {
  const parts = path.split(".");
  if (parts.some((p) => forbidden.has(p)) || parts.length > 3)
    throw fail(400, "Invalid edit field");
  let target = object;
  for (const key of parts.slice(0, -1)) {
    if (!target || !Object.hasOwn(target, key))
      throw fail(400, "Unknown edit field");
    target = target[key];
  }
  const key = parts.at(-1);
  if (
    !target ||
    !Object.hasOwn(target, key) ||
    typeof target[key] !== "string" ||
    typeof value !== "string"
  )
    throw fail(400, "Only existing text/image fields can be edited");
  target[key] = value;
}
export function registerEditor(app, refs) {
  // Mounted after the existing authentication and CSRF guards.
  app.get("/api/admin/editor", async (_req, res) => {
    const settings = Object.fromEntries(
      (await query("SELECT * FROM settings")).map((r) => [
        r.id,
        { value: json(r), version: r.version },
      ]),
    );
    const content = (
      await query(
        "SELECT * FROM content WHERE status='published' AND deleted_at IS NULL AND (published_at IS NULL OR published_at<=UTC_TIMESTAMP()) ORDER BY sort_order,created_at",
      )
    ).map((r) => ({
      ...r,
      featured: !!r.featured,
      fields: typeof r.fields === "string" ? JSON.parse(r.fields) : r.fields,
    }));
    res.json({ settings, content });
  });
  app.patch("/api/admin/editor", async (req, res) => {
    const changes = req.body?.changes;
    if (!Array.isArray(changes) || !changes.length || changes.length > 500)
      throw fail(400, "Provide 1–500 changes");
    const rules = await definition();
    const groups = new Map();
    for (const change of changes) {
      if (
        !change ||
        !["settings", "content"].includes(change.kind) ||
        typeof change.id !== "string" ||
        typeof change.path !== "string" ||
        typeof change.value !== "string" ||
        change.value.length > 10000 ||
        !Number.isInteger(change.version)
      )
        throw fail(400, "Invalid edit");
      const key = change.kind + "/" + change.id;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(change);
    }
    await transaction(async (c) => {
      // Deterministic lock order and one transaction: no partially published edits.
      for (const key of [...groups.keys()].sort()) {
        const edits = groups.get(key),
          first = edits[0];
        if (first.kind === "settings") {
          if (
            ![
              "homepage",
              "about",
              "navigation",
              "brand",
              "settings",
              "ui",
            ].includes(first.id)
          )
            throw fail(400, "Use Appearance to change design settings");
          const [row] = await query(
            "SELECT * FROM settings WHERE id=? FOR UPDATE",
            [first.id],
            c,
          );
          if (!row || edits.some((e) => e.version !== row.version))
            throw fail(
              409,
              "Content changed in another window. Reload before saving; your draft has not been published.",
            );
          const value = json(row);
          for (const e of edits) {
            const rule = rules[first.id]?.[e.path];
            // Structured menus, ordering, and security-sensitive configuration stay in admin.
            if (
              !rule ||
              e.path.includes(".") ||
              [
                "sections",
                "sectionOrder",
                "socialOrder",
                "canonicalDomain",
              ].includes(e.path)
            )
              throw fail(400, "This field is managed in admin");
            if (
              e.value.length > rule.max ||
              (rule.url && !safeUrl(e.value, { contact: true })) ||
              (rule.image &&
                e.value &&
                !(e.value.startsWith("/") || /^https?:/.test(e.value)))
            )
              throw fail(400, "Invalid value for " + e.path);
            if (
              first.id === "navigation" &&
              ["menu", "footerMenu"].includes(e.path) &&
              e.value
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
              throw fail(400, "Use one Label|URL per menu line");
            assignEditorValue(value, e.path, e.value);
          }
          await query(
            "UPDATE settings SET value=?,version=version+1 WHERE id=?",
            [JSON.stringify(value), first.id],
            c,
          );
          await refs(c, first.id, value, true);
        } else {
          const [row] = await query(
            "SELECT * FROM content WHERE id=? AND deleted_at IS NULL FOR UPDATE",
            [first.id],
            c,
          );
          if (
            !row ||
            row.status !== "published" ||
            edits.some((e) => e.version !== row.version)
          )
            throw fail(
              409,
              "A record changed. Reload before saving; your draft has not been published.",
            );
          const fields =
            typeof row.fields === "string"
              ? JSON.parse(row.fields)
              : row.fields;
          const value = { title: row.title, summary: row.summary, fields };
          for (const e of edits) {
            if (!/^(title|summary|fields\.[a-zA-Z]+(?:\.\d+)?)$/.test(e.path))
              throw fail(400, "Unsupported content field");
            if (
              first.id === "navigation" &&
              ["menu", "footerMenu"].includes(e.path) &&
              e.value
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
              throw fail(400, "Use one Label|URL per menu line");
            assignEditorValue(value, e.path, e.value);
          }
          const parsed = parseContent(row.collection, {
            ...value,
            slug: row.slug,
            body: row.body,
            status: row.status,
            featured: !!row.featured,
            sort_order: row.sort_order,
            seo_title: row.seo_title,
            seo_description: row.seo_description,
            published_at: row.published_at
              ? new Date(row.published_at).toISOString()
              : null,
          });
          await query(
            "UPDATE content SET title=?,summary=?,fields=?,version=version+1 WHERE id=?",
            [
              parsed.title,
              parsed.summary,
              JSON.stringify(parsed.fields),
              row.id,
            ],
            c,
          );
          await refs(c, row.id, parsed);
        }
      }
    });
    res.json({ ok: true });
  });
}

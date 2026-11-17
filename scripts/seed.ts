import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import {
  BRAND_INFO,
  SERVICES,
  PROJECTS,
  DEALS,
  RESOURCES,
  VIDEOS,
  REVIEWS,
} from "../seed/original-content";
import { pool, query } from "../server/db.mjs";
import { parseContent } from "../server/validation.mjs";
const id = (key: string) => {
  const h = createHash("sha256").update(key).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
const slug = (title: string, key: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || key;
try {
  const groups: any = {
    services: SERVICES,
    projects: PROJECTS,
    deals: DEALS,
    resources: RESOURCES,
    videos: VIDEOS,
    testimonials: REVIEWS,
  };
  for (const [collection, items] of Object.entries(groups) as [
    string,
    any[],
  ][]) {
    for (const [index, item] of items.entries()) {
      const fields: any = {
        image: item.image || item.thumbnail || "",
        category: item.category || item.tag || "",
      };
      if (collection === "services")
        Object.assign(fields, {
          icon: item.icon,
          features: item.features,
          ctaLabel: "Book Now",
        });
      if (collection === "deals")
        Object.assign(fields, {
          discount: item.discount,
          link: item.link,
          tag: item.tag,
        });
      if (collection === "resources")
        Object.assign(fields, {
          type: item.type,
          tag: item.tag,
          downloadUrl: item.downloadUrl === "#" ? "" : item.downloadUrl || "",
        });
      if (collection === "videos")
        Object.assign(fields, { duration: item.duration });
      if (collection === "testimonials")
        Object.assign(fields, {
          name: item.name,
          role: item.role,
          rating: item.rating,
        });
      const v = parseContent(collection, {
        title: item.title || item.name,
        slug: slug(item.title || item.name, `${collection}-${item.id}`),
        summary: item.description || item.quote || "",
        status: "published",
        featured: true,
        sort_order: index,
        fields,
      });
      // Stable seed identity: renamed/deleted imported records are never inserted again or overwritten.
      await query(
        "INSERT INTO content(id,collection,slug,title,summary,body,status,featured,sort_order,fields,seo_title,seo_description) VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE id=id",
        [
          id(collection + item.id),
          collection,
          v.slug,
          v.title,
          v.summary,
          v.body,
          v.status,
          v.featured,
          v.sort_order,
          JSON.stringify(v.fields),
          "",
          "",
        ],
      );
    }
  }
  const settings = JSON.parse(
    await readFile(
      new URL("../server/settings-seed.json", import.meta.url),
      "utf8",
    ),
  );
  settings.brand = {
    ...BRAND_INFO,
    ...Object.fromEntries(
      Object.entries(BRAND_INFO.socials).map(([k, v]) => ["social_" + k, v]),
    ),
  };
  delete settings.brand.socials;
  for (const [key, value] of Object.entries(settings))
    await query(
      "INSERT INTO settings(id,value) VALUES (?,?) ON DUPLICATE KEY UPDATE id=id",
      [key, JSON.stringify(value)],
    );
  console.log("Initial content imported without overwriting existing records.");
} finally {
  await pool.end();
}

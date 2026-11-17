import { z } from "zod";
import sanitizeHtml from "sanitize-html";
export const collections = [
  "gallery",
  "services",
  "projects",
  "blog",
  "resources",
  "videos",
  "deals",
  "testimonials",
];
export function safeUrl(value, { contact = false } = {}) {
  if (value === "") return true;
  if (typeof value !== "string" || /[\u0000-\u0020\\]/.test(value))
    return false;
  if (/^\/(?!\/)/.test(value) || /^#[\w-]+$/.test(value)) return true;
  try {
    const u = new URL(value);
    return (
      ["https:", "http:", ...(contact ? ["mailto:", "tel:"] : [])].includes(
        u.protocol,
      ) &&
      !u.username &&
      !u.password
    );
  } catch {
    return false;
  }
}
const text = (max = 500) => z.string().max(max);
const url = z
  .string()
  .max(2048)
  .refine(
    (v) => safeUrl(v, { contact: true }),
    "Use a safe http(s), site, mailto or tel URL",
  );
const image = z
  .string()
  .max(2048)
  .refine(
    (v) => safeUrl(v) && (!v || v.startsWith("/") || /^https?:/.test(v)),
    "Invalid image URL",
  );
const base = { image: image.default(""), category: text(100).default("") };
const schemas = {
  gallery: z
    .object({
      ...base,
      alt: text(500).default(""),
      location: text(200).default(""),
    })
    .strict(),
  services: z
    .object({
      ...base,
      icon: z
        .enum([
          "ShoppingBag",
          "Zap",
          "Brain",
          "Code",
          "BarChart3",
          "PlayCircle",
          "Target",
          "Eye",
          "ShieldCheck",
          "MessageSquare",
          "Globe",
          "Settings",
          "Layers",
          "TagIcon",
          "ExternalLink",
          "BookOpen",
          "Download",
          "FileText",
        ])
        .default("Code"),
      features: z.array(text(200)).max(30).default([]),
      ctaLabel: text(100).default("Book a Strategy Call"),
      ctaUrl: url.default("/#booking"),
    })
    .strict(),
  projects: z
    .object({
      ...base,
      client: text(200).default(""),
      technologies: z.array(text(100)).max(50).default([]),
      gallery: z.array(image).max(20).default([]),
      liveUrl: url.default(""),
      outcomes: text(5000).default(""),
    })
    .strict(),
  blog: z
    .object({
      ...base,
      author: text(200).default("Md Tanvir Hossain"),
      tags: z.array(text(100)).max(30).default([]),
    })
    .strict(),
  resources: z
    .object({
      ...base,
      type: z.enum(["free", "paid"]).default("free"),
      tag: text(100).default(""),
      price: z.number().nonnegative().nullable().default(null),
      currency: z
        .string()
        .regex(/^[A-Z]{3}$/)
        .default("BDT"),
      downloadUrl: url.default(""),
      fileId: z.string().uuid().nullable().default(null),
      private: z.boolean().default(false),
      whatsappUrl: url.default(""),
    })
    .strict(),
  videos: z
    .object({
      ...base,
      youtubeUrl: z
        .string()
        .max(2048)
        .refine(
          (v) => !v || youtubeId(v),
          "Use a valid YouTube watch, shorts or youtu.be URL",
        )
        .default(""),
      duration: text(30).default(""),
    })
    .strict(),
  deals: z
    .object({
      ...base,
      discount: text(100).default(""),
      tag: text(100).default(""),
      link: url.default(""),
      coupon: text(100).default(""),
      expiresAt: z.string().datetime().nullable().default(null),
    })
    .strict(),
  testimonials: z
    .object({
      ...base,
      name: text(150).default(""),
      role: text(200).default(""),
      rating: z.number().int().min(1).max(5).default(5),
      videoUrl: url.default(""),
    })
    .strict(),
};
export function youtubeId(value) {
  try {
    const u = new URL(value);
    if (!["https:", "http:"].includes(u.protocol)) return null;
    const id =
      u.hostname === "youtu.be"
        ? u.pathname.slice(1)
        : ["www.youtube.com", "youtube.com"].includes(u.hostname)
          ? u.searchParams.get("v") ||
            u.pathname.match(/^\/(?:shorts|embed)\/([^/]+)$/)?.[1]
          : null;
    return /^[\w-]{11}$/.test(id || "") ? id : null;
  } catch {
    return null;
  }
}
export function cleanHtml(value) {
  return sanitizeHtml(value, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "em",
      "ul",
      "ol",
      "li",
      "h2",
      "h3",
      "blockquote",
      "a",
    ],
    allowedAttributes: { a: ["href", "title"] },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
    },
  });
}
export function parseContent(collection, input) {
  if (!collections.includes(collection)) throw Error("Unknown collection");
  const schema = z
    .object({
      title: z.string().trim().min(1).max(255),
      slug: z
        .string()
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .max(180),
      summary: text(5000).default(""),
      body: text(100000).default(""),
      status: z.enum(["draft", "published"]).default("draft"),
      featured: z.boolean().default(false),
      sort_order: z.number().int().min(-10000).max(10000).default(0),
      fields: schemas[collection],
      seo_title: text(255).default(""),
      seo_description: text(500).default(""),
      published_at: z.string().datetime().nullable().default(null),
      version: z.number().int().positive().optional(),
    })
    .strict();
  const value = schema.parse(input);
  value.body = cleanHtml(value.body);
  return value;
}
export const requestSchema = z
  .object({
    kind: z.enum(["booking", "contact"]),
    name: z.string().trim().min(1).max(150),
    email: z.string().email().max(254),
    phone: text(50).default(""),
    service: text(255).default(""),
    message: z.string().trim().min(1).max(5000),
    requested_at: z.string().datetime().nullable().default(null),
    timezone: z
      .string()
      .max(100)
      .refine((v) => {
        try {
          new Intl.DateTimeFormat("en", { timeZone: v });
          return true;
        } catch {
          return false;
        }
      })
      .default("Asia/Dhaka"),
    dedup_key: z.string().uuid(),
    website: z.literal("").default(""),
  })
  .strict();
export function collectMedia(value) {
  const ids = new Set();
  function walk(v, k = "") {
    if (typeof v === "string") {
      for (const m of v.matchAll(/\/media\/([a-f0-9-]{36})/g)) ids.add(m[1]);
      if (k === "fileId" && /^[a-f0-9-]{36}$/.test(v)) ids.add(v);
    } else if (Array.isArray(v)) v.forEach((x) => walk(x));
    else if (v && typeof v === "object")
      Object.entries(v).forEach(([key, x]) => walk(x, key));
  }
  walk(value);
  return [...ids];
}

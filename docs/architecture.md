# Architecture and content model

React 19 + Vite remains the public frontend. A same-origin Express 5 service serves the production bundle, APIs, media, sitemap and route metadata. MySQL 8 is the persistent store. The owner confirmed Hostinger Node.js Web App and MySQL availability. No external backend or new paid service is introduced.

## Storage

Versioned SQL lives in server/migrations. The migration runner takes a database advisory lock and records completed filenames. MySQL DDL auto-commits; migration 001 uses CREATE IF NOT EXISTS so an interrupted initial creation can be retried. Do not edit applied migrations; add a new numbered file.

| Table | Responsibility |
| --- | --- |
| users | One bootstrap owner, unique email, bcrypt password hash |
| sessions | Express session records, expiry; HTTP-only cookie contains only opaque ID |
| content | One row per item, collection, unique collection/slug pair, title, summary, sanitized body, publication state/time, featured, order, SEO, soft deletion, optimistic version |
| media | UUID, original name, verified MIME, alt text, size, binary bytes, creation timestamp |
| content_media / settings_media | Foreign-key references; prevent removal of referenced assets |
| settings | Separate validated modules for homepage, about, navigation, brand and SEO; versioned for conflict detection |
| requests | Booking/contact records, requested UTC timestamp and visitor timezone, status, private notes, unique submission key |
| schema_migrations | Applied schema versions |

Collection-specific fields use strict Zod schemas in server/validation.mjs. They are bounded structured JSON per record, not a whole-site JSON document. Common searchable/ordered/state fields are relational columns; media relationships are foreign keys. Feature, gallery and tag arrays preserve order inside validated per-record JSON. New searchable relationships can be normalized into child tables as the project grows.

## Collections

Services: icon, features, image, category, CTA label/URL. Projects: client, category, description/body, image/gallery, technologies, live URL, owner-supplied outcomes. Blog: author, category, tags, cover, publication timestamp. Resources: free/paid, type/category tag, optional price/currency, external link or file reference, private flag, WhatsApp URL. Videos: valid YouTube URL, optional thumbnail and duration. Deals: discount, tag, URL, coupon and expiry. Testimonials: name, role, rating, quote in summary, avatar and optional video URL.

Copy extraction preserves component markup, Bangla strings and original collection data. server/settings-definition.json is the authoritative allowlist of editable copy/URL fields. seed/original-content.tsx preserves the original collection values. The import uses stable IDs and does not update existing rows, even after a slug/title changes. No published blog posts are invented.

## Requests and security

No registration API exists. The interactive CLI creates the first owner only and reads the password without displaying it. Login regenerates sessions. Cookies are HTTP-only, SameSite=Lax and Secure in production. Writes require exact APP_ORIGIN and synchronizer CSRF tokens for authenticated endpoints. Password changes invalidate all sessions. Login and public submission limits use process-local counters: deployment assumes one application instance. Use a shared limiter before scaling to multiple processes.

Uploads accept verified PNG/JPEG/WebP/PDF only, maximum 5 MB, held in MySQL MEDIUMBLOB columns. The server generates UUID storage identifiers; filenames never become paths. Uploads do not touch deployment directories. Unreferenced and draft-only media are private. Protected resource file references override other references and remain owner-only; no customer entitlement system or payment gateway is implemented. Public private-resource responses omit file identifiers and download URLs. PDFs download as attachments. Image alt metadata is editable; public card descriptions currently use their content titles for image alt text.

Rich HTML allows a small tag/attribute set and removes scripts/events. React escapes plain settings. Parameterized queries and explicit field schemas protect writes. Security headers block arbitrary scripts; Tailwind is built locally. Secrets are server-only. Error responses omit database internals and stack traces.

## Rendering and cache behavior

Public bootstrap loads current database data, with explicit unavailable UI on failure. It never falls back to seed data. Public API responses and route HTML are no-store, so admin edits appear on the next navigation/reload without redeployment. The bootstrap currently returns all published content; collection administration is paginated. Very large public catalogs should move to dedicated paginated API loading.

The server emits published detail-page title, description, canonical URL and sanitized article content directly in HTML. Draft, deleted and future-dated content returns 404 before HTML generation and is excluded from the sitemap. SPA list/home content still needs JavaScript for complete indexing; full server rendering is not implemented. Detail hydration uses React createRoot to replace the initial article. No fabricated analytics or email-delivery claims exist.

## Operational constraints

Uploads are durable with database backups, trading filesystem uncertainty for increased database size and backup cost. Check Hostinger database quotas, max_allowed_packet (at least 8 MB) and backup limits. APP_ORIGIN must be the public HTTPS origin in production. Confirm trusted proxy count before setting TRUST_PROXY. Runtime: Node 22, MySQL 8, one server process. Database host is normally 127.0.0.1 on Hostinger; use actual account values. No database initialization, seed or reset runs at application startup.

The production build explicitly sets NODE_ENV=production before invoking Vite, avoiding development React bundles when a developer's .env uses NODE_ENV=development. The application was verified locally with real MySQL and process restarts; see qa-report.md for the separate Hostinger verification boundary.

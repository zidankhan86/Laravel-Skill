# Public portfolio redesign

Implemented locally on 2026-11-09 using the existing React 19, Vite, Tailwind, Framer Motion, and Lucide stack. No dependencies were added.

## Presentation

Cream, deep green, sage, lavender, and lime surfaces; asymmetric service and project cards; a portrait-led editorial hero; DM Sans with selected DM Serif Display italics; Hind Siliguri for Bangla. Existing configured primary colors remain in use for primary actions. A visitor light/dark toggle saves only a browser preference. It does not update MySQL or admin settings.

[Light preview](http://localhost:3000/?theme=light) · [Dark preview](http://localhost:3000/?theme=dark)

The saved CMS website mode remains Dark, and its configured red primary remains unchanged. The preview query overrides mode for that page only. Navigation without the preview query follows the saved setting or the visitor's local preference.

The hero counters show published services, public portfolio entries, and resources in the library. They are not claims about all client work. Counters animate once, reserve width, expose the final value to assistive technology, and skip animation with reduced motion. No extra process section or unsupported metrics were introduced.

## Preserved content inventory

| Area | Presentation and retained behavior |
| --- | --- |
| Hero | Existing portrait, name, positioning, availability, founder link, Bangla description, CTAs, phone, experience, and quote |
| Expertise strip | All configured expertise labels, in their configured order |
| About | Existing introduction, transition copy, mission, vision, and belief |
| Journey | Independent CMS portrait, biography, quote marks, and full-story action |
| Services | Existing featured selection, ordering, three-item homepage limit, feature lists, detail URLs, and CTAs |
| YouTube | Existing featured videos, thumbnails, duration, and destinations; no autoplay or embed loading |
| Portfolio | Existing featured entries, imagery, descriptions, technology chips, detail and demo links |
| Deals | Existing discounts, destinations, categories, and expiry behavior |
| Resources | Existing free/paid labels, download availability, protected access, and WhatsApp destinations |
| Testimonials | All existing featured quotes, names, portraits, roles, and ratings; static cards replace automatic rotation |
| Booking/contact | Same request form, fields, payload, timezone, validation, and success/error handling |
| Footer | Existing brand, links, socials, contact details, and copyright |

Existing top-level pages: `/about`, `/services`, `/projects`, `/deals`, `/resources`, `/blog`, `/booking`, `/contact`. Every published detail URL continues through the existing `DetailPage` and public API. Existing anchor IDs are retained. There were no public search/filter/pagination controls to replace; admin controls were not changed.

## Main frontend files

- `public.css`: scoped public tokens, layouts, responsive styles, contrast, reduced motion, and component treatments.
- `components/Presentation.tsx`: plain-text-safe mixed typography, image failure placeholders, and factual counters.
- `components/Hero.tsx`, `Navbar.tsx`, `ServicesSection.tsx`, `YouTubeSection.tsx`, `TestimonialsSection.tsx`: redesigned presentation.
- Remaining public sections, listings, `DetailPage.tsx`, and `RequestForm.tsx`: coordinated styling, semantics, media fallbacks, and preserved interactions.
- `public-theme.ts`, `index.tsx`, `App.tsx`, `index.html`: public mode preference, scoped styles, lightweight entrances, and fonts. Existing Inter font support for admin is retained.

## Actual validation

- `npm run typecheck`: passed.
- `npm run build`: passed.
- `npm test`: all 8 security tests passed.
- Brave/Playwright: all homepage sections checked in Light and Dark at 360, 390, 768, 1024, and 1440px with no horizontal page overflow.
- All eight top-level public pages, all 22 currently published detail URLs, the empty blog, and a missing-detail state loaded successfully.
- Mobile dialog: keyboard opening, Escape, focus restoration, menu links, and anchor navigation passed. Native modal behavior prevents background focus while open.
- Visitor mode survives refresh. Reduced motion exposes final counter values immediately.
- Booking/contact submissions were intercepted, validated with the real backend `requestSchema`, and given simulated success/error responses. The tests verified retained input on error. No actual request records or external notifications were created.
- Paid resource actions were intercepted at `window.open`; destinations match existing content and WhatsApp logic.
- Isolated API fixtures checked a long edited CMS heading, plain-text fallback, missing portrait, empty/hidden sections, private resources, and API failure/retry. Fixtures did not change the database.
- No runtime JavaScript errors in the browser tests.
- Before/after public API responses were identical. Hash comparisons verified unchanged admin files, backend settings/application files, migrations, theme implementation, and package manifests against the start of this task. Existing uncommitted work from the preceding admin task was preserved.

## Screenshots

| View | Before | After |
| --- | --- | --- |
| Desktop | [Saved dark design](screenshots/public-before-desktop.png) | [Light presentation](screenshots/public-after-desktop.png) |
| Mobile | [Saved dark design](screenshots/public-before-mobile.png) | [Light presentation](screenshots/public-after-mobile.png) |
| Dark presentation | — | [Desktop](screenshots/public-after-dark.png) |

## Limits and deferred work

No frontend additions required backend changes, so none were deferred for that reason. The current records contain no published blog posts, playable video destinations, or free-resource download URLs; those existing unavailable/empty states were preserved. Real playback and free-file downloading cannot be exercised until the owner supplies those values in the existing CMS. Remote image availability is outside the frontend; missing images receive a labeled fallback.

No backend/schema/auth/admin/environment/deployment changes were made for this redesign. No deployment or GitHub push was performed.

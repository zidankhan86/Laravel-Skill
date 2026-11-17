# Repository audit — 2026-11-09

## Evidence and baseline

This directory is a source export: no `.git`, lockfile, `node_modules`, backend, migrations, tests, hosting configuration or AGENTS.md was found. `git status --short` failed because Apple's developer tools are absent; no feature branch could be created. Existing files were preserved. Node/npm were absent from PATH and common installation directories; initial `npm run dev` failed with `command not found`. A temporary official Node runtime is being prepared for local checks. No original desktop/mobile screenshots have yet been captured. The original HTML has no module entry script, so the exported app cannot mount as supplied; the entry repair must precede a useful visual baseline.

Declared versions in package.json: React/React DOM ^19.2.3, Vite ^6.2.0, TypeScript ~5.8.2, Framer Motion 11.11.17, Lucide 0.474.0, React Vite plugin ^5.0.0. These are dependency constraints, not verified installed versions. Tailwind runs from a CDN; fonts come from Google. index.html also contains an unnecessary React 19.0.0 import map. Runtime motion components are cast to any. There is no API, authentication, localStorage persistence or database.

## Views and interactions

App.tsx switches React state between home, about, services, projects, deals and resources. These are not URL routes and refresh resets to home. All views include Footer and FloatingActions. The home order is Hero, TrustStrip, AboutSection, AboutMeSection, ServicesSection, YouTubeSection, ProjectsSection, DealsSection, ResourcesSection, TestimonialsSection, BookingSection, Footer. Preserve anchors about, aboutme, services, youtube, projects, deals, resources, testimonials, booking and contact.

| Source | Editable content and existing behavior |
| --- | --- |
| constants.tsx BRAND_INFO | Owner name, phone, WhatsApp, email, founder name/URL, Bangla biography, six social URLs |
| Hero.tsx | Availability, 5+ years, portrait, headline, Bangla description with emphasis, quote, booking/contact labels; buttons scroll to sections |
| TrustStrip.tsx | Five icon/text items; wraps responsively |
| AboutSection.tsx | Heading, introduction, transformation badges, mission introduction, mission/vision/belief cards |
| AboutMeSection.tsx, AboutPage.tsx | Journey heading, biography, full story, two experience/value cards, portrait and mission quote; full story action already opens about view |
| ServicesSection.tsx, AllServices.tsx | Five SERVICES records: title, description, icon and ordered feature list; homepage takes first three; home cards link to booking; no detail pages |
| ProjectsSection.tsx, AllProjects.tsx | Three PROJECTS: title, description, image, category; demo/preview buttons lack handlers and destinations |
| YouTubeSection.tsx | Four VIDEOS with synthetic v1–v4 IDs, titles, stock thumbnails and duration; cards have no playback; subscription link works |
| DealsSection.tsx, AllDeals.tsx | Three DEALS: title, description, discount, tag/category, image, destination; homepage first three |
| ResourcesSection.tsx, AllResources.tsx | Four RESOURCES: title, description, free/paid, tag, image, download URL; two free URLs are #; paid items open prefilled WhatsApp |
| TestimonialsSection.tsx | Three REVIEWS: name, role, quote, rating, image; timed and manual carousel assumes nonempty array |
| BookingSection.tsx | Call length, service region, contact links, calendar placeholder, inert booking button, Bangla CTA to WhatsApp; no submissions |
| Navbar.tsx | Six navigation buttons, Book Call, mobile drawer, branding; navigation from other views uses delayed home scroll |
| Footer.tsx | Brand description, founder/social links, four sitemap anchors, contacts, location, copyright and tagline; anchors fail in non-home views |
| FloatingActions.tsx | WhatsApp link and scroll-to-top visibility |

No blog, admin, hidden routes or additional data sources were found. All 19 component files, entry/config/type files and constants were inspected.

## Owner review items

- Portrait path ./assets/tanvir.png is absent; three components use a GitHub-hosted fallback. Other images use Unsplash and Picsum.
- Existing testimonials include quantified results, portfolio copy claims millions in revenue, and deals advertise discounts without dates. Preserve source wording but obtain owner verification; do not invent replacement claims.
- Real video URLs, demo URLs and free resource files are missing. Keep clear unavailable states until configured.
- vite.config.ts exposed GEMINI_API_KEY through define despite no application usage; remove that exposure. No secret values were read or printed.
- Original README's Gemini setup is unrelated to the website. No configured booking provider exists in source.

## Hosting decision

Owner confirmed Node.js Web App and MySQL availability. Retain React/Vite, add a same-origin Node API and MySQL. Do not introduce external providers or change DNS. Uploaded media will be database-backed with size limits, avoiding unsupported assumptions about writable build-directory persistence. Hostinger account/runtime and database credentials are not available in this session.

Sources: [Hostinger Node deployment](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/), [Hostinger MySQL configuration](https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/). Official documentation checked during this audit; plan availability was separately confirmed by the owner.

## Implementation sequence

Repair entry/config, capture runnable baseline, retain visual components and extract seed content. Implement migrations and owner bootstrap, session authorization and CSRF, Services admin/database/public flow, remaining collections/settings, requests/media/SEO, then build, security/integration and browser QA. Record unavailable checks honestly. No production writes or customer notifications are authorized for verification.

## Implementation follow-through

The owner confirmed Node.js Web App + MySQL. Node was provisioned temporarily for checks; dependencies and a package lock now exist. Framer Motion was updated to 12.x for React 19 compatibility. Tailwind is built locally. The audit's initial blockers above are historical observations; completed implementation and actual verification results are recorded in qa-report.md. The baseline source snapshot and screenshots are under docs/. Branch creation remains unavailable because this source export has no Git repository and the system Git installation is unusable.

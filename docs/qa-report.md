# QA report — 2026-11-09

## Environment and scope

All writes used an isolated local MySQL 8.4.11 database named `tanvir_cms_test`, bound to localhost:3307, with generated credentials kept out of output. Node 22.23.4 was downloaded from nodejs.org and its SHA-256 checked against the official checksum list. The temporary MySQL archive matched the checksum published on MySQL's download page. No production database, Hostinger account, DNS, customer messages or real bookings were used.

The initial source export had no Node/npm installation, Git metadata, lockfile, tests or working HTML module entry. Apple Git failed because developer tools were absent. Those facts prevented a feature branch. Browser and local-socket checks required sandbox permission. The preserved source snapshot is docs/baseline-source.tar.gz; it contains the initial entry/config repairs, before CMS/public-component changes. Baseline preview also needed the original tsconfig and removal of the conflicting import map. The macOS /tmp alias initially caused raw TSX to be served; using /private/tmp resolved it.

## Executed checks

| Check | Actual outcome |
| --- | --- |
| `npm run typecheck` | Passed |
| `npm run build` | Passed; production React bundle is enforced regardless of local NODE_ENV |
| npm installation audit | 0 reported vulnerabilities at install time |
| `npm test` | 8 tests passed: URL/sanitizer/typed-input/YouTube/timezone/media-reference validation, anonymous admin denial, origin and CSRF rejection |
| `ALLOW_TEST_DATABASE=yes npm run test:integration` | Passed against MySQL: real login, draft/public behavior, sanitization, stale-write conflict, duplicate slug, delete/restore, private upload denial, MIME-content rejection, referenced-file deletion protection, idempotent booking request, public media persistence across app recreation, logout invalidation |
| `ALLOW_TEST_DATABASE=yes npm run test:bootstrap` | Passed: first owner created, password absent from CLI output, second bootstrap refused |
| `ALLOW_TEST_DATABASE=yes npm run test:restart` | Passed: two actual Node server process starts retained content and exact uploaded bytes; published article HTML contains crawlable title/body; anonymous admin read denied |
| `node scripts/check-import.mjs` | Passed: repeat import did not overwrite an edited imported service; test edit restored |
| `node scripts/browser-qa.mjs` | Passed in installed Brave/Playwright: desktop/mobile homepage, mobile public navigation, Blog empty state, services direct refresh, admin login, service creation/publication through the form, public detail and Bangla rendering, mobile admin navigation |
| `node scripts/scan-build-secrets.mjs` | Passed: configured database password and session-secret values absent from browser output; no values printed |
| Baseline/updated screenshots | Captured desktop 1440×1000 and mobile 390×844, including full pages and hero viewports; admin desktop/mobile captured |

No lint configuration existed. TypeScript and targeted runtime tests were used; a separate lint pass is not claimed. Test fixtures are removed by their tests; seed content is retained only in the isolated database. Scripts do not call customer messaging providers.

## Failures found and corrected

- Missing index.tsx entry and unused Gemini secret injection in Vite.
- Original React 19 / Framer Motion 11 peer conflict; updated Motion to compatible 12.x.
- First migration failed on MySQL foreign-key column collations; schema now explicitly uses matching utf8mb4_unicode_ci.
- Initial admin render depended on public copy initialization; admin labels are now independent.
- Switching admin modules briefly rendered previous-module data and crashed; navigation clears data before rendering the next module.
- Status select lacked an unambiguous accessible label; explicit label added.
- Extracted inline copy lost leading spaces; original JSX spacing restored in import data.
- Local NODE_ENV=development affected a release build; scripts/build.mjs now explicitly builds production assets.

## Visual assessment and limits

The reviewed desktop/mobile hero retains the original black/red palette, typography, layout, spacing, buttons and responsive behavior. Blog is added to navigation. The calendar placeholder is intentionally replaced with the request form. Missing resource/demo/video destinations now have explicit unavailable behavior. Full-page screenshots include viewport-triggered animations and external assets, so they are evidence for review rather than deterministic pixel-diff tests.

The portrait file was already missing from the export, and the original external fallback did not load in baseline or updated screenshots. The existing remote URL is retained as the editable portrait setting; the owner must upload a working portrait. Other remote images/font delivery can vary by network. No visual replacement or invented owner image was generated.

## Remaining manual setup / production limits

- Open the actual Git repository with working Git and create the requested feature branch; this directory is a source export.
- Provision production/staging MySQL and server environment, run migrations/import, bootstrap the real owner privately, and follow docs/hostinger-deployment.md.
- Hostinger proxy/cookie behavior, deployment/redeployment, domain/SSL and backups/restores have not been verified in the account. Local process restart persistence passed; Hostinger redeploy persistence still needs staging verification.
- Supply the missing portrait, actual video URLs, demo destinations and free files. Review existing discount/result/testimonial claims.
- Optional SMTP and third-party calendar integration are not configured; request submission and admin management are implemented, with no claim of confirmation or email delivery.
- Homepage/list content remains client-rendered; detail pages have server-generated article HTML and metadata. The public bootstrap currently loads all published records; admin lists are paginated. Very large public catalogs will need paginated public loading.
- Rich content uses a sanitized HTML textarea, not a full WYSIWYG editor. Slug changes do not generate automatic redirects. Protected resources are owner-only; customer entitlement/payment systems were not introduced.
- Rate-limit counters are per process; use a shared limiter before horizontal scaling. MySQL media storage needs quota/backup monitoring.

Production status: not deployed. No live website or DNS changes were made.

Final source formatting check with Prettier passed after formatting the backend. The disposable preview/API/database processes were stopped at handoff. Session-only test configuration was moved out of the repository; create your own .env from .env.example for normal use. Local MySQL binaries/data used for QA were temporary tooling, not a new hosting dependency or deployed service.


## Admin appearance update — 2026-11-09

- Rebuilt the admin layout with a teal sidebar, lime selection state, real summary counts, collection cards, status badges, and responsive forms.
- Added persisted, independently configured website/admin colors and light/dark/system modes. Migration 003 inserts appearance defaults; existing content and images are retained.
- Brave/Playwright checked Dashboard, Services, Homepage, Appearance and Media Library at 320, 390, 768, 1024 and 1440px: no horizontal page overflow or JavaScript errors.
- Saved custom colors and modes through the UI; verified database persistence after reload and public website color/light mode. Confirmed System mode reacts to operating-system changes. Invalid colors and mode values return HTTP 400. Original appearance values restored after testing.
- Production build, TypeScript checks and all 8 security tests passed. Browser captures are kept locally under `.local/admin-desktop.png`, `.local/admin-mobile.png`, `.local/admin-dark.png`, and `.local/website-light.png`.
- This is local verification; no hosting deployment was performed.


## Requested fixes — 2026-11-11

- Desktop header becomes an inset rounded bar after scrolling; mobile geometry remains unchanged. Vision icon uses deep green. Resource images fill a responsive 4:3 frame on home/listing pages. The closing WhatsApp CTA has refined spacing and an arrow action.
- Date/time input invokes the native picker from the whole field, with keyboard activation and native-editing fallback. Reveal entrances cover navigation, content, media, cards, and forms while honoring reduced motion and leaving content visible by default.
- Added the gallery collection using existing CRUD/media authorization, a responsive masonry section after resources, and a native dialog for full-size photos. No sample event photos were published.
- Admin search keeps the input mounted and debounces requests. Homepage switches save the existing section list and filter related menu links. All-off is accepted; invalid section keys are rejected.
- Browser checks passed at 360, 390, 768, 1024, and 1440px: header behavior, resource cover sizing, no horizontal overflow, date-picker invocation, continuous content/request search with focus retention, saved visibility + menu filtering, gallery ordering/responsiveness, dialog Escape/focus return, and all-off state. Public gallery pictures used intercepted fixtures. The temporary local service toggle was restored.
- Isolated MySQL tests passed gallery create/search/draft/publish/delete, anonymous authorization, all-off settings, and invalid section validation. The temporary test database was removed.
- TypeScript, production build, and all 8 existing security tests passed. No deployment performed.


## Refinement follow-up — 2026-11-11

- Reveal targets now use cards/main containers, not individual text, images, links or form fields. Section heading groups align left and enter vertically from below. Reduced-motion preferences disable these transitions.
- Removed the top availability/founder strip; moved the existing founder link above the hero name in place of the static expertise eyebrow.
- Added a dedicated visibility save form. It merges only section switches into the latest homepage settings; ordinary homepage saves preserve independently saved visibility and gallery text. Same-origin website tabs refresh after visibility/gallery changes.
- Replaced the generic gallery editor with section text fields, multiple image upload, image previews and remove controls. Newly added images publish automatically. Existing records and metadata are retained, but captions are no longer displayed publicly.
- Browser verification passed: persisted switch values, cross-tab refresh, preservation after saving another homepage form, reload persistence, gallery upload payload validation with intercepted writes, text-only settings updates, vertical heading animation, card-level animation targets, reduced motion, and 390/768/1440px widths without overflow. Test visibility values were restored; no test photos were stored.


## Palette, calendar and navigation follow-up — 2026-11-11

- Added three independently validated/persisted website color fields (deep green, lime, lavender) alongside the existing primary color. Applied defaults without replacing saved values; appropriate accent-surface text colors are derived from chosen colors.
- Added an editable Home menu entry, larger menu labels, scroll/route-aware active underlines, and mobile drawer entry/exit animation with reduced-motion support.
- Replaced the native datetime popup with a custom month/day calendar and hour/minute controls in an accessible native dialog. Confirmation supplies the same hidden local datetime value; submission retains the existing UTC/timezone contract. Missing dates focus the picker; successful submission clears it.
- Browser checks passed for Home/active links, thumbnail ratio at 360/390/768/1024/1440px, no horizontal overflow, mobile drawer animation/Escape/focus, custom date selection, confirmation/reset, and schema-validated intercepted booking submission. Three custom colors were saved and verified on their corresponding surfaces, then the original palette was restored. No real booking was submitted. No runtime JavaScript errors observed.
- Mobile calendar capture: `.local/custom-calendar-mobile.png`.

### Top loading line and centered About introduction
- TypeScript and production build passed.
- Browser checks saved Website loading line OFF and ON through Admin → Appearance and verified the stored preference against a delayed site response; original appearance settings restored afterward.
- Enabled line sits at the viewport top and disappears when content arrives; disabled state shows no visual loader. Reduced-motion mode uses a static line.
- About introduction heading and paragraphs are centered at 390px and 1440px without horizontal overflow.

### Image loading smoothness
- Shared MediaImage begins lazy image requests up to 1000px before the viewport, waits for decoding, and reveals the complete image with a short opacity transition without a spinner. Existing aspect-ratio containers and error fallbacks remain.
- Card reveals trigger slightly ahead of the viewport. Reduced-motion mode skips the image fade.
- Typecheck/build passed. Browser checks at 390px and 1440px verified all rendered MediaImage images decoded, remained ready on repeat scroll, and caused no horizontal overflow or JavaScript errors.
- Attached recording inspection was limited: extracted frames showed OBS followed by black frames; the exact reported video artifact could not be confirmed.

### Hero simplification and stable gallery motion
- Removed the marked hero phone/quote, published counts row and final About introduction paragraph from public rendering; stored copy remains intact.
- Active menu underline and the three Systems I’ve Built project cards follow the website primary color, with contrasting card text. Hero colors remain unchanged.
- Gallery slots now reserve alternating landscape/portrait ratios before image download; thumbnails crop to fill, and the existing lightbox shows the full image. Gallery containers no longer receive scroll transforms; decoded images fade once.
- Added one-time vertical card/heading reveals, button/card hover feedback and subtle floating hero badges, respecting reduced-motion preferences.
- Browser test with six delayed fixture images verified identical gallery positions/heights before and after image decode, responsive widths 390/768/1440, lightbox/Escape, marked content removal, pending reveal setup and reduced-motion behavior. Fixture images were intercepted only; no database changes.
- Inspected https://tanvirhossain.online/ in Brave for motion reference. Typecheck and production build passed.

### Visual front editor and three portfolio themes — 2026-11-16
- Added authenticated, lazy-loaded Edit Website mode with explicit field bindings, draft preview, text editing, image library/upload, save/discard, focus handling and unsaved-navigation warning. Normal public rendering contains no editing controls.
- Added atomic `/api/admin/editor` updates using existing CSRF/origin/session guards, per-record versions, field validation and transactional media references. Concurrent changes reject the entire batch.
- Added Editorial, Studio and Executive layouts, theme-specific settings, spacing/corners/motion settings and an actual-site desktop/mobile iframe preview. Appearance changes are isolated until saved.
- Applied additive migrations 008–010 locally. No deployment or GitHub push.
- Browser checks passed: anonymous redirect/API denial; opening from admin; draft isolation; saved Bangla text and project title; image upload, library selection and public image persistence; discard; mobile editor; three theme previews on desktop/mobile without overflow; no premature theme publication; theme save/reload; responsive catalog; no JS runtime errors. All test content/appearance values restored and uploaded fixture removed.
- Field audit found 227 valid rendered bindings before final additions for logo text, discounts and floating label; no invalid field mappings. Automated visitor timezone remains uneditable.
- Isolated MySQL integration passed: authenticated save, CSRF denial, atomic rollback on conflict, invalid field/prototype/URL/menu rejection, invalid theme rejection and valid theme persistence. Temporary test database dropped.
- Nine unit/security tests passed (local HTTP binding required sandbox escalation); TypeScript and production build passed.
- Local screenshots: `.local/theme-picker-catalog.png`, `.local/theme-picker-mobile.png`, `.local/editor-mobile.png`. Browser QA scripts and fixtures under `.local` are ignored.

Run `npm run test:editor` only with a migrated/seeded isolated database ending `_test` and `ALLOW_TEST_DATABASE=yes`; never point it at customer production data.
- Final public smoke test passed for Editorial/Studio/Executive in both light and dark modes at 360px, 768px and 1440px: no horizontal overflow, no visitor editing controls, and no runtime errors.

### Drag-and-drop homepage sections
- Replaced the manual section-key textarea with one ordered list combining visibility switches, pointer/touch drag handles and keyboard/up/down controls. Includes drag insertion indicators, edge auto-scroll and Escape/pointer-cancel handling.
- Added additive migration 011 for full section order, independent of enabled sections; disabling/re-enabling a section retains its position across saves/reloads. Generic homepage edits preserve the saved order.
- Homepage rendering follows the saved order, including Gallery, independently positioned Closing CTA, and Footer. Header navigation, Blog menu link and floating controls remain visibility-only. Non-Hero first sections reserve space for fixed navigation.
- Browser QA passed: real mouse drag, touch input, keyboard Home/arrow ordering, absence of manual order input, save/reload, hidden-position retention, Gallery's saved position, CTA visible with Booking off, generic Homepage save preservation, and 390px mobile layout. Original homepage settings restored after tests; gallery fixture intercepted only.
- Ten unit/security tests passed, including order normalization and hide/re-enable behavior. Typecheck and production build passed. Screenshot: `.local/section-order-mobile.png`.

### Admin media and lead workspace — 2026-11-16
- Added distinct globe/edit header actions, inline media preview editor, metadata editing, safe same-ID file replacement, and colored Booking/Contact Kanban boards with detail dialogs.
- Applied additive migration 012 locally (media/request version counters).
- TypeScript, production build and 10 existing unit/security tests passed.
- Isolated-database integration test passed: metadata updates, same-ID image replacement, stale-version rejection, lead status-only updates preserving notes, all five statuses for both request kinds, notes updates, search/filtering, authentication/CSRF and missing-record response. Test file: tests/admin-workspace-integration.mjs; requires a seeded isolated _test database and ALLOW_TEST_DATABASE=yes.
- Brave/Playwright checks passed: header controls, inline media preview, mouse and touch lead drag, popup status/notes updates, both pipelines, Escape close, 390px page width and no browser runtime errors. Lead browser data was intercepted fixture data; actual customer leads were not changed. Desktop/mobile screenshots inspected locally.

### Integrations, logos and inbox follow-up — 2026-11-16
- Migration 013 adds disabled integration/custom-code settings and independent text/image logo settings without replacing existing content.
- Supersedes the previous dual-board layout: booking remains Kanban; contact is a searchable, paginated inbox with inline details/editing and external contact links.
- Isolated API tests passed for editable lead fields, invalid email rejection, provider ID validation, custom-code persistence, public-only CSP changes, strict admin/editor/preview CSP, logo validation and public media references.
- Browser fixture checks passed for tab saves/return navigation, public custom HTML/script/CSS insertion, once-only initialization, no execution in admin/theme preview, both logo positions, whole-card mouse drag, phone whole-card touch drag with persisted status, booking name edits and contact message/status edits, and 390px inbox width/back navigation.
- Tracking network calls were intercepted; no test events went to a real provider. Existing live settings and customer messages were not edited. Actual provider account delivery requires the owner's IDs and provider-side verification.

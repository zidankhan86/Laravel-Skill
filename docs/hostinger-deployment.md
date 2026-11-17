# Hostinger deployment runbook

Status: local implementation; not deployed or verified on Hostinger. The owner confirmed Node.js Web App and MySQL availability. Do not replace the current website or change DNS until staging passes.

Official references checked for this implementation: [Node.js deployment](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/) and [MySQL connection](https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/). Node apps on eligible Business/Cloud plans support GitHub builds. Actual account limits, runtime choice and proxy configuration must be checked in hPanel.

## Application configuration

- Repository root: this directory containing package.json; no nested app root.
- Package manager: npm; commit package-lock.json. Runtime: Node 22 (minimum 22.16).
- Install: `npm ci --include=dev` (build dependencies must be installed even when NODE_ENV=production).
- Build: `npm run build`. Frontend output: `dist/`.
- Start: `npm start`, entry `server/index.mjs`. Select a Node/Express web application, not a static-only Vite deployment. The server serves dist and the API from the same origin.
- Listen: `0.0.0.0`, `PORT` supplied by hosting (local default 3001). Do not set the startup command to Vite preview.
- Versioned migrations: `npm run migrate`; initial import: `npm run seed`; one-time interactive owner setup: `npm run owner:create`. Run these as controlled release steps, never build/start hooks.

## Configure staging first

1. Connect `m-tanvir-hossain/Md-Tanvir-Hossain-Portfolio` and select `feature/cms-backend` for staging. The local folder is now connected to the original repository history. Preserve unrelated changes and do not force-push. Keep the existing live deployment on its current branch until staging is verified.
2. Create a separate staging Node app and MySQL database/user. Use a strong generated database password. Grant only the required database permissions; schema migration needs DDL, normal application use needs table reads/writes.
3. Set server-only variables from .env.example in hPanel: NODE_ENV=production, PORT if required, APP_ORIGIN=https://your-staging-host, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, SESSION_SECRET, TRUST_PROXY. Generate SESSION_SECRET with `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"` in a private terminal and paste directly into the secret setting. Never commit it or use VITE_ prefixes.
4. For a Hostinger-local MySQL database the documented host is 127.0.0.1; use full prefixed database/user names. Verify connectivity with `npm run migrate`. If the app and DB are hosted separately, use the host/TLS settings supplied by the provider; this implementation assumes the confirmed local Hostinger MySQL connection.
5. Confirm Hostinger's proxy count. Set TRUST_PROXY only to that count; verify secure cookies behind HTTPS and source IP throttling. Do not set arbitrary trust-all proxy behavior.
6. Build and deploy staging. Run migrate once, seed once, then owner:create through an interactive secure shell. If the managed plan lacks an interactive command runner, use Hostinger SSH if provided or ask support for the supported administrative execution path. Do not create a bootstrap HTTP endpoint or put passwords in build logs.
7. Review imported records and configure missing video/demo/resource destinations. Verify discount/testimonial claims. Upload the real portrait if preferred over the existing external fallback.

## Durable uploads and backups

Media bytes live in MySQL, outside the build artifact. Ensure max_allowed_packet is at least 8 MB for the 5 MB upload limit. Confirm DB size/backup quotas. Database snapshots must include media, settings, sessions, users and all content tables. No separate uploads directory or external storage bill is introduced.

Before releases, take a Hostinger database backup and a secure logical dump using `mysqldump --single-transaction --hex-blob --no-tablespaces -h HOST -u USER -p DATABASE > backup.sql` (replace placeholders; password prompt, never command-line password). Store encrypted backups outside the app directory with restricted access. Test restore into a fresh isolated database using `mysql -h HOST -u USER -p RESTORE_DATABASE < backup.sql`; never restore over production for testing. Verify counts, owner login and sample image/PDF bytes. Set a retention policy based on personal-data requirements.

## Release and smoke checks

GitHub pushes may automatically rebuild and redeploy; select the staging branch first and confirm hPanel behavior. Do not couple automatic code deployment to destructive schema changes. Apply additive migrations before code needing them. Capture deployment commit/version and pre-release DB backup reference.

Check HTTPS, `/api/health` returning only `{status:"ok"}`, homepage, `/services`, a published service detail on direct refresh, `/blog`, `/admin` login/logout, unauthorized direct admin APIs, draft guessed URLs, image/PDF access and private-file denial. Use isolated test records for booking/contact; never send customer notifications. Verify request wording, Bangla/mobile navigation, CSRF rejection, media upload, publish/unpublish, ordering and restore. Restart/redeploy staging and verify edited records and uploaded bytes still exist. Inspect browser assets and logs for secrets without printing secret values.

Only after successful staging checks should the owner switch the live domain and SSL configuration through Hostinger. Set APP_ORIGIN to the final HTTPS origin and matching site SEO settings. Ensure HTTP redirects to HTTPS and the selected canonical hostname; the Node server handles SPA refresh and detail routes. Do not add a blanket static rewrite that bypasses API authorization or draft checks.

## Rollback

Keep the prior code build/commit deployable against the updated schema. Roll back code through hPanel/GitHub without reseeding or resetting data. MySQL DDL changes are not automatically transactional; prefer expand/migrate/contract releases. For an incompatible migration, stop writes and restore a validated backup under an explicit recovery procedure; restoring code alone does not undo data changes. Never delete current hosting or alter DNS merely to prepare a release.

## Visual editor and design-theme release
Before serving this version, run `npm run migrate` through migration `010_editor_form_labels.sql`. Migrations 008–010 add design options and editable presentation labels without replacing existing owner content. They also work before the initial seed on a fresh installation. Then build/restart the Node app.

The new `/api/admin/editor` GET/PATCH endpoints use the same session, origin and CSRF guards as the rest of admin. PATCH saves a batch in one MySQL transaction with optimistic version checks and media-reference validation. No separate frontend-editing account or secret is needed. `/?edit=1` opens the authenticated editor; `/?preview=design` is a read-only, same-origin iframe preview. CSP now permits same-origin preview frames. Keep both frontend and API on the same HTTPS origin.

Smoke-test Edit Website → text/image draft → Save changes, media upload/library selection, anonymous rejection, and Appearance → each theme → desktop/mobile preview → Save Appearance. Verify a new public visit uses the saved design. Do not import a new seed or reset customer data to switch themes.

## Drag-and-drop section ordering
Run migration `011_section_order.sql` before deploying this release. It initializes `homepage.sectionOrder` from the saved enabled-section list without enabling or disabling sections. Admin now stores the complete section order separately so hidden sections retain their positions; `homepage.sections` continues to contain enabled sections in display order. Gallery is no longer pinned after Resources, and Closing CTA/Footer render independently at their saved positions. Header navigation, Blog menu visibility and floating controls retain their fixed placement.

Admin workspace update: run the existing migration command before starting the updated server. Migration `012_media_lead_versions.sql` adds version counters to media and requests for safe concurrent edits. Existing files and leads are preserved.

Integration/inbox/logo update: run migrations through `013_integrations_logos.sql` before restarting. Integrations and custom code default to off. Public HTML CSP permits enabled provider scripts; custom-code mode permits owner-supplied inline/HTTPS scripts only on public documents. Admin and authoring documents retain their strict policy. If your host adds its own CSP header, it must also permit the providers you enable. Custom snippets run after the client loads, not as server-rendered/no-JavaScript tags.

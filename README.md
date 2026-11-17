# Tanvir Portfolio CMS

GitHub repository: https://github.com/m-tanvir-hossain/Md-Tanvir-Hossain-Portfolio. CMS implementation branch: `feature/cms-backend`. The local folder is now connected to the original repository history.

React/Vite public website with a Node/Express admin API and MySQL persistence. Existing content is imported separately from application code. Hostinger Node.js Web App + MySQL is the selected deployment target.

## Local setup

Requires Node 22.16+ (22.x), npm and MySQL 8. Create an empty database with utf8mb4, then:

```sh
npm ci
cp .env.example .env
# Edit .env locally: database credentials, a random SESSION_SECRET, APP_ORIGIN.
npm run migrate
npm run seed
npm run owner:create
```

The interactive owner command has no default password and refuses to run after an owner exists. The import is repeatable and does not overwrite edits. No migration/import runs during startup.

Run two terminals:

```sh
npm run dev:server
```

```sh
npm run dev
```

Open http://localhost:3000 and http://localhost:3000/admin. APP_ORIGIN must match exactly. Vite proxies /api and /media to port 3001. For a production-style local check, build, set APP_ORIGIN=http://localhost:3001 and run `npm start`; use NODE_ENV=development locally unless HTTPS is available.

```sh
npm run typecheck
npm test
npm run build
```

For database integration checks, provision an isolated migrated database with a name ending `_test`, configure its DB_* values and run `ALLOW_TEST_DATABASE=yes npm run test:integration`. Never run this against production. Tests create and clean only their own records. Browser QA scripts are documented in docs/qa-report.md.

Uploaded PNG/JPEG/WebP/PDF files (5 MB maximum) live in MySQL, not dist. Keep database backups including binary media. Free files with missing destinations display unavailable; paid resources retain WhatsApp. Booking submissions are requests, not confirmed appointments.

- [Repository audit](docs/project-audit.md)
- [Architecture and content model](docs/architecture.md)
- [Admin user guide](docs/admin-user-guide.md)
- [Hostinger deployment](docs/hostinger-deployment.md)
- [QA outcomes and limitations](docs/qa-report.md)

Do not commit .env, database dumps or owner credentials. This source export originally lacked Git metadata; use the real repository and a dedicated feature branch for delivery. No production deployment has been performed.

## Ready-to-run setup on this Mac

This checkout now includes an ignored local runtime/database installation. Run `./scripts/local-service.sh start`, then open http://localhost:3000 or http://localhost:3000/admin. The macOS background service stays running after the terminal closes. See [local setup and private login location](docs/local-setup.md) for status/stop commands. This setup is separate from Hostinger deployment.

## Visual editing and portfolio themes
After admin login, **Edit Website** opens the front-page editor with text editing, image library/upload, draft preview, Save changes and Discard. **Appearance** includes three layout themes (Editorial, Studio, Executive), live desktop/mobile previews and theme-specific controls. Theme changes preserve existing content. See the [admin user guide](docs/admin-user-guide.md) for usage and the [deployment runbook](docs/hostinger-deployment.md) for migrations 008–010.
# Laravel-Skill

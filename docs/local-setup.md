# Local setup on this Mac

This checkout has private, project-local Node 22 and MySQL 8.4 runtimes. It does not require a global Node installation or change your shell profile.

Start the website, API and database as a macOS user background service:

```sh
./scripts/local-service.sh start
```

The command exits after checking readiness. The website keeps running when the terminal or chat closes. This service is registered for the current macOS login session; after logging out or restarting your Mac, run the start command again.

```sh
./scripts/local-service.sh status
./scripts/local-service.sh stop
```

For foreground debugging only, stop the background service first and run `./scripts/local-start.sh`. That alternative requires keeping the terminal open; Ctrl+C stops it.

- Website: http://localhost:3000
- Admin: http://localhost:3000/admin
- Owner email: devtanvirhossain@gmail.com
- Initial random password: open `.local/owner-credentials.txt` locally in your editor. It is not committed or displayed in chat. Change it under Account & Security after login.

Always use `localhost:3000` in your browser: cookie write requests must match APP_ORIGIN. The services bind to your Mac's loopback interface. MySQL uses port 3308, the API uses 3001 and Vite uses 3000. The launcher refuses to silently pick another port.

## Persistent files

- `.local/mysql-data/`: database and uploaded media. Keep this directory to retain content across restarts.
- `.local/runtime/`: private Node/MySQL binaries for this Mac.
- `.env`: generated local application configuration and secrets.
- `.local/mysql-root.env`: private local database maintenance credentials.
- `.local/logs/`: startup and runtime logs.

`.local/` and `.env` are ignored by Git. Do not upload them to Hostinger or commit them. Production needs separate database credentials and a new owner account. This is a local development installation, not a Hostinger deployment.

For other commands, temporarily enable the bundled Node runtime in your terminal:

```sh
export PATH="$PWD/.local/runtime/node/bin:$PATH"
npm run build
npm run typecheck
```

The startup command never migrates, imports, resets or replaces data. Database migrations and the initial import have already been run. If you deliberately change schema later, run `npm run migrate` with the local database running.

If startup fails, inspect `.local/logs/service-error.log`, `mysql.log`, `api.log` and `frontend.log`. The background start command can be repeated while running. Do not run the foreground launcher at the same time. These bundled binaries are specific to this Mac; on another computer install compatible Node/MySQL and follow the main README.

# quotes-api

A small Express API deployed to a **Linux server behind nginx**. nginx listens on port 80 and reverse-proxies to the Node app running as a `systemd` service on port 3000.

## Endpoints
- `GET /health` -> `{ "status": "ok" }`
- `GET /api/version` -> `{ "name", "version" }`
- `GET /api/quotes` -> list of quotes
- `GET /api/quotes/random` -> one random quote
- `GET /api/quotes/:id` -> one quote (404 if missing)

## Run locally
```bash
npm install
npm start          # http://localhost:3000/health
```

## Test
```bash
npm run test:unit
npm run test:api
npm run test:coverage
```

## Deploy
- `deploy/nginx.conf` — the nginx reverse-proxy site config.
- `deploy/quotes-api.service` — the systemd unit that runs the app.
- Server provisioning and the CI/CD you must build are described in the assignment and setup guide your instructor provides.

## CI/CD

- **CI** (`.github/workflows/ci.yml`): runs on push to `main` and on every PR - lint, `npm audit --audit-level=high`, unit + API tests, coverage (summary on the run page, report uploaded as an artifact). Uses `permissions: contents: read`, `concurrency` with `cancel-in-progress`, `setup-node` with `cache: npm` and `npm ci`.
- **CD** (`.github/workflows/cd.yml`, manual `workflow_dispatch` with a `version` input): `npm ci --omit=dev`, rsync to `releases/<version>` on the server, atomic switch of the `current` symlink, `systemctl restart quotes-api` + `nginx -s reload`, health check on `http://SERVER_HOST/health` (port 80, 10 retries), and a GitHub release/tag only if the deploy is healthy.

### How rollback works
Every deploy goes into a new release folder, so the previous release is never touched. Before switching, the workflow records where `current` points. If the health check fails, the rollback step repoints `current` to that previous release (temporary symlink + `mv -T`, which is atomic), restarts the service, reloads nginx and re-checks `/health`. The run is still marked failed and the release/tag job is skipped.

### How the health check is verified
- Normal deploy: the workflow calls `/health` through nginx on port 80 and expects `{"status":"ok"}` within 10 attempts.
- Rollback test: run CD with `simulate_failure = true`. The check hits a non-existent path, fails after 10 attempts, and the rollback step restores the previous release.

### Secrets and variables
Secret `SSH_PRIVATE_KEY`; variables `SERVER_HOST` and `SERVER_USER` (optional `APP_DIR`, default `/opt/quotes-api`).

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

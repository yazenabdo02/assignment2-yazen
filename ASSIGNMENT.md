# Assignment 2 — Build the CI/CD to publish quotes-api to a Linux + nginx server

You're given the **`quotes-api`** project (clean code + README + `deploy/` configs). Your job: **write the CI and CD pipelines** that test it and publish it to the Linux server, where **nginx** reverse-proxies to the Node app. No application code changes required.

**Server:** your instructor provides `SERVER_HOST`, `SERVER_USER`, and the `SSH_PRIVATE_KEY` secret (see the setup guide). The app lives at `/opt/quotes-api` with a `releases/` + `current` layout; a `systemd` service runs it; nginx serves port 80.

---

## Part A — CI (`.github/workflows/ci.yml`)
Runs on GitHub-hosted runners on push to `main` and every PR. It must:
1. **Lint** (`npm run lint`).
2. **Security scan** (`npm audit --audit-level=high`).
3. **Unit + API tests** (`npm run test:unit`, `npm run test:api`).
4. **Coverage** (`npm run test:coverage`) and publish the summary.
Best-practice touches: `permissions: contents: read`, `concurrency` with `cancel-in-progress`, `setup-node` with `cache: npm`, `npm ci`.

## Part B — CD (`.github/workflows/cd.yml`)
Manual (`workflow_dispatch` with a `version` input). It must, over SSH:
1. Build/prepare the app (`npm ci --omit=dev`).
2. **Copy** the app into a **new release folder** on the server: `/opt/quotes-api/releases/<version-or-timestamp>` (use `rsync`).
3. **Switch** the `current` symlink to the new release (atomic).
4. **Restart** the systemd service and **reload nginx**.
5. **Health check** `http://SERVER_HOST/health` (through nginx, port 80) with retries.
6. **Roll back** on failure: repoint `current` to the previous release and restart.
7. **Tag a release** on success.

Use the secret/variables: `secrets.SSH_PRIVATE_KEY`, `vars.SERVER_HOST`, `vars.SERVER_USER`.

## Best practices required
- Least-privilege `permissions:`.
- No plaintext credentials — SSH key from a **secret**; host/user from **variables**.
- Deploy to a **new release dir + symlink switch** (not overwrite-in-place) so rollback is instant.
- **Health check + automatic rollback**.
- Tag/release only **after** a healthy deploy.

## How to submit (GitHub)
1. Create a **new repository in your GitHub account** (or the class org), e.g. `assignment2-<yourname>`.
2. Unzip this project and push it there (`git init` → commit → `git remote add origin <your-repo-url>` → `git push -u origin main`).
3. Add your two GitHub **Variables** (`SERVER_HOST`, `SERVER_USER`) and the **Secret** `SSH_PRIVATE_KEY` in that repo's Settings (see `SETUP-LINUX-NGINX.md`).
4. Build `ci.yml` and `cd.yml`, work on branches → PRs → merge, and run a successful CD deploy.
5. **Submit your repository URL** in the LMS. Make the repo **public**, or add the instructor as a **collaborator**.

## Deliverables (in your repo)
- `ci.yml` and `cd.yml` in `.github/workflows/`.
- A short note in the README: how rollback works and how you verified the health check.
- Evidence: a green CI run and a successful CD deploy — the site reachable at `http://SERVER_HOST/api/quotes` (link or screenshot).

## Grading
| Criteria | Weight |
|---|---|
| CI: lint + security + tests + coverage, best-practice touches | 25% |
| CD deploys via SSH to a new release + symlink switch | 25% |
| systemd restart + nginx reload + health check pass | 20% |
| Automatic rollback on a failed health check (demonstrated) | 20% |
| Tag/release only on success; secrets/vars used correctly | 10% |

## Hints
- Load the key on the runner:
  ```yaml
  - run: |
      mkdir -p ~/.ssh && echo "${{ secrets.SSH_PRIVATE_KEY }}" > ~/.ssh/id_ed25519
      chmod 600 ~/.ssh/id_ed25519
      ssh-keyscan -H ${{ vars.SERVER_HOST }} >> ~/.ssh/known_hosts
  ```
- `rsync -az --delete ./ ${{ vars.SERVER_USER }}@${{ vars.SERVER_HOST }}:/opt/quotes-api/releases/$VERSION/`
- Remote commands: `ssh user@host "ln -sfn releases/$VERSION current && sudo systemctl restart quotes-api && sudo nginx -s reload"`
- Full reference solution is with the instructor (`REFERENCE-workflows.md`).

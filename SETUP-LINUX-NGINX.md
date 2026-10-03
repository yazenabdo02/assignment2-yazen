# Setup — Linux server + nginx (for the quotes-api assignment)

One-time server provisioning so students can deploy `quotes-api` from GitHub Actions. Target: **Ubuntu 22.04+**. nginx listens on **port 80** and reverse-proxies to the Node app (a `systemd` service on **127.0.0.1:3000**).

> **Security:** SSH key-only (no passwords), a **non-root `deploy` user**, least-privilege sudo, firewall on. `<SERVER-IP>` is a placeholder.

**Layout we build (best practice: timestamped releases + a `current` symlink):**
```
/opt/quotes-api/
├── releases/2026....   (one folder per deploy)
├── current  ->  releases/2026....   (symlink the service runs from)
```

Run as a sudo-capable user (or root) over SSH.

## 1. Base packages + Node
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx rsync
node -v && nginx -v
```

## 2. Create a non-root deploy user
```bash
sudo adduser --disabled-password --gecos "" deploy
sudo mkdir -p /opt/quotes-api/releases
sudo chown -R deploy:deploy /opt/quotes-api
```

## 3. systemd service (runs the Node app)
Copy the repo's `deploy/quotes-api.service` to the server:
```bash
sudo cp quotes-api.service /etc/systemd/system/quotes-api.service
sudo systemctl daemon-reload
sudo systemctl enable quotes-api
```
It runs `node src/server.js` from `/opt/quotes-api/current` as the `deploy` user on port 3000. (It won't start until the first deploy creates `current`.)

## 4. nginx reverse proxy
Copy the repo's `deploy/nginx.conf`:
```bash
sudo cp nginx.conf /etc/nginx/sites-available/quotes-api
sudo ln -sf /etc/nginx/sites-available/quotes-api /etc/nginx/sites-enabled/quotes-api
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

## 5. Firewall
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw --force enable
```

## 6. Let the deploy user control its service without a password
So CI can restart the service over SSH without an interactive sudo prompt:
```bash
echo 'deploy ALL=(ALL) NOPASSWD: /bin/systemctl restart quotes-api, /bin/systemctl status quotes-api, /usr/sbin/nginx -s reload' | sudo tee /etc/sudoers.d/deploy
sudo chmod 440 /etc/sudoers.d/deploy
```
(Least privilege: the deploy user can restart only this service and reload nginx — nothing else.)

## 7. SSH deploy key for CI
On your laptop (or the server), make a dedicated keypair for the pipeline:
```bash
ssh-keygen -t ed25519 -C "quotes-api-deploy" -f quotes_deploy_key
```
Add the **public** key to the deploy user:
```bash
sudo -u deploy mkdir -p /home/deploy/.ssh
sudo -u deploy bash -c 'cat >> /home/deploy/.ssh/authorized_keys' < quotes_deploy_key.pub
sudo chmod 700 /home/deploy/.ssh && sudo chmod 600 /home/deploy/.ssh/authorized_keys
```
In the GitHub repo → **Settings → Secrets and variables → Actions**:
- **Secret** `SSH_PRIVATE_KEY` = the contents of `quotes_deploy_key` (the private key).
- **Variable** `SERVER_HOST` = `<SERVER-IP>`
- **Variable** `SERVER_USER` = `deploy`

## 8. Smoke test the setup manually (before CI)
```bash
sudo -u deploy mkdir -p /opt/quotes-api/releases/manual
# copy the app there, then:
cd /opt/quotes-api/releases/manual && npm ci --omit=dev
sudo -u deploy ln -sfn /opt/quotes-api/releases/manual /opt/quotes-api/current
sudo systemctl restart quotes-api
curl -s http://localhost/health          # {"status":"ok"} via nginx on port 80
```

## Best practices baked in
- **nginx as reverse proxy** in front of Node (TLS, buffering, one public port).
- **systemd** keeps the app running and restarts it on failure.
- **Non-root deploy user** + **least-privilege sudo** (only restart this service / reload nginx).
- **Key-only SSH**, dedicated deploy key stored as a **secret**.
- **Releases + `current` symlink** → atomic switch and instant rollback (repoint the symlink).
- **Firewall** limited to SSH + 80.

## Troubleshooting
- `curl http://localhost/health` fails → `sudo systemctl status quotes-api` and `journalctl -u quotes-api -n 50`.
- 502 from nginx → the Node service isn't up on 3000 (check the service).
- Permission denied on deploy → deploy user doesn't own `/opt/quotes-api`, or the SSH key isn't in `authorized_keys`.

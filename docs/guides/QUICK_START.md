# ⚡ QUICK START - New Terminal Session

## 🎯 One Command to Rule Them All

Open a **NEW SSH terminal** and run:

```bash
ssh root@66.116.199.219
```
Password: `ZT@DY#machine01`

Then copy-paste this **ONE COMMAND**:

```bash
curl -o setup.sh https://raw.githubusercontent.com/isumitmalhotra/Zyphex-Tech/main/scripts/complete-vps-setup.sh && chmod +x setup.sh && ./setup.sh
```

⏱️ **Time:** 5 minutes  
✅ **Result:** Steps 6-14 completed automatically

---

## 📋 After Script Completes

### 1️⃣ Generate SSH Key (2 min)
```bash
su - deploy
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/github_deploy -N ""
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# COPY THIS OUTPUT:
cat ~/.ssh/github_deploy
```

### 2️⃣ Add to GitHub Secrets (2 min)
Go to: https://github.com/isumitmalhotra/Zyphex-Tech/settings/secrets/actions

Add 4 secrets:
- `VPS_SSH_PRIVATE_KEY` = [paste private key]
- `VPS_HOST` = `66.116.199.219`
- `VPS_USER` = `deploy`
- `VPS_PORT` = `22`

### 3️⃣ Create Environment File (2 min)
```bash
cd /var/www/zyphextech
cat > .env.production << 'EOF'
DATABASE_URL="postgresql://zyphex:zyphex_secure_pass_2024@localhost:5432/zyphextech"
REDIS_URL="redis://:zyphex_redis_pass_2024@localhost:6379"
NEXTAUTH_URL="https://www.zyphextech.com"
NEXTAUTH_SECRET="CHANGE_ME_TO_RANDOM_32_CHARS"
NODE_ENV="production"
PORT=3000
EOF

# Generate secret
openssl rand -base64 32
# Copy output and replace CHANGE_ME_TO_RANDOM_32_CHARS

nano .env.production  # Edit and save
chmod 600 .env.production
```

### 4️⃣ Setup Nginx & SSL (2 min)
```bash
exit  # Back to root
sudo cp /var/www/zyphextech/configs/nginx/zyphextech.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/zyphextech.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d www.zyphextech.com --email admin@zyphextech.com --agree-tos --non-interactive
```

### 5️⃣ Deploy Application (3 min)
```bash
su - deploy
cd /var/www/zyphextech
npm ci && npx prisma generate && npx prisma migrate deploy && npm run build
pm2 start ecosystem.config.js && pm2 save
pm2 status
```

### 6️⃣ Test (30 sec)
```bash
curl http://localhost:3000/api/health
# Should return: {"status":"ok"}
```

Open: https://www.zyphextech.com ✅

---

## 🎊 Done!

Total time: **~15 minutes**

Every push to GitHub `main` branch now deploys automatically! 🚀

---

## 📚 Full Documentation

- **Quick Guide:** `FRESH_TERMINAL_SETUP.md`
- **Immediate Action:** `IMMEDIATE_ACTION_REQUIRED.md`
- **Commands:** `VPS_QUICK_COMMANDS.md`
- **Visual Guide:** `VPS_DEPLOYMENT_VISUAL_ROADMAP.md`

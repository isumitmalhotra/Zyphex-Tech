# 🚀 Fresh Terminal Setup - Complete Commands

## Copy and paste these commands in your new SSH session

### Step 1: Connect to VPS
```bash
ssh root@66.116.199.219
# Password: ZT@DY#machine01
```

### Step 2: Download and Run Complete Setup Script
```bash
# Download the fixed setup script
curl -o complete-setup.sh https://raw.githubusercontent.com/isumitmalhotra/Zyphex-Tech/main/scripts/complete-vps-setup.sh

# Make it executable
chmod +x complete-setup.sh

# Run it (completes steps 6-14)
./complete-setup.sh
```

This script will:
- ✅ Fix Redis configuration (handles AlmaLinux 8 path correctly)
- ✅ Install and configure Nginx
- ✅ Install Certbot for SSL
- ✅ Create application directory
- ✅ Clone your repository
- ✅ Install and configure PM2
- ✅ Setup health monitoring
- ✅ Setup log rotation
- ✅ Configure SELinux

**Time:** ~5 minutes

---

### Step 3: Generate SSH Key for GitHub Actions
```bash
# Switch to deploy user
su - deploy

# Generate SSH key
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/github_deploy -N ""

# Add to authorized_keys
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Display private key - COPY THIS ENTIRE OUTPUT!
echo ""
echo "=========================================="
echo "COPY EVERYTHING BELOW (including headers)"
echo "=========================================="
cat ~/.ssh/github_deploy
echo "=========================================="
```

**⚠️ COPY THE ENTIRE PRIVATE KEY OUTPUT (including -----BEGIN and -----END lines)**

---

### Step 4: Add GitHub Secrets

Open in browser: https://github.com/isumitmalhotra/Zyphex-Tech/settings/secrets/actions

Add these 4 secrets:

1. **VPS_SSH_PRIVATE_KEY**
   - Paste the entire private key from Step 3

2. **VPS_HOST**
   - Value: `66.116.199.219`

3. **VPS_USER**
   - Value: `deploy`

4. **VPS_PORT**
   - Value: `22`

---

### Step 5: Create Environment File
```bash
# As deploy user, create environment file
cd /var/www/zyphextech
nano .env.production
```

**Paste this content:**
```env
# Database
DATABASE_URL="postgresql://zyphex:zyphex_secure_pass_2024@localhost:5432/zyphextech"
DIRECT_URL="postgresql://zyphex:zyphex_secure_pass_2024@localhost:5432/zyphextech"

# Redis
REDIS_URL="redis://:zyphex_redis_pass_2024@localhost:6379"

# NextAuth
NEXTAUTH_URL="https://www.zyphextech.com"
NEXTAUTH_SECRET="REPLACE_WITH_RANDOM_SECRET_HERE"

# Node
NODE_ENV="production"
PORT=3000

# Email (update with your SMTP)
EMAIL_FROM="noreply@zyphextech.com"
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-smtp-user"
SMTP_PASSWORD="your-smtp-password"
```

**Generate NEXTAUTH_SECRET:**
```bash
# Run this command and copy the output
openssl rand -base64 32

# Replace REPLACE_WITH_RANDOM_SECRET_HERE with the output
```

**Save file:**
- Press `Ctrl+X`
- Press `Y`
- Press `Enter`

**Secure the file:**
```bash
chmod 600 .env.production
```

---

### Step 6: Setup Nginx Configuration
```bash
# Exit from deploy user back to root
exit

# Copy Nginx config
sudo cp /var/www/zyphextech/configs/nginx/zyphextech.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/zyphextech.conf /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

---

### Step 7: Get SSL Certificate
```bash
# Obtain Let's Encrypt SSL certificate
sudo certbot --nginx -d www.zyphextech.com --email admin@zyphextech.com --agree-tos --non-interactive

# Verify certificate
sudo certbot certificates
```

---

### Step 8: Deploy Application
```bash
# Switch to deploy user
su - deploy

# Go to application directory
cd /var/www/zyphextech

# Install dependencies
npm ci

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Build Next.js application
npm run build

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Check status
pm2 status
```

---

### Step 9: Test Everything
```bash
# Health check
curl http://localhost:3000/api/health

# Should return: {"status":"ok"}

# View logs
pm2 logs zyphextech --lines 20

# Check all services
sudo systemctl status nginx
sudo systemctl status postgresql-15
sudo systemctl status redis
```

---

### Step 10: Test Website
```bash
# Test locally
curl -I https://www.zyphextech.com

# Open in browser:
# https://www.zyphextech.com
```

---

### Step 11: Trigger GitHub Actions
On your local machine (PowerShell):
```powershell
cd C:\Projects\Zyphex-Tech
git commit --allow-empty -m "test: trigger automated deployment"
git push origin main
```

Watch deployment at: https://github.com/isumitmalhotra/Zyphex-Tech/actions

---

## ✅ Success Checklist

- [ ] Setup script completed without errors
- [ ] SSH key generated and added to GitHub secrets
- [ ] All 4 GitHub secrets configured
- [ ] Environment file created with NEXTAUTH_SECRET
- [ ] Nginx configuration loaded
- [ ] SSL certificate obtained
- [ ] Application built successfully
- [ ] PM2 shows "online" status
- [ ] Health check returns {"status":"ok"}
- [ ] Website loads at https://www.zyphextech.com
- [ ] GitHub Actions workflow runs successfully

---

## 🆘 Quick Troubleshooting

**If Redis doesn't start:**
```bash
sudo systemctl restart redis
sudo systemctl status redis
redis-cli -a zyphex_redis_pass_2024 ping
```

**If PM2 doesn't start:**
```bash
pm2 logs zyphextech --err
pm2 restart zyphextech
```

**If Nginx fails:**
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

**If database connection fails:**
```bash
psql -h localhost -U zyphex -d zyphextech
# Password: zyphex_secure_pass_2024
```

---

## 📞 Need Help?

Check these documents:
- `IMMEDIATE_ACTION_REQUIRED.md` - Quick fix guide
- `VPS_QUICK_COMMANDS.md` - Command reference
- `VPS_SETUP_COMPLETE_GUIDE.md` - Full documentation

---

**Total Time:** ~20-25 minutes for complete setup
**Result:** Fully automated CI/CD deployment pipeline 🚀

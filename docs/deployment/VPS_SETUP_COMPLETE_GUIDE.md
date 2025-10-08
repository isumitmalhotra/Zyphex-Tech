# 🚀 Complete VPS Setup Guide for AlmaLinux

**Target VPS:** 66.116.199.219 (AlmaLinux)  
**Domain:** www.zyphextech.com  
**Deployment:** Automated GitHub Actions CI/CD

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Machine Setup](#local-machine-setup)
3. [VPS Initial Setup](#vps-initial-setup)
4. [GitHub Secrets Configuration](#github-secrets-configuration)
5. [First Deployment](#first-deployment)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Prerequisites

### What You Need:
- ✅ VPS Access: SSH root access to 66.116.199.219
- ✅ Domain: www.zyphextech.com (DNS configured)
- ✅ GitHub Repository: Push access to your repository
- ✅ Local Tools: Git, SSH client, PowerShell/Terminal

---

## 💻 Local Machine Setup

### Step 1: Generate SSH Key Pair (If Not Already Done)

**On Windows (PowerShell):**
```powershell
# Generate new SSH key pair
ssh-keygen -t ed25519 -C "github-actions-deploy" -f "$env:USERPROFILE\.ssh\vps_deploy_key"

# This creates:
# - Private key: C:\Users\YourName\.ssh\vps_deploy_key
# - Public key:  C:\Users\YourName\.ssh\vps_deploy_key.pub
```

**Important:** Press Enter when asked for passphrase (leave empty for GitHub Actions)

### Step 2: Copy Public Key Content

```powershell
# Display public key (copy this entire output)
Get-Content "$env:USERPROFILE\.ssh\vps_deploy_key.pub"
```

**Copy the output** - it looks like:
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... github-actions-deploy
```

### Step 3: Copy Private Key Content

```powershell
# Display private key (copy this entire output including header/footer)
Get-Content "$env:USERPROFILE\.ssh\vps_deploy_key"
```

**Copy the ENTIRE output** - it looks like:
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
...multiple lines...
-----END OPENSSH PRIVATE KEY-----
```

---

## 🖥️ VPS Initial Setup

### Step 1: Connect to VPS

```powershell
# Connect as root
ssh root@66.116.199.219
# Password: ZT@DY#machine01
```

### Step 2: Run Complete Setup Script

Copy and paste this entire script into your VPS terminal:

```bash
#!/bin/bash

# VPS Complete Setup Script for AlmaLinux
# This script sets up everything needed for the Zyphex Tech platform

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting VPS Setup for Zyphex Tech${NC}"

# ============================================================================
# Step 1: System Update
# ============================================================================
echo -e "${YELLOW}📦 Updating system packages...${NC}"
dnf update -y
dnf install -y git curl wget vim firewalld policycoreutils-python-utils

# ============================================================================
# Step 2: Create Deploy User
# ============================================================================
echo -e "${YELLOW}👤 Creating deploy user...${NC}"
if ! id -u deploy >/dev/null 2>&1; then
    useradd -m -s /bin/bash deploy
    usermod -aG wheel deploy
    echo "deploy ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/deploy
fi

# ============================================================================
# Step 3: Setup SSH for Deploy User
# ============================================================================
echo -e "${YELLOW}🔑 Setting up SSH for deploy user...${NC}"
mkdir -p /home/deploy/.ssh
touch /home/deploy/.ssh/authorized_keys
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}📋 IMPORTANT: Add SSH Public Key${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Please paste your SSH public key (the one ending with 'github-actions-deploy')"
echo "Press Enter when done:"
read -r SSH_PUBLIC_KEY

if [ -n "$SSH_PUBLIC_KEY" ]; then
    echo "$SSH_PUBLIC_KEY" >> /home/deploy/.ssh/authorized_keys
    echo -e "${GREEN}✅ SSH key added successfully${NC}"
else
    echo -e "${RED}❌ No SSH key provided. You'll need to add it manually later.${NC}"
fi

# ============================================================================
# Step 4: Configure Firewall
# ============================================================================
echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
systemctl start firewalld
systemctl enable firewalld
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --permanent --add-service=ssh
firewall-cmd --reload

# ============================================================================
# Step 5: Install Node.js 20
# ============================================================================
echo -e "${YELLOW}📦 Installing Node.js 20...${NC}"
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
dnf install -y nodejs
npm install -g npm@latest

# ============================================================================
# Step 6: Install PostgreSQL 15
# ============================================================================
echo -e "${YELLOW}🗄️  Installing PostgreSQL 15...${NC}"
dnf install -y postgresql15-server postgresql15-contrib
postgresql-15-setup initdb
systemctl start postgresql-15
systemctl enable postgresql-15

# Configure PostgreSQL
echo -e "${YELLOW}🔧 Configuring PostgreSQL...${NC}"
sudo -u postgres psql -c "CREATE USER zyphex WITH PASSWORD 'zyphex_secure_pass_2024';" || true
sudo -u postgres psql -c "CREATE DATABASE zyphextech OWNER zyphex;" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE zyphextech TO zyphex;" || true

# Update pg_hba.conf for local connections
sed -i 's/peer/md5/g' /var/lib/pgsql/15/data/pg_hba.conf
sed -i 's/ident/md5/g' /var/lib/pgsql/15/data/pg_hba.conf

# Optimize PostgreSQL for 4GB RAM
cat >> /var/lib/pgsql/15/data/postgresql.conf << 'EOF'

# Performance Tuning for 4GB RAM
shared_buffers = 1GB
effective_cache_size = 3GB
maintenance_work_mem = 256MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 10MB
min_wal_size = 1GB
max_wal_size = 4GB
max_connections = 100
EOF

systemctl restart postgresql-15

# ============================================================================
# Step 7: Install Redis
# ============================================================================
echo -e "${YELLOW}🔴 Installing Redis...${NC}"
dnf install -y redis
systemctl start redis
systemctl enable redis

# Configure Redis
cat > /etc/redis/redis.conf << 'EOF'
bind 127.0.0.1
port 6379
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
EOF

systemctl restart redis

# ============================================================================
# Step 8: Install Nginx
# ============================================================================
echo -e "${YELLOW}🌐 Installing Nginx...${NC}"
dnf install -y nginx
systemctl start nginx
systemctl enable nginx

# ============================================================================
# Step 9: Install Certbot for SSL
# ============================================================================
echo -e "${YELLOW}🔒 Installing Certbot...${NC}"
dnf install -y certbot python3-certbot-nginx

# ============================================================================
# Step 10: Install PM2
# ============================================================================
echo -e "${YELLOW}⚡ Installing PM2...${NC}"
npm install -g pm2
pm2 startup systemd -u deploy --hp /home/deploy

# ============================================================================
# Step 11: Create Application Directory
# ============================================================================
echo -e "${YELLOW}📁 Creating application directory...${NC}"
mkdir -p /var/www/zyphextech
chown -R deploy:deploy /var/www/zyphextech

# ============================================================================
# Step 12: Clone Repository (as deploy user)
# ============================================================================
echo -e "${YELLOW}📦 Cloning repository...${NC}"
sudo -u deploy bash << 'EOF'
cd /var/www/zyphextech
if [ ! -d ".git" ]; then
    git clone https://github.com/isumitmalhotra/Zyphex-Tech.git .
fi
EOF

# ============================================================================
# Step 13: Create Environment File
# ============================================================================
echo -e "${YELLOW}🔧 Creating environment file...${NC}"
cat > /var/www/zyphextech/.env.production << 'EOF'
# Database
DATABASE_URL="postgresql://zyphex:zyphex_secure_pass_2024@localhost:5432/zyphextech"

# NextAuth
NEXTAUTH_URL="https://www.zyphextech.com"
NEXTAUTH_SECRET="CHANGE_THIS_TO_RANDOM_STRING_AT_LEAST_32_CHARS_LONG"

# Redis
REDIS_URL="redis://localhost:6379"

# Node Environment
NODE_ENV="production"
PORT=3000

# Email (Configure these based on your email provider)
EMAIL_FROM="noreply@zyphextech.com"
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-smtp-user"
SMTP_PASSWORD="your-smtp-password"

# OAuth (Add your actual credentials)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
MICROSOFT_CLIENT_ID="your-microsoft-client-id"
MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret"
EOF

chown deploy:deploy /var/www/zyphextech/.env.production
chmod 600 /var/www/zyphextech/.env.production

# ============================================================================
# Step 14: Setup Nginx Configuration
# ============================================================================
echo -e "${YELLOW}🌐 Configuring Nginx...${NC}"
cp /var/www/zyphextech/configs/nginx/zyphextech.conf /etc/nginx/conf.d/zyphextech.conf

# Test Nginx configuration
nginx -t

# Reload Nginx
systemctl reload nginx

# ============================================================================
# Step 15: Setup SSL Certificate
# ============================================================================
echo -e "${YELLOW}🔒 Setting up SSL certificate...${NC}"
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🔐 SSL Certificate Setup${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Run this command to get SSL certificate:"
echo "sudo certbot --nginx -d www.zyphextech.com"
echo ""

# ============================================================================
# Step 16: Setup Monitoring
# ============================================================================
echo -e "${YELLOW}📊 Setting up monitoring...${NC}"
mkdir -p /var/log/pm2
chown -R deploy:deploy /var/log/pm2

# Health check cron job
(crontab -l 2>/dev/null; echo "*/5 * * * * curl -f http://localhost:3000/api/health || systemctl restart nginx") | crontab -

# ============================================================================
# Step 17: Setup Log Rotation
# ============================================================================
echo -e "${YELLOW}📝 Setting up log rotation...${NC}"
cat > /etc/logrotate.d/zyphextech << 'EOF'
/var/log/pm2/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 deploy deploy
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

# ============================================================================
# Completion
# ============================================================================
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ VPS Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Update .env.production with your actual credentials"
echo "2. Run SSL certificate setup: sudo certbot --nginx -d www.zyphextech.com"
echo "3. Configure GitHub Secrets (see VPS_SETUP_COMPLETE_GUIDE.md)"
echo "4. Deploy application: cd /var/www/zyphextech && ./scripts/deploy-manual.sh"
echo ""
echo "Database Connection:"
echo "  Host: localhost"
echo "  Port: 5432"
echo "  Database: zyphextech"
echo "  User: zyphex"
echo "  Password: zyphex_secure_pass_2024"
echo ""
echo "Important Files:"
echo "  App Directory: /var/www/zyphextech"
echo "  Nginx Config: /etc/nginx/conf.d/zyphextech.conf"
echo "  Environment: /var/www/zyphextech/.env.production"
echo "  Logs: /var/log/pm2/"
echo ""
```

**Run the script:**
```bash
# Save the script
cat > setup-vps.sh << 'SCRIPT_END'
[paste the entire script above]
SCRIPT_END

# Make it executable
chmod +x setup-vps.sh

# Run it
./setup-vps.sh
```

**During the script execution:**
- When prompted for SSH public key, paste the public key you copied earlier
- Wait for the script to complete (~10-15 minutes)

### Step 3: Update Environment Variables

```bash
# Edit the environment file
sudo nano /var/www/zyphextech/.env.production
```

**Update these critical values:**
1. `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
2. Email SMTP settings (your email provider details)
3. OAuth credentials (Google, Microsoft)

### Step 4: Setup SSL Certificate

```bash
sudo certbot --nginx -d www.zyphextech.com --non-interactive --agree-tos --email your-email@example.com
```

### Step 5: Initial Manual Deployment

```bash
# Switch to deploy user
su - deploy

# Navigate to app directory
cd /var/www/zyphextech

# Install dependencies
npm ci

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Build application
npm run build

# Start with PM2
pm2 start ecosystem.config.js
pm2 save

# Check status
pm2 status
```

---

## 🔐 GitHub Secrets Configuration

### Step 1: Navigate to GitHub Settings

1. Go to your repository: https://github.com/isumitmalhotra/Zyphex-Tech
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions**
4. Click **New repository secret**

### Step 2: Add Required Secrets

Add these **4 secrets** one by one:

#### Secret 1: `VPS_SSH_PRIVATE_KEY`
- **Name:** `VPS_SSH_PRIVATE_KEY`
- **Value:** Paste the ENTIRE private key content you copied earlier
  ```
  -----BEGIN OPENSSH PRIVATE KEY-----
  b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
  ...entire key content...
  -----END OPENSSH PRIVATE KEY-----
  ```

#### Secret 2: `VPS_HOST`
- **Name:** `VPS_HOST`
- **Value:** `66.116.199.219`

#### Secret 3: `VPS_USER`
- **Name:** `VPS_USER`
- **Value:** `deploy`

#### Secret 4: `VPS_PORT`
- **Name:** `VPS_PORT`
- **Value:** `22`

### Step 3: Verify Secrets

After adding all secrets, you should see:
- ✅ VPS_SSH_PRIVATE_KEY (Updated X seconds ago)
- ✅ VPS_HOST (Updated X seconds ago)
- ✅ VPS_USER (Updated X seconds ago)
- ✅ VPS_PORT (Updated X seconds ago)

---

## 🎯 First Deployment

### Option 1: Automatic (Push to GitHub)

```powershell
# On your local machine
git add .
git commit -m "trigger deployment"
git push origin main
```

The GitHub Action will automatically deploy to your VPS!

### Option 2: Manual Trigger

1. Go to **Actions** tab in GitHub
2. Click **Deploy to VPS** workflow
3. Click **Run workflow** button
4. Select `main` branch
5. Click **Run workflow**

---

## ✅ Verification

### 1. Check GitHub Actions
- Go to **Actions** tab
- Watch the deployment progress
- Ensure all steps complete successfully (green checkmarks)

### 2. Check VPS Application
```bash
# SSH to VPS
ssh deploy@66.116.199.219

# Check PM2 status
pm2 status

# Check logs
pm2 logs zyphextech --lines 50

# Check Nginx
sudo systemctl status nginx

# Check PostgreSQL
sudo systemctl status postgresql-15

# Check Redis
sudo systemctl status redis
```

### 3. Test Website
```bash
# Health check
curl http://localhost:3000/api/health

# Or from browser
https://www.zyphextech.com
```

---

## 🔧 Troubleshooting

### Issue: GitHub Action Fails with "ssh-private-key is empty"
**Solution:**
1. Verify secret `VPS_SSH_PRIVATE_KEY` exists in GitHub
2. Ensure you copied the ENTIRE private key including header/footer
3. Check secret name matches exactly (case-sensitive)

### Issue: Permission Denied (publickey)
**Solution:**
```bash
# On VPS, check authorized_keys
cat /home/deploy/.ssh/authorized_keys

# Ensure permissions are correct
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
sudo chown -R deploy:deploy /home/deploy/.ssh
```

### Issue: Application Not Starting
**Solution:**
```bash
# Check PM2 logs
pm2 logs zyphextech

# Check environment file
cat /var/www/zyphextech/.env.production

# Restart application
pm2 restart zyphextech
```

### Issue: Database Connection Error
**Solution:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql-15

# Test database connection
psql -h localhost -U zyphex -d zyphextech
# Password: zyphex_secure_pass_2024

# Check DATABASE_URL in .env.production
```

### Issue: SSL Certificate Error
**Solution:**
```bash
# Renew certificate
sudo certbot renew --dry-run

# Check Nginx configuration
sudo nginx -t

# Check certificate
sudo certbot certificates
```

### Issue: Port 3000 Not Accessible
**Solution:**
```bash
# Check if application is running
curl http://localhost:3000/api/health

# Check Nginx reverse proxy
sudo nginx -t
sudo systemctl reload nginx

# Check firewall
sudo firewall-cmd --list-all
```

---

## 📞 Support Commands

### Quick Status Check
```bash
# All-in-one status check
pm2 status && \
sudo systemctl status nginx && \
sudo systemctl status postgresql-15 && \
sudo systemctl status redis
```

### Quick Restart
```bash
# Restart everything
pm2 restart zyphextech
sudo systemctl restart nginx
```

### View Logs
```bash
# Application logs
pm2 logs zyphextech --lines 100

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# PostgreSQL logs
sudo tail -f /var/lib/pgsql/15/data/log/postgresql-*.log
```

---

## 🎉 Success Criteria

Your deployment is successful when:
- ✅ GitHub Action completes without errors
- ✅ `pm2 status` shows zyphextech as "online"
- ✅ `https://www.zyphextech.com` loads successfully
- ✅ SSL certificate is valid (padlock icon in browser)
- ✅ `/api/health` endpoint returns success

---

## 📚 Additional Resources

- **VPS Documentation:** See other VPS_DEPLOYMENT_*.md files
- **GitHub Actions:** `.github/workflows/deploy-vps.yml`
- **Nginx Config:** `configs/nginx/zyphextech.conf`
- **PM2 Config:** `ecosystem.config.js`

---

**Last Updated:** October 8, 2025  
**VPS IP:** 66.116.199.219  
**Domain:** www.zyphextech.com  
**OS:** AlmaLinux

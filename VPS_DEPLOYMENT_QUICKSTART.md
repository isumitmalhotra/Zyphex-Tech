# VPS Deployment - Quick Start Guide

**Get your Zyphex Tech Platform live in 2 hours!**

---

## 🚀 Quick Overview

This guide will help you deploy the Zyphex Tech Platform to your VPS with automated deployments via GitHub Actions.

**What you'll achieve:**
- ✅ Production website live at https://www.zyphextech.com
- ✅ Automated deployments (push code → auto-deploy)
- ✅ SSL/HTTPS enabled
- ✅ Database, Redis, and all services running
- ✅ PM2 process management
- ✅ Monitoring and logging

---

## 📝 Prerequisites Checklist

Before starting, have these ready:

- [ ] VPS access (IP: 66.116.199.219, User: root, Password: ZT@DY#machine01)
- [ ] Domain (www.zyphextech.com) pointing to VPS IP
- [ ] GitHub repository access
- [ ] SSH client (PowerShell or PuTTY on Windows)
- [ ] Your email for SSL certificate
- [ ] 2-3 hours of time

**API Keys & Credentials Needed:**
- [ ] Database password (create a strong one)
- [ ] Redis password (create a strong one)
- [ ] NextAuth secret (generate: `openssl rand -base64 32`)
- [ ] SendGrid API key
- [ ] Google OAuth credentials
- [ ] GitHub OAuth credentials
- [ ] Stripe live keys
- [ ] Azure Storage credentials (optional)
- [ ] Sentry DSN (optional)

---

## 🎯 Deployment Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| **Phase 1: Initial Setup** | 30 min | Connect to VPS, run setup script |
| **Phase 2: Configuration** | 30 min | Configure database, services, environment |
| **Phase 3: SSL & Nginx** | 20 min | Setup SSL certificate, configure Nginx |
| **Phase 4: Deploy App** | 20 min | Clone repo, build, start with PM2 |
| **Phase 5: CI/CD Setup** | 20 min | Configure GitHub Actions |
| **Phase 6: Testing** | 20 min | Test deployment, monitoring |

**Total:** ~2 hours

---

## 🏁 Phase 1: Initial VPS Setup (30 minutes)

### Step 1.1: Connect to VPS

**Using PowerShell (Windows):**
```powershell
ssh root@66.116.199.219
# Password: ZT@DY#machine01
```

### Step 1.2: Upload Setup Script

**On your local machine (PowerShell):**
```powershell
# Navigate to project
cd C:\Projects\Zyphex-Tech

# Copy setup script to VPS
scp scripts/vps-setup.sh root@66.116.199.219:/root/
# Enter password when prompted
```

**On VPS:**
```bash
# Make script executable
chmod +x /root/vps-setup.sh

# Run setup script
./vps-setup.sh
```

This script will:
- ✅ Update system packages
- ✅ Create deploy user
- ✅ Configure firewall
- ✅ Install Node.js 20
- ✅ Install PostgreSQL 15
- ✅ Install Redis
- ✅ Install Nginx
- ✅ Install Certbot
- ✅ Setup PM2
- ✅ Configure monitoring

**Wait for completion** (~15 minutes)

---

## ⚙️ Phase 2: Service Configuration (30 minutes)

### Step 2.1: Configure PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE zyphex_tech_production;
CREATE USER zyphex_user WITH ENCRYPTED PASSWORD 'YOUR_STRONG_DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE zyphex_tech_production TO zyphex_user;

# Switch to the database
\c zyphex_tech_production

# Grant schema permissions
GRANT ALL ON SCHEMA public TO zyphex_user;
ALTER DATABASE zyphex_tech_production OWNER TO zyphex_user;

# Exit PostgreSQL
\q
```

**Test connection:**
```bash
psql -h localhost -U zyphex_user -d zyphex_tech_production
# Enter password
# Type \q to exit
```

### Step 2.2: Configure Redis Password

```bash
# Edit Redis config
sudo nano /etc/redis/redis.conf

# Find the line: # requirepass foobared
# Uncomment and change to:
requirepass YOUR_STRONG_REDIS_PASSWORD

# Save and exit (Ctrl+X, Y, Enter)

# Restart Redis
sudo systemctl restart redis

# Test
redis-cli -a YOUR_STRONG_REDIS_PASSWORD ping
# Should return: PONG
```

### Step 2.3: Setup Nginx Configuration

```bash
# Upload Nginx config from local machine
# On your local PowerShell:
scp configs/nginx/zyphextech.conf root@66.116.199.219:/etc/nginx/sites-available/

# Back on VPS:
# Enable the site
ln -s /etc/nginx/sites-available/zyphextech.conf /etc/nginx/sites-enabled/

# Test Nginx config
nginx -t

# Don't reload yet (we need SSL first)
```

---

## 🔒 Phase 3: SSL Certificate Setup (20 minutes)

### Step 3.1: Obtain SSL Certificate

```bash
# Stop Nginx temporarily
sudo systemctl stop nginx

# Get certificate (replace email)
sudo certbot certonly --standalone \
  -d www.zyphextech.com \
  -d zyphextech.com \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email

# Start Nginx
sudo systemctl start nginx

# Reload Nginx
sudo systemctl reload nginx
```

### Step 3.2: Test SSL

Visit: https://www.zyphextech.com

You should see Nginx default page (or 502 Bad Gateway - this is OK, app isn't running yet)

### Step 3.3: Setup Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Should say: Congratulations, all simulated renewals succeeded
```

Auto-renewal cron is already setup by vps-setup.sh! ✅

---

## 🚀 Phase 4: Deploy Application (20 minutes)

### Step 4.1: Clone Repository

```bash
# Switch to deploy user
su - deploy

# Navigate to app directory
cd /var/www/zyphextech

# Clone repository
git clone https://github.com/isumitmalhotra/Zyphex-Tech.git .

# If private repo, you'll need to:
# 1. Generate SSH key: ssh-keygen -t ed25519 -C "deploy@vps"
# 2. Add public key to GitHub: cat ~/.ssh/id_ed25519.pub
# 3. Add to: https://github.com/isumitmalhotra/Zyphex-Tech/settings/keys
```

### Step 4.2: Create Environment File

```bash
# Create .env.production
nano .env.production
```

**Paste this content (replace with your actual values):**

```bash
# Database
DATABASE_URL="postgresql://zyphex_user:YOUR_DB_PASSWORD@localhost:5432/zyphex_tech_production?schema=public"
DIRECT_URL="postgresql://zyphex_user:YOUR_DB_PASSWORD@localhost:5432/zyphex_tech_production?schema=public"

# Application
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://www.zyphextech.com"
NEXT_PUBLIC_API_URL="https://www.zyphextech.com/api"

# Authentication
NEXTAUTH_URL="https://www.zyphextech.com"
NEXTAUTH_SECRET="YOUR_NEXTAUTH_SECRET"

# Redis
REDIS_URL="redis://:YOUR_REDIS_PASSWORD@localhost:6379"
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD="YOUR_REDIS_PASSWORD"

# Email (SendGrid)
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASSWORD="YOUR_SENDGRID_API_KEY"
SMTP_FROM="noreply@zyphextech.com"
SMTP_FROM_NAME="Zyphex Tech"

# Google OAuth
GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"

# GitHub OAuth
GITHUB_CLIENT_ID="YOUR_GITHUB_CLIENT_ID"
GITHUB_CLIENT_SECRET="YOUR_GITHUB_CLIENT_SECRET"

# Stripe
STRIPE_SECRET_KEY="sk_live_YOUR_KEY"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_YOUR_KEY"
STRIPE_WEBHOOK_SECRET="whsec_YOUR_SECRET"

# Optional: Azure Storage
# AZURE_STORAGE_CONNECTION_STRING="YOUR_CONNECTION_STRING"
# AZURE_STORAGE_CONTAINER_NAME="documents"

# Optional: Sentry
# NEXT_PUBLIC_SENTRY_DSN="YOUR_SENTRY_DSN"

# Features
ENABLE_REGISTRATION="true"
ENABLE_OAUTH="true"
```

**Save and exit (Ctrl+X, Y, Enter)**

```bash
# Secure the file
chmod 600 .env.production
```

### Step 4.3: Install Dependencies & Build

```bash
# Install dependencies
npm ci

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Optional: Seed database
# npx prisma db seed

# Build application
npm run build
```

### Step 4.4: Start with PM2

```bash
# Start application
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs zyphextech --lines 50

# Save PM2 config
pm2 save
```

### Step 4.5: Test Application

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Should return: {"status":"ok"}
```

**Visit:** https://www.zyphextech.com

You should see your application! 🎉

---

## 🤖 Phase 5: Setup GitHub Actions CI/CD (20 minutes)

### Step 5.1: Generate Deployment SSH Key

```bash
# Still as deploy user
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions -N ""

# Add to authorized_keys
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Display private key
cat ~/.ssh/github_actions
```

**Copy the entire private key output (including BEGIN and END lines)**

### Step 5.2: Add GitHub Secrets

1. Go to: https://github.com/isumitmalhotra/Zyphex-Tech/settings/secrets/actions
2. Click **New repository secret**
3. Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `VPS_SSH_PRIVATE_KEY` | The private key you just copied |
| `VPS_HOST` | `66.116.199.219` |
| `VPS_USER` | `deploy` |
| `VPS_PORT` | `22` |

### Step 5.3: Test Automated Deployment

**On your local machine:**

```powershell
# Navigate to project
cd C:\Projects\Zyphex-Tech

# Make a small change
echo "# Test deployment" >> README.md

# Commit and push
git add .
git commit -m "Test automated deployment"
git push origin main
```

**Watch GitHub Actions:**
1. Go to: https://github.com/isumitmalhotra/Zyphex-Tech/actions
2. You should see a new workflow running
3. It will automatically deploy to your VPS!

**On VPS, watch logs:**
```bash
# As deploy user
pm2 logs zyphextech --lines 50
```

---

## ✅ Phase 6: Testing & Validation (20 minutes)

### Step 6.1: Service Health Check

```bash
# Exit to root user
exit

# Check all services
systemctl status nginx
systemctl status postgresql-15
systemctl status redis
systemctl status pm2-deploy
```

All should show: **active (running)** ✅

### Step 6.2: Application Health

```bash
# As deploy user
su - deploy

# Check PM2
pm2 status
# Should show: online, uptime > 0

# Check logs for errors
pm2 logs zyphextech --err --lines 50
```

### Step 6.3: Web Testing

Visit these URLs:

- ✅ https://www.zyphextech.com (home page)
- ✅ https://www.zyphextech.com/api/health (should return JSON)
- ✅ https://www.zyphextech.com/login (login page)

### Step 6.4: Performance Check

```bash
# Check memory usage
free -h

# Check disk space
df -h

# Check CPU
htop
# Press Q to exit

# Check PostgreSQL connections
su - postgres -c "psql -d zyphex_tech_production -c 'SELECT count(*) FROM pg_stat_activity;'"

# Check Redis
redis-cli -a YOUR_REDIS_PASSWORD info stats
```

### Step 6.5: Test Automated Deployment

**On local machine:**

```powershell
# Make a visible change
# Edit any file, then:
git add .
git commit -m "Test deployment pipeline"
git push origin main
```

**Within 2-3 minutes:**
- Check GitHub Actions: Should show success ✅
- Check website: Changes should be live
- Check VPS logs: `pm2 logs zyphextech --lines 20`

---

## 🎉 Success! What Now?

### Your Deployment is Complete!

✅ **Production website:** https://www.zyphextech.com  
✅ **SSL/HTTPS:** Enabled with auto-renewal  
✅ **Automated deployments:** Push to GitHub → Auto-deploy  
✅ **Process management:** PM2 with auto-restart  
✅ **Monitoring:** Health checks every 5 minutes  
✅ **Logging:** Full application and access logs  

### Your New Workflow

**To deploy changes:**
```powershell
# Make changes locally
# Test locally
git add .
git commit -m "Description of changes"
git push origin main
# ✅ Automatically deploys to VPS!
```

**To check application status:**
```bash
ssh deploy@66.116.199.219
pm2 status
pm2 logs zyphextech
```

**To manually restart:**
```bash
ssh deploy@66.116.199.219
pm2 restart zyphextech
```

---

## 📊 Monitoring & Maintenance

### Daily Commands

```bash
# Check application status
pm2 status

# View recent logs
pm2 logs zyphextech --lines 100

# Check system resources
htop

# Check disk space
df -h
```

### Weekly Tasks

```bash
# Check for system updates
sudo dnf update

# Review error logs
pm2 logs zyphextech --err --lines 500

# Check database size
psql -h localhost -U zyphex_user -d zyphex_tech_production -c "SELECT pg_size_pretty(pg_database_size('zyphex_tech_production'));"
```

### Monthly Tasks

```bash
# Update dependencies
cd /var/www/zyphextech
npm update
npm audit fix
git add package*.json
git commit -m "Update dependencies"
git push origin main

# Backup database
pg_dump -h localhost -U zyphex_user zyphex_tech_production > backup_$(date +%Y%m%d).sql
```

---

## 🆘 Troubleshooting

### Application Not Accessible

```bash
# Check if app is running
pm2 status

# If stopped, start it
pm2 start zyphextech

# Check Nginx
sudo systemctl status nginx
sudo systemctl restart nginx

# Check logs
pm2 logs zyphextech --err --lines 50
sudo tail -f /var/log/nginx/zyphextech_error.log
```

### Database Connection Error

```bash
# Check PostgreSQL
sudo systemctl status postgresql-15

# Test connection
psql -h localhost -U zyphex_user -d zyphex_tech_production

# Check connection string in .env.production
```

### High Memory Usage

```bash
# Restart application
pm2 restart zyphextech

# Check memory
free -h

# If needed, restart PM2
sudo systemctl restart pm2-deploy
```

### SSL Certificate Expiring

```bash
# Renew manually
sudo certbot renew

# Check auto-renewal
sudo certbot renew --dry-run
```

---

## 📞 Support Resources

**Documentation:**
- Full Guide: [VPS_DEPLOYMENT_GUIDE.md](./VPS_DEPLOYMENT_GUIDE.md)
- Deployment Index: [DEPLOYMENT_MASTER_INDEX.md](./DEPLOYMENT_MASTER_INDEX.md)

**Useful Commands:**
```bash
# Application Management
pm2 status          # Check status
pm2 logs            # View logs
pm2 restart all     # Restart all apps
pm2 monit           # Monitor resources

# Service Management
systemctl status nginx postgresql-15 redis
systemctl restart [service-name]

# Database
psql -h localhost -U zyphex_user -d zyphex_tech_production

# Logs
tail -f /var/log/nginx/zyphextech_error.log
pm2 logs zyphextech --lines 100
```

---

## 🎯 Next Steps

1. **Setup Monitoring:**
   - Configure Sentry for error tracking
   - Setup UptimeRobot for uptime monitoring
   - Configure email alerts

2. **Performance Optimization:**
   - Setup CloudFlare for CDN
   - Configure database backups
   - Optimize images

3. **Security Hardening:**
   - Setup fail2ban
   - Configure IP whitelisting for admin
   - Enable 2FA for SSH

4. **Scaling:**
   - Increase PM2 instances when traffic grows
   - Consider database replication
   - Setup load balancer if needed

---

**Congratulations! Your Zyphex Tech Platform is live! 🚀**

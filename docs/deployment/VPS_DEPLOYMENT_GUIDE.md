# VPS Deployment Guide - Zyphex Tech Platform
## AlmaLinux + Nginx + PostgreSQL + PM2 + GitHub Actions

**Complete guide for deploying to your VPS with automated CI/CD**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [VPS Specifications](#vps-specifications)
3. [Pre-Deployment Setup](#pre-deployment-setup)
4. [Step 1: Initial VPS Setup](#step-1-initial-vps-setup)
5. [Step 2: Install Required Software](#step-2-install-required-software)
6. [Step 3: PostgreSQL Setup](#step-3-postgresql-setup)
7. [Step 4: Redis Setup](#step-4-redis-setup)
8. [Step 5: Application Deployment](#step-5-application-deployment)
9. [Step 6: Nginx Configuration](#step-6-nginx-configuration)
10. [Step 7: SSL/HTTPS Setup](#step-7-sslhttps-setup)
11. [Step 8: PM2 Process Manager](#step-8-pm2-process-manager)
12. [Step 9: GitHub Actions CI/CD](#step-9-github-actions-cicd)
13. [Step 10: Monitoring & Logging](#step-10-monitoring--logging)
14. [Post-Deployment](#post-deployment)
15. [Troubleshooting](#troubleshooting)

---

## 📊 Overview

### What This Guide Does

✅ Sets up complete production environment on AlmaLinux VPS  
✅ Installs Node.js, PostgreSQL, Redis, Nginx  
✅ Configures automated deployments via GitHub Actions  
✅ Sets up SSL certificates (Let's Encrypt)  
✅ Implements PM2 for process management  
✅ Configures monitoring and logging  

### After Setup

**Your workflow will be:**
```bash
# On your local machine
git add .
git commit -m "Update feature X"
git push origin main

# Automatically happens:
# → GitHub Actions triggers
# → Code is pulled to VPS
# → Dependencies installed
# → Database migrations run
# → PM2 restarts application
# → Website is live with changes! ✅
```

**Time to complete:** 2-3 hours  
**Difficulty:** Intermediate  

---

## 🖥️ VPS Specifications

**Your VPS Details:**
- **IP Address:** 66.116.199.219
- **Domain:** www.zyphextech.com
- **OS:** AlmaLinux (RHEL-based)
- **RAM:** 4GB
- **CPU:** 1 Core
- **SSH User:** root
- **SSH Password:** ZT@DY#machine01

**DNS Configuration:**
- ✅ Domain already pointing to VPS IP
- ✅ Ready for SSL setup

**Existing Services:**
- Email hosting (will not be affected)
- Web server configured (will reconfigure)

---

## 🚀 Pre-Deployment Setup

### On Your Local Machine

**1. Ensure Git Repository is Ready**
```bash
# Navigate to project
cd C:\Projects\Zyphex-Tech

# Check git status
git status

# Ensure you're on main branch
git branch

# Ensure remote is set
git remote -v
```

**2. Prepare Secrets (Write These Down)**

You'll need these later:
- Database password (create a strong one)
- NextAuth secret (generate with: `openssl rand -base64 32`)
- Stripe keys (from Stripe dashboard)
- Google OAuth credentials
- GitHub OAuth credentials
- SendGrid API key

---

## 🔧 Step 1: Initial VPS Setup

### Connect to VPS

**Using PowerShell (Windows):**
```powershell
ssh root@66.116.199.219
# Password: ZT@DY#machine01
```

**First Time Login - Security Setup:**

```bash
# Update system
dnf update -y

# Install basic utilities
dnf install -y curl wget git nano htop

# Check current services
systemctl list-units --type=service --state=running

# Check if web server is running
systemctl status nginx || systemctl status httpd

# Check disk space
df -h

# Check memory
free -h

# Check current user
whoami
```

### Create Deployment User (Recommended for Security)

```bash
# Create deployment user
useradd -m -s /bin/bash deploy
passwd deploy
# Enter strong password when prompted

# Add to wheel group (sudo access)
usermod -aG wheel deploy

# Allow sudo without password for deploy user
echo "deploy ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/deploy

# Create SSH directory for deploy user
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh

# Copy root's authorized_keys if exists
if [ -f /root/.ssh/authorized_keys ]; then
    cp /root/.ssh/authorized_keys /home/deploy/.ssh/
    chown -R deploy:deploy /home/deploy/.ssh
fi
```

### Configure Firewall

```bash
# Install firewalld if not present
dnf install -y firewalld

# Start and enable firewall
systemctl start firewalld
systemctl enable firewalld

# Allow HTTP, HTTPS, SSH
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --permanent --add-service=ssh

# Allow PostgreSQL (only from localhost)
firewall-cmd --permanent --add-port=5432/tcp

# Reload firewall
firewall-cmd --reload

# Check status
firewall-cmd --list-all
```

---

## 📦 Step 2: Install Required Software

### Install Node.js 20.x (LTS)

```bash
# Add NodeSource repository
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -

# Install Node.js
dnf install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show v10.x.x

# Install global packages
npm install -g pm2 pnpm
```

### Install Build Tools

```bash
# Install development tools (needed for native modules)
dnf groupinstall -y "Development Tools"

# Install Python (needed for some npm packages)
dnf install -y python3 python3-pip
```

---

## 🗄️ Step 3: PostgreSQL Setup

### Install PostgreSQL 15

```bash
# Install PostgreSQL repository
dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-9-x86_64/pgdg-redhat-repo-latest.noarch.rpm

# Disable built-in PostgreSQL module
dnf -qy module disable postgresql

# Install PostgreSQL 15
dnf install -y postgresql15-server postgresql15-contrib

# Initialize database
/usr/pgsql-15/bin/postgresql-15-setup initdb

# Start and enable PostgreSQL
systemctl start postgresql-15
systemctl enable postgresql-15

# Check status
systemctl status postgresql-15
```

### Configure PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt, create database and user
CREATE DATABASE zyphex_tech_production;
CREATE USER zyphex_user WITH ENCRYPTED PASSWORD 'YOUR_STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE zyphex_tech_production TO zyphex_user;

# Grant additional permissions
\c zyphex_tech_production
GRANT ALL ON SCHEMA public TO zyphex_user;
ALTER DATABASE zyphex_tech_production OWNER TO zyphex_user;

# Exit PostgreSQL
\q
```

### Configure PostgreSQL for Application Access

```bash
# Edit pg_hba.conf to allow local connections
nano /var/lib/pgsql/15/data/pg_hba.conf

# Add this line BEFORE other lines (around line 80):
# TYPE  DATABASE        USER            ADDRESS                 METHOD
host    zyphex_tech_production    zyphex_user     127.0.0.1/32            md5
host    zyphex_tech_production    zyphex_user     ::1/128                 md5

# Save and exit (Ctrl+X, Y, Enter)

# Edit postgresql.conf for performance
nano /var/lib/pgsql/15/data/postgresql.conf

# Find and modify these settings (use Ctrl+W to search):
shared_buffers = 1GB                    # 25% of RAM
effective_cache_size = 3GB              # 75% of RAM
maintenance_work_mem = 256MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 10485kB
min_wal_size = 1GB
max_wal_size = 4GB
max_connections = 100

# Save and exit

# Restart PostgreSQL
systemctl restart postgresql-15

# Test connection
psql -h localhost -U zyphex_user -d zyphex_tech_production
# Enter password when prompted
# If successful, you'll see: zyphex_tech_production=>
# Type \q to exit
```

### Create Database Connection String

```bash
# Your DATABASE_URL will be:
# postgresql://zyphex_user:YOUR_PASSWORD@localhost:5432/zyphex_tech_production?schema=public
```

---

## 🔴 Step 4: Redis Setup

### Install Redis

```bash
# Add EPEL repository
dnf install -y epel-release

# Install Redis
dnf install -y redis

# Start and enable Redis
systemctl start redis
systemctl enable redis

# Check status
systemctl status redis

# Test Redis
redis-cli ping
# Should return: PONG
```

### Configure Redis for Production

```bash
# Edit Redis configuration
nano /etc/redis/redis.conf

# Find and modify these settings:
maxmemory 512mb
maxmemory-policy allkeys-lru
bind 127.0.0.1 ::1
protected-mode yes
requirepass YOUR_REDIS_PASSWORD_HERE

# Save and exit

# Restart Redis
systemctl restart redis

# Test with password
redis-cli -a YOUR_REDIS_PASSWORD_HERE ping
# Should return: PONG
```

### Redis Connection String

```bash
# Your REDIS_URL will be:
# redis://:YOUR_REDIS_PASSWORD@localhost:6379
```

---

## 🚀 Step 5: Application Deployment

### Create Application Directory

```bash
# Create app directory
mkdir -p /var/www/zyphextech
chown -R deploy:deploy /var/www/zyphextech

# Switch to deploy user
su - deploy

# Navigate to app directory
cd /var/www/zyphextech
```

### Clone Repository (Manual First Deploy)

```bash
# Clone your repository
git clone https://github.com/isumitmalhotra/Zyphex-Tech.git .

# If private repo, you'll need to set up SSH key or personal access token
# For now, we'll set up GitHub Actions to handle this

# Install dependencies
npm install

# Install Prisma CLI
npm install -D prisma
```

### Create Production Environment File

```bash
# Create .env.production file
nano .env.production
```

**Add this content (replace with your actual values):**

```bash
# =============================================================================
# DATABASE
# =============================================================================
DATABASE_URL="postgresql://zyphex_user:YOUR_DB_PASSWORD@localhost:5432/zyphex_tech_production?schema=public"
DIRECT_URL="postgresql://zyphex_user:YOUR_DB_PASSWORD@localhost:5432/zyphex_tech_production?schema=public"

# =============================================================================
# APPLICATION
# =============================================================================
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://www.zyphextech.com"
NEXT_PUBLIC_API_URL="https://www.zyphextech.com/api"

# =============================================================================
# AUTHENTICATION
# =============================================================================
NEXTAUTH_URL="https://www.zyphextech.com"
NEXTAUTH_SECRET="YOUR_NEXTAUTH_SECRET_HERE"  # Generate with: openssl rand -base64 32

# =============================================================================
# REDIS CACHE
# =============================================================================
REDIS_URL="redis://:YOUR_REDIS_PASSWORD@localhost:6379"
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD="YOUR_REDIS_PASSWORD"

# =============================================================================
# EMAIL CONFIGURATION (SendGrid)
# =============================================================================
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASSWORD="YOUR_SENDGRID_API_KEY"
SMTP_FROM="noreply@zyphextech.com"
SMTP_FROM_NAME="Zyphex Tech"

# =============================================================================
# OAUTH - GOOGLE
# =============================================================================
GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"

# =============================================================================
# OAUTH - GITHUB
# =============================================================================
GITHUB_CLIENT_ID="YOUR_GITHUB_CLIENT_ID"
GITHUB_CLIENT_SECRET="YOUR_GITHUB_CLIENT_SECRET"

# =============================================================================
# STRIPE PAYMENTS
# =============================================================================
STRIPE_SECRET_KEY="sk_live_YOUR_STRIPE_SECRET_KEY"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_YOUR_STRIPE_PUBLISHABLE_KEY"
STRIPE_WEBHOOK_SECRET="whsec_YOUR_WEBHOOK_SECRET"

# =============================================================================
# AZURE BLOB STORAGE
# =============================================================================
AZURE_STORAGE_CONNECTION_STRING="YOUR_AZURE_CONNECTION_STRING"
AZURE_STORAGE_CONTAINER_NAME="documents"
AZURE_STORAGE_ACCOUNT_NAME="YOUR_STORAGE_ACCOUNT"
AZURE_STORAGE_ACCOUNT_KEY="YOUR_STORAGE_KEY"

# =============================================================================
# MONITORING - SENTRY
# =============================================================================
NEXT_PUBLIC_SENTRY_DSN="YOUR_SENTRY_DSN"
SENTRY_ORG="YOUR_SENTRY_ORG"
SENTRY_PROJECT="YOUR_SENTRY_PROJECT"
SENTRY_AUTH_TOKEN="YOUR_SENTRY_AUTH_TOKEN"

# =============================================================================
# FEATURES
# =============================================================================
ENABLE_REGISTRATION="true"
ENABLE_OAUTH="true"
ENABLE_EMAIL_VERIFICATION="true"
ENABLE_TWO_FACTOR="false"

# =============================================================================
# RATE LIMITING
# =============================================================================
RATE_LIMIT_MAX="100"
RATE_LIMIT_WINDOW_MS="900000"

# =============================================================================
# FILE UPLOAD
# =============================================================================
MAX_FILE_SIZE="10485760"
ALLOWED_FILE_TYPES="pdf,doc,docx,xls,xlsx,jpg,jpeg,png"

# =============================================================================
# SESSION
# =============================================================================
SESSION_MAX_AGE="2592000"
SESSION_UPDATE_AGE="86400"
```

**Save and exit (Ctrl+X, Y, Enter)**

### Set File Permissions

```bash
# Secure the .env file
chmod 600 .env.production

# Make sure deploy user owns everything
chown -R deploy:deploy /var/www/zyphextech
```

### Run Database Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database (if you have seed script)
# npx prisma db seed
```

### Build Application

```bash
# Build Next.js application
npm run build

# This will create .next directory with production build
```

---

## 🌐 Step 6: Nginx Configuration

### Install Nginx

```bash
# Switch back to root
exit  # Exit from deploy user

# Install Nginx
dnf install -y nginx

# Start and enable Nginx
systemctl start nginx
systemctl enable nginx

# Check status
systemctl status nginx
```

### Configure Nginx for Zyphex Tech

```bash
# Remove default config if exists
rm -f /etc/nginx/sites-enabled/default

# Create sites-available and sites-enabled directories (if not exist)
mkdir -p /etc/nginx/sites-available
mkdir -p /etc/nginx/sites-enabled

# Create configuration file
nano /etc/nginx/sites-available/zyphextech.conf
```

**Add this configuration:**

```nginx
# Upstream configuration for Next.js
upstream nextjs_backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=general_limit:10m rate=30r/s;

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name www.zyphextech.com zyphextech.com;

    # Allow Let's Encrypt validation
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.zyphextech.com zyphextech.com;

    # SSL certificates (will be added by Certbot)
    ssl_certificate /etc/letsencrypt/live/www.zyphextech.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.zyphextech.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # OCSP stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # Max body size
    client_max_body_size 10M;

    # Logging
    access_log /var/log/nginx/zyphextech_access.log;
    error_log /var/log/nginx/zyphextech_error.log warn;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;

    # API routes with rate limiting
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        limit_req_status 429;

        proxy_pass http://nextjs_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Static files caching
    location /_next/static/ {
        proxy_pass http://nextjs_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        
        # Cache static files for 1 year
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Image optimization
    location /_next/image {
        proxy_pass http://nextjs_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Cache optimized images
        add_header Cache-Control "public, max-age=86400";
    }

    # All other requests
    location / {
        limit_req zone=general_limit burst=50 nodelay;

        proxy_pass http://nextjs_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://nextjs_backend/api/health;
        access_log off;
    }
}
```

**Save and exit**

### Enable Configuration

```bash
# Create symlink to enable site
ln -s /etc/nginx/sites-available/zyphextech.conf /etc/nginx/sites-enabled/

# Update main nginx.conf to include sites-enabled
nano /etc/nginx/nginx.conf

# Add this line in the http block (before any server blocks):
# include /etc/nginx/sites-enabled/*;

# Test Nginx configuration
nginx -t

# If test is successful, reload Nginx
systemctl reload nginx
```

---

## 🔒 Step 7: SSL/HTTPS Setup (Let's Encrypt)

### Install Certbot

```bash
# Install Certbot and Nginx plugin
dnf install -y certbot python3-certbot-nginx

# Create webroot directory for challenges
mkdir -p /var/www/certbot
```

### Obtain SSL Certificate

```bash
# Stop Nginx temporarily
systemctl stop nginx

# Obtain certificate (replace with your email)
certbot certonly --standalone \
  -d www.zyphextech.com \
  -d zyphextech.com \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email

# Start Nginx
systemctl start nginx

# Test renewal
certbot renew --dry-run
```

### Setup Auto-Renewal

```bash
# Create renewal script
nano /usr/local/bin/renew-cert.sh
```

**Add this content:**

```bash
#!/bin/bash
certbot renew --quiet --post-hook "systemctl reload nginx"
```

**Make executable:**

```bash
chmod +x /usr/local/bin/renew-cert.sh

# Add to crontab
crontab -e

# Add this line (runs daily at 2 AM):
0 2 * * * /usr/local/bin/renew-cert.sh
```

---

## 🔄 Step 8: PM2 Process Manager

### Configure PM2

```bash
# Switch to deploy user
su - deploy

# Navigate to app directory
cd /var/www/zyphextech

# Create PM2 ecosystem file
nano ecosystem.config.js
```

**Add this configuration:**

```javascript
module.exports = {
  apps: [
    {
      name: 'zyphextech',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/zyphextech',
      instances: 1,  // Use 1 instance for 1 CPU
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_file: '.env.production',
      error_file: '/var/log/pm2/zyphextech-error.log',
      out_file: '/var/log/pm2/zyphextech-out.log',
      log_file: '/var/log/pm2/zyphextech-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
```

**Save and exit**

### Create Log Directory

```bash
# Exit to root
exit

# Create PM2 log directory
mkdir -p /var/log/pm2
chown -R deploy:deploy /var/log/pm2

# Switch back to deploy
su - deploy
cd /var/www/zyphextech
```

### Start Application with PM2

```bash
# Start application
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs zyphextech --lines 50

# Monitor
pm2 monit

# Save PM2 process list
pm2 save

# Exit to root
exit
```

### Setup PM2 Startup Script

```bash
# As root user
# Generate startup script for deploy user
su - deploy -c "pm2 startup systemd -u deploy --hp /home/deploy"

# This will output a command, copy and run it as root
# It will look like:
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u deploy --hp /home/deploy

# Enable and start PM2
systemctl enable pm2-deploy
systemctl start pm2-deploy
systemctl status pm2-deploy
```

---

## 🤖 Step 9: GitHub Actions CI/CD Pipeline

### Create Deployment SSH Key

```bash
# On VPS as root
su - deploy

# Generate SSH key for GitHub Actions
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions -N ""

# Add public key to authorized_keys
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Display private key (copy this for GitHub Secrets)
cat ~/.ssh/github_actions
# Copy the entire output including -----BEGIN and -----END lines

# Exit deploy user
exit
```

### Add Secrets to GitHub

1. Go to your GitHub repository: https://github.com/isumitmalhotra/Zyphex-Tech
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these secrets:

| Name | Value |
|------|-------|
| `VPS_SSH_PRIVATE_KEY` | The private key from `~/.ssh/github_actions` |
| `VPS_HOST` | `66.116.199.219` |
| `VPS_USER` | `deploy` |
| `VPS_PORT` | `22` |
| `DATABASE_URL` | Your full PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Your NextAuth secret |
| `REDIS_URL` | Your Redis connection string |

### Create GitHub Actions Workflow

**On your local machine:**

```bash
# Navigate to project
cd C:\Projects\Zyphex-Tech

# Create workflows directory
mkdir -p .github\workflows

# Create deployment workflow file
# (I'll create this in the next step)
```

---

## 📊 Step 10: Monitoring & Logging

### Setup Log Rotation

```bash
# Create logrotate config
nano /etc/logrotate.d/zyphextech
```

**Add this content:**

```
/var/log/nginx/zyphextech_*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 nginx adm
    sharedscripts
    postrotate
        systemctl reload nginx > /dev/null
    endscript
}

/var/log/pm2/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 deploy deploy
    sharedscripts
    postrotate
        su - deploy -c "pm2 reloadLogs" > /dev/null
    endscript
}
```

### Setup Monitoring Script

```bash
# Create monitoring directory
mkdir -p /opt/monitoring
nano /opt/monitoring/health-check.sh
```

**Add this content:**

```bash
#!/bin/bash

# Health check script for Zyphex Tech
LOG_FILE="/var/log/health-check.log"
ALERT_EMAIL="your-email@example.com"

# Check if application is running
if ! pm2 describe zyphextech > /dev/null 2>&1; then
    echo "[$(date)] ERROR: Application is not running" >> $LOG_FILE
    su - deploy -c "cd /var/www/zyphextech && pm2 start ecosystem.config.js"
    echo "Zyphex Tech application was down and has been restarted" | mail -s "App Restart Alert" $ALERT_EMAIL
fi

# Check if Nginx is running
if ! systemctl is-active --quiet nginx; then
    echo "[$(date)] ERROR: Nginx is not running" >> $LOG_FILE
    systemctl start nginx
    echo "Nginx was down and has been restarted" | mail -s "Nginx Restart Alert" $ALERT_EMAIL
fi

# Check if PostgreSQL is running
if ! systemctl is-active --quiet postgresql-15; then
    echo "[$(date)] ERROR: PostgreSQL is not running" >> $LOG_FILE
    systemctl start postgresql-15
    echo "PostgreSQL was down and has been restarted" | mail -s "PostgreSQL Restart Alert" $ALERT_EMAIL
fi

# Check if Redis is running
if ! systemctl is-active --quiet redis; then
    echo "[$(date)] ERROR: Redis is not running" >> $LOG_FILE
    systemctl start redis
    echo "Redis was down and has been restarted" | mail -s "Redis Restart Alert" $ALERT_EMAIL
fi

# Check HTTP response
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
if [ "$HTTP_CODE" != "200" ]; then
    echo "[$(date)] ERROR: Application health check failed (HTTP $HTTP_CODE)" >> $LOG_FILE
fi

# Check disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    echo "[$(date)] WARNING: Disk usage is at ${DISK_USAGE}%" >> $LOG_FILE
    echo "Disk usage is at ${DISK_USAGE}%" | mail -s "Disk Space Warning" $ALERT_EMAIL
fi

# Check memory usage
MEM_USAGE=$(free | grep Mem | awk '{print ($3/$2) * 100.0}' | cut -d. -f1)
if [ "$MEM_USAGE" -gt 90 ]; then
    echo "[$(date)] WARNING: Memory usage is at ${MEM_USAGE}%" >> $LOG_FILE
fi
```

**Make executable and schedule:**

```bash
chmod +x /opt/monitoring/health-check.sh

# Add to crontab (every 5 minutes)
crontab -e

# Add this line:
*/5 * * * * /opt/monitoring/health-check.sh
```

---

## ✅ Post-Deployment Validation

### Test Everything

```bash
# 1. Check if all services are running
systemctl status nginx
systemctl status postgresql-15
systemctl status redis
su - deploy -c "pm2 status"

# 2. Test database connection
su - deploy -c "cd /var/www/zyphextech && npx prisma db push --skip-generate"

# 3. Test Redis
redis-cli -a YOUR_REDIS_PASSWORD ping

# 4. Test application
curl http://localhost:3000/api/health

# 5. Test Nginx
curl -I http://www.zyphextech.com

# 6. Test HTTPS
curl -I https://www.zyphextech.com

# 7. View application logs
su - deploy -c "pm2 logs zyphextech --lines 100"

# 8. View Nginx logs
tail -f /var/log/nginx/zyphextech_access.log
tail -f /var/log/nginx/zyphextech_error.log
```

### Performance Test

```bash
# Check memory usage
free -h

# Check disk usage
df -h

# Check CPU usage
htop

# Check PostgreSQL connections
su - postgres -c "psql -d zyphex_tech_production -c 'SELECT count(*) FROM pg_stat_activity;'"

# Check Redis memory
redis-cli -a YOUR_REDIS_PASSWORD info memory
```

---

## 🔧 Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
su - deploy -c "pm2 logs zyphextech --err --lines 50"

# Check if port 3000 is in use
netstat -tlnp | grep 3000

# Restart application
su - deploy -c "cd /var/www/zyphextech && pm2 restart zyphextech"
```

### Database Connection Issues

```bash
# Check PostgreSQL status
systemctl status postgresql-15

# Check PostgreSQL logs
tail -f /var/lib/pgsql/15/data/log/postgresql-*.log

# Test connection
psql -h localhost -U zyphex_user -d zyphex_tech_production

# Check pg_hba.conf
cat /var/lib/pgsql/15/data/pg_hba.conf
```

### Nginx Issues

```bash
# Test Nginx configuration
nginx -t

# Check Nginx logs
tail -f /var/log/nginx/error.log

# Restart Nginx
systemctl restart nginx
```

### SSL Certificate Issues

```bash
# Check certificate status
certbot certificates

# Renew certificates manually
certbot renew --force-renewal

# Check certificate files
ls -la /etc/letsencrypt/live/www.zyphextech.com/
```

### Memory Issues

```bash
# Clear cache
sync; echo 3 > /proc/sys/vm/drop_caches

# Check memory hogs
ps aux --sort=-%mem | head -10

# Restart application with lower memory
su - deploy -c "pm2 restart zyphextech --max-memory-restart 800M"
```

### Disk Space Issues

```bash
# Check disk usage
df -h

# Find large files
find / -type f -size +100M -exec ls -lh {} \;

# Clear PM2 logs
su - deploy -c "pm2 flush"

# Clear old logs
find /var/log -type f -name "*.log" -mtime +30 -delete
```

---

## 📚 Quick Reference Commands

### Application Management

```bash
# Start application
su - deploy -c "cd /var/www/zyphextech && pm2 start ecosystem.config.js"

# Stop application
su - deploy -c "pm2 stop zyphextech"

# Restart application
su - deploy -c "pm2 restart zyphextech"

# View logs
su - deploy -c "pm2 logs zyphextech"

# Monitor
su - deploy -c "pm2 monit"
```

### Database Management

```bash
# Connect to database
psql -h localhost -U zyphex_user -d zyphex_tech_production

# Run migrations
su - deploy -c "cd /var/www/zyphextech && npx prisma migrate deploy"

# Backup database
pg_dump -h localhost -U zyphex_user zyphex_tech_production > backup_$(date +%Y%m%d).sql

# Restore database
psql -h localhost -U zyphex_user -d zyphex_tech_production < backup_file.sql
```

### Service Management

```bash
# Nginx
systemctl status nginx
systemctl restart nginx
systemctl reload nginx

# PostgreSQL
systemctl status postgresql-15
systemctl restart postgresql-15

# Redis
systemctl status redis
systemctl restart redis

# PM2
systemctl status pm2-deploy
systemctl restart pm2-deploy
```

---

## 🎯 Next Steps

1. ✅ Complete initial setup
2. ✅ Configure GitHub Actions (next file)
3. ✅ Test automated deployment
4. ✅ Set up monitoring alerts
5. ✅ Configure backups
6. ✅ Performance tuning

---

**Deployment guide complete! Next, I'll create the GitHub Actions workflow file.**

# Phase 5.6 - Production Deployment Guide
## Zyphex Tech Platform - VPS Deployment & CMS Usage

**Date:** October 29, 2025  
**Environment:** Personal VPS (66.116.199.219)  
**Deployment Method:** Git-based CI/CD with PM2  
**Status:** Ready for Production Deployment ✅

---

## Table of Contents

1. [Pre-Deployment Checklist](#1-pre-deployment-checklist)
2. [VPS Environment Setup](#2-vps-environment-setup)
3. [Environment Configuration](#3-environment-configuration)
4. [Database Setup & Migration](#4-database-setup--migration)
5. [Deployment Process](#5-deployment-process)
6. [Post-Deployment Verification](#6-post-deployment-verification)
7. [CMS System Usage Guide](#7-cms-system-usage-guide)
8. [Managing Services Page](#8-managing-services-page)
9. [Content Management](#9-content-management)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Pre-Deployment Checklist

### 1.1 Code Readiness

✅ **Completed:**
- [x] All Phase 5 tasks completed
- [x] Security audit passed (5/5 rating)
- [x] Build verification successful (211 routes)
- [x] E2E tests created and documented
- [x] Performance optimizations applied
- [x] Dependency vulnerabilities resolved

### 1.2 Environment Preparation

**Required on VPS:**
```bash
# Check these are installed and up to date
node --version    # Should be v18+ or v20+
npm --version     # Should be v9+ or v10+
pm2 --version     # Process manager
postgresql --version  # Database
nginx --version   # Web server (if using)
git --version     # Version control
```

### 1.3 Repository Access

Ensure your VPS has SSH access to GitHub:
```bash
# On VPS, check SSH key exists
cat ~/.ssh/id_rsa.pub

# If not, generate one
ssh-keygen -t rsa -b 4096 -C "deploy@zyphextech.com"

# Add to GitHub: https://github.com/settings/keys
```

### 1.4 Domain & SSL

- [ ] Domain DNS configured (A record pointing to 66.116.199.219)
- [ ] SSL certificate obtained (Let's Encrypt or other)
- [ ] Nginx/Apache configured for reverse proxy
- [ ] Firewall rules configured (ports 80, 443, 3000)

---

## 2. VPS Environment Setup

### 2.1 System Requirements

**Minimum Specifications:**
- **CPU:** 1 core (2+ cores recommended)
- **RAM:** 2GB (4GB+ recommended for build process)
- **Storage:** 20GB (SSD preferred)
- **OS:** Ubuntu 20.04/22.04 LTS or similar

### 2.2 Initial VPS Setup

```bash
# SSH into your VPS
ssh root@66.116.199.219

# Update system
apt update && apt upgrade -y

# Install Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PostgreSQL 15
apt install -y postgresql postgresql-contrib

# Install PM2 globally
npm install -g pm2

# Install build essentials
apt install -y build-essential

# Install Nginx (if not already installed)
apt install -y nginx

# Enable and start services
systemctl enable postgresql
systemctl enable nginx
```

### 2.3 Create Deploy User

```bash
# Create deploy user
adduser deploy
usermod -aG sudo deploy

# Set up directories
mkdir -p /var/www/zyphextech
chown -R deploy:deploy /var/www/zyphextech

# Create log directories
mkdir -p /var/log/pm2
chown -R deploy:deploy /var/log/pm2

# Switch to deploy user
su - deploy
cd /var/www/zyphextech
```

### 2.4 Clone Repository

```bash
# As deploy user
cd /var/www/zyphextech

# Clone repository
git clone git@github.com:isumitmalhotra/Zyphex-Tech.git .

# Verify clone
ls -la

# Install dependencies
npm install --legacy-peer-deps
```

---

## 3. Environment Configuration

### 3.1 Create Production Environment File

```bash
# Create .env.production file
nano /var/www/zyphextech/.env.production
```

### 3.2 Required Environment Variables

**Critical Configuration:**

```bash
# =============================================================================
# PRODUCTION ENVIRONMENT CONFIGURATION
# =============================================================================

# -----------------------------------------------------------------------------
# DATABASE (PostgreSQL)
# -----------------------------------------------------------------------------
DATABASE_URL="postgresql://zyphex_user:YOUR_SECURE_PASSWORD@localhost:5432/zyphextech_production?schema=public&connection_limit=10&pool_timeout=20&connect_timeout=10"

# -----------------------------------------------------------------------------
# NEXTAUTH CONFIGURATION
# -----------------------------------------------------------------------------
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET="YOUR_GENERATED_NEXTAUTH_SECRET_HERE"
NEXTAUTH_URL="https://www.zyphextech.com"

# -----------------------------------------------------------------------------
# APPLICATION SETTINGS
# -----------------------------------------------------------------------------
APP_NAME="Zyphex Tech"
APP_URL="https://www.zyphextech.com"
SUPPORT_EMAIL="support@zyphextech.com"
NEXT_PUBLIC_APP_VERSION="1.0.0"
NODE_ENV="production"

# -----------------------------------------------------------------------------
# EMAIL CONFIGURATION (RECOMMENDED: Use Resend)
# -----------------------------------------------------------------------------
EMAIL_PROVIDER="resend"
RESEND_API_KEY="re_YOUR_RESEND_API_KEY_HERE"
EMAIL_FROM="noreply@zyphextech.com"
EMAIL_FROM_NAME="Zyphex Technologies"

# Alternative: SMTP Configuration (if not using Resend)
# EMAIL_PROVIDER="nodemailer"
# EMAIL_SERVER_HOST="smtp.titan.email"
# EMAIL_SERVER_PORT="587"
# EMAIL_SERVER_USER="noreply@zyphextech.com"
# EMAIL_SERVER_PASSWORD="YOUR_SMTP_PASSWORD"

# Email Features
EMAIL_VERIFICATION_ENABLED="true"
EMAIL_VERIFICATION_REQUIRED="false"
WELCOME_EMAIL_ENABLED="true"
PASSWORD_RESET_EMAIL_ENABLED="true"
PAYMENT_CONFIRMATION_EMAIL_ENABLED="true"

# -----------------------------------------------------------------------------
# STRIPE PAYMENT (Production Keys)
# -----------------------------------------------------------------------------
STRIPE_SECRET_KEY="sk_live_YOUR_PRODUCTION_STRIPE_SECRET_KEY"
STRIPE_PUBLISHABLE_KEY="pk_live_YOUR_PRODUCTION_STRIPE_PUBLISHABLE_KEY"
STRIPE_WEBHOOK_SECRET="whsec_YOUR_PRODUCTION_WEBHOOK_SECRET"

# -----------------------------------------------------------------------------
# OAUTH PROVIDERS (Production)
# -----------------------------------------------------------------------------
GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"

GITHUB_CLIENT_ID="YOUR_GITHUB_CLIENT_ID"
GITHUB_CLIENT_SECRET="YOUR_GITHUB_CLIENT_SECRET"

# -----------------------------------------------------------------------------
# REDIS CACHE (Optional but Recommended)
# -----------------------------------------------------------------------------
REDIS_URL="redis://localhost:6379"
# Or if Redis has password:
# REDIS_URL="redis://YOUR_PASSWORD@localhost:6379"

# -----------------------------------------------------------------------------
# SECURITY & ENCRYPTION
# -----------------------------------------------------------------------------
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY="YOUR_64_CHARACTER_HEX_ENCRYPTION_KEY_HERE"

ALLOWED_ORIGINS="https://www.zyphextech.com,https://zyphextech.com"
SESSION_MAX_AGE="2592000"  # 30 days

# -----------------------------------------------------------------------------
# FILE UPLOAD CONFIGURATION
# -----------------------------------------------------------------------------
MAX_FILE_SIZE="10485760"  # 10MB
ALLOWED_FILE_TYPES="image/jpeg,image/png,image/gif,application/pdf"

# -----------------------------------------------------------------------------
# RATE LIMITING (Production Settings)
# -----------------------------------------------------------------------------
RATE_LIMIT_MAX="5000"  # 5000 requests per window
RATE_LIMIT_WINDOW="900000"  # 15 minutes

# -----------------------------------------------------------------------------
# LOGGING & MONITORING
# -----------------------------------------------------------------------------
LOG_LEVEL="info"
ENABLE_EMAIL_LOGGING="true"

# Sentry Error Monitoring (Recommended for Production)
SENTRY_DSN="https://YOUR_KEY@o4510167403003904.ingest.de.sentry.io/YOUR_PROJECT_ID"
SENTRY_AUTH_TOKEN="YOUR_SENTRY_AUTH_TOKEN"

# -----------------------------------------------------------------------------
# SOCKET.IO CONFIGURATION
# -----------------------------------------------------------------------------
NEXT_PUBLIC_SOCKET_URL="https://www.zyphextech.com"

# -----------------------------------------------------------------------------
# PRODUCTION FLAGS
# -----------------------------------------------------------------------------
NEXT_TELEMETRY_DISABLED="1"
ANALYZE="false"  # Set to true when analyzing bundle
```

### 3.3 Generate Secure Keys

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Save these securely!
```

### 3.4 Set File Permissions

```bash
# Protect environment file
chmod 600 /var/www/zyphextech/.env.production

# Verify
ls -la /var/www/zyphextech/.env.production
# Should show: -rw------- (600)
```

---

## 4. Database Setup & Migration

### 4.1 Create PostgreSQL Database

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL shell:
CREATE DATABASE zyphextech_production;
CREATE USER zyphex_user WITH ENCRYPTED PASSWORD 'YOUR_SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE zyphextech_production TO zyphex_user;

# Grant schema permissions
\c zyphextech_production
GRANT ALL ON SCHEMA public TO zyphex_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO zyphex_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO zyphex_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO zyphex_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO zyphex_user;

# Exit
\q
```

### 4.2 Run Prisma Migrations

```bash
# As deploy user
cd /var/www/zyphextech

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Verify migrations
npx prisma migrate status

# (Optional) Seed database if you have seed data
# npm run db:seed
```

### 4.3 Backup Strategy

```bash
# Create backup script
nano /var/www/zyphextech/scripts/backup-db.sh
```

Add this content:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/zyphextech"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U zyphex_user zyphextech_production > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

# Keep only last 7 days
find $BACKUP_DIR -name "db_backup_*.sql" -mtime +7 -delete

echo "Backup completed: db_backup_$TIMESTAMP.sql"
```

```bash
# Make executable
chmod +x /var/www/zyphextech/scripts/backup-db.sh

# Set up daily backup cron (3 AM)
crontab -e
# Add: 0 3 * * * /var/www/zyphextech/scripts/backup-db.sh
```

---

## 5. Deployment Process

### 5.1 Manual Deployment (First Time)

```bash
# As deploy user
cd /var/www/zyphextech

# Pull latest code
git pull origin main

# Install dependencies
npm install --legacy-peer-deps

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Build application (with increased memory)
NODE_OPTIONS='--max-old-space-size=4096' npm run build

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
# Follow the command it outputs

# Check status
pm2 status
pm2 logs zyphextech
```

### 5.2 Using the Deployment Script

Your existing `manual-deploy.sh` is perfect! Use it like this:

```bash
# SSH into VPS as deploy user
ssh deploy@66.116.199.219

# Run deployment script
cd /var/www/zyphextech
bash manual-deploy.sh

# Or run remotely (as root, then switch to deploy)
ssh root@66.116.199.219 "su - deploy -c 'cd /var/www/zyphextech && bash manual-deploy.sh'"
```

### 5.3 Automated Git-Based Deployment

Set up a post-receive hook for automatic deployment:

```bash
# On your local machine, set up a git remote
git remote add production deploy@66.116.199.219:/var/www/zyphextech

# Create git hook on VPS
ssh deploy@66.116.199.219
cd /var/www/zyphextech/.git/hooks
nano post-receive
```

Add this content:
```bash
#!/bin/bash
cd /var/www/zyphextech
git --git-dir=/var/www/zyphextech/.git pull origin main
bash /var/www/zyphextech/manual-deploy.sh
```

```bash
# Make executable
chmod +x post-receive

# Now deploy with:
git push production main
```

### 5.4 PM2 Management Commands

```bash
# View status
pm2 status

# View logs (real-time)
pm2 logs zyphextech

# View logs (last 100 lines)
pm2 logs zyphextech --lines 100

# Restart application
pm2 restart zyphextech

# Reload with zero-downtime
pm2 reload zyphextech

# Stop application
pm2 stop zyphextech

# Delete from PM2
pm2 delete zyphextech

# Monitor resources
pm2 monit

# View detailed info
pm2 info zyphextech
```

---

## 6. Post-Deployment Verification

### 6.1 Health Checks

```bash
# Check application health
curl http://localhost:3000/api/health

# Expected response:
# {"status":"healthy","message":"Service is operational",...}

# Check via domain (if DNS configured)
curl https://www.zyphextech.com/api/health
```

### 6.2 Verify Services

```bash
# Check PostgreSQL
sudo systemctl status postgresql

# Check Nginx
sudo systemctl status nginx

# Check PM2
pm2 status

# Check disk space
df -h

# Check memory
free -h

# Check process
ps aux | grep node
```

### 6.3 Test Critical Endpoints

```bash
# Homepage
curl -I https://www.zyphextech.com/

# API endpoints
curl https://www.zyphextech.com/api/services
curl https://www.zyphextech.com/api/portfolio

# Static assets
curl -I https://www.zyphextech.com/_next/static/...
```

### 6.4 SSL Certificate

```bash
# Check SSL certificate (if using Let's Encrypt)
sudo certbot certificates

# Renew if needed
sudo certbot renew

# Set up auto-renewal (if not already set)
sudo systemctl status certbot.timer
```

### 6.5 Performance Testing

```bash
# Test response time
time curl https://www.zyphextech.com/ > /dev/null

# Run lighthouse audit (from local machine)
npm run performance-audit
```

---

## 7. CMS System Usage Guide

### 7.1 Accessing the CMS

**Login URL:** `https://www.zyphextech.com/login`

**Admin Access:**
1. Navigate to `/login`
2. Sign in with your admin account
3. You'll be redirected based on your role:
   - **SUPER_ADMIN** → `/super-admin`
   - **ADMIN** → `/admin`

### 7.2 CMS Dashboard Overview

After logging in, you'll see the admin dashboard with these main sections:

**Navigation Menu:**
```
┌─────────────────────────────────┐
│ 📊 Dashboard                     │
│ 🎨 Content Management            │
│   ├─ Content Types              │
│   ├─ Manage Content             │
│   ├─ Media Library              │
│   └─ Pages                      │
│ 📝 CMS (Advanced)                │
│   ├─ Pages                      │
│   ├─ Templates                  │
│   ├─ Media                      │
│   ├─ Settings                   │
│   └─ Analytics                  │
│ 👥 Users & Clients              │
│ 📁 Projects                     │
│ 💰 Financial                    │
│ 🔧 Settings                     │
└─────────────────────────────────┘
```

### 7.3 Understanding Content Types

Your application uses a **dynamic content system** with these content types:

1. **Services** - For the services page
2. **Portfolio** - For portfolio items
3. **Blog Posts** - For blog articles
4. **Team Members** - For team profiles
5. **Testimonials** - For client reviews

**Where to find:** Admin → Content Management → Content Types

---

## 8. Managing Services Page

### 8.1 Overview

The Services page (`/services`) dynamically loads content from the database using the **Content Management** system.

**Current Implementation:**
- Services are stored as `DynamicContentItem` with contentType "services"
- API endpoint: `/api/services`
- Each service has: title, description, icon, imageUrl, features, pricing, etc.

### 8.2 Adding a New Service

#### Method 1: Using Content Management (Recommended)

**Step 1: Navigate to Content Management**
```
Admin Dashboard → Content Management → Manage Content
```

**Step 2: Select Services Content Type**
- Click on "Services" content type
- Click "Add New Item" button

**Step 3: Fill in Service Details**

Required fields:
- **Title:** Service name (e.g., "Custom Software Development")
- **Slug:** URL-friendly identifier (e.g., "custom-software-development")
- **Status:** Select "PUBLISHED" to make it live
- **Featured:** Toggle ON to show as featured service

**Step 4: Add Service Data (JSON format)**

In the "Data" field, enter JSON with this structure:

```json
{
  "description": "We build custom software solutions tailored to your business needs, from web applications to mobile apps.",
  "icon": "Code",
  "imageUrl": "/images/services/custom-software.jpg",
  "features": [
    "Custom Web Applications",
    "Mobile App Development",
    "API Development & Integration",
    "Legacy System Modernization",
    "Microservices Architecture"
  ],
  "price": "Starting at $5,000",
  "ctaText": "Get Started",
  "ctaLink": "/contact"
}
```

**Field Descriptions:**
- `description`: Main service description (shown in card)
- `icon`: Lucide icon name (Code, Cloud, Shield, Database, etc.)
- `imageUrl`: Path to service image (upload to Media Library first)
- `features`: Array of feature bullets
- `price`: Pricing information (optional)
- `ctaText`: Call-to-action button text
- `ctaLink`: Where CTA button links to

**Step 5: Set Order & Categories**
- **Order:** Number to control display order (lower numbers first)
- **Categories:** Add tags like ["Development", "Cloud"]
- **Tags:** Add searchable tags

**Step 6: Save & Publish**
- Click "Save" button
- Verify it appears on `/services` page

#### Method 2: Using Advanced CMS

For more control, use the Advanced CMS:

```
Admin Dashboard → CMS → Pages → Create New
```

This allows you to:
- Create custom page layouts
- Add multiple sections
- Use templates
- Schedule publishing

### 8.3 Editing Existing Services

**Step 1: Find the Service**
```
Admin → Content Management → Manage Content → Services
```

**Step 2: Click Edit**
- Find the service in the list
- Click the Edit icon/button

**Step 3: Modify Content**
- Update any fields
- Change the JSON data structure
- Update images via Media Library

**Step 4: Save Changes**
- Click "Update" button
- Changes appear immediately on the live site

### 8.4 Deleting a Service

```
Admin → Content Management → Manage Content → Services
```

- Click the Delete icon/button next to the service
- Confirm deletion
- Service is removed from the live site

### 8.5 Reordering Services

Services display in this order:
1. **Featured services first** (featured=true)
2. **Then by order number** (ascending)
3. **Then by creation date** (newest first)

To reorder:
- Edit each service
- Set the `order` field to desired number
- Lower numbers appear first (e.g., order: 1, 2, 3...)

### 8.6 Service Icons Available

The system uses **Lucide React icons**. Common options:

```
Code          - Programming/Development
Cloud         - Cloud Services
Shield        - Security
Database      - Data Management
Cpu           - Computing/Processing
Globe         - Web Services
Smartphone    - Mobile Development
Server        - Server/Infrastructure
Lock          - Security
Zap           - Performance
Settings      - Configuration
Users         - Consulting
BarChart      - Analytics
Package       - Software Packages
```

---

## 9. Content Management

### 9.1 Managing Media (Images, Files)

**Upload Media:**
```
Admin → Content Management → Media Library → Upload
```

**Steps:**
1. Click "Upload" button
2. Select file(s) from computer
3. Add title and alt text (for SEO)
4. Add tags for organization
5. Click "Save"

**Supported Formats:**
- Images: JPG, PNG, GIF, WebP (max 10MB)
- Documents: PDF (max 10MB)

**Using Media in Content:**
1. Upload image to Media Library
2. Copy the image URL
3. Use URL in service `imageUrl` field

### 9.2 Managing Portfolio Items

**Add Portfolio Item:**
```
Admin → Content Management → Manage Content → Portfolio
```

**JSON Structure:**
```json
{
  "clientName": "ABC Corporation",
  "projectType": "Web Application",
  "description": "Built a modern SaaS platform...",
  "imageUrl": "/images/portfolio/abc-corp.jpg",
  "technologies": ["React", "Node.js", "PostgreSQL"],
  "completedDate": "2024-06-15",
  "projectUrl": "https://example.com",
  "caseStudyUrl": "/portfolio/abc-corporation",
  "category": "Web Development"
}
```

### 9.3 Managing Blog Posts

**Add Blog Post:**
```
Admin → Content Management → Manage Content → Blog Posts
```

**JSON Structure:**
```json
{
  "author": "John Doe",
  "authorImage": "/images/team/john-doe.jpg",
  "excerpt": "Learn how to build scalable applications...",
  "content": "Full blog post content in markdown...",
  "imageUrl": "/images/blog/featured-image.jpg",
  "readTime": "5 min read",
  "categories": ["Development", "Tutorial"]
}
```

### 9.4 Managing Pages (Advanced)

**Create Custom Page:**
```
Admin → CMS → Pages → Create New
```

**Features:**
- Visual page builder
- Section-based layouts
- Template system
- SEO settings
- Scheduled publishing

**Steps:**
1. Enter page title and slug
2. Choose template (or start blank)
3. Add sections (hero, features, CTA, etc.)
4. Configure SEO metadata
5. Set publish status
6. Save & Publish

### 9.5 Page SEO Settings

For every page/content item, set:

- **Meta Title:** Page title for search engines (60 chars max)
- **Meta Description:** Page description (160 chars max)
- **Meta Keywords:** Comma-separated keywords
- **OG Image:** Social media preview image
- **Canonical URL:** Preferred URL for duplicate content

**Example:**
```
Title: "Custom Software Development Services | Zyphex Tech"
Description: "Expert custom software development services. We build web apps, mobile apps, and enterprise solutions tailored to your business needs."
Keywords: "custom software development, web applications, mobile apps"
```

---

## 10. Troubleshooting

### 10.1 Common Issues

#### Application Won't Start

```bash
# Check PM2 logs
pm2 logs zyphextech --lines 50

# Common causes:
# 1. Database connection failed
# 2. Missing environment variables
# 3. Port already in use
# 4. Build failed

# Solutions:
# Check database is running
sudo systemctl status postgresql

# Verify environment file exists
ls -la /var/www/zyphextech/.env.production

# Check port availability
netstat -tulpn | grep 3000

# Rebuild application
cd /var/www/zyphextech
NODE_OPTIONS='--max-old-space-size=4096' npm run build
pm2 restart zyphextech
```

#### Build Fails (Out of Memory)

```bash
# Increase Node memory limit
NODE_OPTIONS='--max-old-space-size=4096' npm run build

# Or temporarily stop other services
pm2 stop all
npm run build
pm2 restart all

# Consider upgrading VPS RAM if this happens frequently
```

#### Database Connection Errors

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U zyphex_user -d zyphextech_production -h localhost

# Verify DATABASE_URL in .env.production
cat /var/www/zyphextech/.env.production | grep DATABASE_URL

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

#### 502 Bad Gateway (Nginx)

```bash
# Check application is running
pm2 status

# Check Nginx configuration
sudo nginx -t

# Check Nginx error log
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

#### SSL Certificate Issues

```bash
# Renew certificate
sudo certbot renew

# Force renewal
sudo certbot renew --force-renewal

# Check certificate expiry
sudo certbot certificates
```

### 10.2 Performance Issues

#### High Memory Usage

```bash
# Check memory
free -h

# Check process memory
pm2 monit

# Restart application (frees memory)
pm2 restart zyphextech

# Consider increasing max_memory_restart in ecosystem.config.js
```

#### Slow Database Queries

```bash
# Check slow queries in PostgreSQL
sudo -u postgres psql -d zyphextech_production

# Enable query logging
ALTER SYSTEM SET log_min_duration_statement = 1000; # Log queries >1s
SELECT pg_reload_conf();

# View slow query log
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

#### High CPU Usage

```bash
# Check processes
top

# Check PM2
pm2 monit

# Check for memory leaks
pm2 logs zyphextech | grep "heap"

# Consider implementing Redis caching
```

### 10.3 CMS Issues

#### Can't Upload Images

**Check:**
1. File size (max 10MB)
2. File format (JPG, PNG, GIF, PDF)
3. Folder permissions:
   ```bash
   ls -la /var/www/zyphextech/uploads/
   chmod 755 /var/www/zyphextech/uploads/
   ```

#### Services Not Appearing

**Debug:**
```bash
# Check API endpoint
curl http://localhost:3000/api/services

# Check database
sudo -u postgres psql -d zyphextech_production
SELECT * FROM "DynamicContentItem" WHERE "contentTypeId" IN (SELECT id FROM "ContentType" WHERE name = 'services');
\q
```

#### Changes Not Reflecting

**Solutions:**
1. **Clear browser cache** (Ctrl+Shift+R)
2. **Restart application**:
   ```bash
   pm2 restart zyphextech
   ```
3. **Check publish status** (must be "PUBLISHED")
4. **Verify API returns data**:
   ```bash
   curl https://www.zyphextech.com/api/services
   ```

### 10.4 Emergency Rollback

If deployment breaks production:

```bash
# SSH into VPS
ssh deploy@66.116.199.219
cd /var/www/zyphextech

# Find last working commit
git log --oneline -10

# Rollback to previous commit
git reset --hard <COMMIT_HASH>

# Rebuild
NODE_OPTIONS='--max-old-space-size=4096' npm run build

# Restart
pm2 restart zyphextech

# Verify
curl http://localhost:3000/api/health
```

### 10.5 Getting Help

**Logs to Check:**
```bash
# Application logs
pm2 logs zyphextech

# Nginx access log
sudo tail -f /var/log/nginx/access.log

# Nginx error log
sudo tail -f /var/log/nginx/error.log

# PostgreSQL log
sudo tail -f /var/log/postgresql/postgresql-15-main.log

# System log
sudo journalctl -xe
```

**Useful Commands:**
```bash
# System status
pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql

# Disk space
df -h

# Memory
free -h

# Processes
ps aux | grep node

# Network
netstat -tulpn | grep LISTEN
```

---

## Quick Reference Commands

### Deployment
```bash
# Deploy
cd /var/www/zyphextech && bash manual-deploy.sh

# Quick restart
pm2 restart zyphextech

# View logs
pm2 logs zyphextech --lines 100
```

### Database
```bash
# Backup
pg_dump -U zyphex_user zyphextech_production > backup.sql

# Restore
psql -U zyphex_user -d zyphextech_production < backup.sql

# Run migrations
npx prisma migrate deploy
```

### Monitoring
```bash
# Application status
pm2 status && curl http://localhost:3000/api/health

# System health
free -h && df -h && pm2 monit
```

---

## Conclusion

Your Zyphex Tech platform is now **production-ready** with:

✅ **Secure VPS deployment** with PM2 process management  
✅ **Automated CI/CD** via Git-based deployment  
✅ **Comprehensive CMS** for easy content management  
✅ **Dynamic services page** fully manageable via admin panel  
✅ **Database backups** and rollback procedures  
✅ **Health monitoring** and troubleshooting guides  

**Next Steps:**
1. Complete environment configuration on VPS
2. Run first deployment
3. Verify all systems operational
4. Add your services via CMS
5. Monitor performance and errors
6. Proceed to Phase 5.7 (Monitoring Setup)

**Need Help?**
- Check logs: `pm2 logs zyphextech`
- Review this guide's Troubleshooting section
- Contact: support@zyphextech.com

---

**End of Production Deployment Guide**

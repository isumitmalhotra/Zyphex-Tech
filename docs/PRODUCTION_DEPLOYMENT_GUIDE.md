# 🚀 MONITORING SYSTEM - PRODUCTION DEPLOYMENT GUIDE

**Status:** Phase 5 - Production Ready  
**Date:** October 13, 2025  
**Version:** 1.0.0  

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Configuration](#environment-configuration)
3. [VPS Setup](#vps-setup)
4. [Application Deployment](#application-deployment)
5. [Monitoring Configuration](#monitoring-configuration)
6. [Testing & Validation](#testing--validation)
7. [Troubleshooting](#troubleshooting)
8. [Maintenance & Operations](#maintenance--operations)

---

## ✅ Pre-Deployment Checklist

### Code Readiness
- [x] All 121 tests passing
- [x] Zero TypeScript errors
- [x] Code reviewed and approved
- [x] Documentation complete
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates configured

### External Services
- [ ] Sentry account created
- [ ] Resend API key obtained
- [ ] Slack webhook configured (optional)
- [ ] Discord webhook configured (optional)
- [ ] UptimeRobot monitoring set up

### Infrastructure
- [ ] VPS provisioned (recommended: 4GB RAM minimum)
- [ ] Node.js 18+ installed
- [ ] PostgreSQL installed and configured
- [ ] PM2 or systemd configured for process management
- [ ] Nginx/Apache configured as reverse proxy
- [ ] Firewall configured
- [ ] Backup system in place

---

## 🔧 Environment Configuration

### Required Environment Variables

Create a `.env.production` file with the following configuration:

```bash
# ==============================================
# APPLICATION CONFIGURATION
# ==============================================
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://zyphex.com
NEXT_PUBLIC_APP_VERSION=1.0.0

# ==============================================
# DATABASE
# ==============================================
DATABASE_URL=postgresql://user:password@localhost:5432/zyphex_tech
DATABASE_POOL_SIZE=20
DATABASE_CONNECTION_TIMEOUT=30000

# ==============================================
# ERROR TRACKING (SENTRY)
# ==============================================
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ORG=your-organization
SENTRY_PROJECT=zyphex-tech
SENTRY_AUTH_TOKEN=your-auth-token
SENTRY_TRACES_SAMPLE_RATE=0.1  # 10% in production
SENTRY_REPLAYS_SESSION_SAMPLE_RATE=0.01  # 1% of sessions
SENTRY_REPLAYS_ERROR_SAMPLE_RATE=1.0  # 100% of error sessions

# ==============================================
# EMAIL ALERTS (RESEND)
# ==============================================
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ALERTS_ENABLED=true
ALERT_FROM_EMAIL=alerts@zyphex.com
ALERT_RECIPIENTS=ops@zyphex.com,admin@zyphex.com
ALERT_COOLDOWN_MINUTES=15

# ==============================================
# SLACK INTEGRATION (OPTIONAL)
# ==============================================
SLACK_ALERTS_ENABLED=true
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_CHANNEL=#alerts
SLACK_USERNAME=Zyphex Monitor
SLACK_ICON_EMOJI=:robot_face:

# ==============================================
# DISCORD INTEGRATION (OPTIONAL)
# ==============================================
DISCORD_ALERTS_ENABLED=true
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR/WEBHOOK/URL
DISCORD_USERNAME=Zyphex Monitor

# ==============================================
# SECURITY
# ==============================================
NEXTAUTH_SECRET=your-very-long-random-secret-here
NEXTAUTH_URL=https://zyphex.com

# ==============================================
# RATE LIMITING
# ==============================================
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# ==============================================
# MONITORING & HEALTH CHECKS
# ==============================================
HEALTH_CHECK_INTERVAL_MS=30000  # 30 seconds
HEALTH_CHECK_TIMEOUT_MS=5000    # 5 seconds
PERFORMANCE_THRESHOLD_MS=1000   # 1 second
```

### Optional Environment Variables

```bash
# UPTIME MONITORING
UPTIME_ROBOT_API_KEY=your-uptime-robot-key

# CUSTOM EXTERNAL SERVICES
CUSTOM_SERVICE_1_URL=https://api.example.com/health
CUSTOM_SERVICE_2_URL=https://api2.example.com/health

# LOGGING
LOG_LEVEL=info  # debug, info, warn, error
LOG_TO_FILE=true
LOG_FILE_PATH=/var/log/zyphex/app.log
LOG_MAX_FILE_SIZE=10M
LOG_MAX_FILES=10
```

---

## 🖥️ VPS Setup

### System Requirements

**Minimum Specifications:**
- **CPU:** 2 cores
- **RAM:** 4GB
- **Storage:** 20GB SSD
- **OS:** Ubuntu 22.04 LTS or newer

**Recommended Specifications:**
- **CPU:** 4 cores
- **RAM:** 8GB
- **Storage:** 40GB SSD
- **OS:** Ubuntu 22.04 LTS

### 1. Initial Server Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git build-essential

# Configure firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Create application user
sudo useradd -m -s /bin/bash zyphex
sudo usermod -aG sudo zyphex
```

### 2. Install Node.js

```bash
# Install Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should be 18.x or higher
npm --version
```

### 3. Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE zyphex_tech;
CREATE USER zyphex_user WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE zyphex_tech TO zyphex_user;
ALTER DATABASE zyphex_tech OWNER TO zyphex_user;
\q
EOF
```

### 4. Install PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Configure PM2 to start on boot
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u zyphex --hp /home/zyphex
```

### 5. Install and Configure Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/zyphex
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name zyphex.com www.zyphex.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name zyphex.com www.zyphex.com;

    # SSL Configuration (update paths after certbot)
    ssl_certificate /etc/letsencrypt/live/zyphex.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/zyphex.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /api/health {
        proxy_pass http://localhost:3000/api/health;
        access_log off;
    }

    # Static files caching
    location /_next/static {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Public files caching
    location /public {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=86400";
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/zyphex /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d zyphex.com -d www.zyphex.com

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## 📦 Application Deployment

### 1. Clone Repository

```bash
# Switch to application user
sudo su - zyphex

# Clone repository
cd /home/zyphex
git clone https://github.com/isumitmalhotra/Zyphex-Tech.git
cd Zyphex-Tech

# Checkout production branch
git checkout main  # or production branch
```

### 2. Install Dependencies

```bash
# Install npm packages
npm ci --only=production

# Build Next.js application
npm run build
```

### 3. Run Database Migrations

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database (if needed)
npm run db:seed
```

### 4. Create PM2 Ecosystem File

Create `ecosystem.config.js` in the project root (if not exists):

```javascript
module.exports = {
  apps: [{
    name: 'zyphex-tech',
    script: 'npm',
    args: 'start',
    instances: 'max',  // Use all available CPUs
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    error_file: '/var/log/zyphex/pm2-error.log',
    out_file: '/var/log/zyphex/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
  }],
};
```

### 5. Start Application

```bash
# Create log directory
sudo mkdir -p /var/log/zyphex
sudo chown zyphex:zyphex /var/log/zyphex

# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Check status
pm2 status
pm2 logs zyphex-tech
```

---

## 📊 Monitoring Configuration

### 1. Configure Sentry

```bash
# Verify Sentry integration
npm run sentry:check

# Upload source maps (already handled in build)
# Verify in Sentry dashboard: Settings → Source Maps
```

### 2. Configure UptimeRobot

1. **Create Account:** https://uptimerobot.com/
2. **Add Monitor:**
   - Type: HTTPS
   - URL: https://zyphex.com/api/health
   - Interval: 5 minutes
   - Alert Contacts: Your email/SMS
3. **Configure Alerts:**
   - Email notifications
   - SMS notifications (optional)
   - Slack/Discord webhooks

### 3. Test Email Alerts

```bash
# SSH into server
curl -X POST https://zyphex.com/api/test-alert \
  -H "Content-Type: application/json" \
  -d '{"type": "test", "severity": "info"}'
```

### 4. Test Webhook Alerts

```bash
# Test Slack webhook
curl -X POST https://zyphex.com/api/test-webhook \
  -H "Content-Type: application/json" \
  -d '{"channel": "slack", "message": "Test alert"}'

# Test Discord webhook
curl -X POST https://zyphex.com/api/test-webhook \
  -H "Content-Type: application/json" \
  -d '{"channel": "discord", "message": "Test alert"}'
```

---

## ✅ Testing & Validation

### 1. Application Health Check

```bash
# Check application health
curl https://zyphex.com/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-10-13T...",
  "services": {
    "database": { "status": "healthy", "responseTime": 25 },
    "auth": { "status": "healthy", "responseTime": 150 }
  },
  "systemResources": {
    "memory": { "usagePercent": 45 },
    "cpu": { "loadAverage": { "1min": 1.5 } }
  }
}
```

### 2. Database Connection

```bash
# Test database connection
npx prisma db execute --stdin <<< "SELECT 1;"
```

### 3. Performance Test

```bash
# Install Apache Bench (if not installed)
sudo apt install -y apache2-utils

# Run load test
ab -n 1000 -c 10 https://zyphex.com/

# Check response times
ab -n 100 -c 5 https://zyphex.com/api/health
```

### 4. Alert Testing

```bash
# Trigger a test error alert
curl -X POST https://zyphex.com/api/trigger-test-alert \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-admin-token"

# Check email/Slack/Discord for alert delivery
```

### 5. Dashboard Access

1. Navigate to: `https://zyphex.com/admin/monitoring`
2. Verify real-time data updates
3. Check all tabs (Services, Resources, Details)
4. Test auto-refresh toggle
5. Test manual refresh button

---

## 🐛 Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs zyphex-tech --lines 100

# Check for port conflicts
sudo lsof -i :3000

# Verify environment variables
pm2 env 0

# Restart application
pm2 restart zyphex-tech
```

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql -U zyphex_user -d zyphex_tech -h localhost

# Check PostgreSQL status
sudo systemctl status postgresql

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### High Memory Usage

```bash
# Check memory usage
pm2 monit

# Reduce PM2 instances
pm2 scale zyphex-tech 2  # Run 2 instances instead of max

# Restart with memory limit
pm2 restart zyphex-tech --max-memory-restart 800M
```

### Alerts Not Sending

```bash
# Check email configuration
node -e "console.log(process.env.RESEND_API_KEY)"

# Test Resend API
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"from":"alerts@zyphex.com","to":"test@example.com","subject":"Test","html":"Test"}'

# Check webhook URLs
curl -X POST $SLACK_WEBHOOK_URL -d '{"text":"Test"}'
```

### SSL Certificate Issues

```bash
# Renew certificate manually
sudo certbot renew

# Test certificate
sudo certbot certificates

# Check Nginx configuration
sudo nginx -t
```

---

## 🔧 Maintenance & Operations

### Daily Tasks

1. **Check Dashboard:** Monitor system health at `/admin/monitoring`
2. **Review Alerts:** Check email/Slack for any overnight alerts
3. **Check Logs:** Review application logs for errors

```bash
pm2 logs zyphex-tech --lines 50
```

### Weekly Tasks

1. **Review Metrics:** Check Sentry for error trends
2. **Database Maintenance:**

```bash
# Vacuum database
psql -U zyphex_user -d zyphex_tech -c "VACUUM ANALYZE;"
```

3. **Update Dependencies:**

```bash
npm audit
npm update
```

4. **Backup Database:**

```bash
pg_dump -U zyphex_user zyphex_tech > backup_$(date +%Y%m%d).sql
```

### Monthly Tasks

1. **Security Updates:**

```bash
sudo apt update && sudo apt upgrade -y
```

2. **SSL Certificate Renewal:**

```bash
sudo certbot renew
```

3. **Log Rotation:**

```bash
pm2 flush  # Clear PM2 logs
```

4. **Performance Review:**
   - Check Sentry performance metrics
   - Review database query performance
   - Analyze CPU and memory trends

### Backup Strategy

**Automated Daily Backups:**

Create `/home/zyphex/backup.sh`:

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/home/zyphex/backups"
DB_NAME="zyphex_tech"
DB_USER="zyphex_user"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U $DB_USER $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Backup uploads/files (if any)
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz /home/zyphex/Zyphex-Tech/public/uploads

# Remove old backups
find $BACKUP_DIR -name "*.sql" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $DATE"
```

```bash
# Make executable
chmod +x /home/zyphex/backup.sh

# Add to crontab (run daily at 2 AM)
crontab -e
# Add line:
0 2 * * * /home/zyphex/backup.sh >> /var/log/zyphex/backup.log 2>&1
```

### Update Procedure

```bash
# 1. Pull latest code
cd /home/zyphex/Zyphex-Tech
git pull origin main

# 2. Install dependencies
npm ci --only=production

# 3. Run migrations
npx prisma migrate deploy

# 4. Rebuild application
npm run build

# 5. Restart application
pm2 restart zyphex-tech

# 6. Verify health
curl https://zyphex.com/api/health
```

### Rollback Procedure

```bash
# 1. Stop application
pm2 stop zyphex-tech

# 2. Revert to previous commit
git log --oneline -10  # Find commit hash
git checkout <previous-commit-hash>

# 3. Rebuild
npm run build

# 4. Restart
pm2 restart zyphex-tech
```

---

## 📞 Emergency Contacts

**On-Call Rotation:**
- Primary: ops@zyphex.com
- Secondary: admin@zyphex.com
- Emergency: +1-XXX-XXX-XXXX

**Service Providers:**
- Sentry Support: support@sentry.io
- Resend Support: support@resend.com
- VPS Provider: [Your VPS provider support]

---

## 📚 Additional Resources

- **Monitoring Dashboard:** https://zyphex.com/admin/monitoring
- **Sentry Dashboard:** https://sentry.io/organizations/your-org/projects/zyphex-tech/
- **UptimeRobot Dashboard:** https://uptimerobot.com/dashboard
- **Repository:** https://github.com/isumitmalhotra/Zyphex-Tech
- **Documentation:** `/docs/` folder in repository

---

**Last Updated:** October 13, 2025  
**Next Review:** November 13, 2025  
**Maintainer:** Zyphex Tech Operations Team

# 🚀 VPS Deployment - Quick Command Reference

## 📋 System Information
```
VPS IP:     66.116.199.219
OS:         AlmaLinux
Domain:     www.zyphextech.com
App Dir:    /var/www/zyphextech
Deploy User: deploy
```

---

## ⚡ Quick Setup (Copy & Paste)

### 1️⃣ Initial Setup (Run Once)
```bash
# SSH to VPS as root
ssh root@66.116.199.219

# Download and run setup script
cd /root
curl -o setup.sh https://raw.githubusercontent.com/isumitmalhotra/Zyphex-Tech/main/scripts/vps-setup-almalinux.sh
chmod +x setup.sh
./setup.sh

# Wait ~10 minutes for completion
```

### 2️⃣ Generate SSH Key for GitHub
```bash
# Switch to deploy user
su - deploy

# Generate key
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/github_deploy -N ""
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# COPY THIS OUTPUT (private key)
cat ~/.ssh/github_deploy
```

### 3️⃣ Add to GitHub Secrets
```
Go to: github.com/isumitmalhotra/Zyphex-Tech/settings/secrets/actions

Add 4 secrets:
1. VPS_SSH_PRIVATE_KEY = [paste private key from step 2]
2. VPS_HOST = 66.116.199.219
3. VPS_USER = deploy
4. VPS_PORT = 22
```

### 4️⃣ Configure Environment
```bash
# As deploy user
cd /var/www/zyphextech
nano .env.production

# Add this (update NEXTAUTH_SECRET):
DATABASE_URL="postgresql://zyphex:zyphex_secure_pass_2024@localhost:5432/zyphextech"
REDIS_URL="redis://:zyphex_redis_pass_2024@localhost:6379"
NEXTAUTH_URL="https://www.zyphextech.com"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NODE_ENV="production"
PORT=3000

# Save and secure
chmod 600 .env.production
```

### 5️⃣ Setup SSL
```bash
sudo cp /var/www/zyphextech/configs/nginx/zyphextech.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/zyphextech.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo certbot --nginx -d www.zyphextech.com --non-interactive --agree-tos --email admin@zyphextech.com
sudo systemctl reload nginx
```

### 6️⃣ Deploy Application
```bash
cd /var/www/zyphextech
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 start ecosystem.config.js
pm2 save
```

---

## 🔧 Daily Commands

### Application Management
```bash
# Check status
pm2 status

# View logs (live)
pm2 logs zyphextech

# View logs (last 50 lines)
pm2 logs zyphextech --lines 50

# Restart app
pm2 restart zyphextech

# Stop app
pm2 stop zyphextech

# Delete from PM2
pm2 delete zyphextech

# Save PM2 state
pm2 save
```

### Service Management
```bash
# Check all services
sudo systemctl status nginx
sudo systemctl status postgresql-15
sudo systemctl status redis

# Restart services
sudo systemctl restart nginx
sudo systemctl restart postgresql-15
sudo systemctl restart redis

# View service logs
sudo journalctl -u nginx -f
sudo journalctl -u postgresql-15 -f
sudo journalctl -u redis -f
```

### Database Operations
```bash
# Connect to database
psql -h localhost -U zyphex -d zyphextech
# Password: zyphex_secure_pass_2024

# Run migrations
cd /var/www/zyphextech
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Reset database (DANGER!)
npx prisma migrate reset

# View migration status
npx prisma migrate status
```

### Log Management
```bash
# Application logs
tail -f /var/log/pm2/zyphextech-out.log
tail -f /var/log/pm2/zyphextech-error.log

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PostgreSQL logs
sudo tail -f /var/lib/pgsql/15/data/log/postgresql-*.log

# Clear old logs
sudo journalctl --vacuum-time=7d
```

---

## 🔍 Monitoring & Debugging

### Health Checks
```bash
# Application health
curl http://localhost:3000/api/health

# External check
curl https://www.zyphextech.com/api/health

# Check if port is open
netstat -tlnp | grep 3000

# Check Nginx proxy
curl -I http://localhost
```

### Resource Usage
```bash
# CPU and Memory
top
htop

# Disk usage
df -h
du -sh /var/www/zyphextech

# Memory by process
ps aux --sort=-%mem | head

# PM2 monitoring
pm2 monit
```

### SSL Certificate
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate (manual)
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run

# Check SSL expiry
echo | openssl s_client -servername www.zyphextech.com -connect www.zyphextech.com:443 2>/dev/null | openssl x509 -noout -dates
```

---

## 🚨 Emergency Commands

### Application Issues
```bash
# Quick restart everything
pm2 restart zyphextech
sudo systemctl restart nginx

# Nuclear option (restart all services)
pm2 restart all
sudo systemctl restart nginx
sudo systemctl restart postgresql-15
sudo systemctl restart redis

# Rollback to previous version
cd /var/www/zyphextech
git reset --hard HEAD~1
npm ci
npm run build
pm2 restart zyphextech
```

### Disk Space Full
```bash
# Find large files
sudo du -ah /var | sort -rh | head -20

# Clean npm cache
npm cache clean --force

# Clean PM2 logs
pm2 flush

# Clean old logs
sudo journalctl --vacuum-time=3d
```

### Database Connection Issues
```bash
# Restart PostgreSQL
sudo systemctl restart postgresql-15

# Check PostgreSQL status
sudo systemctl status postgresql-15

# View PostgreSQL logs
sudo tail -f /var/lib/pgsql/15/data/log/postgresql-*.log

# Test connection
psql -h localhost -U zyphex -d zyphextech -c "SELECT version();"
```

### Nginx Issues
```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# Check error logs
sudo tail -f /var/log/nginx/error.log
```

---

## 📊 Performance Optimization

### Cache Management
```bash
# Clear Redis cache
redis-cli -a zyphex_redis_pass_2024 FLUSHALL

# Check Redis memory
redis-cli -a zyphex_redis_pass_2024 INFO memory

# Monitor Redis
redis-cli -a zyphex_redis_pass_2024 MONITOR
```

### Database Optimization
```bash
# Vacuum database
psql -h localhost -U zyphex -d zyphextech -c "VACUUM ANALYZE;"

# Check database size
psql -h localhost -U zyphex -d zyphextech -c "SELECT pg_size_pretty(pg_database_size('zyphextech'));"

# Find slow queries
psql -h localhost -U zyphex -d zyphextech -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

---

## 🔐 Security Commands

### Firewall
```bash
# List firewall rules
sudo firewall-cmd --list-all

# Add port
sudo firewall-cmd --permanent --add-port=PORT/tcp
sudo firewall-cmd --reload

# Remove port
sudo firewall-cmd --permanent --remove-port=PORT/tcp
sudo firewall-cmd --reload
```

### User Management
```bash
# List users
cat /etc/passwd | grep deploy

# Change deploy user password
sudo passwd deploy

# View sudo access
sudo -l -U deploy
```

### File Permissions
```bash
# Fix app directory permissions
sudo chown -R deploy:deploy /var/www/zyphextech
sudo chmod 755 /var/www/zyphextech

# Secure environment file
chmod 600 /var/www/zyphextech/.env.production
chown deploy:deploy /var/www/zyphextech/.env.production
```

---

## 🔄 Backup & Restore

### Database Backup
```bash
# Backup database
pg_dump -h localhost -U zyphex zyphextech > backup_$(date +%Y%m%d).sql

# Restore database
psql -h localhost -U zyphex zyphextech < backup_20251008.sql

# Automated daily backup (add to crontab)
0 2 * * * pg_dump -h localhost -U zyphex zyphextech > /backups/db_$(date +\%Y\%m\%d).sql
```

### Application Backup
```bash
# Backup application
cd /var/www
sudo tar -czf zyphextech_backup_$(date +%Y%m%d).tar.gz zyphextech/

# Restore application
cd /var/www
sudo tar -xzf zyphextech_backup_20251008.tar.gz
```

---

## 📱 One-Liner Commands

```bash
# Full status check
pm2 status && sudo systemctl status nginx && sudo systemctl status postgresql-15 && sudo systemctl status redis

# Quick restart
pm2 restart zyphextech && sudo systemctl reload nginx

# View all logs
pm2 logs zyphextech --lines 20

# Check disk space
df -h | grep -E '^Filesystem|^/dev/'

# Check memory
free -h

# Check load average
uptime

# Network connections
netstat -tlnp

# Recent logins
last | head

# Current users
who

# Process tree
pstree

# Top memory processes
ps aux --sort=-%mem | head -10
```

---

## 📞 Support

**Documentation:**
- Full Guide: `VPS_SETUP_COMPLETE_GUIDE.md`
- Quick Start: `IMMEDIATE_ACTION_REQUIRED.md`
- Deployment Guide: `VPS_DEPLOYMENT_GUIDE.md`

**Common Issues:** Check the troubleshooting section in each guide

**Emergency:** Run `pm2 logs zyphextech` for error details

---

**Last Updated:** October 8, 2025  
**Version:** 1.0  
**Platform:** AlmaLinux VPS

# VPS Production Setup - Redis & Encryption

## Overview

This guide is for deploying Redis caching and encryption on your **personal VPS server** where the Zyphex-Tech application is hosted.

## Prerequisites

- SSH access to your VPS
- Root or sudo privileges
- Application running on VPS (currently deployed)
- PM2 for process management

## Step 1: Generate Production Keys (Local Machine)

On your **local development machine**, run:

```bash
node scripts/generate-keys.js
```

**Save the output** - you'll need to add these to your VPS `.env` file:
```
ENCRYPTION_KEY="<64-character-hex-key>"
NEXTAUTH_SECRET="<base64-secret>"
```

> ⚠️ **Important**: Keep these keys secure! Never commit them to Git.

## Step 2: Install Redis on VPS

SSH into your VPS and install Redis:

```bash
# SSH to your VPS
ssh deploy@your-vps-ip

# Update package list
sudo apt update

# Install Redis
sudo apt install redis-server -y

# Check Redis version
redis-server --version
```

## Step 3: Configure Redis for Production

### Option A: Local Redis (Same VPS)

Edit Redis configuration:

```bash
sudo nano /etc/redis/redis.conf
```

**Recommended changes for production:**

1. **Set a password** (find and uncomment/add):
```conf
requirepass YOUR_STRONG_REDIS_PASSWORD_HERE
```

2. **Bind to localhost only** (more secure):
```conf
bind 127.0.0.1 ::1
```

3. **Set max memory** (adjust based on your VPS RAM):
```conf
maxmemory 512mb
maxmemory-policy allkeys-lru
```

4. **Enable persistence**:
```conf
save 900 1
save 300 10
save 60 10000
```

5. **Set supervised systemd**:
```conf
supervised systemd
```

Save and exit (Ctrl+X, Y, Enter).

### Restart Redis:

```bash
sudo systemctl restart redis-server
sudo systemctl enable redis-server
sudo systemctl status redis-server
```

### Test Redis connection:

```bash
# Without password (if you didn't set one)
redis-cli ping
# Should return: PONG

# With password
redis-cli -a YOUR_STRONG_REDIS_PASSWORD_HERE ping
# Should return: PONG
```

### Option B: Managed Redis Service (Recommended for Production)

If you prefer a managed service:

**Upstash Redis** (Free tier available):
1. Sign up at https://console.upstash.com/
2. Create a new Redis database
3. Copy the `REDIS_URL` connection string
4. Use this in your `.env` file

**Benefits**:
- Automatic backups
- High availability
- No VPS maintenance
- Free tier: 10,000 commands/day

## Step 4: Update VPS Environment Variables

On your VPS, update the `.env` file:

```bash
# Navigate to application directory
cd /var/www/zyphextech  # or your deployment path

# Edit .env file
nano .env
```

**Add/update these variables:**

```env
# Encryption Key (from Step 1)
ENCRYPTION_KEY="your-64-character-hex-key-from-local-generation"

# NextAuth Secret (from Step 1)
NEXTAUTH_SECRET="your-base64-secret-from-local-generation"

# Redis Configuration (Option A - Local Redis)
REDIS_HOST="127.0.0.1"
REDIS_PORT="6379"
REDIS_PASSWORD="YOUR_STRONG_REDIS_PASSWORD_HERE"  # If you set one
REDIS_DB="0"

# OR Redis URL (Option B - Managed Service)
# REDIS_URL="rediss://default:password@host:port"
```

**Important**: If using local Redis WITHOUT password, leave `REDIS_PASSWORD` empty:
```env
REDIS_PASSWORD=""
```

Save and exit (Ctrl+X, Y, Enter).

## Step 5: Deploy and Restart Application

```bash
# Pull latest changes (after you push the Redis setup files)
git pull origin main

# Install any new dependencies (if needed)
npm install

# Rebuild application
npm run build

# Restart PM2 processes
pm2 restart all

# Or restart specific app
pm2 restart zyphextech
```

## Step 6: Verify Redis Connection

Check application logs:

```bash
# View PM2 logs
pm2 logs zyphextech

# Look for Redis connection success
# Should see: [Redis] Connected successfully to 127.0.0.1:6379
```

Test Redis is working:

```bash
# Monitor Redis commands (in separate terminal)
redis-cli monitor

# Or check Redis stats
redis-cli info stats
```

## Step 7: Monitor Cache Performance

### Check Cache Hit Rate:

```bash
# SSH to VPS
redis-cli info stats | grep keyspace

# View cached keys
redis-cli keys "*"

# View specific key
redis-cli get "cache:your-key"
```

### Monitor Application Logs:

```bash
# Real-time logs
pm2 logs zyphextech --lines 100

# Filter for cache/Redis logs
pm2 logs zyphextech | grep -i redis
pm2 logs zyphextech | grep -i cache
```

## Production Checklist

Before going live, verify:

- [ ] Redis installed and running on VPS
- [ ] Redis password set (for local Redis)
- [ ] `ENCRYPTION_KEY` added to VPS `.env` (64 hex characters)
- [ ] `NEXTAUTH_SECRET` added to VPS `.env`
- [ ] `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` configured
- [ ] Application restarted with PM2
- [ ] Logs show "Redis Connected successfully"
- [ ] Redis is accepting connections: `redis-cli ping` returns `PONG`
- [ ] Firewall allows Redis port (if using external Redis)
- [ ] Redis auto-starts on reboot: `systemctl is-enabled redis-server`

## Security Best Practices

### 1. Redis Security

```bash
# Disable dangerous commands (add to redis.conf)
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command CONFIG ""
rename-command SHUTDOWN ""
```

### 2. Firewall Configuration

If using UFW firewall:

```bash
# Redis should only be accessible locally (already default)
sudo ufw status

# If you need remote Redis access (NOT recommended):
# sudo ufw allow from TRUSTED_IP to any port 6379
```

### 3. Backup Redis Data

```bash
# Manual backup
redis-cli save

# View backup location
redis-cli config get dir

# Automated backup (add to crontab)
# Daily backup at 2 AM
0 2 * * * redis-cli save && cp /var/lib/redis/dump.rdb /backup/redis-$(date +\%Y\%m\%d).rdb
```

### 4. Monitor Redis Memory

```bash
# Check memory usage
redis-cli info memory

# View current memory
redis-cli info memory | grep used_memory_human

# Set memory alerts (optional)
redis-cli config set maxmemory-policy allkeys-lru
```

## Troubleshooting

### Issue: Redis Not Starting

```bash
# Check Redis status
sudo systemctl status redis-server

# View Redis logs
sudo journalctl -u redis-server -n 50

# Check configuration syntax
redis-server /etc/redis/redis.conf --test-memory 1

# Restart Redis
sudo systemctl restart redis-server
```

### Issue: Connection Refused

```bash
# Check if Redis is running
sudo systemctl status redis-server

# Check Redis port
sudo netstat -tlnp | grep 6379

# Test connection
redis-cli -h 127.0.0.1 -p 6379 ping
```

### Issue: Authentication Failed

```bash
# Connect with password
redis-cli -a YOUR_PASSWORD ping

# Or connect interactively
redis-cli
AUTH YOUR_PASSWORD
PING
```

### Issue: Application Can't Connect

1. Check `.env` file has correct Redis credentials:
```bash
cat .env | grep REDIS
```

2. Test Redis from application directory:
```bash
cd /var/www/zyphextech
node -e "const Redis = require('ioredis'); const r = new Redis({host:'127.0.0.1',port:6379,password:'YOUR_PASSWORD'}); r.ping().then(console.log).catch(console.error).finally(()=>r.quit());"
```

3. Check application logs:
```bash
pm2 logs zyphextech --err --lines 50
```

## Performance Optimization

### 1. Increase Redis Performance

```bash
# Edit /etc/redis/redis.conf

# Disable disk persistence for better performance (if acceptable)
save ""

# Use faster RDB compression
rdbcompression yes

# Optimize for speed
hz 10
```

### 2. Monitor Cache Efficiency

```typescript
// Add to your monitoring dashboard
import { cacheService } from '@/lib/cache';

const stats = cacheService.getStats();
console.log(`Hit Rate: ${stats.hitRate}%`);
console.log(`Total Hits: ${stats.hits}`);
console.log(`Total Misses: ${stats.misses}`);
```

### 3. Tune Application Cache

The cache system automatically optimizes, but you can adjust in `lib/cache/index.ts`:

```typescript
const config = {
  l1: {
    maxSize: 100 * 1024 * 1024,  // 100MB (increase if you have more RAM)
    maxEntries: 10000,            // 10,000 entries (increase as needed)
  },
};
```

## Maintenance

### Daily Tasks

```bash
# Check Redis memory
redis-cli info memory | grep used_memory_human

# Check cache hit rate
pm2 logs zyphextech | grep "Cache hit rate"
```

### Weekly Tasks

```bash
# Backup Redis data
redis-cli save
sudo cp /var/lib/redis/dump.rdb /backup/redis-weekly.rdb

# Check Redis logs for errors
sudo journalctl -u redis-server --since "7 days ago" | grep -i error
```

### Monthly Tasks

```bash
# Review cache performance
redis-cli info stats

# Clean old logs
pm2 flush

# Update Redis if needed
sudo apt update
sudo apt upgrade redis-server
```

## Rollback Plan

If Redis causes issues:

1. **Disable Redis temporarily**:
```bash
# Comment out Redis in .env
nano .env
# Add # before REDIS_HOST, REDIS_PORT, REDIS_PASSWORD

# Restart application
pm2 restart zyphextech
```

Application will automatically fall back to memory cache.

2. **Stop Redis service**:
```bash
sudo systemctl stop redis-server
```

3. **Re-enable when ready**:
```bash
sudo systemctl start redis-server
# Uncomment Redis config in .env
pm2 restart zyphextech
```

## Cost Analysis

### Option A: VPS Local Redis
- **Cost**: $0 (uses existing VPS resources)
- **RAM needed**: ~256MB-512MB for Redis
- **Pros**: No additional cost, low latency
- **Cons**: Uses VPS resources, you manage backups

### Option B: Upstash Redis (Managed)
- **Free tier**: 10,000 commands/day
- **Paid**: $0.20 per 100K commands
- **Pros**: Managed, automatic backups, high availability
- **Cons**: External dependency, potential latency

**Recommendation**: Start with **Option A (VPS Local Redis)** since you already have a VPS. If you need more reliability or your VPS is resource-constrained, move to Upstash.

## Next Steps

1. ✅ Generate keys on local machine
2. ✅ Install Redis on VPS
3. ✅ Configure Redis with password
4. ✅ Update VPS `.env` file
5. ✅ Deploy and restart application
6. ✅ Verify Redis connection in logs
7. ✅ Monitor performance for 24 hours
8. ✅ Set up automated backups

## Support

If you encounter issues:

1. Check application logs: `pm2 logs zyphextech`
2. Check Redis logs: `sudo journalctl -u redis-server -n 50`
3. Review this guide's troubleshooting section
4. Test Redis connection: `redis-cli ping`

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**VPS Optimized**: Yes  
**Maintained by**: Zyphex-Tech Development Team

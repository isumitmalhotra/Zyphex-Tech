# 🚀 Quick Deployment Commands - VPS Redis Setup

## 1️⃣ Generate Keys (Run on Local Machine)

```bash
node scripts/generate-keys.js
```

Copy the output keys - you'll need them for Step 3.

---

## 2️⃣ Install Redis on VPS

```bash
# SSH to VPS
ssh deploy@your-vps-ip

# Install Redis
sudo apt update && sudo apt install redis-server -y

# Configure Redis
sudo nano /etc/redis/redis.conf
```

**Add these lines to redis.conf:**
```conf
requirepass YOUR_STRONG_PASSWORD_HERE
bind 127.0.0.1 ::1
maxmemory 512mb
maxmemory-policy allkeys-lru
supervised systemd
```

**Restart Redis:**
```bash
sudo systemctl restart redis-server
sudo systemctl enable redis-server
redis-cli -a YOUR_STRONG_PASSWORD_HERE ping
# Should return: PONG
```

---

## 3️⃣ Update VPS Environment

```bash
# Edit .env on VPS
cd /var/www/zyphextech
nano .env
```

**Add these lines to .env:**
```env
# From Step 1 - Keys generated locally
ENCRYPTION_KEY="your-64-char-hex-key-here"
NEXTAUTH_SECRET="your-base64-secret-here"

# Redis Configuration
REDIS_HOST="127.0.0.1"
REDIS_PORT="6379"
REDIS_PASSWORD="YOUR_STRONG_PASSWORD_HERE"
REDIS_DB="0"
```

---

## 4️⃣ Deploy Application

```bash
# Pull latest code
git pull origin main

# Install dependencies (if needed)
npm install

# Build application
npm run build

# Restart PM2
pm2 restart all

# Check logs
pm2 logs zyphextech --lines 50
```

**Look for:** `[Redis] Connected successfully to 127.0.0.1:6379`

---

## 5️⃣ Verify Everything Works

```bash
# Test Redis
redis-cli -a YOUR_PASSWORD ping

# Check application logs
pm2 logs zyphextech | grep -i redis

# Monitor cache performance
redis-cli info stats

# View cached keys
redis-cli -a YOUR_PASSWORD keys "*"
```

---

## ✅ Success Checklist

- [ ] Redis installed and running: `systemctl status redis-server`
- [ ] Redis password set in `/etc/redis/redis.conf`
- [ ] Encryption keys added to VPS `.env`
- [ ] Redis config added to VPS `.env`
- [ ] Application rebuilt: `npm run build`
- [ ] PM2 restarted: `pm2 restart all`
- [ ] Logs show Redis connected: `pm2 logs | grep Redis`
- [ ] Redis responding: `redis-cli -a PASSWORD ping` returns `PONG`

---

## 🔧 Common Issues

### Redis won't start
```bash
sudo journalctl -u redis-server -n 50
sudo systemctl restart redis-server
```

### Can't connect from app
```bash
# Check .env has correct password
cat .env | grep REDIS_PASSWORD

# Test connection
redis-cli -h 127.0.0.1 -p 6379 -a YOUR_PASSWORD ping
```

### App still using memory cache
```bash
# Check logs for connection errors
pm2 logs zyphextech --err

# Restart app
pm2 restart zyphextech
```

---

## 📊 Monitor Performance

```bash
# Real-time monitoring
redis-cli monitor

# Memory usage
redis-cli info memory | grep used_memory_human

# Cache statistics
redis-cli info stats

# Application cache hit rate
pm2 logs zyphextech | grep "hit rate"
```

---

## 🔒 Security Reminders

- ✅ Never commit `.env` to Git
- ✅ Use strong Redis password (20+ characters)
- ✅ Redis bound to localhost only
- ✅ Firewall blocks external Redis access
- ✅ Regular Redis backups: `redis-cli save`

---

## 📞 Need Help?

1. **Redis issues**: `sudo journalctl -u redis-server -n 50`
2. **App issues**: `pm2 logs zyphextech --err --lines 100`
3. **Review guide**: See `VPS_REDIS_PRODUCTION_SETUP.md`

---

**Total Setup Time**: ~10-15 minutes  
**Downtime Required**: ~30 seconds (PM2 restart only)

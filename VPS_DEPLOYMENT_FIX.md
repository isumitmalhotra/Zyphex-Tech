# VPS Deployment Memory Fix Guide

**Issue:** Deployment fails with `ENOMEM` (out of memory) during `npm install`  
**Date:** October 18, 2025  
**Status:** 🔧 Requires VPS Configuration

---

## Problem Analysis

The VPS deployment failed with this error:
```
npm error code ENOMEM
npm error syscall spawn
npm error errno -12
npm error spawn ENOMEM
```

**Root Cause:** The VPS doesn't have enough memory to complete `npm install` for the large dependency tree.

---

## Solution: Add Swap Space on VPS

### Option 1: Create Swap File (Recommended - Quick Fix)

SSH into your VPS and run these commands:

```bash
# 1. Check current swap
free -h

# 2. Create 2GB swap file (adjust size based on your VPS RAM)
sudo fallocate -l 2G /swapfile

# 3. Set correct permissions
sudo chmod 600 /swapfile

# 4. Mark as swap space
sudo mkswap /swapfile

# 5. Enable the swap
sudo swapon /swapfile

# 6. Verify swap is active
free -h

# 7. Make swap permanent (survives reboots)
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 8. Optimize swap usage (optional)
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
```

**Swap Size Recommendations:**
- 512MB RAM → 2GB swap
- 1GB RAM → 2-3GB swap
- 2GB RAM → 1-2GB swap
- 4GB+ RAM → 1GB swap

---

## Option 2: Use npm ci with --legacy-peer-deps

Modify your deployment script to use less memory:

```bash
# Instead of: npm install
# Use:
npm ci --legacy-peer-deps --prefer-offline --no-audit --no-fund
```

This reduces memory usage by:
- Using `npm ci` (cleaner install)
- Skipping peer dependency resolution
- Using offline cache when possible
- Skipping audit/fund checks

---

## Option 3: Install Dependencies Incrementally

If swap space isn't enough, install in stages:

```bash
# Clear existing
rm -rf node_modules package-lock.json

# Install production dependencies only
npm install --production --legacy-peer-deps

# Then install dev dependencies
npm install --only=dev --legacy-peer-deps
```

---

## Option 4: Pre-build Locally, Deploy Build

**Most Reliable Method:**

1. **Build locally** (which you've already verified works):
```bash
npm run build
```

2. **Create deployment package** with only necessary files:
```bash
# Create a deploy directory
mkdir deploy
cp -r .next deploy/
cp -r public deploy/
cp -r prisma deploy/
cp package.json deploy/
cp package-lock.json deploy/
cp next.config.mjs deploy/
cp .env.production deploy/.env
```

3. **On VPS, only install production dependencies**:
```bash
npm ci --production --legacy-peer-deps
```

4. **Use the pre-built .next folder** - no build step needed on VPS!

---

## Recommended Deployment Workflow

### Update your deployment script (`.github/workflows/deploy.yml` or similar):

```yaml
name: Deploy to VPS

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      # Build locally on GitHub Actions (has plenty of memory)
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Create deployment package
        run: |
          mkdir -p deploy
          cp -r .next deploy/
          cp -r public deploy/
          cp -r prisma deploy/
          cp package.json deploy/
          cp package-lock.json deploy/
          cp next.config.mjs deploy/
          cp server.js deploy/
          cp ecosystem.config.js deploy/
      
      # Deploy to VPS
      - name: Deploy to VPS
        uses: appleboy/scp-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: ${{ secrets.VPS_PORT }}
          source: "deploy/*"
          target: "/var/www/zyphex-tech"
      
      - name: Install production dependencies on VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: ${{ secrets.VPS_PORT }}
          script: |
            cd /var/www/zyphex-tech/deploy
            npm ci --production --legacy-peer-deps
            pm2 restart ecosystem.config.js --update-env
```

---

## Immediate Fix Steps

**Step 1: Add Swap Space**
```bash
# SSH to VPS
ssh -p ${VPS_PORT} ${VPS_USER}@${VPS_HOST}

# Add 2GB swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verify
free -h
```

**Step 2: Modify npm install command**
Update your deployment script to use:
```bash
npm ci --legacy-peer-deps --prefer-offline --no-audit --no-fund
```

**Step 3: Retry Deployment**
```bash
# Trigger your deployment again
git push origin main
```

---

## Alternative: Build Locally and Deploy

Since your local build works perfectly, you can:

1. **Build locally:**
```powershell
npm run build
```

2. **Create a deployment archive:**
```powershell
# PowerShell commands
$files = @(
    ".next",
    "public",
    "prisma",
    "package.json",
    "package-lock.json",
    "next.config.mjs",
    "server.js",
    "ecosystem.config.js",
    ".env.production"
)

# Create deploy directory
New-Item -ItemType Directory -Force -Path deploy

# Copy files
foreach ($file in $files) {
    if (Test-Path $file) {
        Copy-Item -Recurse -Force $file deploy/
    }
}

# Create tarball (requires tar on Windows or WSL)
tar -czf deploy.tar.gz -C deploy .
```

3. **Upload to VPS:**
```bash
scp -P ${VPS_PORT} deploy.tar.gz ${VPS_USER}@${VPS_HOST}:/var/www/zyphex-tech/
```

4. **Extract and install on VPS:**
```bash
ssh -p ${VPS_PORT} ${VPS_USER}@${VPS_HOST}
cd /var/www/zyphex-tech
tar -xzf deploy.tar.gz
npm ci --production --legacy-peer-deps
pm2 restart all
```

---

## Verification Checklist

After applying the fix, verify:

- [ ] Swap space is active (`free -h` shows swap)
- [ ] npm install completes without ENOMEM error
- [ ] Application builds successfully (if building on VPS)
- [ ] PM2 starts the application
- [ ] Application is accessible via web browser
- [ ] Database connections work
- [ ] Redis connections work (if applicable)

---

## Monitoring Commands

```bash
# Check memory usage
free -h

# Check swap usage
swapon --show

# Check PM2 status
pm2 status

# Check application logs
pm2 logs

# Check system memory in real-time
top
# Press 'M' to sort by memory usage

# Check Node.js memory usage
pm2 monit
```

---

## Prevention for Future

1. **Use CI/CD with pre-built artifacts** (recommended)
2. **Always have swap space enabled on VPS**
3. **Use `npm ci` instead of `npm install`**
4. **Consider upgrading VPS RAM** if budget allows
5. **Monitor memory usage regularly**

---

## Need More Help?

If issues persist:

1. **Check VPS specs:**
```bash
cat /proc/meminfo | head -5
cat /proc/cpuinfo | grep "model name" | head -1
df -h
```

2. **Check npm cache:**
```bash
npm cache clean --force
```

3. **Try Docker deployment** (better resource isolation)

4. **Consider upgrading VPS plan** if consistently hitting memory limits

---

**Status:** Ready to apply fix  
**Next Step:** Add swap space and retry deployment  
**Expected Result:** Successful deployment without memory errors

---

## Quick Commands Reference

```bash
# Add 2GB swap (run as root or with sudo)
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Deploy with memory-efficient npm
npm ci --legacy-peer-deps --prefer-offline --no-audit --no-fund

# Or use production-only install
npm ci --production --legacy-peer-deps
```

---

**Generated:** October 18, 2025  
**Author:** GitHub Copilot  
**Project:** Zyphex Tech IT Services Platform

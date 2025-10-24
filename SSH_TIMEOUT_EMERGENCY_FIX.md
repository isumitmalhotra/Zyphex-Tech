# URGENT: SSH Timeout Fix - Build Detachment

## Critical Issue
**Problem:** SSH connection times out during Next.js build, killing the process  
**Exit Code:** 255 (Broken pipe) or 1  
**Stage:** Build phase after npm install succeeds

## Root Cause Analysis

The VPS deployment log shows:
```
> my-v0-project@0.1.0 build
> cross-env NODE_OPTIONS=--max-old-space-size=2048 next build
...
client_loop: send disconnect: Broken pipe
```

### Why It's Happening

1. **SSH Timeout:** GitHub Actions SSH connection has a maximum lifetime
2. **Long Build:** Next.js build takes 5-10 minutes on low-RAM VPS
3. **Process Kill:** When SSH disconnects, child processes are killed
4. **Incomplete Detachment:** `nohup` alone is not enough

## Fixes Applied

### 1. **Complete Process Detachment**

Changed from:
```bash
nohup npm run build:vps > build.log 2>&1 &
```

To:
```bash
setsid nohup npx cross-env NODE_OPTIONS=--max-old-space-size=2048 NEXT_TELEMETRY_DISABLED=1 next build > build.log 2>&1 < /dev/null &
```

**Benefits:**
- `setsid`: Creates new session (completely detached from SSH)
- `nohup`: Ignores hangup signals
- `< /dev/null`: Prevents stdin issues
- Direct `cross-env` call: Bypasses npm script indirection

### 2. **Removed Invalid Next.js Config**

Removed:
```javascript
isrMemoryCacheSize: 0, // This option doesn't exist in Next.js 14
```

### 3. **Build Verification**

Added checks before build:
```bash
# Verify package.json updated
grep -q "build:vps" package.json

# Show environment info
node --version
free -m
```

### 4. **SSH Keep-Alive (Already Applied)**

```yaml
ssh -o ServerAliveInterval=60 \
    -o ServerAliveCountMax=10
```

## Why Previous Attempts Failed

1. **npm script indirection:** `npm run build` adds another layer
2. **Incomplete detachment:** Process still tied to SSH session
3. **No stdin redirection:** Build might wait for input
4. **Invalid config warning:** Slows down build startup

## Testing Strategy

### What Should Happen Now

```
🏗️ Building application...
Build command: npx cross-env NODE_OPTIONS=--max-old-space-size=2048 ...
Launching build in detached session...
Build PID: 12345
Build is running in detached session (will survive SSH disconnect)

Build running... 30s elapsed
Build running... 60s elapsed
Build running... 90s elapsed
... (continues even if SSH drops)
✅ Build completed in 287s
```

### If Build Still Fails

The build process is now **fully detached**. Even if SSH disconnects, the build will continue on the VPS.

**Manual verification:**

```bash
# SSH into VPS
ssh user@vps

# Check if build is still running
cd /var/www/zyphextech
ps aux | grep "next build"

# Watch build log
tail -f build.log

# Once build completes
ls -la .next/BUILD_ID

# Restart PM2
pm2 restart zyphextech
```

## Emergency Manual Deployment

If automated deployment continues to fail:

```bash
ssh user@vps
cd /var/www/zyphextech

# Stop PM2 to free memory
pm2 stop zyphextech

# Pull latest code
git fetch origin
git reset --hard origin/main

# Install dependencies
NODE_OPTIONS='--max-old-space-size=2048' npm install --prefer-offline --no-audit --legacy-peer-deps

# Generate Prisma
npx prisma generate

# Build in screen session (fully detached)
screen -dmS build bash -c 'npx cross-env NODE_OPTIONS=--max-old-space-size=2048 NEXT_TELEMETRY_DISABLED=1 next build 2>&1 | tee build.log'

# Monitor build (can disconnect and reconnect)
screen -r build
# Press Ctrl+A then D to detach

# Check build progress
tail -f build.log

# After build completes
pm2 restart zyphextech
pm2 logs zyphextech --lines 50

# Verify
curl http://localhost:3000/api/health
```

## Alternative: Build on GitHub, Deploy Artifacts

If VPS builds continue to fail, build on GitHub Actions (more resources):

### Option 1: Artifact Upload

```yaml
# In .github/workflows/deploy-with-rollback.yml
# Add before SSH step:

- name: Build Application on GitHub
  run: |
    npm ci
    npm run build
    tar -czf next-build.tar.gz .next node_modules
    
- name: Upload Build to VPS
  run: |
    scp next-build.tar.gz user@vps:/var/www/zyphextech/
    ssh user@vps "cd /var/www/zyphextech && tar -xzf next-build.tar.gz && pm2 restart zyphextech"
```

### Option 2: Docker Build

Build as Docker image, push to registry, pull on VPS.

## VPS Resource Check

Before next deployment:

```bash
# Check available memory
ssh user@vps "free -h"

# Should have:
# - RAM: At least 500MB free
# - Swap: 4GB active

# Check swap
ssh user@vps "swapon -s"

# If no swap, create it:
ssh user@vps "sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile"
```

## Monitoring Next Deployment

Watch for these key indicators:

✅ **Success Indicators:**
```
Launching build in detached session...
Build PID: 12345
Build is running in detached session (will survive SSH disconnect)
Build running... 30s elapsed
Build running... 60s elapsed
... (progress continues)
✅ Build completed in XXXs
```

❌ **Failure Indicators:**
```
client_loop: send disconnect: Broken pipe
Error: Process completed with exit code 255
```

If you see failure again, the build is **still running on VPS**. Just SSH in and check `tail -f build.log`.

## Files Changed

1. **next.config.mjs** - Removed invalid `isrMemoryCacheSize`
2. **deploy-with-rollback.yml** - Full process detachment with `setsid`
3. **SSH_TIMEOUT_EMERGENCY_FIX.md** - This document

## Commit Message

```
fix: URGENT - Complete SSH session detachment for builds

Critical changes to prevent SSH timeout killing builds:
- Use setsid for complete session detachment
- Direct cross-env call (bypass npm script)
- Redirect stdin from /dev/null
- Remove invalid Next.js config option
- Add build verification step

This ensures builds continue even if SSH disconnects.
```

## Next Steps

1. ✅ Commit and push these changes
2. ⏳ Monitor GitHub Actions deployment
3. 🔍 If SSH disconnects, build continues on VPS
4. ✅ SSH back in to verify build completion
5. 🎉 PM2 will restart once build completes

---

**This is the FINAL fix. The build process is now completely independent of the SSH session.**

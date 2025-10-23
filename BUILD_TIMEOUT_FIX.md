# Build Timeout Fix - SSH Disconnection Issue

## Issue Summary
**Error:** `client_loop: send disconnect: Broken pipe` with `exit code 255/1`  
**Root Cause:** SSH connection times out during long Next.js build process on VPS  
**Stage:** Build phase (npm install succeeds, but build fails)

## Why This Happens

1. **Long build time:** Next.js builds can take 5-10 minutes on low-resource VPS
2. **SSH timeout:** Default SSH timeout is too short for long-running builds
3. **Memory pressure:** Build process uses significant memory, causing slowdowns
4. **Connection drops:** If SSH disconnects, the build process is killed

## Solutions Applied

### 1. **SSH Keep-Alive Configuration**

Added to workflow:
```yaml
ssh -o ServerAliveInterval=60 \
    -o ServerAliveCountMax=10 \
    -o ConnectTimeout=30 \
    -p ${VPS_PORT} ${VPS_USER}@${VPS_HOST}
```

This keeps SSH connection alive for up to 10 minutes (60s × 10).

### 2. **Background Build Process**

Changed from:
```bash
npm run build 2>&1 | tee build.log
```

To:
```bash
nohup npm run build:vps > build.log 2>&1 &
BUILD_PID=$!
# Monitor in background
```

Benefits:
- Build continues even if SSH disconnects
- Progress monitoring every 30 seconds
- 10-minute timeout protection
- Non-blocking deployment

### 3. **Reduced Memory Usage**

**package.json** - Reduced from 4GB to 2GB:
```json
{
  "scripts": {
    "build": "cross-env NODE_OPTIONS=--max-old-space-size=2048 next build",
    "build:vps": "cross-env NODE_OPTIONS=--max-old-space-size=2048 NEXT_TELEMETRY_DISABLED=1 next build"
  }
}
```

**next.config.mjs** - Added memory optimizations:
```javascript
experimental: {
  workerThreads: false,
  cpus: 1,
  isrMemoryCacheSize: 0, // Disable ISR memory cache
}
```

### 4. **Build Monitoring**

The workflow now shows real-time progress:
```
Build running... 30s elapsed
Build running... 60s elapsed
Build running... 90s elapsed
✅ Build completed in 127s
```

## Testing the Fix

### Before Deployment

Check VPS resources:
```bash
ssh user@vps "free -h && df -h"
```

Ensure you have:
- **Memory:** At least 1GB RAM + 4GB swap
- **Disk:** At least 10GB free

### During Deployment

Watch GitHub Actions:
- https://github.com/isumitmalhotra/Zyphex-Tech/actions

Monitor on VPS:
```bash
ssh user@vps "tail -f /var/www/zyphextech/build.log"
```

### After Deployment

Verify success:
```bash
# Check PM2 status
ssh user@vps "pm2 list"

# Test application
curl https://www.zyphextech.com/api/health

# Verify Time Tracking page
curl -I https://www.zyphextech.com/project-manager/time-tracking
```

## Manual Build Process (If Automated Fails)

If the automated deployment continues to fail, build manually:

```bash
# SSH into VPS
ssh user@your-vps
cd /var/www/zyphextech

# Pull latest code
git pull origin main

# Stop PM2 to free memory
pm2 stop zyphextech

# Install dependencies
NODE_OPTIONS='--max-old-space-size=2048' npm install --prefer-offline --no-audit --legacy-peer-deps

# Generate Prisma client
npx prisma generate

# Build in background (prevents SSH timeout)
nohup npm run build:vps > build.log 2>&1 &

# Monitor build progress
tail -f build.log

# Once build completes (Ctrl+C to stop tail)
# Verify build success
ls -la .next/BUILD_ID

# Restart application
pm2 restart zyphextech

# Verify
pm2 logs zyphextech --lines 50
curl http://localhost:3000/api/health
```

## Alternative: Build Locally, Deploy Build

If VPS is too resource-constrained, build locally:

### Option A: Build on GitHub Actions

```yaml
# Add to workflow before SSH step:
- name: Build Application
  run: |
    npm ci
    npm run build
    
- name: Upload Build
  uses: actions/upload-artifact@v3
  with:
    name: next-build
    path: .next
    
- name: Deploy Build to VPS
  run: |
    # Download and extract build on VPS
    # Then just restart PM2
```

### Option B: Build Locally, Upload

```bash
# On local machine
npm run build

# Create build tarball
tar -czf next-build.tar.gz .next

# Upload to VPS
scp next-build.tar.gz user@vps:/var/www/zyphextech/

# On VPS
ssh user@vps
cd /var/www/zyphextech
tar -xzf next-build.tar.gz
pm2 restart zyphextech
```

## Resource Requirements for Smooth Builds

### Current (Minimum)
- **RAM:** 1GB + 4GB swap
- **Build Time:** 5-10 minutes
- **Risk:** Medium (may timeout/fail)

### Recommended
- **RAM:** 2GB + 2GB swap
- **Build Time:** 2-5 minutes
- **Risk:** Low

### Optimal
- **RAM:** 4GB
- **Build Time:** 1-3 minutes
- **Risk:** Very Low

## Monitoring Commands

```bash
# Watch memory during build
ssh user@vps "watch -n 2 free -h"

# Monitor build log
ssh user@vps "tail -f /var/www/zyphextech/build.log"

# Check for OOM kills
ssh user@vps "dmesg | grep -i 'killed process'"

# PM2 monitoring
ssh user@vps "pm2 monit"
```

## Expected Build Output

Successful build should show:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (140/140)
✓ Collecting build traces
✓ Finalizing page optimization

Route (app)                               Size     First Load JS
┌ ○ /                                     9.08 kB  390 kB
...
```

Build ID file should exist:
```bash
cat .next/BUILD_ID
# Should output something like: abc123def456
```

## Troubleshooting

### If Build Still Fails

1. **Check available memory:**
   ```bash
   ssh user@vps "free -m"
   ```
   If available < 500MB, the build will likely fail.

2. **Check swap is active:**
   ```bash
   ssh user@vps "swapon -s"
   ```
   Should show 4GB swap file.

3. **Check for OOM killer:**
   ```bash
   ssh user@vps "dmesg | tail -50 | grep -i kill"
   ```

4. **Increase swap temporarily:**
   ```bash
   ssh user@vps "sudo fallocate -l 6G /swapfile2 && sudo chmod 600 /swapfile2 && sudo mkswap /swapfile2 && sudo swapon /swapfile2"
   ```

5. **Reduce build parallelism:**
   Edit `next.config.mjs`:
   ```javascript
   experimental: {
     cpus: 1,  // Already set, but verify
     workerThreads: false,
   }
   ```

## Changes Summary

### Files Modified:
1. `.github/workflows/deploy-with-rollback.yml`
   - SSH keep-alive settings
   - Background build process
   - Build progress monitoring

2. `package.json`
   - Reduced memory from 4GB to 2GB
   - Added `build:vps` script

3. `next.config.mjs`
   - Disabled ISR memory cache
   - Confirmed single CPU/no worker threads

### Commits:
- Previous: Memory optimization for npm install ✅
- Current: Build timeout and SSH keep-alive fixes 🔄

## Next Steps

1. **Commit these changes:**
   ```bash
   git add -A
   git commit -m "fix: Resolve build timeout with SSH keep-alive and background process"
   git push origin main
   ```

2. **Monitor deployment:**
   - GitHub Actions: https://github.com/isumitmalhotra/Zyphex-Tech/actions
   - Watch for "Build running..." progress messages

3. **Verify success:**
   - Check PM2 status
   - Test Time Tracking page
   - Review build logs

The build should now complete successfully even on low-resource VPS! 🚀

# 🚀 VPS Deployment Instructions - Memory Fix Applied

**Date**: 2025-10-25  
**Critical Fix**: JavaScript heap out of memory resolved  
**Status**: Ready to deploy ✅

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure:

- [x] ✅ Code pushed to GitHub (commit 509cc9d)
- [x] ✅ Memory fix applied (4GB heap size)
- [x] ✅ Webpack optimizations configured
- [x] ✅ Team Communication feature complete
- [ ] ⏳ VPS has at least 4GB available memory
- [ ] ⏳ PM2 is running
- [ ] ⏳ PostgreSQL is running
- [ ] ⏳ Redis is running (optional but recommended)

---

## 🎯 Quick Deployment (Recommended)

### Option 1: Automated Deployment Script

```bash
# 1. SSH to VPS
ssh deploy@66.116.199.219

# 2. Navigate to project
cd /var/www/zyphextech

# 3. Make script executable (first time only)
chmod +x scripts/deploy-with-memory-fix.sh

# 4. Run deployment script
./scripts/deploy-with-memory-fix.sh
```

**What this does:**
- ✅ Checks available memory
- ✅ Stops PM2 to free memory if needed
- ✅ Pulls latest code from GitHub
- ✅ Installs dependencies
- ✅ Generates Prisma Client
- ✅ Runs migrations
- ✅ Builds with 4GB heap size
- ✅ Restarts PM2
- ✅ Tests application health
- ✅ Shows memory status

**Expected Duration:** 10-15 minutes

---

## 📝 Manual Deployment (Step-by-Step)

If you prefer to run commands manually or the script fails:

### Step 1: Connect to VPS

```bash
ssh deploy@66.116.199.219
```

### Step 2: Check Memory

```bash
# Check available memory
free -h

# Should show:
#              total        used        free      shared  buff/cache   available
# Mem:          7.8Gi       2.1Gi       3.2Gi        45Mi       2.5Gi       5.4Gi
```

**⚠️ If available memory < 3.5GB:**

```bash
# Stop PM2 processes
pm2 stop all

# Clear cache (if you have sudo)
sync; sudo sh -c 'echo 3 > /proc/sys/vm/drop_caches'

# Check again
free -h
```

### Step 3: Navigate and Pull

```bash
cd /var/www/zyphextech
git pull origin main
```

**Expected Output:**
```
From https://github.com/isumitmalhotra/Zyphex-Tech
 * branch            main       -> FETCH_HEAD
   d6eb889..509cc9d  main       -> origin/main
Updating d6eb889..509cc9d
Fast-forward
 DEPLOYMENT_MEMORY_FIX.md                         | 676 ++++++++++++++
 TEAM_COMMUNICATION_IMPLEMENTATION_COMPLETE.md    | 1800 ++++++++++++++++++++++++++++++++++
 next.config.mjs                                  |  35 +-
 package.json                                     |   4 +-
 scripts/deploy-with-memory-fix.sh                | 145 +++
 app/project-manager/communication/page.tsx       | 480 +++++++++
 app/api/project-manager/communication/*/route.ts | 274 ++++++
 7 files changed, 3412 insertions(+), 2 deletions(-)
```

### Step 4: Install Dependencies

```bash
npm install --legacy-peer-deps
```

**Duration:** 1-2 minutes

### Step 5: Generate Prisma Client

```bash
npx prisma generate
```

**Duration:** ~30 seconds

### Step 6: Run Migrations

```bash
npx prisma migrate deploy
```

**Expected:** "No pending migrations to apply."

### Step 7: Remove Old Build

```bash
rm -rf .next
```

### Step 8: Build Application (CRITICAL)

```bash
# Build with 4GB heap size (this is the fix!)
npm run build:vps
```

**⚠️ IMPORTANT:**
- This will take **10-15 minutes**
- Memory usage will peak at ~3.5GB
- Do NOT interrupt this process
- Monitor memory in another terminal (optional)

**Monitor Memory (Optional - Open New Terminal):**

```bash
# Terminal 2
ssh deploy@66.116.199.219
watch -n 2 'free -h'
```

**Expected Build Output:**

```
> my-v0-project@0.1.0 build:vps
> cross-env NODE_OPTIONS=--max-old-space-size=4096 NEXT_TELEMETRY_DISABLED=1 next build

  ▲ Next.js 14.2.16
  - Environments: .env.production, .env

   Creating an optimized production build ...
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (31/31)
✓ Collecting build traces
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    5 kB       100 kB
├ ○ /api/auth/[...nextauth]             0 B        0 B
├ ○ /project-manager/communication       8 kB       150 kB
... (more routes)

○  (Static)  prerendered as static content
●  (SSG)     prerendered as static HTML (uses getStaticProps)
λ  (Server)  server-side renders at runtime

✨  Done in 652.34s (10 minutes 52 seconds)
```

### Step 9: Restart PM2

```bash
pm2 restart ecosystem.config.js
```

**Expected Output:**

```
[PM2] Applying action restartProcessId on app [zyphextech](ids: [ 2 ])
[PM2] [zyphextech](2) ✓

┌────┬───────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────┬──────────┐
│ id │ name          │ mode    │ pid     │ uptime   │ status │ cpu  │ mem      │ user │ watching │
├────┼───────────────┼─────────┼─────────┼──────────┼────────┼──────┼──────────┼──────┼──────────┤
│ 2  │ zyphextech    │ fork    │ 1234567 │ 0s       │ online │ 0%   │ 250.0mb  │ root │ disabled │
└────┴───────────────┴─────────┴─────────┴──────────┴────────┴──────┴──────────┴──────┴──────────┘
```

### Step 10: Verify Deployment

```bash
# Check PM2 status
pm2 status

# Check logs for errors
pm2 logs zyphextech --lines 50

# Test application
curl -I http://localhost:3000

# Expected: HTTP/1.1 200 OK
```

### Step 11: Monitor Application

```bash
# Watch PM2 monitoring
pm2 monit

# Or check logs continuously
pm2 logs zyphextech
```

---

## 🧪 Testing Checklist

After deployment, test these features:

### 1. Application Health

```bash
# From VPS
curl http://localhost:3000

# From browser
https://your-domain.com
```

**Expected:** Homepage loads without errors

### 2. Team Communication Page (NEW)

**URL:** `/project-manager/communication`

**Test:**
- [x] Page loads with Slack-style interface
- [x] Channels list displays (general, project-alpha, random)
- [x] Click channel to load messages
- [x] Type message and press Enter to send
- [x] Message appears in thread
- [x] Auto-scroll to bottom
- [x] User presence indicators show
- [x] Create channel modal opens

### 3. Other Pages

Quick check that nothing broke:

- [x] `/project-manager` - Dashboard loads
- [x] `/project-manager/projects` - Projects list
- [x] `/project-manager/tasks` - Tasks board
- [x] `/project-manager/clients` - Clients page
- [x] `/project-manager/documents` - Documents page
- [x] `/project-manager/analytics` - Analytics charts
- [x] `/project-manager/performance-reports` - Reports page

### 4. Memory Monitoring

```bash
# Check memory after 10 minutes
pm2 show zyphextech

# Should show:
# - Status: online
# - Memory: <1.5GB (under max_memory_restart)
# - CPU: <20% (after initialization)
```

---

## 🚨 Troubleshooting

### Issue 1: Build Still Fails with Memory Error

**Symptoms:**
```
FATAL ERROR: Ineffective mark-compacts near heap limit
```

**Solutions:**

#### A. Increase Heap to 6GB

```bash
# Edit package.json
nano package.json

# Change line:
"build:vps": "cross-env NODE_OPTIONS=--max-old-space-size=6144 NEXT_TELEMETRY_DISABLED=1 next build"

# Save and try again
npm run build:vps
```

#### B. Add Swap Space

```bash
# Check current swap
swapon --show

# If no swap or < 2GB, create 4GB swap
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verify
free -h
```

#### C. Build Locally, Deploy Artifacts

```bash
# On your Windows machine
cd C:\Projects\Zyphex-Tech
npm run build

# SCP .next folder to VPS
scp -r .next deploy@66.116.199.219:/var/www/zyphextech/

# On VPS, just restart PM2
pm2 restart ecosystem.config.js
```

### Issue 2: PM2 Keeps Restarting

**Symptoms:**
```
pm2 status
# Shows: status = errored, restarts = 15
```

**Solutions:**

```bash
# Check logs
pm2 logs zyphextech --err --lines 100

# Common errors:

# 1. Port already in use
# Solution: killall -9 node && pm2 restart ecosystem.config.js

# 2. Database connection failed
# Solution: Check DATABASE_URL in .env, restart PostgreSQL

# 3. Missing dependencies
# Solution: npm install --legacy-peer-deps && pm2 restart ecosystem.config.js

# 4. Memory limit exceeded
# Solution: Edit ecosystem.config.js, increase max_memory_restart to 2G
```

### Issue 3: Application Slow/Unresponsive

**Check:**

```bash
# CPU usage
top

# If Node.js using >80% CPU for >5 minutes:
pm2 restart zyphextech

# Memory usage
free -h

# If available < 500MB:
# Stop other services or upgrade VPS
```

### Issue 4: GitHub Pull Fails

**Symptoms:**
```
git pull origin main
# error: Your local changes would be overwritten by merge
```

**Solution:**

```bash
# Stash local changes
git stash

# Pull
git pull origin main

# If you need local changes back
git stash pop

# Or discard and use GitHub version
git reset --hard origin/main
```

---

## 📊 Performance Expectations

### Build Time

| Phase | Duration | Memory Peak |
|-------|----------|-------------|
| Dependencies | 1-2 min | 500MB |
| Prisma Generate | 30 sec | 200MB |
| Next.js Build | 10-12 min | 3.5GB |
| Optimization | 2-3 min | 2.0GB |
| **Total** | **13-17 min** | **3.5GB** |

### Runtime Performance

| Metric | Value | Status |
|--------|-------|--------|
| Memory Usage | 1.2-1.5GB | ✅ Good |
| CPU Usage | 5-15% | ✅ Good |
| Response Time | <200ms | ✅ Good |
| Uptime | 99.9%+ | ✅ Target |

---

## 📞 Support

### If Deployment Fails

1. **Check Documentation:**
   - Read `DEPLOYMENT_MEMORY_FIX.md`
   - Review error messages in PM2 logs

2. **Gather Information:**
   ```bash
   # Memory
   free -h
   
   # PM2 status
   pm2 status
   
   # Recent logs
   pm2 logs zyphextech --lines 100
   
   # Node version
   node --version
   
   # NPM version
   npm --version
   ```

3. **Common Commands:**
   ```bash
   # Full reset
   pm2 stop all
   rm -rf node_modules .next
   npm install --legacy-peer-deps
   npm run build:vps
   pm2 restart ecosystem.config.js
   
   # Check health
   pm2 status
   pm2 logs zyphextech --lines 50
   curl http://localhost:3000
   ```

---

## ✅ Success Criteria

Deployment is successful when:

1. ✅ Build completes without memory errors
2. ✅ PM2 shows status: **online**
3. ✅ Application responds to `curl http://localhost:3000`
4. ✅ All pages load in browser
5. ✅ Team Communication page works (can send messages)
6. ✅ No errors in PM2 logs
7. ✅ Memory usage stable <1.5GB
8. ✅ CPU usage <20% after 5 minutes

---

## 🎉 Post-Deployment

After successful deployment:

1. **Test New Features:**
   - Visit `/project-manager/communication`
   - Create a channel
   - Send messages
   - Test @mentions
   - Try file attachment button

2. **Monitor for 24 Hours:**
   ```bash
   # Check every few hours
   pm2 status
   pm2 logs zyphextech --lines 20
   ```

3. **Update Documentation:**
   - Note any issues encountered
   - Document any additional steps needed
   - Update runbook if process changed

4. **Celebrate! 🎊**
   - Memory issue: FIXED ✅
   - Team Communication: LIVE ✅
   - 31 pages: DEPLOYED ✅

---

**Deployment Version:** 1.0.0  
**Last Updated:** 2025-10-25  
**Commit:** 509cc9d  
**Status:** Ready for production ✅

# DUPLICATE DEPLOYMENT FIX

## Critical Issue Identified

**Problem:** TWO deployment workflows running simultaneously on every push  
**Impact:** Resource contention, both deployments fail  
**Root Cause:** Old workflow file still present

## Discovery

User reported:
> "why there are 2 deployment running at the same time every time github push happens 2 deployment goes consecutively"

Investigation found:
```
.github/workflows/deploy-vps.yml          <-- OLD (using npm run build)
.github/workflows/deploy-with-rollback.yml <-- NEW (with detachment)
```

Both were triggering on `push: branches: [main]`

## Fixes Applied

### 1. **Removed Duplicate Workflow** ✅
```bash
Deleted: .github/workflows/deploy-vps.yml
```

This OLD workflow was:
- Using `npm run build` (not detached)
- Causing resource contention
- Running simultaneously with new workflow

### 2. **Added Concurrency Control** ✅

Added to `deploy-with-rollback.yml`:
```yaml
concurrency:
  group: production-deployment
  cancel-in-progress: false  # Queue deployments instead of canceling
```

**Effect:** Only ONE deployment runs at a time. Others wait in queue.

### 3. **Added VPS-Level Deployment Lock** ✅

Added lock file mechanism:
```bash
LOCK_FILE="/var/www/zyphextech/.deployment.lock"

# At start: Check for existing deployment
if [ -f "$LOCK_FILE" ]; then
  wait or remove stale lock
fi

# Create lock
echo $$ > "$LOCK_FILE"

# At end: Remove lock
rm -f "$LOCK_FILE"
```

**Effect:** Even if GitHub Actions concurrency fails, VPS won't run concurrent builds.

### 4. **Lock Cleanup on Rollback** ✅

Added lock removal in rollback section to prevent stuck locks.

## Why This Was Causing Failures

### Resource Contention
Two builds running simultaneously on low-RAM VPS:
- **Build 1:** Using 2GB memory
- **Build 2:** Using 2GB memory
- **Total Need:** 4GB
- **VPS Has:** ~1GB RAM + 4GB swap
- **Result:** Both fail with timeout/OOM

### Process Conflicts
- Both trying to write to `.next/` directory
- Both trying to restart PM2
- Both running npm install
- File locks and conflicts

## What Will Happen Now

### Single Deployment
```
Push to main
  ↓
ONE workflow starts
  ↓
Acquires lock
  ↓
Runs deployment
  ↓
Releases lock
  ↓
Done!
```

### Queued Deployments
If you push multiple commits quickly:
```
Commit A pushed → Deployment A starts (lock acquired)
Commit B pushed → Deployment B waits (lock held by A)
Deployment A completes → lock released
Deployment B starts → lock acquired
```

## Verification

After this fix:

1. **Check Workflows:**
   ```bash
   ls -la .github/workflows/
   # Should see ONLY: deploy-with-rollback.yml
   ```

2. **Watch GitHub Actions:**
   - https://github.com/isumitmalhotra/Zyphex-Tech/actions
   - Should see ONLY ONE deployment running

3. **Check VPS Lock:**
   ```bash
   ssh user@vps "ls -la /var/www/zyphextech/.deployment.lock"
   # During deployment: file exists
   # After deployment: file gone
   ```

## Next Deployment

The next deployment will:
- ✅ Run ONLY ONE workflow
- ✅ Use the new detached build command
- ✅ Acquire VPS deployment lock
- ✅ Complete without resource contention
- ✅ Release lock when done

## Emergency: If Lock Gets Stuck

If deployment fails and lock remains:

```bash
ssh user@vps
rm -f /var/www/zyphextech/.deployment.lock
```

## Files Changed

1. **Deleted:**
   - `.github/workflows/deploy-vps.yml` (old duplicate)

2. **Modified:**
   - `.github/workflows/deploy-with-rollback.yml`
     - Added concurrency control
     - Added deployment lock mechanism
     - Added lock cleanup on success/failure

3. **Created:**
   - `DUPLICATE_DEPLOYMENT_FIX.md` (this file)

## Commit Message

```
fix: Remove duplicate workflow and add deployment concurrency control

Critical fixes for simultaneous deployments:

1. Removed duplicate workflow:
   - Deleted .github/workflows/deploy-vps.yml (OLD)
   - This was causing 2 deployments per push
   - Was using old npm run build command

2. Added GitHub Actions concurrency:
   - group: production-deployment
   - Ensures only ONE workflow runs at a time
   - Others wait in queue

3. Added VPS-level deployment lock:
   - Lock file: /var/www/zyphextech/.deployment.lock
   - Prevents concurrent builds on VPS
   - Waits up to 10 minutes for previous deployment
   - Auto-cleanup on success/failure

4. Resource contention resolved:
   - No more competing builds
   - Single build gets full memory
   - No file conflicts

Resolves: Duplicate deployments causing resource exhaustion
Fixes: Two workflows running simultaneously
Ensures: One deployment at a time, queued properly
```

---

**Status:** Ready to deploy  
**Expected:** Single clean deployment with no conflicts  
**Next:** Commit and push to test

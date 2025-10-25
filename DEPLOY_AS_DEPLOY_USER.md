# VPS Deployment - Correct Method (Deploy User)

**Critical Issue**: Files must be owned by `deploy` user, not `root`  
**Status**: ✅ Fixed  
**Date**: October 25, 2025

---

## 🔴 The Problem

### What Was Going Wrong:

1. **Running commands as root** instead of deploy user
2. **Files owned by root** → npm install fails with EACCES
3. **CI/CD uses deploy user** but local SSH was using root
4. **Permission mismatches** cause deployment failures

### Error You Were Seeing:

```
npm error code EACCES
npm error syscall open
npm error path /var/www/zyphextech/package-lock.json
npm error errno -13
npm error Error: EACCES: permission denied, open '/var/www/zyphextech/package-lock.json'
```

---

## ✅ The Solution

### Always Use Deploy User for Deployments

**CORRECT Way:**
```bash
# Option 1: SSH as deploy directly (if you have deploy password)
ssh deploy@66.116.199.219

# Option 2: SSH as root, then switch to deploy
ssh root@66.116.199.219
su - deploy
cd /var/www/zyphextech
```

**WRONG Way (causes permission issues):**
```bash
# ❌ Don't do this - runs as root
ssh root@66.116.199.219 "cd /var/www/zyphextech && npm install"
```

---

## 📋 Step-by-Step Manual Deployment

### Method 1: Interactive SSH (Recommended)

```bash
# 1. SSH to VPS as root
ssh root@66.116.199.219

# 2. Switch to deploy user
su - deploy

# 3. Navigate to project
cd /var/www/zyphextech

# 4. Stash local changes
git stash

# 5. Pull latest code
git pull origin main

# 6. Install dependencies
npm install --legacy-peer-deps

# 7. Generate Prisma Client
npx prisma generate

# 8. Run migrations
npx prisma migrate deploy

# 9. Stop PM2 (free memory for build)
pm2 stop zyphextech

# 10. Build with 4GB heap
NODE_OPTIONS='--max-old-space-size=4096' npm run build

# 11. Restart application
pm2 restart zyphextech

# 12. Check status
pm2 status
pm2 logs zyphextech --lines 20
```

### Method 2: Automated Script

I've created `manual-deploy.sh` that does everything above automatically.

**Upload and run:**
```bash
# From your local machine, push the script
git add manual-deploy.sh
git commit -m "Add manual deployment script"
git push origin main

# On VPS as deploy user
ssh root@66.116.199.219
su - deploy
cd /var/www/zyphextech
git pull origin main
chmod +x manual-deploy.sh
./manual-deploy.sh
```

**Or run directly:**
```bash
# From your local machine
ssh root@66.116.199.219 "su - deploy -c 'cd /var/www/zyphextech && git pull origin main && chmod +x manual-deploy.sh && ./manual-deploy.sh'"
```

---

## 🔧 Fix Current Permission Issues

### If Files Are Owned by Root:

```bash
# As root user
ssh root@66.116.199.219

# Fix ownership
chown -R deploy:deploy /var/www/zyphextech

# Verify
ls -la /var/www/zyphextech | head -20

# Expected: All files should show "deploy deploy"
```

### Remove Root-Owned Build Artifacts:

```bash
# As root
ssh root@66.116.199.219

# Switch to deploy
su - deploy
cd /var/www/zyphextech

# Clean up
rm -rf .next node_modules/.cache

# Now rebuild as deploy user
npm install --legacy-peer-deps
npm run build:vps
```

---

## 🤖 Fixed CI/CD Workflow

### What I Changed:

```yaml
# .github/workflows/deploy-simple.yml

# Before:
npm install --prefer-offline --no-audit --legacy-peer-deps || npm install

# After:
echo "👤 Current user: $(whoami)"
echo "📁 Directory ownership: $(ls -ld /var/www/zyphextech)"

# Fix permissions if needed
if [ "$(stat -c '%U' .)" != "deploy" ]; then
  echo "⚠️  Directory not owned by deploy user, fixing..."
  sudo chown -R deploy:deploy /var/www/zyphextech
fi

npm install --prefer-offline --no-audit --legacy-peer-deps
```

### Key Improvements:

1. ✅ **User verification** - Check who's running the commands
2. ✅ **Ownership check** - Verify deploy user owns files
3. ✅ **Auto-fix** - Automatically fix permissions if needed
4. ✅ **Proper flags** - Use --legacy-peer-deps consistently

---

## 📊 User Comparison

### Root User (DON'T USE):

| Action | Result |
|--------|--------|
| npm install | ❌ Creates files owned by root |
| git pull | ⚠️ Works but causes issues later |
| npm run build | ❌ Creates .next owned by root |
| pm2 restart | ⚠️ Works but app can't write logs |

**Problem**: Next time deploy user tries to run commands → **Permission denied**

### Deploy User (CORRECT):

| Action | Result |
|--------|--------|
| npm install | ✅ Creates files owned by deploy |
| git pull | ✅ Works correctly |
| npm run build | ✅ Creates .next owned by deploy |
| pm2 restart | ✅ App can write logs |

**Benefit**: All operations work correctly, no permission issues

---

## 🚀 Complete This Deployment Now

### Quick Fix (Right Now):

```bash
# 1. Open PuTTY or terminal
ssh root@66.116.199.219

# 2. Switch to deploy
su - deploy

# 3. Complete the build
cd /var/www/zyphextech
NODE_OPTIONS='--max-old-space-size=4096' npm run build

# 4. Restart
pm2 restart zyphextech

# 5. Verify
pm2 status
curl -I http://localhost:3000
```

**Expected output:**
```
✅ Build completes in ~11 minutes
✅ PM2 shows "online" status
✅ curl returns HTTP/1.1 200 OK
```

---

## 📝 CI/CD Configuration

### GitHub Secrets (Must Be Set):

Go to: `https://github.com/isumitmalhotra/Zyphex-Tech/settings/secrets/actions`

Required secrets:
- `VPS_HOST` = `66.116.199.219`
- `VPS_USER` = `deploy` ← **MUST BE deploy, not root**
- `VPS_PORT` = `22`
- `VPS_SSH_PRIVATE_KEY` = Private SSH key for deploy user

### How CI/CD Works:

```
GitHub Actions → SSH as deploy user → Run commands as deploy
```

**NOT:**
```
GitHub Actions → SSH as root → su deploy → Run commands
```

The CI/CD connects directly as the deploy user using SSH keys.

---

## 🔍 Verify Deploy User Setup

### Check SSH Key Access:

```bash
# From your local machine
ssh deploy@66.116.199.219 "whoami"
# Should output: deploy
```

If this fails with "Permission denied", you need to:

1. **Generate SSH key for deploy user** (if not exists)
2. **Add public key to** `~/.ssh/authorized_keys` (deploy user)
3. **Update GitHub secret** `VPS_SSH_PRIVATE_KEY` with deploy user's private key

### Check Deploy User Permissions:

```bash
ssh deploy@66.116.199.219 "ls -la /var/www/zyphextech | head -5"
```

**Expected:**
```
drwxr-xr-x 26 deploy deploy 12288 Oct 25 01:58 .
```

**If you see:**
```
drwxr-xr-x 26 root root 12288 Oct 25 01:58 .
```

**Fix it:**
```bash
ssh root@66.116.199.219 "chown -R deploy:deploy /var/www/zyphextech"
```

---

## ✅ Final Checklist

Before next deployment:

- [ ] All files in `/var/www/zyphextech` owned by `deploy:deploy`
- [ ] Can SSH as deploy user (test: `ssh deploy@66.116.199.219`)
- [ ] GitHub secret `VPS_USER` is set to `deploy`
- [ ] GitHub secret `VPS_SSH_PRIVATE_KEY` is deploy user's private key
- [ ] CI/CD workflow updated (pushed to GitHub)
- [ ] Manual deployment completed successfully
- [ ] Website accessible at https://www.zyphextech.com

---

## 📞 Quick Reference

### Fix Permissions:
```bash
ssh root@66.116.199.219 "chown -R deploy:deploy /var/www/zyphextech"
```

### Deploy as Deploy User:
```bash
ssh root@66.116.199.219
su - deploy
cd /var/www/zyphextech
npm run build:vps
pm2 restart zyphextech
```

### Check Who Owns Files:
```bash
ssh root@66.116.199.219 "ls -la /var/www/zyphextech | head -20"
```

### View PM2 Logs:
```bash
ssh deploy@66.116.199.219 "pm2 logs zyphextech --lines 50"
```

---

## 🎯 Summary

### The Golden Rule:

> **Always deploy as the `deploy` user, never as `root`**

### Why:

1. ✅ Proper file permissions
2. ✅ No EACCES errors
3. ✅ CI/CD works correctly
4. ✅ Security best practice
5. ✅ Consistent environment

### Next Steps:

1. ✅ Fix current deployment (complete the build as deploy user)
2. ✅ Verify CI/CD workflow is updated (already pushed)
3. ✅ Test next push triggers successful auto-deployment
4. ✅ Never run deployment commands as root again

---

**Status**: Ready to complete deployment as deploy user  
**Action**: Run the commands in "Complete This Deployment Now" section  
**Expected**: Site will be live in ~11 minutes ✅

# CI/CD Deployment - Quick Reference

## ✅ Production Server Cleaned & Ready

### What Was Done
1. ✅ Removed all failed build artifacts (`.next`, `build.log`, `build-full.log`)
2. ✅ Git repository in clean state (no uncommitted changes)
3. ✅ Latest code pulled (commit d2a4f6c)
4. ✅ Critical fix applied: Status filter now uses `'PUBLISHED'` (uppercase)

---

## 🚀 GitHub Actions Will Now Execute

### Automatic Steps (No Manual Action Needed)
The workflow will:

1. **Clean Environment** → Remove old `.next` and `node_modules/.cache`
2. **Install Dependencies** → `npm install --legacy-peer-deps`
3. **Generate Prisma Client** → `npx prisma generate`
4. **Run Migrations** → `npx prisma migrate deploy`
5. **Stop PM2** → Free up memory for build
6. **Build Application** → `npm run build` (with 3GB memory)
7. **Start PM2** → `pm2 start ecosystem.config.js`
8. **Health Check** → Verify app is running

---

## 📊 Monitor Deployment

### GitHub Actions
- **Workflow**: "Deploy to VPS - Simple & Working"
- **URL**: https://github.com/isumitmalhotra/Zyphex-Tech/actions
- **Branch**: main
- **Trigger**: Automatic (on push to main)

### Expected Timeline
- **Total Duration**: 5-10 minutes
- **Build Step**: 3-5 minutes (most time-consuming)
- **Health Check**: 15 seconds
- **Status**: Will show ✅ or ❌ in GitHub Actions tab

---

## ✅ Success Indicators

### In GitHub Actions Log:
```
✅ Build completed!
🔄 Restarting application...
✅ Application is healthy!
🎉 Deployment successful!
🌐 https://www.zyphextech.com
```

### On Production Server:
```bash
# PM2 Status
pm2 status
# Should show: status = "online"

# Build Exists
ls -la /var/www/zyphextech/.next/BUILD_ID
# Should exist with recent timestamp
```

---

## 🧪 Post-Deployment Testing

Once GitHub Actions shows ✅ SUCCESS:

### 1. SSH into Server & Verify
```bash
ssh deploy@66.116.199.219

# Check PM2 status
pm2 status

# Test APIs
curl http://localhost:3000/api/content?type=team_member | jq '.items | length'
# Should return: 6

curl http://localhost:3000/api/services | jq '.data | length'
# Should return: 6

curl http://localhost:3000/api/content?type=blog | jq '.items | length'
# Should return: 6
```

### 2. Test Live Website
- **Team Members**: https://zyphextech.com/about
  - Scroll to "Meet Our Leadership Team"
  - Should see 6 team member cards with colorful avatar images

- **Services**: https://zyphextech.com/services
  - Should see 6 service cards with professional images

- **Blog Posts**: https://zyphextech.com/updates
  - Should see blog articles with featured images

### 3. Browser DevTools Check
- Open F12 (DevTools)
- Go to Console tab
- Navigate to each page above
- **Verify**: NO 404 errors for images
- **Verify**: Images load from `images.unsplash.com` and `ui-avatars.com`

---

## 🐛 If Deployment Fails

### Check GitHub Actions Log
1. Go to https://github.com/isumitmalhotra/Zyphex-Tech/actions
2. Click on the latest "Deploy to VPS" workflow run
3. Expand the failed step
4. Look for error message

### Common Failures & Solutions

**Error: "npm install failed"**
- Already handled in workflow with `--legacy-peer-deps`
- Should auto-retry

**Error: "Build failed" or "Build timeout"**
- Workflow stops PM2 to free memory
- Uses 3GB heap size
- If still fails: Server needs memory upgrade

**Error: "Health check timeout"**
- App may still be starting
- SSH in and check: `pm2 logs zyphextech`
- May need to increase health check timeout

**Error: "Permission denied"**
- Workflow includes permission fix
- May need manual intervention: `sudo chown -R deploy:deploy /var/www/zyphextech`

---

## 📞 Manual Intervention (If Needed)

If CI/CD fails and you need to deploy manually:

```bash
# SSH into server
ssh deploy@66.116.199.219

# Navigate to project
cd /var/www/zyphextech

# Clean slate
rm -rf .next node_modules/.cache

# Fresh install
npm install --legacy-peer-deps

# Generate Prisma
npx prisma generate

# Build (may take 5+ minutes)
npm run build

# Restart PM2
pm2 restart zyphextech

# Verify
pm2 logs zyphextech --lines 20
```

---

## 🎯 Expected Final Result

### Database
- ✅ 6 Blog Posts with Unsplash CDN URLs
- ✅ 6 Team Members with UI Avatars CDN URLs
- ✅ 6 Services with Unsplash CDN URLs
- ✅ All items have `status = 'PUBLISHED'`

### APIs
- ✅ `/api/content?type=blog` → Returns 6 items
- ✅ `/api/content?type=team_member` → Returns 6 items (FIXED!)
- ✅ `/api/services` → Returns 6 items

### Website
- ✅ https://zyphextech.com/about → Team photos visible
- ✅ https://zyphextech.com/services → Service images visible
- ✅ https://zyphextech.com/updates → Blog images visible
- ✅ NO 404 errors in browser console

---

**Status**: Ready for CI/CD Deployment ✅  
**Action**: GitHub Actions will auto-deploy on push to main  
**Monitoring**: https://github.com/isumitmalhotra/Zyphex-Tech/actions


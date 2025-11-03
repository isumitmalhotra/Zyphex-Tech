# 🎯 QUICK START - Fix Images on Live Website

## The Problem
- ❌ Blog posts not showing images on https://zyphextech.com/updates
- ❌ Team members not showing photos on https://zyphextech.com/about

## The Solution (Already Done Locally ✅)
Updated image URLs from local paths to CDN URLs in database.

## Deploy to Production (3 Simple Steps)

### Option A: Automatic Deployment (Recommended)
```powershell
.\deploy-image-fix.ps1
```
This script does everything automatically!

### Option B: Manual Deployment

#### Step 1: Push Code Changes
```bash
git add .
git commit -m "fix: Update image URLs to use CDN"
git push origin cms-consolidation
```

#### Step 2: Deploy & Update Database
```bash
# SSH to production
ssh deploy@66.116.199.219

# Run these commands
cd /var/www/zyphextech
git pull origin cms-consolidation
npm install
pm2 restart all

# Update database with new image URLs (IMPORTANT!)
npx tsx scripts/reset-and-reseed-content.ts
npx tsx scripts/seed-blog-posts.ts
npx tsx scripts/seed-team-members.ts
```

#### Step 3: Verify
Visit:
- https://zyphextech.com/updates ✅ Should show 6 blog posts with images
- https://zyphextech.com/about ✅ Should show 6 team members with photos

## What Changed?

### Before
```typescript
imageUrl: '/images/blog/ai-development.jpg'  // ❌ Local file (doesn't exist)
```

### After
```typescript
imageUrl: 'https://images.unsplash.com/photo-...'  // ✅ CDN URL (always works)
```

## Files Modified
- ✅ `scripts/seed-blog-posts.ts` - Blog images now use Unsplash CDN
- ✅ `scripts/seed-team-members.ts` - Team photos now use UI Avatars CDN
- ✅ Created helper scripts for deployment and verification

## Need Help?

### Quick Checks
1. **Database not updated?** 
   - Run seed scripts on production server (see Step 2 above)

2. **Still no images?**
   - Check browser console for errors
   - Verify CDN domains in `next.config.mjs`

3. **Images on local but not production?**
   - Make sure you ran seed scripts on production database!

### Detailed Documentation
- 📖 `IMAGE_FIX_COMPLETE.md` - Full summary
- 📖 `IMAGE_FIX_DEPLOYMENT_GUIDE.md` - Detailed deployment guide
- 📖 `IMAGE_FIX_SOLUTION.md` - Technical details

---

**TL;DR**: Run `.\deploy-image-fix.ps1` and you're done! 🎉

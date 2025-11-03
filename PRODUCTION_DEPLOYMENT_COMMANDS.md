# 🚀 PRODUCTION DEPLOYMENT - COMPLETE COMMAND GUIDE

## 📋 PRE-DEPLOYMENT CHECKLIST

Before you start, verify:
- [x] All changes tested locally
- [x] Blog images verified (6 posts with CDN URLs)
- [x] Team member photos verified (6 members with CDN URLs)
- [x] Database seeded locally
- [x] No errors in local environment

---

## PART 1: PUSH CHANGES TO GIT

### Step 1: Check What Changed
```bash
# See all modified files
git status

# See the actual changes
git diff
```

### Step 2: Stage All Changes
```powershell
# Add all modified files
git add .

# OR add specific files only
git add scripts/seed-blog-posts.ts
git add scripts/seed-team-members.ts
git add scripts/reset-and-reseed-content.ts
git add scripts/verify-content-images.ts
```

### Step 3: Commit Changes
```powershell
# Commit with descriptive message
git commit -m "fix: Update image URLs to use CDN for blog posts and team members

- Updated blog post images to use Unsplash CDN
- Updated team member photos to use UI Avatars CDN
- Added reset and verification scripts
- All images now load from CDN (production-ready)
"
```

### Step 4: Push to GitHub
```powershell
# Push to current branch (cms-consolidation)
git push origin cms-consolidation

# If you want to merge to main first:
# git checkout main
# git merge cms-consolidation
# git push origin main
```

**Expected Output:**
```
Enumerating objects: 12, done.
Counting objects: 100% (12/12), done.
Delta compression using up to 8 threads
Compressing objects: 100% (7/7), done.
Writing objects: 100% (7/7), 3.45 KiB | 3.45 MiB/s, done.
Total 7 (delta 5), reused 0 (delta 0), pack-reused 0
To github.com:isumitmalhotra/Zyphex-Tech.git
   abc1234..def5678  cms-consolidation -> cms-consolidation
```

---

## PART 2: AUTOMATIC DEPLOYMENT VIA CI/CD

Your GitHub Actions workflow will **automatically deploy** when you push to `main` branch.

### Check Deployment Status
1. Go to: https://github.com/isumitmalhotra/Zyphex-Tech/actions
2. Look for the latest "Deploy to VPS - Simple & Working" workflow
3. Wait for it to complete (usually 10-15 minutes)

**Workflow Steps:**
- ✅ Checkout code
- ✅ Setup SSH
- ✅ Pull latest code on VPS
- ✅ Install dependencies
- ✅ Generate Prisma Client
- ✅ Run migrations
- ✅ Build application
- ✅ Restart PM2

**IMPORTANT:** The CI/CD only deploys code, it does NOT seed the database!

---

## PART 3: SEED PRODUCTION DATABASE

After successful deployment, you MUST seed the database on production.

### Option A: SSH into Production Server

```powershell
# Connect to VPS (adjust IP if different)
ssh deploy@66.116.199.219

# Or if using different port:
# ssh -p 22 deploy@66.116.199.219
```

**Once connected, run these commands:**

```bash
# Navigate to project directory
cd /var/www/zyphextech

# Verify you're in the right place
pwd
# Should show: /var/www/zyphextech

# Check current branch
git branch
# Should be on 'main' or 'cms-consolidation'

# IMPORTANT: Pull latest changes (if CI/CD didn't run)
git pull origin main

# Install dependencies (if needed)
npm install

# Generate Prisma Client (if needed)
npx prisma generate
```

### Step 3.1: Verify Current Database Content

```bash
# Check current blog posts and team members
npx tsx scripts/verify-content-images.ts
```

**Expected Output:**
```
🔍 Verifying content and image URLs...

📝 BLOG POSTS:
Found 6 blog posts:
1. The Future of AI... (might have OLD image URLs)
...

👥 TEAM MEMBERS:
Found 6 team members:
1. Sumit Malhotra (might have OLD image URLs)
...
```

### Step 3.2: Reset and Reseed Database

```bash
# STEP 1: Delete old content with broken image URLs
npx tsx scripts/reset-and-reseed-content.ts
```

**Expected Output:**
```
🔄 Resetting and reseeding content with updated image URLs...

🗑️  Deleting existing blog posts...
✅ Deleted 6 blog posts

🗑️  Deleting existing team members...
✅ Deleted 6 team members

🎉 Reset completed!
```

```bash
# STEP 2: Seed blog posts with Unsplash CDN URLs
npx tsx scripts/seed-blog-posts.ts
```

**Expected Output:**
```
📝 Seeding blog posts...

✅ Created blog post: The Future of AI in Software Development
✅ Created blog post: Building Scalable Microservices Architecture
✅ Created blog post: Cybersecurity Best Practices for Modern Applications
✅ Created blog post: Cloud Migration Strategies for Enterprise
✅ Created blog post: DevOps Culture: Beyond the Tools
✅ Created blog post: Mobile-First Design Principles

🎉 Blog posts seeding completed successfully!

📊 Total blog posts: 6 (3 featured)
```

```bash
# STEP 3: Seed team members with UI Avatars CDN URLs
npx tsx scripts/seed-team-members.ts
```

**Expected Output:**
```
👥 Seeding team members...

✅ Created team member: Sumit Malhotra - Founder & CEO
✅ Created team member: Priya Sharma - Chief Technology Officer
✅ Created team member: Rahul Verma - Lead Full-Stack Developer
✅ Created team member: Ananya Patel - Senior UX/UI Designer
✅ Created team member: Vikram Singh - Senior DevOps Engineer
✅ Created team member: Neha Kapoor - Project Manager

🎉 Team members seeding completed successfully!

📊 Total team members: 6 (4 featured)
```

### Step 3.3: Verify Database Updated Correctly

```bash
# Verify all content has CDN URLs now
npx tsx scripts/verify-content-images.ts
```

**Expected Output:**
```
🔍 Verifying content and image URLs...

📝 BLOG POSTS:
Found 6 blog posts:

1. The Future of AI in Software Development
   Image: https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600...
   ✅ CDN URL

2. Building Scalable Microservices Architecture
   Image: https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=600...
   ✅ CDN URL

...

👥 TEAM MEMBERS:
Found 6 team members:

1. Sumit Malhotra
   Image: https://ui-avatars.com/api/?name=Sumit+Malhotra&size=400...
   ✅ CDN URL

...

✅ VERIFICATION SUMMARY:
Blog Posts: 6
Team Members: 6

🎉 All content verified successfully!
✅ Ready for production deployment
```

### Step 3.4: Restart Application (if needed)

```bash
# Check PM2 status
pm2 status

# Restart application to ensure changes are loaded
pm2 restart zyphextech

# OR restart all PM2 processes
pm2 restart all

# Save PM2 configuration
pm2 save

# Check logs for any errors
pm2 logs zyphextech --lines 50
```

---

## PART 4: VERIFY PRODUCTION WEBSITE

### Test in Browser

1. **Visit Updates Page:**
   - URL: https://zyphextech.com/updates
   - Expected: 6 blog posts with images from Unsplash
   - Check: All images load without 404 errors

2. **Visit About Page:**
   - URL: https://zyphextech.com/about
   - Expected: 6 team members with colorful avatars
   - Check: All photos load correctly

3. **Open Browser DevTools (F12):**
   - **Console Tab:** Should have NO errors related to images
   - **Network Tab:** All image requests should return 200 OK
   - Filter by "Img" to see only image requests

### Test API Endpoints

```bash
# From your local machine or production server

# Test blog posts API
curl https://zyphextech.com/api/content?type=blog | jq

# Test team members API
curl https://zyphextech.com/api/content?type=team_member | jq

# Should return JSON with 6 items each, with CDN image URLs
```

### Mobile Testing

1. Open site on mobile device
2. Check /updates and /about pages
3. Verify images load on 4G/5G connection
4. Check image quality and loading speed

---

## PART 5: SEED OTHER CONTENT (OPTIONAL)

If you have other content types to seed:

```bash
# Seed services (if you have this)
npx tsx scripts/seed-services.ts

# Seed portfolio items (if you have this)
npx tsx scripts/seed-portfolio-content.ts

# Seed testimonials (if you have this)
npx tsx scripts/seed-testimonials.ts

# Seed all CMS pages (if you have this)
npx tsx scripts/seed-cms-pages.ts
```

---

## 🔧 TROUBLESHOOTING

### Problem: Images Still Not Loading

**Solution 1: Clear Next.js Cache**
```bash
cd /var/www/zyphextech
rm -rf .next
npm run build
pm2 restart zyphextech
```

**Solution 2: Check Image Domains in next.config.mjs**
```bash
cat next.config.mjs | grep -A 20 "domains:"
```
Should include:
- `images.unsplash.com`
- `ui-avatars.com`

**Solution 3: Check Database Directly**
```bash
npx prisma studio
```
- Open browser to http://localhost:5555
- Check `DynamicContentItem` table
- Verify `data` field has CDN URLs

### Problem: Seed Scripts Fail

**Check Database Connection:**
```bash
# Test database connection
npx prisma db pull

# If connection fails, check .env file
cat .env | grep DATABASE_URL
```

**Check Node Version:**
```bash
node --version  # Should be v18 or higher
npm --version
```

**Install tsx if missing:**
```bash
npm install -D tsx
```

### Problem: Content Not Showing on Website

**Check API Response:**
```bash
# On production server
curl http://localhost:3000/api/content?type=blog

# Should return JSON with 6 blog posts
```

**Check Content Type Exists:**
```bash
npx prisma studio
# Navigate to ContentType table
# Verify 'blog' and 'team_member' exist
```

**Check Logs:**
```bash
pm2 logs zyphextech --lines 100
# Look for any errors
```

---

## 📊 QUICK REFERENCE

### Complete Command Sequence

```bash
# ===== ON YOUR LOCAL MACHINE =====
git add .
git commit -m "fix: Update image URLs to use CDN"
git push origin main

# Wait for GitHub Actions to complete deployment

# ===== ON PRODUCTION SERVER (SSH) =====
ssh deploy@66.116.199.219

cd /var/www/zyphextech

# Verify deployment
git pull origin main
npm install
npx prisma generate

# Reset and reseed database
npx tsx scripts/reset-and-reseed-content.ts
npx tsx scripts/seed-blog-posts.ts
npx tsx scripts/seed-team-members.ts

# Verify
npx tsx scripts/verify-content-images.ts

# Restart app
pm2 restart zyphextech
pm2 logs zyphextech --lines 50

# Exit SSH
exit

# ===== VERIFY IN BROWSER =====
# https://zyphextech.com/updates
# https://zyphextech.com/about
```

---

## ✅ SUCCESS CRITERIA

You'll know it worked when:
- ✅ `/updates` page shows 6 blog posts with Unsplash images
- ✅ `/about` page shows 6 team members with colorful avatars
- ✅ No 404 errors in browser console
- ✅ All images load quickly from CDN
- ✅ Works on mobile and desktop
- ✅ Verification script shows all content has CDN URLs

---

## 🆘 NEED HELP?

If something goes wrong:

1. **Check GitHub Actions logs**
2. **Check PM2 logs:** `pm2 logs zyphextech`
3. **Check database:** `npx prisma studio`
4. **Rollback if needed:**
   ```bash
   git revert HEAD
   git push origin main
   # Wait for deployment
   ```

---

**Last Updated:** November 3, 2025
**Status:** Ready for Production Deployment

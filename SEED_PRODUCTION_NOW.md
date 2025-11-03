# PRODUCTION DATABASE SEEDING - STEP BY STEP COMMANDS

## 🚨 THE PROBLEM

Your website pages are empty because:
- ✅ Code is deployed to production
- ❌ Database is NOT seeded on production server

The `/updates` and `/about` pages have empty "Featured Articles" and "All Articles" sections.

---

## ✅ THE SOLUTION - RUN THESE COMMANDS

### Step 1: SSH into Production Server

```bash
ssh deploy@66.116.199.219
```

**Password:** [Your SSH password or use SSH key]

---

### Step 2: Navigate to Project Directory

```bash
cd /var/www/zyphextech
pwd  # Should show: /var/www/zyphextech
```

---

### Step 3: Verify Git Pull Happened

```bash
git log --oneline -3
# Should show: "Images URL Fixed" as the latest commit
```

If not, pull the latest code:
```bash
git pull origin main
npm install
npx prisma generate
```

---

### Step 4: Run Database Seeding (OPTION A - Automated Script)

```bash
# Make script executable
chmod +x seed-production-database.sh

# Run the script
bash seed-production-database.sh
```

**Expected Output:**
```
╔════════════════════════════════════════════════════════════════╗
║   SEEDING PRODUCTION DATABASE                                  ║
╚════════════════════════════════════════════════════════════════╝

🗑️  Step 1/4: Deleting old blog posts and team members...
✅ Deleted 6 blog posts
✅ Deleted 6 team members

📝 Step 2/4: Creating 6 blog posts with Unsplash images...
✅ Created blog post: The Future of AI in Software Development
✅ Created blog post: Building Scalable Microservices Architecture
[... 4 more ...]

👥 Step 3/4: Creating 6 team members with UI Avatar photos...
✅ Created team member: Sumit Malhotra - Founder & CEO
✅ Created team member: Priya Sharma - Chief Technology Officer
[... 4 more ...]

🔍 Step 4/4: Verifying database content...
✅ All content verified successfully!

╔════════════════════════════════════════════════════════════════╗
║   ✅ SEEDING COMPLETE!                                        ║
╚════════════════════════════════════════════════════════════════╝
```

---

### Step 4: Run Database Seeding (OPTION B - Manual Commands)

If the script doesn't work, run these commands one by one:

```bash
# 1. Delete old content
npx tsx scripts/reset-and-reseed-content.ts

# 2. Seed blog posts
npx tsx scripts/seed-blog-posts.ts

# 3. Seed team members
npx tsx scripts/seed-team-members.ts

# 4. Verify
npx tsx scripts/verify-content-images.ts
```

---

### Step 5: Restart Application

```bash
# Check PM2 status
pm2 status

# Restart application
pm2 restart zyphextech

# Check logs
pm2 logs zyphextech --lines 30
```

---

### Step 6: Verify Website (In Your Browser)

1. **Visit Updates Page:**
   ```
   https://zyphextech.com/updates
   ```
   - Should show 6 blog posts with images
   - Featured section should have 3 posts
   - All Articles section should have 6 posts

2. **Visit About Page:**
   ```
   https://zyphextech.com/about
   ```
   - Should show 6 team members under "Meet Our Leadership Team"
   - Each member should have a colorful avatar

3. **Check Browser Console:**
   - Press F12
   - Check Console tab for errors
   - Check Network tab - images should load with 200 status

4. **Hard Refresh:**
   - Windows: Ctrl + Shift + R
   - Mac: Cmd + Shift + R

---

## 🔍 TROUBLESHOOTING

### Problem: "tsx command not found"

**Solution:**
```bash
npm install -D tsx
# Then retry the seed commands
```

### Problem: "Database connection failed"

**Solution:**
```bash
# Check if .env file exists
cat .env | grep DATABASE_URL

# Test database connection
npx prisma db pull
```

### Problem: "Content still not showing"

**Solution 1 - Check API Endpoint:**
```bash
# Test the API directly
curl http://localhost:3000/api/content?type=blog
# Should return JSON with 6 blog posts

curl http://localhost:3000/api/content?type=team_member
# Should return JSON with 6 team members
```

**Solution 2 - Rebuild and Restart:**
```bash
rm -rf .next
npm run build
pm2 restart zyphextech
```

**Solution 3 - Check Database Directly:**
```bash
npx prisma studio
# Open in browser: http://localhost:5555
# Navigate to DynamicContentItem table
# Verify blog and team_member entries exist with CDN URLs
```

### Problem: "Images load but are broken"

**Solution - Check next.config.mjs:**
```bash
cat next.config.mjs | grep -A 10 "domains:"
```
Should include:
- `images.unsplash.com`
- `ui-avatars.com`

---

## 📊 VERIFICATION CHECKLIST

After seeding, verify:

- [ ] SSH into production successful
- [ ] Latest code pulled (commit: "Images URL Fixed")
- [ ] reset-and-reseed-content.ts completed
- [ ] seed-blog-posts.ts created 6 posts
- [ ] seed-team-members.ts created 6 members
- [ ] verify-content-images.ts shows success
- [ ] PM2 restarted
- [ ] /updates page shows 6 blog posts
- [ ] /about page shows 6 team members
- [ ] All images load without errors
- [ ] Browser console has no errors

---

## 🎯 ONE-LINER COMMAND (Quick Fix)

If you're confident and want to do everything in one command:

```bash
cd /var/www/zyphextech && \
npx tsx scripts/reset-and-reseed-content.ts && \
npx tsx scripts/seed-blog-posts.ts && \
npx tsx scripts/seed-team-members.ts && \
npx tsx scripts/verify-content-images.ts && \
pm2 restart zyphextech && \
echo "✅ Done! Check https://zyphextech.com/updates and /about"
```

---

## 📞 STILL HAVING ISSUES?

1. Check PM2 logs: `pm2 logs zyphextech --lines 100`
2. Check if app is running: `pm2 status`
3. Check app health: `curl http://localhost:3000/api/health`
4. Share the error output with me

---

**Created:** November 3, 2025
**Status:** Ready to Execute on Production

# 🚀 DEPLOYMENT CHEAT SHEET

## Step 1: Push to GitHub (Local Machine)
```powershell
git add .
git commit -m "fix: Update image URLs to use CDN"
git push origin main
```

## Step 2: Wait for CI/CD
- Go to: https://github.com/isumitmalhotra/Zyphex-Tech/actions
- Wait for "Deploy to VPS" to complete (~10-15 min)

## Step 3: SSH to Production
```bash
ssh deploy@66.116.199.219
cd /var/www/zyphextech
```

## Step 4: Seed Database (Production Server)
```bash
# Option A: Use automated script (recommended)
bash scripts/production-seed.sh

# Option B: Manual commands
npx tsx scripts/reset-and-reseed-content.ts
npx tsx scripts/seed-blog-posts.ts
npx tsx scripts/seed-team-members.ts
npx tsx scripts/verify-content-images.ts
```

## Step 5: Restart App
```bash
pm2 restart zyphextech
pm2 logs zyphextech --lines 50
```

## Step 6: Verify Website
- ✅ https://zyphextech.com/updates (6 blog posts with images)
- ✅ https://zyphextech.com/about (6 team members with photos)

---

## 🆘 Quick Troubleshooting

**Images not loading?**
```bash
rm -rf .next && npm run build && pm2 restart zyphextech
```

**Seed failed?**
```bash
npx prisma generate
npm install
```

**Check database:**
```bash
npx prisma studio
# Open: http://localhost:5555
```

---

## 📋 Expected Results

**Blog Posts API:**
```bash
curl http://localhost:3000/api/content?type=blog | jq '.items | length'
# Should return: 6
```

**Team Members API:**
```bash
curl http://localhost:3000/api/content?type=team_member | jq '.items | length'
# Should return: 6
```

**Verification Script:**
```
✅ Blog Posts: 6
✅ Team Members: 6
🎉 All content verified successfully!
```

---

## ⚡ One-Liner (All Steps)
```bash
cd /var/www/zyphextech && \
npx tsx scripts/reset-and-reseed-content.ts && \
npx tsx scripts/seed-blog-posts.ts && \
npx tsx scripts/seed-team-members.ts && \
pm2 restart zyphextech
```

**Done! 🎉**

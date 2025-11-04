# 🚀 Complete Image Upload & Deployment Guide

## 📋 COMPLETE CHECKLIST

### ✅ Step 1: Save Images Locally (DO THIS NOW)

Save the two images from the chat attachments:

**Image 1 (Sumit - First image with beige sweater):**
- Right-click on the image in chat
- Click "Save image as..."
- Navigate to: `C:\Projects\Zyphex-Tech\public\team\`
- Save as: **`sumit-malhotra.jpg`**

**Image 2 (Ishaan - Second image with black t-shirt):**
- Right-click on the image in chat
- Click "Save image as..."
- Navigate to: `C:\Projects\Zyphex-Tech\public\team\`
- Save as: **`ishaan-garg.jpg`**

---

### ✅ Step 2: Update Database for Local Testing

Once images are saved, run this command:

```bash
npx tsx scripts/update-team-images-local.ts
```

This will update the database to point to:
- `/team/sumit-malhotra.jpg`
- `/team/ishaan-garg.jpg`

---

### ✅ Step 3: Test Locally

1. Restart your dev server if it's running:
   ```bash
   # Press Ctrl+C to stop, then
   npm run dev
   ```

2. Visit: http://localhost:3000/about

3. Verify images are showing correctly

4. You can also test direct image URLs:
   - http://localhost:3000/team/sumit-malhotra.jpg
   - http://localhost:3000/team/ishaan-garg.jpg

---

### ✅ Step 4: Commit Images to Git

```bash
git add public/team/sumit-malhotra.jpg
git add public/team/ishaan-garg.jpg
git commit -m "Add team member profile photos"
```

---

### ✅ Step 5: Push to GitHub (Triggers Auto-Deployment)

```bash
git push origin main
```

**What happens automatically:**
1. ✅ GitHub receives the code
2. ✅ GitHub Actions CI/CD triggers
3. ✅ Code is pulled to VPS (66.116.199.219)
4. ✅ `npm install` runs
5. ✅ `npm run build` creates production build
6. ✅ PM2 reloads the app
7. ✅ Images are now live on production!

---

### ✅ Step 6: Verify on Production

After GitHub Actions completes (~2-3 minutes):

1. **Visit production site:**
   - http://66.116.199.219/about
   - OR https://yoursite.com/about

2. **Check direct image URLs:**
   - http://66.116.199.219/team/sumit-malhotra.jpg
   - http://66.116.199.219/team/ishaan-garg.jpg

---

## 🔍 Troubleshooting

### Images not showing locally?

**Check 1:** Files are in the correct location?
```bash
dir public\team\
```
Should show:
- `sumit-malhotra.jpg`
- `ishaan-garg.jpg`

**Check 2:** Database updated?
```bash
npx tsx scripts/check-team.ts
```
Should show paths like `/team/sumit-malhotra.jpg`

**Check 3:** Clear browser cache
- Press Ctrl+Shift+Delete
- Clear cached images and files
- Refresh page (Ctrl+F5)

### Images not showing on production?

**Check 1:** Wait for GitHub Actions to complete
- Go to: https://github.com/isumitmalhotra/Zyphex-Tech/actions
- Ensure the latest workflow is green ✅

**Check 2:** Verify files deployed
SSH to VPS:
```bash
ssh user@66.116.199.219
cd /var/www/zyphex-tech
ls -la public/team/
```

Should show both jpg files.

**Check 3:** Check PM2 status
```bash
pm2 status
pm2 logs zyphex-tech --lines 50
```

**Check 4:** Manually restart if needed
```bash
pm2 reload zyphex-tech
```

---

## 📊 File Structure

```
Zyphex-Tech/
├── public/
│   └── team/
│       ├── sumit-malhotra.jpg  ← First image (beige sweater)
│       ├── ishaan-garg.jpg     ← Second image (black t-shirt)
│       └── README.md
├── scripts/
│   ├── update-team-images-local.ts  ← Run this after saving images
│   └── check-team.ts                ← Use to verify database
└── ...
```

---

## 🎯 Quick Commands Reference

```bash
# 1. Save images to public/team/ folder (manually)

# 2. Update database
npx tsx scripts/update-team-images-local.ts

# 3. Check if updated
npx tsx scripts/check-team.ts

# 4. Test locally
npm run dev
# Visit: http://localhost:3000/about

# 5. Commit and push
git add public/team/
git commit -m "Add team member profile photos"
git push origin main

# 6. Monitor deployment
# Visit: https://github.com/isumitmalhotra/Zyphex-Tech/actions

# 7. Verify on production (after 2-3 minutes)
# Visit: http://66.116.199.219/about
```

---

## ✨ What's Different from Placeholders?

**Before (Placeholders):**
- Generic stock photos from Unsplash
- Not personalized

**After (Real Photos):**
- ✅ Sumit's actual photo (beige sweater, glasses)
- ✅ Ishaan's actual photo (black t-shirt)
- ✅ Professional appearance
- ✅ Builds trust with clients

---

## 🎉 Success Criteria

Your setup is complete when:
- [x] Images saved in `public/team/`
- [x] Database updated (run script)
- [x] Images show on localhost:3000/about
- [x] Committed to git
- [x] Pushed to GitHub
- [x] GitHub Actions completed successfully
- [x] Images show on production site

---

## 💡 Pro Tips

1. **Image Optimization:** 
   The images look good! But for even faster loading, you can compress them:
   - Use https://tinypng.com before saving
   - Or use https://squoosh.app

2. **Backup:**
   Keep the original high-res versions somewhere safe

3. **Future Updates:**
   To change images later, just:
   - Replace files in `public/team/`
   - Push to GitHub
   - That's it! (Database already points to these paths)

---

Need help? Run into issues? Let me know! 🚀

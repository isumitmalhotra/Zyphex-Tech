# 🚀 VPS Post-Deployment Checklist

## ⚠️ IMPORTANT: Database Update Required on VPS

After CI/CD deploys the code to production, you **MUST** run the team member database update script on the VPS server.

---

## 📋 Step-by-Step VPS Actions

### 1️⃣ Push to GitHub (Do this first!)

```bash
git push origin main
```

**What happens automatically:**
- ✅ GitHub receives the code
- ✅ GitHub Actions CI/CD triggers
- ✅ Code deployed to VPS (66.116.199.219)
- ✅ Dependencies installed (`npm install`)
- ✅ Production build created (`npm run build`)
- ✅ PM2 reloads the app
- ✅ Team member images copied to `/var/www/zyphex-tech/public/team/`

---

### 2️⃣ SSH into VPS

```bash
ssh root@66.116.199.219
# Or use your configured SSH alias
```

---

### 3️⃣ Navigate to Project Directory

```bash
cd /var/www/zyphex-tech
# Or wherever your project is deployed
```

---

### 4️⃣ **CRITICAL: Update Team Members in Production Database**

This is the **MOST IMPORTANT** step! The database on VPS needs to be populated with team member data.

```bash
npx tsx scripts/update-team-members.ts
```

**Expected output:**
```
✅ Found/created team_member ContentType
🗑️  Deleted X existing team members
✅ Created Sumit Malhotra (Co-Founder & CTO)
✅ Created Ishaan Garg (Co-Founder & CEO)
✅ Created Our Senior Development Team
🎉 Team members update completed successfully!
```

---

### 5️⃣ Update Team Images to Use Local Paths

```bash
npx tsx scripts/update-team-images-local.ts
```

**Expected output:**
```
✅ Updated Sumit Malhotra image to /team/sumit-malhotra.jpg
✅ Updated Ishaan Garg image to /team/ishaan-garg.jpg
🎉 Team images updated successfully!
```

---

### 6️⃣ Verify Images Are Deployed

```bash
ls -lh public/team/
```

**Should show:**
```
-rw-r--r-- 1 user user 172K Nov  4 13:15 sumit-malhotra.jpg
-rw-r--r-- 1 user user 208K Nov  4 13:15 ishaan-garg.jpg
```

---

### 7️⃣ Check PM2 Status

```bash
pm2 status
```

**Should show:**
```
┌─────┬──────────────┬─────────┬─────────┬─────────┬──────────┐
│ id  │ name         │ status  │ restart │ uptime  │ cpu      │
├─────┼──────────────┼─────────┼─────────┼─────────┼──────────┤
│ 0   │ zyphex-tech  │ online  │ 0       │ 5m      │ 0%       │
└─────┴──────────────┴─────────┴─────────┴─────────┴──────────┘
```

---

### 8️⃣ Check PM2 Logs (Optional - for debugging)

```bash
pm2 logs zyphex-tech --lines 50
```

Look for any errors or warnings.

---

### 9️⃣ Verify Database Connection

```bash
npx tsx scripts/check-team.ts
```

**Expected output:**
```
Members: 3
- Sumit Malhotra: status='published', featured=true
- Ishaan Garg: status='published', featured=true
- Our Senior Development Team: status='published', featured=true
```

---

### 🔟 Test Production URLs

**Team member images:**
- http://66.116.199.219/team/sumit-malhotra.jpg
- http://66.116.199.219/team/ishaan-garg.jpg
- (Or use your domain name if configured)

**About page:**
- http://66.116.199.219/about
- Should display 3 team members with real photos

---

## 🧪 Verification Tests

### Test 1: Direct Image Access
```bash
curl -I http://66.116.199.219/team/sumit-malhotra.jpg
```
**Expected:** `HTTP/1.1 200 OK`

### Test 2: Check Database via Script
```bash
npx tsx scripts/check-data-structure.ts
```
**Expected:** Should show `/team/sumit-malhotra.jpg` and `/team/ishaan-garg.jpg` in imageUrl fields

### Test 3: Browser Test
Open in browser:
- Production About page should show real team member photos
- No console errors
- Images load within 1-2 seconds

---

## 🚨 Troubleshooting

### Issue: Images not showing on production

**Solution 1:** Check file permissions
```bash
cd /var/www/zyphex-tech/public/team
chmod 644 *.jpg
```

**Solution 2:** Verify nginx/server is serving static files
```bash
# If using nginx
sudo nginx -t
sudo systemctl reload nginx
```

**Solution 3:** Clear Next.js cache
```bash
rm -rf .next
npm run build
pm2 reload zyphex-tech
```

---

### Issue: Database not updated

**Solution:** Re-run the scripts in order
```bash
npx tsx scripts/update-team-members.ts
npx tsx scripts/update-team-images-local.ts
npx tsx scripts/check-team.ts
```

---

### Issue: PM2 app crashed

**Check logs:**
```bash
pm2 logs zyphex-tech --err --lines 100
```

**Restart:**
```bash
pm2 restart zyphex-tech
```

---

### Issue: Database connection error

**Check environment variables:**
```bash
cat .env | grep DATABASE_URL
```

**Ensure production DATABASE_URL is set correctly**

---

## ✅ Final Checklist

- [ ] Code pushed to GitHub
- [ ] GitHub Actions completed successfully (check Actions tab)
- [ ] SSH into VPS
- [ ] Ran `update-team-members.ts` script
- [ ] Ran `update-team-images-local.ts` script
- [ ] Verified images exist in `/public/team/`
- [ ] PM2 status shows "online"
- [ ] Direct image URLs work (http://yoursite.com/team/*.jpg)
- [ ] About page displays team members correctly
- [ ] No console errors in browser
- [ ] Contact info updated across all pages
- [ ] Testimonials showing real clients

---

## 📝 Summary of Changes Going Live

### Content Changes:
✅ Real team member photos (Sumit & Ishaan)
✅ Client testimonials (3 real clients)
✅ Contact info (Mohali address, Indian phone numbers)
✅ Email: info@zyphextech.com

### Technical Changes:
✅ Team member CMS system in database
✅ Fixed status filter bug (case sensitivity)
✅ Fixed TypeScript errors in error pages
✅ Improved error handling and Link components

### New Assets:
✅ 2 team member profile photos
✅ 7 utility scripts for team management
✅ 3 documentation files

---

## 🎯 Expected Result

After completing all steps, your production website will have:
- ✅ Real team member photos on /about page
- ✅ Professional client testimonials on homepage
- ✅ Accurate contact information everywhere
- ✅ No TypeScript/console errors
- ✅ Fast-loading optimized images
- ✅ Proper SEO with updated schema.org data

---

## 🆘 Need Help?

If something goes wrong:
1. Check PM2 logs: `pm2 logs zyphex-tech`
2. Check GitHub Actions: https://github.com/isumitmalhotra/Zyphex-Tech/actions
3. Re-run database scripts on VPS
4. Clear .next cache and rebuild

---

**Time estimate:** 5-10 minutes for full deployment and verification ⏱️

Good luck! 🚀

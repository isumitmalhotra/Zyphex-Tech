# VPS Deployment Commands (As Root User)

## ✅ Build Completed Successfully!

Your build has completed successfully. Now follow these steps to restart the application.

---

## 🚀 Step-by-Step Commands (Copy & Paste)

### Step 1: Switch to Deploy User and Navigate to Project
```bash
su - deploy
cd /var/www/zyphextech
```

### Step 2: Restart PM2 Application
```bash
pm2 restart zyphextech
```

### Step 3: Check PM2 Status
```bash
pm2 status
```

**Expected Output:**
```
┌────┬────────────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name               │ mode     │ ↺    │ status    │ cpu      │ memory   │
├────┼────────────────────┼──────────┼──────┼───────────┼──────────┼──────────┤
│ 0  │ zyphextech         │ fork     │ 0    │ online    │ 0%       │ XXX MB   │
└────┴────────────────────┴──────────┴──────┴───────────┴──────────┴──────────┘
```

✅ Look for `status: online` and low restart count

### Step 4: Check Application Logs (Last 30 Lines)
```bash
pm2 logs zyphextech --lines 30
```

**Expected Output:**
```
✓ Ready in 2.5s
○ Local: http://localhost:3000
✓ Socket.IO server initialized on path: /api/socket/io
```

✅ No errors, should show "Ready" message

### Step 5: Verify .next Folder Exists
```bash
ls -lah /var/www/zyphextech/.next/ | head -20
```

**Expected Output:**
```
drwxr-xr-x  cache
drwxr-xr-x  server
drwxr-xr-x  static
-rw-r--r--  build-manifest.json
-rw-r--r--  prerender-manifest.json  ← This file was missing before!
```

---

## 🌐 Step 6: Test the Website

Open your browser and visit:
```
https://zyphextech.com
```

**What to Check:**
- ✅ Site loads without errors
- ✅ No MIME type errors in browser console
- ✅ CSS and JavaScript load correctly
- ✅ Login page appears properly
- ✅ No "Application error" message

---

## 🔍 Troubleshooting Commands

### If PM2 Shows "Errored" Status:
```bash
pm2 logs zyphextech --err --lines 50
```

### If Site Still Shows Errors:
```bash
# Check Nginx error logs
tail -50 /var/log/nginx/error.log

# Check Nginx access logs
tail -50 /var/log/nginx/access.log
```

### Restart Nginx (if needed):
```bash
exit  # Exit from deploy user back to root
systemctl restart nginx
systemctl status nginx
```

### Check Environment Variables:
```bash
su - deploy
cd /var/www/zyphextech
cat .env | grep -E "NEXTAUTH_URL|NEXT_PUBLIC_BASE_URL|NEXT_PUBLIC_SOCKET_URL"
```

**Expected Output:**
```env
NEXTAUTH_URL="https://zyphextech.com"
NEXT_PUBLIC_BASE_URL="https://zyphextech.com"
NEXT_PUBLIC_SOCKET_URL="https://zyphextech.com"
```

⚠️ **If they still show localhost URLs, update them:**
```bash
nano .env
# Change localhost:3000 to zyphextech.com
# Save: Ctrl+X, then Y, then Enter

# Rebuild after env changes
npm run build
pm2 restart zyphextech
```

---

## 📊 Real-Time Monitoring

### Watch Logs Live:
```bash
pm2 logs zyphextech
```
Press `Ctrl+C` to stop watching

### Monitor CPU/Memory:
```bash
pm2 monit
```
Press `Ctrl+C` to exit

---

## ✅ Success Checklist

After running the commands above, verify:

- [ ] PM2 status shows `online`
- [ ] PM2 logs show "Ready" message
- [ ] No error messages in logs
- [ ] https://zyphextech.com loads successfully
- [ ] Browser console shows no errors
- [ ] Can navigate to login page
- [ ] CSS/JS files load properly

---

## 🎯 Quick Reference: All Commands in Sequence

```bash
# Run these commands one by one:
su - deploy
cd /var/www/zyphextech
pm2 restart zyphextech
pm2 status
pm2 logs zyphextech --lines 30
```

---

## 🔧 If You Need to Start Fresh

```bash
# As deploy user:
pm2 delete zyphextech
cd /var/www/zyphextech
npm ci
npm run build
pm2 start npm --name "zyphextech" -- start
pm2 save
```

---

## 📝 Notes

- Build completed successfully ✅
- Generated 183 pages
- Total bundle size looks good
- Next.js 14.2.16 confirmed
- All API routes compiled
- Middleware compiled (48.7 kB)

The application is ready to run! Just restart PM2 and test.

---

## 🚨 Emergency: If Site Still Down

```bash
# Full restart sequence (as root):
su - deploy
cd /var/www/zyphextech
pm2 stop zyphextech
pm2 delete zyphextech
pm2 start npm --name "zyphextech" -- start
pm2 save
pm2 logs zyphextech

# Exit deploy user
exit

# Restart Nginx (as root)
systemctl restart nginx
nginx -t  # Test config
```

---

## 📞 Need Help?

If you see any errors after running these commands, share:
1. Output of `pm2 status`
2. Output of `pm2 logs zyphextech --lines 50`
3. Any browser console errors
4. What you see when visiting https://zyphextech.com

---

**Last Updated:** After successful build completion
**Status:** Ready to restart PM2 ✅

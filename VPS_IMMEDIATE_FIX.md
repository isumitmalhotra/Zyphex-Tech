# 🚨 IMMEDIATE FIX - .next Folder Missing

## The Problem
PM2 is still crashing because the `.next` folder doesn't exist, even though we ran `npm run build`.

This could mean:
1. The build ran in a different directory
2. The build failed silently
3. Permissions issue prevented folder creation

## 🔧 SOLUTION: Run These Commands NOW

```bash
# You should still be in: /var/www/zyphextech as deploy user

# 1. Stop PM2 completely
pm2 stop zyphextech

# 2. Check if .next folder exists
ls -la .next

# 3. If .next doesn't exist, check current directory
pwd

# 4. Run build again (make sure you're in the right directory)
npm run build

# 5. Verify .next folder was created
ls -la .next

# 6. If .next exists, check the prerender-manifest.json
ls -la .next/prerender-manifest.json

# 7. Start PM2 again
pm2 restart zyphextech

# 8. Check logs
pm2 logs zyphextech --lines 20
```

## 📋 Copy/Paste Version:

```bash
pm2 stop zyphextech
ls -la .next
pwd
npm run build
ls -la .next
pm2 restart zyphextech
pm2 logs zyphextech --lines 20
```

---

## ⚠️ If .next Folder STILL Doesn't Exist After Build

There might be a permissions issue. Try:

```bash
# Check permissions of current directory
ls -la /var/www/zyphextech

# If build fails, check for errors:
npm run build 2>&1 | tee build.log
cat build.log

# Check if there's a .next folder somewhere else
find /var/www -name ".next" -type d 2>/dev/null
```

---

## 🔍 Alternative: Manual .next Folder Check

```bash
# See what's in the project directory
ls -la /var/www/zyphextech/ | grep -E "(next|node_modules|package)"

# Check Node version
node --version

# Check npm version
npm --version

# Verify package.json exists
cat package.json | grep "next"
```

---

## 🎯 Expected Output After Build

After `npm run build`, you should see:
```
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages (183/183)
✓ Finalizing page optimization
```

Then after `ls -la .next`:
```
drwxr-xr-x  .next/
drwxr-xr-x  .next/cache
drwxr-xr-x  .next/server
drwxr-xr-x  .next/static
-rw-r--r--  .next/build-manifest.json
-rw-r--r--  .next/prerender-manifest.json  ← THIS FILE IS CRITICAL
```

---

## 🚨 Emergency: If Nothing Works

Delete the app from PM2 and start fresh:

```bash
# Stop and delete from PM2
pm2 stop zyphextech
pm2 delete zyphextech

# Clean install
rm -rf node_modules
rm -rf .next
npm ci

# Build
npm run build

# Verify .next exists
ls -la .next/prerender-manifest.json

# Start with PM2
pm2 start npm --name "zyphextech" -- start

# Save PM2 config
pm2 save

# Check logs
pm2 logs zyphextech
```

---

**RUN THE COMMANDS ABOVE AND SHARE THE OUTPUT!**

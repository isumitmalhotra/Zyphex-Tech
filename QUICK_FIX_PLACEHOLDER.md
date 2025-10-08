# Quick Fix: Remove DigiYantra Placeholder

## Step 1: Wait for Deployment (3-5 minutes)

Your code is deploying now. Check GitHub Actions or wait a few minutes.

## Step 2: SSH to VPS and Run Script

```bash
# SSH as root
ssh root@66.116.199.219

# Navigate to project
cd /var/www/zyphextech

# Make script executable
chmod +x scripts/remove-placeholder.sh

# Run the script
sudo bash scripts/remove-placeholder.sh
```

The script will:
- ✅ Find and remove DigiYantra HTML files
- ✅ Backup files before deletion
- ✅ Check Nginx configuration
- ✅ Verify PM2 status
- ✅ Show you exactly what it found and fixed

## Step 3: Restart Services

```bash
# Restart Nginx
sudo systemctl restart nginx

# Restart PM2 (if needed)
pm2 restart zyphextech

# Check everything is running
pm2 status
sudo systemctl status nginx
```

## Step 4: Test Your Site

```bash
# Test from VPS
curl http://localhost:3000 | grep "Zyphex Tech"

# Test from outside
curl https://zyphextech.com | grep "Zyphex Tech"

# Should see "Zyphex Tech - Leading Remote IT Services Agency"
# Should NOT see "DigiYantra"
```

## Step 5: Clear Browser Cache

On your computer:
1. Open https://zyphextech.com
2. Hard refresh: **Ctrl + Shift + R** (Windows) or **Cmd + Shift + R** (Mac)
3. Check browser tab for Zyphex Tech logo
4. View page source - should NOT contain "DigiYantra"

## Step 6: Google Search Console (Optional but Recommended)

1. Go to: https://search.google.com/search-console
2. Add property: `https://zyphextech.com`
3. Verify ownership
4. Submit sitemap: `https://zyphextech.com/sitemap.xml`
5. Request re-indexing of homepage

## Manual Fallback (If Script Doesn't Work)

```bash
# Find all index.html files
find /var/www -name "index.html" -type f

# Search for DigiYantra
grep -r "DigiYantra" /var/www/

# If found in /var/www/html/index.html
sudo rm /var/www/html/index.html

# Check Nginx config
sudo cat /etc/nginx/sites-enabled/zyphextech.com

# Ensure it has:
# root /var/www/zyphextech;
# proxy_pass http://localhost:3000;

# Restart
sudo systemctl restart nginx
pm2 restart zyphextech
```

## Timeline

| What | When |
|------|------|
| Browser tab icon | Immediate (after hard refresh) |
| Site shows correct info | Immediate |
| Google search updates | 1-7 days |

## Verify Success

✅ **Browser tab** shows Zyphex Tech logo
✅ **Page title** says "Zyphex Tech - Leading Remote IT Services Agency"
✅ **No mention** of DigiYantra anywhere
✅ **Sitemap available** at `/sitemap.xml`
✅ **Robots.txt available** at `/robots.txt`

## Need Help?

Check logs:
```bash
# PM2 logs
pm2 logs zyphextech --lines 50

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Nginx access logs
sudo tail -f /var/log/nginx/access.log
```

---

**Full Documentation:** See `GOOGLE_SEO_BRANDING_FIX.md` for complete guide

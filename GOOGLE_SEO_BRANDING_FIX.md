# Fix Google Search & Branding - Complete Guide

## Issue Overview

When searching "zyphextech.com" on Google, it shows:
- DigiYantra Digital placeholder message
- No Zyphex Tech branding
- No company logo in browser tab
- Generic browser icon

## Root Cause

DigiYantra Digital (the VPS provider) left placeholder HTML files on the server that are being served instead of your Next.js application.

---

## Solutions Implemented

### 1. ✅ Enhanced SEO Metadata

**File Modified:** `app/layout.tsx`

Added comprehensive metadata including:
- Open Graph tags (for social media sharing)
- Twitter Card tags
- Structured data (JSON-LD) for Google
- Proper meta descriptions
- Keywords optimization
- Canonical URLs
- Site verification codes

**What This Does:**
- Tells Google exactly what your website is about
- Improves search result appearance
- Adds rich snippets in search results
- Shows proper preview when sharing on social media

### 2. ✅ Added Favicons & Icons

**Files Created:**
- `public/favicon.ico` - Browser tab icon
- `public/site.webmanifest` - PWA manifest
- Uses existing `public/zyphex-logo.png`

**What This Does:**
- Shows Zyphex Tech logo in browser tabs
- Shows logo when saving to mobile home screen
- Professional appearance across all devices

### 3. ✅ Created Sitemap

**File Created:** `app/sitemap.ts`

Automatically generates XML sitemap at `/sitemap.xml` with all pages:
- Homepage (priority 1.0)
- Services (priority 0.9)
- About, Portfolio (priority 0.8)
- Contact, Login, Register (priority 0.5-0.7)

**What This Does:**
- Helps Google discover and index all your pages
- Tells Google which pages are most important
- Updates automatically when you add new pages

### 4. ✅ Added robots.txt

**File Created:** `public/robots.txt`

Tells search engines:
- All pages are allowed to be indexed
- Links to sitemap location

### 5. ✅ Server Cleanup Script

**File Created:** `scripts/remove-placeholder.sh`

Automated script to:
- Find and remove DigiYantra placeholder files
- Check all common web server locations
- Backup files before removing
- Verify Nginx configuration
- Check PM2 status

---

## Deployment Steps

### Step 1: Deploy Code Changes

```powershell
# From your local machine
git add app/ public/ scripts/
git commit -m "Add comprehensive SEO metadata, favicons, sitemap, and remove placeholder"
git push origin main
```

**Wait 3-5 minutes for CI/CD deployment**

### Step 2: Remove Placeholder on VPS

```bash
# SSH into your VPS as root
ssh root@66.116.199.219

# Run the cleanup script
cd /var/www/zyphextech
chmod +x scripts/remove-placeholder.sh
sudo bash scripts/remove-placeholder.sh

# Restart Nginx
sudo systemctl restart nginx

# Verify PM2 is running
pm2 status

# If not running, start it
cd /var/www/zyphextech
pm2 restart ecosystem.config.js
```

### Step 3: Manual Checks (If Script Doesn't Find It)

```bash
# Check common locations for placeholder HTML
find /var/www -name "index.html" -type f

# Check each file for DigiYantra
grep -r "DigiYantra" /var/www/

# Check Nginx default root
ls -la /var/www/html/
cat /var/www/html/index.html

# If found, remove it
sudo rm /var/www/html/index.html

# Check Nginx configuration
sudo cat /etc/nginx/sites-enabled/zyphextech.com

# Ensure it points to /var/www/zyphextech (not /var/www/html)
# Look for: root /var/www/zyphextech;

# Restart Nginx
sudo systemctl restart nginx
```

### Step 4: Verify Next.js is Serving

```bash
# Test locally on VPS
curl http://localhost:3000

# Should show HTML with "Zyphex Tech" in title
# Should NOT show DigiYantra

# Check from outside
curl https://zyphextech.com

# Test specific port Nginx is using
sudo netstat -tlnp | grep nginx
```

### Step 5: Clear Cache

```bash
# Clear Nginx cache (if enabled)
sudo rm -rf /var/cache/nginx/*
sudo systemctl restart nginx

# Clear Cloudflare cache (if using)
# Go to Cloudflare dashboard → Caching → Purge Everything
```

---

## Google Search Console Setup

### 1. Verify Ownership

1. Go to: https://search.google.com/search-console
2. Add property: `https://zyphextech.com`
3. Choose verification method: **HTML tag**
4. Copy the verification code
5. Update `app/layout.tsx`:

```typescript
verification: {
  google: "your-actual-verification-code-here",
},
```

6. Deploy and verify

### 2. Submit Sitemap

1. In Google Search Console, go to **Sitemaps**
2. Add new sitemap: `https://zyphextech.com/sitemap.xml`
3. Submit

### 3. Request Re-Crawl

1. Go to **URL Inspection** tool
2. Enter: `https://zyphextech.com`
3. Click **Request Indexing**
4. Do this for main pages:
   - Homepage
   - /services
   - /about
   - /portfolio
   - /contact

### 4. Remove Old URLs (if needed)

If the DigiYantra version is still showing:
1. Go to **Removals** tab
2. Request removal of old cached version
3. This is temporary (90 days) until Google re-crawls

---

## Favicon Setup (Optional Enhancement)

The current setup uses your existing `zyphex-logo.png`. For best results, create multiple sizes:

### Using Online Tool (Recommended)

1. Go to: https://favicon.io/favicon-converter/
2. Upload `public/zyphex-logo.png`
3. Download the generated files
4. Replace `public/favicon.ico` with the new one
5. Add these new files to `public/`:
   - `android-chrome-192x192.png`
   - `android-chrome-512x512.png`
   - `apple-touch-icon.png`

### Using ImageMagick (Advanced)

```bash
# Install ImageMagick
sudo apt install imagemagick

# Convert logo to multiple sizes
cd public
convert zyphex-logo.png -resize 16x16 favicon-16x16.png
convert zyphex-logo.png -resize 32x32 favicon-32x32.png
convert zyphex-logo.png -resize 180x180 apple-touch-icon.png
convert zyphex-logo.png -resize 192x192 android-chrome-192x192.png
convert zyphex-logo.png -resize 512x512 android-chrome-512x512.png

# Create .ico file
convert zyphex-logo.png -define icon:auto-resize=64,48,32,16 favicon.ico
```

---

## Testing Checklist

### ✅ Browser Tab Icon

- [ ] Open https://zyphextech.com in Chrome
- [ ] Check browser tab shows Zyphex Tech logo
- [ ] Try in Firefox, Safari, Edge
- [ ] Hard refresh: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)

### ✅ Google Search Appearance

- [ ] Search "zyphextech.com" on Google
- [ ] Should show: "Zyphex Tech - Leading Remote IT Services Agency"
- [ ] Description should mention remote IT services
- [ ] No mention of DigiYantra Digital

**Note:** Google can take 1-7 days to re-crawl and update

### ✅ Social Media Sharing

Test Open Graph tags:
- [ ] Share link on Facebook - should show logo and description
- [ ] Share link on LinkedIn - should show logo and description
- [ ] Share link on Twitter - should show Twitter card

Test with: https://www.opengraph.xyz/url/https%3A%2F%2Fzyphextech.com

### ✅ Structured Data

Test JSON-LD schema:
- [ ] Go to: https://search.google.com/test/rich-results
- [ ] Enter: https://zyphextech.com
- [ ] Should show "Organization" schema
- [ ] No errors

### ✅ Sitemap

- [ ] Visit: https://zyphextech.com/sitemap.xml
- [ ] Should show XML sitemap with all pages
- [ ] No errors

### ✅ Robots.txt

- [ ] Visit: https://zyphextech.com/robots.txt
- [ ] Should show allow rules and sitemap link

### ✅ Mobile

- [ ] Open site on mobile device
- [ ] Add to home screen
- [ ] Should show Zyphex Tech logo and name
- [ ] Icon should be high quality

---

## Troubleshooting

### Issue: DigiYantra Still Shows on Google

**Cause:** Google cache hasn't updated yet

**Solutions:**
1. Wait 24-48 hours for Google to re-crawl
2. Request indexing in Google Search Console
3. Use Google Removals tool (temporary)
4. Check if placeholder HTML is still on server

### Issue: Logo Not Showing in Browser Tab

**Cause:** Browser cache or wrong file format

**Solutions:**
```bash
# Clear browser cache
Ctrl+Shift+Delete (Windows) / Cmd+Shift+Delete (Mac)

# Hard refresh
Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)

# Check file exists
curl https://zyphextech.com/favicon.ico

# Check file is served correctly
curl -I https://zyphextech.com/favicon.ico
# Should show: Content-Type: image/x-icon
```

### Issue: Sitemap 404 Error

**Cause:** Next.js not building sitemap

**Solutions:**
```bash
# SSH to VPS
cd /var/www/zyphextech

# Rebuild
npm run build

# Check if sitemap.xml exists in .next
ls -la .next/server/app/

# Restart PM2
pm2 restart zyphextech
```

### Issue: Placeholder HTML Still Serving

**Cause:** Nginx serving wrong directory

**Solutions:**
```bash
# Check Nginx config
sudo cat /etc/nginx/sites-enabled/zyphextech.com

# Should have:
# root /var/www/zyphextech;
# NOT root /var/www/html;

# If wrong, edit:
sudo nano /etc/nginx/sites-enabled/zyphextech.com

# Change root directive to:
root /var/www/zyphextech;

# Save and restart
sudo systemctl restart nginx
```

### Issue: "Cannot GET /" Error

**Cause:** PM2 not running or wrong port

**Solutions:**
```bash
# Check PM2
pm2 status

# If not running
cd /var/www/zyphextech
pm2 start ecosystem.config.js

# Check port
pm2 logs zyphextech | grep "started"
# Should show: started server on [::]:3000

# Check Nginx proxy
sudo cat /etc/nginx/sites-enabled/zyphextech.com
# Should have: proxy_pass http://localhost:3000;
```

---

## Quick Reference Commands

```bash
# Deploy from local machine
git add . && git commit -m "SEO updates" && git push origin main

# On VPS - Remove placeholder
sudo bash /var/www/zyphextech/scripts/remove-placeholder.sh

# Restart services
sudo systemctl restart nginx
pm2 restart zyphextech

# Check status
pm2 status
sudo systemctl status nginx
curl https://zyphextech.com

# View logs
pm2 logs zyphextech --lines 50
sudo tail -f /var/log/nginx/error.log

# Test sitemap
curl https://zyphextech.com/sitemap.xml

# Test robots
curl https://zyphextech.com/robots.txt

# Test favicon
curl -I https://zyphextech.com/favicon.ico
```

---

## Expected Timeline

| Action | Time to Update |
|--------|----------------|
| Browser tab icon | Immediate (after hard refresh) |
| Site metadata | Immediate |
| Sitemap availability | Immediate |
| Social media previews | 1-24 hours |
| Google Search results | 1-7 days |
| Google rich snippets | 1-14 days |

---

## Support

If issues persist after 48 hours:

1. **Check Google Search Console** for crawl errors
2. **Verify Nginx logs** for errors: `sudo tail -f /var/log/nginx/error.log`
3. **Check PM2 logs** for app errors: `pm2 logs zyphextech`
4. **Contact DigiYantra** to ensure no automatic placeholder restoration
5. **Check DNS** is pointing to correct IP: `nslookup zyphextech.com`

---

## Files Modified Summary

**New Files:**
- `app/sitemap.ts` - XML sitemap generator
- `public/site.webmanifest` - PWA manifest
- `public/robots.txt` - Search engine instructions
- `public/favicon.ico` - Browser icon
- `scripts/remove-placeholder.sh` - Cleanup script

**Modified Files:**
- `app/layout.tsx` - Enhanced SEO metadata

**Total:** 5 new files, 1 modified file

---

## Deployment Commit

```bash
git add app/ public/ scripts/
git commit -m "Add comprehensive SEO metadata, favicons, sitemap, and remove DigiYantra placeholder"
git push origin main
```

**Status:** Ready to deploy! ✅

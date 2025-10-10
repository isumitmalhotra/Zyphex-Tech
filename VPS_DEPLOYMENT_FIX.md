# 🚨 VPS PRODUCTION DEPLOYMENT FIX

## Errors Identified

### Error 1: MIME Type Errors
```
Refused to apply style from '.../_next/static/css/...' 
because its MIME type ('text/html') is not a supported stylesheet MIME type
```

**Meaning:** Server is returning HTML (probably 404 error page) instead of CSS file

### Error 2: Chunk Loading Failures
```
GET https://zyphextech.com/_next/static/chunks/app/page-031289e6b487f870.js 
net::ERR_ABORTED 400 (Bad Request)
```

**Meaning:** JavaScript chunks are missing or server can't find them

### Error 3: CSP Violation
```
Refused to connect to 'https://cdn.jsdelivr.net/npm/antd/dist/antd.min.css.map' 
because it violates the following Content Security Policy directive: "connect-src 'self'"
```

**Meaning:** Content Security Policy is blocking external CDN resources

---

## Root Cause Analysis

Your VPS server is **NOT serving the built Next.js static files** correctly.

### Possible Causes:
1. ❌ `.next` folder not deployed or missing
2. ❌ Next.js not built in production mode
3. ❌ Nginx/Apache not configured to serve `_next/static` files
4. ❌ File permissions incorrect on VPS
5. ❌ PM2/process manager not running correctly

---

## Solution Steps

### Step 1: SSH into VPS

```bash
ssh deploy@66.116.199.219
```

### Step 2: Navigate to Project Directory

```bash
cd /var/www/zyphextech
```

### Step 3: Check if `.next` Folder Exists

```bash
ls -la .next
```

**Expected Output:**
```
drwxr-xr-x .next
drwxr-xr-x static
drwxr-xr-x server
-rw-r--r-- build-manifest.json
```

**If `.next` folder is MISSING or EMPTY:**
```bash
# This is the problem! You need to build Next.js
```

### Step 4: Rebuild Next.js in Production

```bash
# Stop the running server first
pm2 stop zyphextech

# Install dependencies
npm ci --production=false

# Build Next.js
npm run build

# Check if build succeeded
ls -la .next/static

# Restart server
pm2 restart zyphextech

# Check logs
pm2 logs zyphextech
```

### Step 5: Fix Nginx Configuration

Check your Nginx config:

```bash
sudo nano /etc/nginx/sites-available/zyphextech.com
```

**Required Nginx Configuration:**

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name zyphextech.com www.zyphextech.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name zyphextech.com www.zyphextech.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/zyphextech.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/zyphextech.com/privkey.pem;

    # Root directory
    root /var/www/zyphextech;

    # Increase client_max_body_size for file uploads
    client_max_body_size 20M;

    # Next.js static files - CRITICAL!
    location /_next/static/ {
        alias /var/www/zyphextech/.next/static/;
        expires 365d;
        access_log off;
        add_header Cache-Control "public, immutable";
    }

    # Public static files
    location /static/ {
        alias /var/www/zyphextech/public/;
        expires 30d;
        access_log off;
    }

    # Images and other public assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        access_log off;
        add_header Cache-Control "public";
    }

    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Socket.io support
        proxy_set_header X-Forwarded-Host $server_name;
        proxy_read_timeout 86400;
    }

    # Socket.io WebSocket
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API routes
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /500.html;
}
```

**Save and reload Nginx:**

```bash
# Test configuration
sudo nginx -t

# If test passes, reload
sudo systemctl reload nginx
```

### Step 6: Check PM2 Configuration

```bash
# Check PM2 status
pm2 status

# Check if server.js is being used (Socket.io)
pm2 describe zyphextech
```

**Expected PM2 ecosystem.config.js:**

```javascript
module.exports = {
  apps: [{
    name: 'zyphextech',
    script: './server.js',  // NOT 'npm'!
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

**If using wrong script:**

```bash
pm2 delete zyphextech
pm2 start ecosystem.config.js --env production
pm2 save
```

### Step 7: Fix File Permissions

```bash
# Set correct ownership
sudo chown -R deploy:deploy /var/www/zyphextech

# Set correct permissions
sudo chmod -R 755 /var/www/zyphextech

# Ensure .next folder is readable
sudo chmod -R 755 /var/www/zyphextech/.next
```

### Step 8: Check Environment Variables

```bash
# Check if .env exists
cat /var/www/zyphextech/.env

# Make sure production URLs are set
grep "NEXTAUTH_URL" .env
grep "NEXT_PUBLIC_BASE_URL" .env
```

**Should show:**
```env
NEXTAUTH_URL="https://zyphextech.com"
NEXT_PUBLIC_BASE_URL="https://zyphextech.com"
NEXT_PUBLIC_SOCKET_URL="https://zyphextech.com"
```

**If localhost URLs found, update:**

```bash
nano .env
```

Change:
```env
NEXTAUTH_URL="http://localhost:3000"  ← WRONG
NEXT_PUBLIC_BASE_URL="http://localhost:3000"  ← WRONG
```

To:
```env
NEXTAUTH_URL="https://zyphextech.com"  ← CORRECT
NEXT_PUBLIC_BASE_URL="https://zyphextech.com"  ← CORRECT
NEXT_PUBLIC_SOCKET_URL="https://zyphextech.com"  ← CORRECT
```

Then rebuild:
```bash
pm2 stop zyphextech
npm run build
pm2 restart zyphextech
```

---

## CSP Issue Fix

The CSP error is from `next.config.mjs`. Update headers:

```bash
nano next.config.mjs
```

**Add/Update CSP headers:**

```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://cdn.jsdelivr.net wss://zyphextech.com ws://localhost:*",
              "frame-src 'self'",
            ].join('; ')
          }
        ]
      }
    ]
  }
}
```

---

## Quick Diagnostic Commands

Run these on VPS to diagnose:

```bash
# 1. Check if Next.js is running
curl http://localhost:3000

# 2. Check if build files exist
ls -la .next/static/chunks/

# 3. Check Nginx is serving files
curl -I https://zyphextech.com/_next/static/css/3b96518fdec919f9.css

# 4. Check PM2 logs
pm2 logs zyphextech --lines 50

# 5. Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

---

## Most Likely Issue

**99% chance it's one of these:**

1. **`.next` folder not deployed** → Run `npm run build`
2. **Nginx not configured for `_next/static`** → Update nginx config
3. **PM2 running `npm` instead of `server.js`** → Update PM2 config
4. **Wrong environment URLs** → Change localhost to zyphextech.com

---

## Complete Rebuild Steps (If All Else Fails)

```bash
# SSH into VPS
ssh deploy@66.116.199.219

# Go to project
cd /var/www/zyphextech

# Stop server
pm2 stop zyphextech

# Clean everything
rm -rf .next node_modules

# Fresh install
npm ci

# Build
npm run build

# Check build succeeded
ls -la .next/static/chunks/

# Start server
pm2 restart zyphextech

# Save PM2 state
pm2 save

# Check it's running
pm2 logs zyphextech
curl http://localhost:3000
```

---

## Expected Results After Fix

1. ✅ No MIME type errors
2. ✅ All chunks load successfully
3. ✅ CSS files served correctly
4. ✅ Website loads normally
5. ✅ No 400/404 errors in console

---

## If Still Not Working

**Check these:**

1. **DNS pointing correctly?**
   ```bash
   nslookup zyphextech.com
   ```

2. **SSL certificate valid?**
   ```bash
   sudo certbot certificates
   ```

3. **Port 3000 actually running?**
   ```bash
   netstat -tulpn | grep 3000
   ```

4. **Firewall blocking?**
   ```bash
   sudo ufw status
   ```

---

## Contact Me With

If the issue persists, provide:

1. Output of: `pm2 logs zyphextech --lines 50`
2. Output of: `ls -la .next/`
3. Output of: `cat ecosystem.config.js`
4. Output of: `sudo nginx -T | grep zyphextech -A 50`
5. Output of: `npm run build` (build logs)

---

**Status:** Deployment Issue (Not Related to Messaging Fixes)  
**Priority:** HIGH - Site Down  
**Action Required:** Run rebuild steps on VPS immediately

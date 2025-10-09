# Testing Strategy for Production Code

## Overview

You have **4 ways** to test your code before it goes live:

```
Option 1: Local Development Server (Fastest)
   ↓
Option 2: Local Production Build (Most Accurate)
   ↓
Option 3: Staging Server on VPS (Recommended for Large Changes)
   ↓
Option 4: Deploy to Main (Live) ← Only after testing above
```

---

## Option 1: Local Development Server (Fastest) ⚡

**Best for:** Quick testing, UI changes, feature development

### How to Use:

```bash
# On production branch
git checkout production
git pull origin production

# Start development server
npm run dev

# Open in browser
# http://localhost:3000
```

### What Gets Tested:
- ✅ UI/UX changes
- ✅ Component rendering
- ✅ Basic functionality
- ✅ Hot reload (instant updates)
- ✅ React hooks and state
- ⚠️ NOT exact production behavior

### Limitations:
- ❌ Not optimized like production
- ❌ May behave differently when built
- ❌ Build errors won't show
- ❌ Some Next.js features work differently

### When to Use:
- Daily development
- UI tweaks
- Component changes
- Quick iterations

---

## Option 2: Local Production Build (Most Accurate) 🎯

**Best for:** Final verification before deployment

### How to Use:

```bash
# On production branch
git checkout production

# Clean previous build
rm -rf .next
rm -rf node_modules/.cache

# Install fresh dependencies
npm install

# Build for production
npm run build

# If build succeeds, start production server locally
npm start

# Open in browser
# http://localhost:3000
```

### What Gets Tested:
- ✅ Exact production build
- ✅ Build errors (if any)
- ✅ Static page generation
- ✅ API routes
- ✅ Optimizations
- ✅ All Next.js features
- ✅ Same as VPS will build

### Limitations:
- ❌ Local database (not production data)
- ❌ Local environment variables
- ❌ No real VPS environment
- ⚠️ Takes 2-3 minutes to build

### When to Use:
- Before merging to main
- After major changes
- Testing build process
- **ALWAYS before deployment**

---

## Option 3: Staging Server on VPS (Professional Setup) 🚀

**Best for:** Testing with production environment and data

### What is a Staging Server?

A **staging server** is a separate environment on your VPS that mimics production but doesn't affect your live site.

```
VPS Structure:
├── Production (main) → port 3000 → zyphextech.com
└── Staging (production branch) → port 3001 → staging.zyphextech.com
```

### Setup Staging Server (One-Time Setup)

#### Step 1: Create Staging Directory on VPS

```bash
# SSH to VPS
ssh root@66.116.199.219

# Create staging directory
cd /var/www
mkdir zyphextech-staging
cd zyphextech-staging

# Clone repository
git clone https://github.com/isumitmalhotra/Zyphex-Tech.git .
git checkout production

# Copy environment file
cp /var/www/zyphextech/.env.production .env.production

# Update port in .env.production
echo "PORT=3001" >> .env.production
echo "NEXTAUTH_URL=http://staging.zyphextech.com" >> .env.production

# Install dependencies
npm install

# Build
npm run build

# Create PM2 ecosystem file for staging
cat > ecosystem.staging.js << 'EOF'
module.exports = {
  apps: [{
    name: 'zyphextech-staging',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/zyphextech-staging',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
}
EOF

# Start with PM2
pm2 start ecosystem.staging.js
pm2 save
```

#### Step 2: Configure Nginx for Staging

```bash
# Create Nginx config for staging
sudo nano /etc/nginx/sites-available/staging.zyphextech.com

# Add this configuration:
```

```nginx
server {
    listen 80;
    server_name staging.zyphextech.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/staging.zyphextech.com /etc/nginx/sites-enabled/

# Test Nginx config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

#### Step 3: Add DNS Record

Add this DNS record to your domain:

**Type:** A  
**Name:** staging  
**Value:** 66.116.199.219  
**TTL:** 600

#### Step 4: Deploy to Staging Script

Create a deployment script:

```bash
# On VPS: /var/www/zyphextech-staging/deploy-staging.sh
#!/bin/bash

echo "🔄 Deploying to Staging..."

cd /var/www/zyphextech-staging

# Pull latest from production branch
git fetch origin
git checkout production
git pull origin production

# Install dependencies
npm install

# Build
npm run build

# Restart PM2
pm2 restart zyphextech-staging

echo "✅ Staging deployment complete!"
echo "🌐 Test at: http://staging.zyphextech.com"
```

```bash
# Make executable
chmod +x /var/www/zyphextech-staging/deploy-staging.sh
```

### How to Use Staging Server:

```bash
# 1. On your local machine, push to production branch
git checkout production
git add .
git commit -m "Test feature X"
git push origin production

# 2. SSH to VPS and deploy to staging
ssh root@66.116.199.219
cd /var/www/zyphextech-staging
./deploy-staging.sh

# 3. Test on staging URL
# Open: http://staging.zyphextech.com
# Or: http://66.116.199.219:3001

# 4. If everything works, deploy to main
git checkout main
git merge production
git push origin main
```

### Benefits of Staging Server:
- ✅ Real VPS environment
- ✅ Production database (or separate staging DB)
- ✅ Real domain and SSL
- ✅ Test with production data
- ✅ Multiple team members can test
- ✅ No risk to live site
- ✅ Test deployment process

---

## Option 4: Quick VPS Test (Without Full Staging) 🔧

**Best for:** Quick checks without full staging setup

### Use Port 3001 Temporarily:

```bash
# SSH to VPS
ssh root@66.116.199.219

# Navigate to main directory
cd /var/www/zyphextech

# Temporarily switch to production branch
git fetch origin
git checkout production

# Build
npm run build

# Stop main PM2 process
pm2 stop zyphextech

# Start on different port
PORT=3001 npm start &

# Test: http://66.116.199.219:3001

# When done testing, switch back
git checkout main
npm run build
pm2 restart zyphextech
```

### Limitations:
- ⚠️ Main site is down during test
- ⚠️ Not suitable for long testing
- ⚠️ Only for quick verification

---

## Recommended Testing Flow

### For Small Changes (Daily Development):

```
1. Local Dev Server (npm run dev)
   ↓
2. Test in browser
   ↓
3. Local Production Build (npm run build)
   ↓
4. If succeeds → Deploy to main
```

### For Medium Changes (New Features):

```
1. Local Dev Server (npm run dev)
   ↓
2. Test thoroughly
   ↓
3. Local Production Build (npm run build + npm start)
   ↓
4. Test production build locally
   ↓
5. Deploy to main
```

### For Large Changes (Major Updates):

```
1. Local Dev Server (npm run dev)
   ↓
2. Test thoroughly
   ↓
3. Local Production Build (npm run build + npm start)
   ↓
4. Staging Server (deploy to staging.zyphextech.com)
   ↓
5. Test on staging with team/users
   ↓
6. If all good → Deploy to main
```

---

## Testing Checklist

### Before Merging to Main:

```bash
# On production branch
git checkout production

# Clean install
rm -rf node_modules .next
npm install

# Build test
npm run build
```

**Check for:**
- [ ] ✅ Build completes without errors
- [ ] ✅ No TypeScript errors
- [ ] ✅ No missing dependencies
- [ ] ✅ All pages generate successfully
- [ ] ✅ No Suspense boundary warnings
- [ ] ✅ No dynamic server usage errors

### After Build Succeeds:

```bash
# Start production server locally
npm start

# Open http://localhost:3000
```

**Test:**
- [ ] ✅ Homepage loads
- [ ] ✅ Login/Register works
- [ ] ✅ All navigation works
- [ ] ✅ New features work as expected
- [ ] ✅ No console errors
- [ ] ✅ API calls succeed

### Only Then Deploy:

```bash
git checkout main
git merge production
git push origin main
```

---

## Quick Commands Reference

### Local Development Testing:

```bash
# Fast iteration
npm run dev                    # Start dev server
# Test at: http://localhost:3000

# Production build test
npm run build                  # Build for production
npm start                      # Run production build
# Test at: http://localhost:3000
```

### Check for Common Issues:

```bash
# Check TypeScript
npm run type-check             # or: npx tsc --noEmit

# Check Linting
npm run lint

# Check for outdated packages
npm outdated

# Clean everything and start fresh
rm -rf node_modules .next
npm install
npm run build
```

### Staging Server (If Set Up):

```bash
# Deploy to staging
ssh root@66.116.199.219
cd /var/www/zyphextech-staging
./deploy-staging.sh

# Check staging status
pm2 status
pm2 logs zyphextech-staging

# Test: http://staging.zyphextech.com
```

---

## Comparison Table

| Method | Speed | Accuracy | Setup | Best For |
|--------|-------|----------|-------|----------|
| **Local Dev** | ⚡ Fast | 70% | None | Daily dev |
| **Local Build** | 🔸 Medium | 95% | None | Pre-deploy |
| **Staging Server** | 🔹 Slower | 100% | One-time | Large changes |
| **VPS Temp Test** | 🔹 Slower | 100% | None | Quick verify |

---

## My Recommendation for You

### Current Setup (No Staging Yet):

**Use This Workflow:**

```bash
# 1. Develop on production branch
git checkout production

# 2. Test with dev server (quick iterations)
npm run dev
# Make changes, test in browser

# 3. Before merging, test production build
npm run build
npm start
# Thoroughly test at http://localhost:3000

# 4. If everything works, deploy
git checkout main
git merge production
git push origin main
```

### Future Setup (With Staging):

Set up staging server (takes 30 minutes one-time) for:
- Testing with production data
- Team collaboration
- Client preview
- Complex features

---

## When Build Fails Locally

```bash
# Read the error carefully
npm run build 2>&1 | tee build-error.log

# Common fixes:
# 1. Missing Suspense → Wrap in <Suspense>
# 2. Dynamic API routes → Add: export const dynamic = 'force-dynamic'
# 3. useSearchParams → Wrap component in Suspense
# 4. Missing dependencies → npm install <package>
# 5. TypeScript errors → Fix type issues

# After fixing
npm run build  # Try again

# If still fails, check:
cat build-error.log
```

---

## Summary

**Question:** How do I test before deploying to live?

**Answer:** 

1. **Quick Test (5 minutes):**
   ```bash
   npm run dev
   # Test at http://localhost:3000
   ```

2. **Production Test (5 minutes):**
   ```bash
   npm run build    # Must succeed
   npm start        # Test production build
   ```

3. **Deploy (if tests pass):**
   ```bash
   git checkout main
   git merge production
   git push origin main
   ```

**For more thorough testing:** Set up staging server (optional but recommended for professional projects)

---

**Current Status:** You can test locally with `npm run build` + `npm start` ✅  
**Staging Server:** Optional (can set up later if needed)  
**Workflow:** Always run `npm run build` on production branch before merging to main 🎯

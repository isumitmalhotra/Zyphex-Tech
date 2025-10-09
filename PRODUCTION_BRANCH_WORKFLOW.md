# Production Branch Workflow

## Branch Strategy

We now use a **two-branch workflow** for safer deployments:

```
development (local) 
    ↓
production (testing)
    ↓
main (live deployment)
```

---

## Branches

### 1. `main` - Production (Live)
- **Auto-deploys** to VPS via CI/CD
- Only merge from `production` branch
- Always stable and tested code
- Protected branch

### 2. `production` - Staging/Testing
- **Manual testing** environment
- Build verification before going live
- Merge feature branches here first
- Test thoroughly before merging to `main`

### 3. Feature branches (optional)
- Create for specific features: `feature/user-dashboard-fix`
- Merge to `production` for testing
- Delete after merged

---

## Workflow

### Daily Development Flow

```bash
# 1. Create or switch to production branch
git checkout -b production
# or if exists: git checkout production

# 2. Make your changes
# ... edit files ...

# 3. Commit to production
git add .
git commit -m "Your commit message"
git push origin production

# 4. Test the changes
# - Build locally: npm run build
# - Test features manually
# - Check for errors

# 5. If everything works, merge to main
git checkout main
git merge production
git push origin main
# This triggers CI/CD deployment to VPS
```

---

## Setup Instructions

### Step 1: Create Production Branch

```bash
cd C:\Projects\Zyphex-Tech

# Create production branch from current main
git checkout main
git pull origin main
git checkout -b production
git push -u origin production
```

### Step 2: Set Main as Protected (GitHub)

1. Go to: https://github.com/isumitmalhotra/Zyphex-Tech/settings/branches
2. Click **Add rule**
3. Branch name pattern: `main`
4. Enable:
   - ☑️ Require a pull request before merging
   - ☑️ Require status checks to pass before merging
5. Save changes

### Step 3: Update CI/CD to Only Deploy from Main

The current workflow already only deploys on push to `main`, so we're good!

---

## Usage Examples

### Example 1: Fix a Bug

```bash
# Work on production branch
git checkout production
git pull origin production

# Fix the bug
# ... edit files ...

# Commit
git add .
git commit -m "Fix: User dashboard loading issue"

# Push to production for testing
git push origin production

# Test manually on production branch
npm run build
# If build succeeds and tests pass...

# Merge to main for deployment
git checkout main
git merge production
git push origin main
# Triggers deployment
```

### Example 2: Add New Feature

```bash
# Start from production
git checkout production
git pull origin production

# Create feature branch (optional)
git checkout -b feature/new-dashboard

# Develop feature
# ... edit files ...
git add .
git commit -m "Add new dashboard widget"

# Merge back to production
git checkout production
git merge feature/new-dashboard

# Test on production
npm run build
npm run dev
# Test the feature

# If good, merge to main
git checkout main
git merge production
git push origin main

# Clean up feature branch
git branch -d feature/new-dashboard
```

### Example 3: Emergency Hotfix

```bash
# For critical fixes, you can go directly to main
git checkout main
git pull origin main

# Create hotfix branch
git checkout -b hotfix/critical-security-fix

# Fix the issue
# ... edit files ...
git add .
git commit -m "Hotfix: Security vulnerability patch"

# Test the build
npm run build

# If build succeeds, merge directly to main
git checkout main
git merge hotfix/critical-security-fix
git push origin main

# Also merge to production to keep it in sync
git checkout production
git merge main
git push origin production

# Delete hotfix branch
git branch -d hotfix/critical-security-fix
```

---

## Build Verification Before Deployment

### Always Test Before Merging to Main

```bash
# On production branch
git checkout production

# Pull latest
git pull origin production

# Clean install
rm -rf node_modules .next
npm install

# Run build
npm run build

# If build succeeds ✅
# → Safe to merge to main

# If build fails ❌
# → Fix errors first
# → Commit fixes to production
# → Test again
```

---

## CI/CD Behavior

### Main Branch (Auto-Deploy)
```yaml
on:
  push:
    branches: [ main ]
```

**What happens:**
1. Push to `main` triggers GitHub Actions
2. Code is pulled on VPS
3. Dependencies installed
4. Database migrations run
5. Next.js build
6. PM2 restarts app
7. Nginx reloads

### Production Branch (Manual Test)
```yaml
# No auto-deployment
# Only local testing
```

**What to do:**
1. Push to `production`
2. Test locally: `npm run build`
3. If successful → merge to `main`
4. `main` auto-deploys

---

## Quick Reference Commands

```bash
# Create production branch (first time only)
git checkout -b production
git push -u origin production

# Daily workflow: Work on production
git checkout production
git pull origin production
# ... make changes ...
git add .
git commit -m "Your changes"
git push origin production

# Test build
npm run build

# Deploy to live (if build succeeds)
git checkout main
git merge production
git push origin main

# Sync production with main (if main was updated)
git checkout production
git merge main
git push origin production

# Check current branch
git branch

# See all branches
git branch -a

# Delete old feature branch
git branch -d feature/old-feature
```

---

## Safety Checks

### Before Merging to Main

- [ ] ✅ Build succeeds locally on production branch
- [ ] ✅ No TypeScript errors
- [ ] ✅ No ESLint errors (or acceptable warnings)
- [ ] ✅ All tests pass (if you have tests)
- [ ] ✅ Feature works as expected
- [ ] ✅ No console errors in browser
- [ ] ✅ Database migrations tested (if any)

### After Deploying to Main

- [ ] ✅ CI/CD workflow completes successfully
- [ ] ✅ Website loads without errors
- [ ] ✅ New feature works on live site
- [ ] ✅ No broken pages
- [ ] ✅ PM2 shows app running: `ssh` then `pm2 status`

---

## Troubleshooting

### Build fails on production branch

```bash
# See the full error
npm run build 2>&1 | tee build-error.log

# Common fixes:
# 1. TypeScript errors → Fix type issues
# 2. Missing dependencies → npm install
# 3. API routes → Add 'use client' or dynamic export
# 4. useSearchParams → Wrap in Suspense
```

### Merge conflicts between production and main

```bash
# Update production with main's changes
git checkout production
git merge main

# Resolve conflicts
# ... edit files ...

git add .
git commit -m "Merge main into production"
git push origin production
```

### Need to revert a deployment

```bash
# Find the last good commit
git log --oneline

# Revert to that commit
git checkout main
git revert <commit-hash>
git push origin main

# Or reset (dangerous!)
git reset --hard <commit-hash>
git push --force origin main
```

---

## Current Build Errors Fixed

### Error 1: useSearchParams not wrapped in Suspense
**Fixed:** Wrapped all auth pages in Suspense boundary

**Files:**
- `app/login/page.tsx`
- `app/register/page.tsx`  
- `app/forgot-password/page.tsx`

### Error 2: Dashboard API dynamic server usage
**Fixed:** Added `export const dynamic = 'force-dynamic'`

**File:**
- `app/api/user/dashboard/route.ts`

---

## Next Steps

1. **Create production branch:**
   ```bash
   git checkout -b production
   git push -u origin production
   ```

2. **Test the fixes:**
   ```bash
   npm run build
   ```

3. **If build succeeds, deploy:**
   ```bash
   git checkout main
   git merge production
   git push origin main
   ```

4. **From now on, always:**
   - Develop on `production` branch
   - Test with `npm run build`
   - Merge to `main` only when ready
   - `main` auto-deploys to VPS

---

**Status:** Production workflow documented and build errors fixed! ✅

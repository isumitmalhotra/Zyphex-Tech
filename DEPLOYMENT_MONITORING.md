# 🚀 CI/CD Deployment Monitoring Guide

**Last Updated:** October 8, 2025  
**CI/CD Status:** ✅ Active & Automated

---

## 📊 Quick Status Check

### GitHub Actions Workflow
🔗 **View Live Status:** https://github.com/isumitmalhotra/Zyphex-Tech/actions

Current workflow: `Deploy to VPS`
- **Trigger:** Automatic on push to `main` branch
- **Also available:** Manual trigger via workflow_dispatch

---

## 🔍 How to Monitor Deployment

### 1. GitHub Actions Dashboard

**Steps:**
1. Go to: https://github.com/isumitmalhotra/Zyphex-Tech
2. Click on **"Actions"** tab
3. Look for the latest workflow run
4. Click on the run to see detailed logs

**Workflow Stages:**
- ✅ 📥 Checkout code
- ✅ 🔑 Setup SSH
- ✅ 🔐 Add VPS to known hosts
- ✅ 🚀 Deploy to VPS
  - Pull latest code
  - Install dependencies
  - Generate Prisma Client
  - Run database migrations
  - **Build application** (previously failing, now fixed)
  - Restart PM2
  - Health check
- ✅ 📊 Deployment Summary

---

### 2. Real-time VPS Monitoring

#### SSH into VPS:
```bash
# Using deploy user (recommended)
ssh deploy@66.116.199.219

# Or using root user
ssh root@66.116.199.219
```

#### Check Application Status:
```bash
# PM2 status
pm2 status

# View logs in real-time
pm2 logs zyphextech --lines 50

# Follow logs
pm2 logs zyphextech -f

# Check memory and CPU usage
pm2 monit
```

#### Check Build Output:
```bash
# Navigate to app directory
cd /var/www/zyphextech

# Check latest git commit
git log -1 --oneline

# Verify .next build directory
ls -la .next/

# Check build artifacts
du -sh .next/
```

#### Application Health Check:
```bash
# Check if app is responding
curl http://localhost:3000/api/health

# Check homepage
curl -I http://localhost:3000

# Test specific endpoints
curl http://localhost:3000/api/reports
```

---

### 3. Website Verification

After deployment completes, verify these URLs:

**Public URLs:**
- 🌐 Homepage: https://www.zyphextech.com
- 📝 Blog: https://www.zyphextech.com/blog
- 💼 Portfolio: https://www.zyphextech.com/portfolio
- 🔑 Login: https://www.zyphextech.com/login
- ❌ Error Page: https://www.zyphextech.com/auth/error

**API Endpoints (require auth):**
- 📊 Reports: https://www.zyphextech.com/api/reports
- 📋 Templates: https://www.zyphextech.com/api/reports/templates

---

## 🐛 Troubleshooting Common Issues

### Issue 1: Build Fails on VPS

**Symptoms:**
```
Error: Process completed with exit code 1
```

**Quick Fixes:**
```bash
# SSH to VPS
ssh root@116.203.64.91 -p 222

# Check build logs
cd /var/www/zyphextech
npm run build 2>&1 | tee build.log

# Check for common issues
cat build.log | grep -i error
```

**Solutions:**
- Check `CI_CD_BUILD_FIXES.md` for known issues
- Verify all dynamic routes have `export const dynamic = 'force-dynamic'`
- Ensure no empty page files exist

---

### Issue 2: Deployment Success but App Not Working

**Symptoms:**
- GitHub Actions shows ✅ success
- But website returns errors

**Quick Fixes:**
```bash
# Check PM2 status
pm2 status zyphextech

# Restart if needed
pm2 restart zyphextech

# Check for errors
pm2 logs zyphextech --err --lines 50

# Verify environment variables
pm2 env 0  # Replace 0 with actual PM2 ID
```

---

### Issue 3: Health Check Fails

**Symptoms:**
```
❌ Health check failed! Rolling back...
```

**Quick Fixes:**
```bash
# Check if port 3000 is accessible
curl http://localhost:3000/_health

# Check if app is listening
netstat -tlnp | grep 3000

# Check PM2 logs
pm2 logs zyphextech

# Manual restart
pm2 restart zyphextech
pm2 save
```

---

### Issue 4: Database Migration Errors

**Symptoms:**
```
Error running database migrations
```

**Quick Fixes:**
```bash
# SSH to VPS
cd /var/www/zyphextech

# Check migration status
npx prisma migrate status

# Force migration
npx prisma migrate deploy

# Reset if needed (⚠️ DESTRUCTIVE)
# npx prisma migrate reset --force
```

---

## 📈 Performance Monitoring

### Check Application Performance:

```bash
# CPU and Memory usage
pm2 monit

# Detailed metrics
pm2 show zyphextech

# Check response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000
```

### Create curl-format.txt:
```bash
cat > curl-format.txt << EOF
    time_namelookup:  %{time_namelookup}\n
       time_connect:  %{time_connect}\n
    time_appconnect:  %{time_appconnect}\n
   time_pretransfer:  %{time_pretransfer}\n
      time_redirect:  %{time_redirect}\n
 time_starttransfer:  %{time_starttransfer}\n
                    ----------\n
         time_total:  %{time_total}\n
EOF
```

---

## 🔔 Notifications

### Get Notified on Deployment Status

Currently, deployment notifications are via GitHub Actions UI.

**Future Enhancements:**
- Slack/Discord webhooks
- Email notifications
- SMS alerts for critical failures

---

## 📝 Deployment Checklist

Before pushing to `main`:

- [ ] Run local build: `npm run build`
- [ ] Test locally: `npm start`
- [ ] Check for console errors
- [ ] Verify dynamic routes have proper config
- [ ] Test API endpoints
- [ ] Check database migrations
- [ ] Review `.env` variables needed

After pushing to `main`:

- [ ] Monitor GitHub Actions workflow
- [ ] Wait for "✅ Deployment successful!" message
- [ ] Verify website loads at https://www.zyphextech.com
- [ ] Test critical pages (login, blog, portfolio)
- [ ] Check PM2 status via SSH
- [ ] Review logs for any warnings

---

## 🎯 Key Metrics to Watch

### Build Time
- **Target:** < 2 minutes
- **Current:** ~1-2 minutes (varies with cache)

### Deployment Time
- **Target:** < 5 minutes end-to-end
- **Stages:**
  - Git pull: ~5-10 seconds
  - NPM install: ~30-60 seconds
  - Prisma generate: ~5-10 seconds
  - Build: ~60-90 seconds
  - PM2 restart: ~5-10 seconds
  - Health check: ~5 seconds

### Application Health
- **Response Time:** < 500ms for homepage
- **API Response:** < 1s for authenticated endpoints
- **Memory Usage:** < 1GB RSS
- **CPU Usage:** < 50% average

---

## 🚨 Emergency Procedures

### Quick Rollback

If deployment causes critical issues:

```bash
# SSH to VPS
ssh deploy@66.116.199.219

# Navigate to app
cd /var/www/zyphextech

# Rollback to previous commit
git reset --hard HEAD~1

# Reinstall dependencies
npm ci

# Rebuild
npm run build

# Restart
pm2 restart zyphextech
pm2 save
```

### Stop Application

```bash
pm2 stop zyphextech
```

### Start Application

```bash
pm2 start zyphextech
```

### View Environment

```bash
pm2 env 0  # Check PM2 process ID first with: pm2 list
```

---

## 📚 Related Documentation

- [CI_CD_BUILD_FIXES.md](./CI_CD_BUILD_FIXES.md) - Build error solutions
- [PRODUCTION_DEPLOYMENT_GUIDE.md](./PRODUCTION_DEPLOYMENT_GUIDE.md) - Full setup guide
- [GitHub Actions Workflow](./.github/workflows/deploy-vps.yml) - CI/CD configuration

---

## 🆘 Support Contacts

**Development Team:**
- GitHub Issues: https://github.com/isumitmalhotra/Zyphex-Tech/issues
- Repository: https://github.com/isumitmalhotra/Zyphex-Tech

**VPS Provider:**
- IP: 66.116.199.219
- Port: 22 (standard SSH)
- Deploy User: deploy
- Root User: root

---

## ✅ Current Status

**Deployment Pipeline:** ✅ Fully Operational  
**Last Successful Deploy:** October 8, 2025  
**Build Status:** ✅ Passing  
**Application Status:** ✅ Running  
**Health Check:** ✅ Healthy

---

**Pro Tip:** Keep this guide bookmarked for quick reference during deployments! 🚀

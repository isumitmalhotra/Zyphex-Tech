# VPS Deployment - Start Here! 🚀

**Deploy Zyphex Tech Platform to your VPS in 2 hours with automated CI/CD**

---

## 🎯 Quick Navigation

### 📖 Choose Your Guide

| Guide | Best For | Time | Difficulty |
|-------|----------|------|------------|
| **[Quick Start](./VPS_DEPLOYMENT_QUICKSTART.md)** | First-time deployment | 2 hours | ⭐⭐ Easy |
| **[Complete Guide](./VPS_DEPLOYMENT_GUIDE.md)** | Deep understanding | 3-4 hours | ⭐⭐⭐ Moderate |
| **[Summary](./VPS_DEPLOYMENT_SUMMARY.md)** | Overview & reference | 15 min | ⭐ Very Easy |

---

## 🚀 Fastest Path to Production

### Prerequisites (5 minutes)

- [ ] VPS access (root@66.116.199.219)
- [ ] Domain pointing to VPS (www.zyphextech.com)
- [ ] GitHub repository access
- [ ] API keys ready (database password, Redis password, etc.)

### Step-by-Step (2 hours)

1. **📥 Upload Setup Script** (5 minutes)
   ```powershell
   # On your local machine
   cd C:\Projects\Zyphex-Tech
   scp scripts/vps-setup.sh root@66.116.199.219:/root/
   ```

2. **⚙️ Run Automated Setup** (15 minutes)
   ```bash
   # On VPS
   ssh root@66.116.199.219
   chmod +x /root/vps-setup.sh
   ./vps-setup.sh
   ```
   This installs: Node.js, PostgreSQL, Redis, Nginx, Certbot, PM2

3. **🗄️ Configure Services** (30 minutes)
   - Setup PostgreSQL database
   - Configure Redis password
   - Setup Nginx configuration
   
   *See: [VPS_DEPLOYMENT_QUICKSTART.md Phase 2](./VPS_DEPLOYMENT_QUICKSTART.md#phase-2-service-configuration-30-minutes)*

4. **🔒 Get SSL Certificate** (15 minutes)
   ```bash
   sudo certbot certonly --standalone \
     -d www.zyphextech.com \
     -d zyphextech.com \
     --email your-email@example.com
   ```

5. **📦 Deploy Application** (20 minutes)
   ```bash
   # As deploy user
   su - deploy
   cd /var/www/zyphextech
   git clone https://github.com/isumitmalhotra/Zyphex-Tech.git .
   # Configure .env.production
   npm ci && npx prisma generate && npm run build
   pm2 start ecosystem.config.js
   ```

6. **🤖 Setup Auto-Deployment** (20 minutes)
   - Generate SSH key for GitHub Actions
   - Add secrets to GitHub repository
   - Push code to trigger first automated deployment
   
   *See: [VPS_DEPLOYMENT_QUICKSTART.md Phase 5](./VPS_DEPLOYMENT_QUICKSTART.md#phase-5-setup-github-actions-cicd-20-minutes)*

7. **✅ Test & Validate** (15 minutes)
   - Visit https://www.zyphextech.com
   - Test all features
   - Check logs and monitoring

---

## 📁 What You Get

### 🛠️ Files Created

```
✅ VPS_DEPLOYMENT_GUIDE.md          (1,500 lines - Complete guide)
✅ VPS_DEPLOYMENT_QUICKSTART.md     (800 lines - Fast deployment)
✅ VPS_DEPLOYMENT_SUMMARY.md        (400 lines - Overview)
✅ VPS_DEPLOYMENT_README.md         (This file - Navigation)
✅ ecosystem.config.js              (PM2 configuration)
✅ .github/workflows/deploy-vps.yml (GitHub Actions CI/CD)
✅ scripts/vps-setup.sh             (Automated VPS setup)
✅ scripts/deploy-manual.sh         (Manual deployment)
✅ configs/nginx/zyphextech.conf    (Nginx configuration)
```

### 🚀 Features Enabled

✅ **Automated Deployments** - Push to GitHub → Auto-deploy to VPS  
✅ **SSL/HTTPS** - Let's Encrypt with auto-renewal  
✅ **Process Management** - PM2 with auto-restart  
✅ **Reverse Proxy** - Nginx with rate limiting  
✅ **Database** - PostgreSQL 15 optimized for 4GB RAM  
✅ **Caching** - Redis for performance  
✅ **Monitoring** - Health checks every 5 minutes  
✅ **Logging** - Application and access logs with rotation  
✅ **Security** - Firewall, security headers, SSL  

---

## 🔄 Your New Workflow

After deployment, updating your website is simple:

```powershell
# 1. Make changes locally
# Edit code, test locally

# 2. Commit and push
git add .
git commit -m "Update feature"
git push origin main

# 3. GitHub Actions automatically:
#    → Pulls code to VPS
#    → Installs dependencies
#    → Runs migrations
#    → Builds application
#    → Restarts with PM2
#    → Website is live! ✅
```

**Total time:** 2-3 minutes 🚀

---

## 📊 Your Production Stack

```
Internet (HTTPS)
      ↓
   Nginx (Port 443)
   - Reverse Proxy
   - SSL Termination
   - Rate Limiting
      ↓
   PM2 (Port 3000)
   - Process Manager
   - Auto Restart
   - Clustering
      ↓
   Next.js App
   - Server Rendering
   - API Routes
   ↙          ↘
PostgreSQL    Redis
Database      Cache
```

---

## 🆘 Quick Help

### Common Commands

```bash
# Check application status
ssh deploy@66.116.199.219 "pm2 status"

# View logs
ssh deploy@66.116.199.219 "pm2 logs zyphextech"

# Restart application
ssh deploy@66.116.199.219 "pm2 restart zyphextech"

# Check all services
ssh root@66.116.199.219 "systemctl status nginx postgresql-15 redis"
```

### Troubleshooting

**Site is down?**
```bash
ssh root@66.116.199.219
systemctl status nginx
su - deploy -c "pm2 status"
```

**Deployment failed?**
- Check: https://github.com/isumitmalhotra/Zyphex-Tech/actions
- View logs: `ssh deploy@66.116.199.219 "pm2 logs --err"`

**Database issues?**
```bash
ssh root@66.116.199.219
systemctl status postgresql-15
```

---

## 📚 Documentation Index

### Getting Started
1. **Start Here:** [VPS_DEPLOYMENT_README.md](./VPS_DEPLOYMENT_README.md) (this file)
2. **Quick Deploy:** [VPS_DEPLOYMENT_QUICKSTART.md](./VPS_DEPLOYMENT_QUICKSTART.md)
3. **Full Guide:** [VPS_DEPLOYMENT_GUIDE.md](./VPS_DEPLOYMENT_GUIDE.md)
4. **Overview:** [VPS_DEPLOYMENT_SUMMARY.md](./VPS_DEPLOYMENT_SUMMARY.md)

### Configuration Files
- PM2: [ecosystem.config.js](./ecosystem.config.js)
- Nginx: [configs/nginx/zyphextech.conf](./configs/nginx/zyphextech.conf)
- GitHub Actions: [.github/workflows/deploy-vps.yml](./.github/workflows/deploy-vps.yml)

### Scripts
- Initial Setup: [scripts/vps-setup.sh](./scripts/vps-setup.sh)
- Manual Deploy: [scripts/deploy-manual.sh](./scripts/deploy-manual.sh)

---

## 🎯 Recommended Path

### For First-Time Deployment

1. **Read** this README (you're here! ✅)
2. **Follow** [VPS_DEPLOYMENT_QUICKSTART.md](./VPS_DEPLOYMENT_QUICKSTART.md)
3. **Reference** [VPS_DEPLOYMENT_SUMMARY.md](./VPS_DEPLOYMENT_SUMMARY.md) as needed
4. **Deep dive** into [VPS_DEPLOYMENT_GUIDE.md](./VPS_DEPLOYMENT_GUIDE.md) for troubleshooting

### For Quick Reference

- **Commands:** [VPS_DEPLOYMENT_SUMMARY.md](./VPS_DEPLOYMENT_SUMMARY.md#quick-commands-reference)
- **Troubleshooting:** [VPS_DEPLOYMENT_QUICKSTART.md](./VPS_DEPLOYMENT_QUICKSTART.md#troubleshooting)
- **Maintenance:** [VPS_DEPLOYMENT_SUMMARY.md](./VPS_DEPLOYMENT_SUMMARY.md#maintenance-tasks)

---

## ⏱️ Time Estimate

| Task | Time |
|------|------|
| Read documentation | 30 min |
| Run automated setup | 15 min |
| Configure services | 30 min |
| Get SSL certificate | 15 min |
| Deploy application | 20 min |
| Setup CI/CD | 20 min |
| Test & validate | 15 min |
| **Total** | **~2 hours** |

---

## ✅ Pre-Deployment Checklist

Before you start, make sure you have:

### Access & Credentials
- [ ] VPS root access (IP: 66.116.199.219)
- [ ] SSH client installed
- [ ] GitHub repository access
- [ ] Domain control (www.zyphextech.com)

### API Keys & Services
- [ ] Database password (strong, secure)
- [ ] Redis password (strong, secure)
- [ ] NextAuth secret (`openssl rand -base64 32`)
- [ ] SendGrid API key or SMTP credentials
- [ ] Google OAuth credentials
- [ ] GitHub OAuth credentials
- [ ] Stripe live keys
- [ ] Azure Storage credentials (optional)
- [ ] Sentry DSN (optional)

### Local Setup
- [ ] Project cloned: `C:\Projects\Zyphex-Tech`
- [ ] Git configured and tested
- [ ] PowerShell or SSH client ready

---

## 🎉 After Deployment

### Your website will be live at:
- 🌐 **https://www.zyphextech.com**
- 🔒 **SSL/HTTPS enabled**
- 🤖 **Auto-deployments active**
- 📊 **Monitoring running**

### What to do next:
1. Test all features thoroughly
2. Setup monitoring alerts (Sentry, UptimeRobot)
3. Configure automated backups
4. Document any custom configurations
5. Train your team on the deployment process

---

## 💡 Pro Tips

**✨ Quick Commands:**
- Deploy manually: `npm run deploy:vps` (from local machine)
- Check status: `ssh deploy@66.116.199.219 "pm2 status"`
- View logs: `ssh deploy@66.116.199.219 "pm2 logs --lines 100"`

**⚡ Speed Up Deployments:**
- Use GitHub Actions (automatically faster)
- Enable PM2 cluster mode when you have more CPU cores
- Configure Redis caching properly

**🔒 Security Best Practices:**
- Change default passwords
- Enable fail2ban after deployment
- Setup IP whitelisting for admin routes
- Regular security updates: `dnf update -y`

**📊 Monitoring:**
- Check logs daily
- Setup Sentry for error tracking
- Use UptimeRobot for uptime monitoring
- Monitor disk space weekly

---

## 📞 Support & Resources

### Documentation
- **Quick Start:** [VPS_DEPLOYMENT_QUICKSTART.md](./VPS_DEPLOYMENT_QUICKSTART.md)
- **Complete Guide:** [VPS_DEPLOYMENT_GUIDE.md](./VPS_DEPLOYMENT_GUIDE.md)
- **Summary:** [VPS_DEPLOYMENT_SUMMARY.md](./VPS_DEPLOYMENT_SUMMARY.md)

### External Resources
- **Next.js Docs:** https://nextjs.org/docs
- **PM2 Docs:** https://pm2.keymetrics.io/docs
- **Nginx Docs:** https://nginx.org/en/docs/
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Let's Encrypt:** https://letsencrypt.org/docs/

### Quick Links
- **GitHub Repository:** https://github.com/isumitmalhotra/Zyphex-Tech
- **GitHub Actions:** https://github.com/isumitmalhotra/Zyphex-Tech/actions
- **Production Site:** https://www.zyphextech.com

---

## 🚀 Ready to Deploy?

**Start with:** [VPS_DEPLOYMENT_QUICKSTART.md](./VPS_DEPLOYMENT_QUICKSTART.md)

**Questions?** Read [VPS_DEPLOYMENT_GUIDE.md](./VPS_DEPLOYMENT_GUIDE.md) for detailed explanations.

**Need overview?** Check [VPS_DEPLOYMENT_SUMMARY.md](./VPS_DEPLOYMENT_SUMMARY.md).

---

**Let's get your website live! 🎯**

**Next Step:** Open [VPS_DEPLOYMENT_QUICKSTART.md](./VPS_DEPLOYMENT_QUICKSTART.md) and follow Phase 1!

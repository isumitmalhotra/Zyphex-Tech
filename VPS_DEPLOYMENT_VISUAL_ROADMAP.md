# 🗺️ VPS Deployment Visual Roadmap

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                    🚀 ZYPHEX TECH VPS DEPLOYMENT                        │
│                    From GitHub to Production in 23 Minutes              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘


╔═════════════════════════════════════════════════════════════════════════╗
║                        📍 WHERE ARE YOU NOW?                            ║
╚═════════════════════════════════════════════════════════════════════════╝

┌─ START HERE ────────────────────────────────────────────────────────────┐
│                                                                         │
│  ❌ GitHub Actions Error: "ssh-private-key argument is empty"          │
│  ❓ What to do? → Follow this roadmap ↓                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════
                              ⏱️  TIMELINE
═══════════════════════════════════════════════════════════════════════════

│
├─ 00:00 ─────────────────────────────────────────────────────────────────
│                                                                         
│  📖 READ: IMMEDIATE_ACTION_REQUIRED.md (2 min)
│  └─ Understand the problem and solution
│
├─ 00:02 ─────────────────────────────────────────────────────────────────
│                                                                         
│  🔐 STEP 1: SSH to VPS (1 min)
│  
│     Local Machine:
│     ┌────────────────────────────────────────────┐
│     │ ssh root@66.116.199.219                    │
│     │ Password: ZT@DY#machine01                  │
│     └────────────────────────────────────────────┘
│
├─ 00:03 ─────────────────────────────────────────────────────────────────
│                                                                         
│  📦 STEP 2: Download Setup Script (30 sec)
│  
│     VPS Terminal:
│     ┌────────────────────────────────────────────────────────────────┐
│     │ cd /root                                                       │
│     │ curl -o setup.sh https://raw.githubusercontent.com/           │
│     │   isumitmalhotra/Zyphex-Tech/main/scripts/                    │
│     │   vps-setup-almalinux.sh                                       │
│     └────────────────────────────────────────────────────────────────┘
│
├─ 00:04 ─────────────────────────────────────────────────────────────────
│                                                                         
│  ⚙️  STEP 3: Run Automated Setup (10 min)
│  
│     VPS Terminal:
│     ┌────────────────────────────────────────────┐
│     │ chmod +x setup.sh                          │
│     │ ./setup.sh                                 │
│     └────────────────────────────────────────────┘
│  
│     🔄 Automated Tasks Running:
│     ┌────────────────────────────────────────────────────────────────┐
│     │ [1/14] ✓ Updating system packages...                          │
│     │ [2/14] ✓ Creating deploy user...                              │
│     │ [3/14] ✓ Configuring firewall (ports 22, 80, 443)...          │
│     │ [4/14] ✓ Installing Node.js 20...                             │
│     │ [5/14] ✓ Installing PostgreSQL 15...                          │
│     │ [6/14] ✓ Installing Redis...                                  │
│     │ [7/14] ✓ Installing Nginx...                                  │
│     │ [8/14] ✓ Installing Certbot (SSL)...                          │
│     │ [9/14] ✓ Creating app directory /var/www/zyphextech...        │
│     │ [10/14] ✓ Cloning repository from GitHub...                   │
│     │ [11/14] ✓ Installing PM2 process manager...                   │
│     │ [12/14] ✓ Setting up health monitoring...                     │
│     │ [13/14] ✓ Configuring log rotation...                         │
│     │ [14/14] ✓ Configuring SELinux...                              │
│     └────────────────────────────────────────────────────────────────┘
│
├─ 00:14 ─────────────────────────────────────────────────────────────────
│                                                                         
│  🔑 STEP 4: Generate SSH Key for GitHub (2 min)
│  
│     VPS Terminal:
│     ┌────────────────────────────────────────────────────────────────┐
│     │ su - deploy                    # Switch to deploy user         │
│     │ ssh-keygen -t ed25519 \                                        │
│     │   -C "github-deploy" \                                         │
│     │   -f ~/.ssh/github_deploy \                                    │
│     │   -N ""                                                        │
│     │                                                                │
│     │ cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys        │
│     │ chmod 600 ~/.ssh/authorized_keys                              │
│     │                                                                │
│     │ # COPY THIS OUTPUT:                                            │
│     │ cat ~/.ssh/github_deploy                                       │
│     └────────────────────────────────────────────────────────────────┘
│  
│     Expected Output (COPY EVERYTHING):
│     ┌────────────────────────────────────────────────────────────────┐
│     │ -----BEGIN OPENSSH PRIVATE KEY-----                            │
│     │ b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAA...            │
│     │ ... (many lines) ...                                           │
│     │ -----END OPENSSH PRIVATE KEY-----                              │
│     └────────────────────────────────────────────────────────────────┘
│
├─ 00:16 ─────────────────────────────────────────────────────────────────
│                                                                         
│  🔐 STEP 5: Add Secrets to GitHub (3 min)
│  
│     Browser:
│     ┌────────────────────────────────────────────────────────────────┐
│     │ 1. Go to: github.com/isumitmalhotra/Zyphex-Tech/              │
│     │           settings/secrets/actions                             │
│     │                                                                │
│     │ 2. Click "New repository secret" (4 times)                    │
│     │                                                                │
│     │ Secret 1:                                                      │
│     │   Name:  VPS_SSH_PRIVATE_KEY                                  │
│     │   Value: [Paste private key from Step 4]                      │
│     │                                                                │
│     │ Secret 2:                                                      │
│     │   Name:  VPS_HOST                                             │
│     │   Value: 66.116.199.219                                       │
│     │                                                                │
│     │ Secret 3:                                                      │
│     │   Name:  VPS_USER                                             │
│     │   Value: deploy                                               │
│     │                                                                │
│     │ Secret 4:                                                      │
│     │   Name:  VPS_PORT                                             │
│     │   Value: 22                                                   │
│     │                                                                │
│     │ 3. Verify all 4 secrets are listed ✓                          │
│     └────────────────────────────────────────────────────────────────┘
│
├─ 00:19 ─────────────────────────────────────────────────────────────────
│                                                                         
│  ⚙️  STEP 6: Configure Environment Variables (2 min)
│  
│     VPS Terminal (as deploy user):
│     ┌────────────────────────────────────────────────────────────────┐
│     │ cd /var/www/zyphextech                                         │
│     │ nano .env.production                                           │
│     │                                                                │
│     │ # Add these lines:                                             │
│     │ DATABASE_URL="postgresql://zyphex:                            │
│     │   zyphex_secure_pass_2024@localhost:5432/zyphextech"          │
│     │ REDIS_URL="redis://:zyphex_redis_pass_2024@localhost:6379"    │
│     │ NEXTAUTH_URL="https://www.zyphextech.com"                     │
│     │ NEXTAUTH_SECRET="[run: openssl rand -base64 32]"              │
│     │ NODE_ENV="production"                                          │
│     │ PORT=3000                                                      │
│     │                                                                │
│     │ # Save: Ctrl+X, Y, Enter                                       │
│     │ chmod 600 .env.production                                      │
│     └────────────────────────────────────────────────────────────────┘
│
├─ 00:21 ─────────────────────────────────────────────────────────────────
│                                                                         
│  🌐 STEP 7: Setup Nginx & SSL (2 min)
│  
│     VPS Terminal:
│     ┌────────────────────────────────────────────────────────────────┐
│     │ # Copy Nginx config                                            │
│     │ sudo cp /var/www/zyphextech/configs/nginx/                    │
│     │   zyphextech.conf /etc/nginx/sites-available/                 │
│     │                                                                │
│     │ sudo ln -s /etc/nginx/sites-available/zyphextech.conf \       │
│     │   /etc/nginx/sites-enabled/                                    │
│     │                                                                │
│     │ # Test configuration                                           │
│     │ sudo nginx -t                                                  │
│     │                                                                │
│     │ # Get SSL certificate                                          │
│     │ sudo certbot --nginx -d www.zyphextech.com \                  │
│     │   --email admin@zyphextech.com \                               │
│     │   --agree-tos --non-interactive                                │
│     │                                                                │
│     │ # Reload Nginx                                                 │
│     │ sudo systemctl reload nginx                                    │
│     └────────────────────────────────────────────────────────────────┘
│
├─ 00:23 ─────────────────────────────────────────────────────────────────
│                                                                         
│  🚀 STEP 8: Initial Deployment (3 min)
│  
│     VPS Terminal (as deploy user):
│     ┌────────────────────────────────────────────────────────────────┐
│     │ cd /var/www/zyphextech                                         │
│     │                                                                │
│     │ npm ci                      # Install dependencies             │
│     │ npx prisma generate         # Generate Prisma Client           │
│     │ npx prisma migrate deploy   # Run database migrations          │
│     │ npm run build               # Build Next.js app                │
│     │                                                                │
│     │ pm2 start ecosystem.config.js  # Start with PM2                │
│     │ pm2 save                       # Save PM2 state                │
│     └────────────────────────────────────────────────────────────────┘
│  
│     Expected Output:
│     ┌────────────────────────────────────────────────────────────────┐
│     │ ┌─────────┬────────┬──────────┬───────┬─────┬──────────┐     │
│     │ │ Name    │ mode   │ status   │ cpu   │ mem │ watching │     │
│     │ ├─────────┼────────┼──────────┼───────┼─────┼──────────┤     │
│     │ │ zyphex… │ cluster│ online   │ 0%    │ 95M │ disabled │     │
│     │ └─────────┴────────┴──────────┴───────┴─────┴──────────┘     │
│     └────────────────────────────────────────────────────────────────┘
│
├─ 00:26 ─────────────────────────────────────────────────────────────────
│                                                                         
│  ✅ STEP 9: Test & Verify (1 min)
│  
│     VPS Terminal:
│     ┌────────────────────────────────────────────────────────────────┐
│     │ # Health check                                                 │
│     │ curl http://localhost:3000/api/health                          │
│     │                                                                │
│     │ # Expected: {"status":"ok"}                                    │
│     └────────────────────────────────────────────────────────────────┘
│  
│     Browser:
│     ┌────────────────────────────────────────────────────────────────┐
│     │ 🌐 Open: https://www.zyphextech.com                           │
│     │                                                                │
│     │ ✓ Site loads successfully                                      │
│     │ ✓ SSL certificate valid (green padlock)                        │
│     │ ✓ No console errors                                            │
│     └────────────────────────────────────────────────────────────────┘
│
├─ 00:27 ─────────────────────────────────────────────────────────────────
│                                                                         
│  🎯 STEP 10: Trigger GitHub Actions (30 sec)
│  
│     Local Machine:
│     ┌────────────────────────────────────────────────────────────────┐
│     │ git commit --allow-empty -m "trigger deployment"               │
│     │ git push origin main                                           │
│     └────────────────────────────────────────────────────────────────┘
│  
│     Browser:
│     ┌────────────────────────────────────────────────────────────────┐
│     │ 📊 Monitor deployment:                                         │
│     │ github.com/isumitmalhotra/Zyphex-Tech/actions                  │
│     │                                                                │
│     │ Workflow: Deploy to VPS                                        │
│     │ Status:   ✅ Success                                           │
│     │ Duration: ~2 minutes                                           │
│     └────────────────────────────────────────────────────────────────┘
│
└─ 00:28 ─────────────────────────────────────────────────────────────────

                            🎉 DEPLOYMENT COMPLETE!


═══════════════════════════════════════════════════════════════════════════
                         🎯 WHAT YOU'VE ACHIEVED
═══════════════════════════════════════════════════════════════════════════

┌───────────────────────────────────────────────────────────────────────┐
│                                                                       │
│  ✅ Fully configured AlmaLinux VPS                                   │
│  ✅ Automated CI/CD pipeline (GitHub Actions)                        │
│  ✅ Production-ready infrastructure:                                 │
│      • Nginx (reverse proxy, SSL, security headers)                 │
│      • PM2 (process manager, auto-restart)                          │
│      • PostgreSQL 15 (optimized for 4GB RAM)                        │
│      • Redis (caching with authentication)                          │
│  ✅ SSL certificate (Let's Encrypt, auto-renewal)                    │
│  ✅ Firewall configured (ports 22, 80, 443)                          │
│  ✅ SELinux properly configured                                      │
│  ✅ Health monitoring (every 5 minutes)                              │
│  ✅ Log rotation (14 days retention)                                 │
│  ✅ Deployment time: 2-3 minutes (automatic)                         │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════
                         📊 DEPLOYMENT ARCHITECTURE
═══════════════════════════════════════════════════════════════════════════

Internet (HTTPS/HTTP)
        │
        ↓
┌───────────────────────┐
│   Domain Registrar    │
│  www.zyphextech.com   │
└───────┬───────────────┘
        │ DNS → 66.116.199.219
        ↓
┌───────────────────────┐
│    AlmaLinux VPS      │
│   66.116.199.219      │
│                       │
│  ┌─────────────────┐  │
│  │   Firewalld     │  │
│  │  Ports: 22,80,  │  │
│  │       443       │  │
│  └────────┬────────┘  │
│           ↓           │
│  ┌─────────────────┐  │
│  │     Nginx       │  │
│  │  - Reverse      │  │
│  │    Proxy        │  │
│  │  - SSL/TLS      │  │
│  │  - Rate Limit   │  │
│  │  - Security     │  │
│  │    Headers      │  │
│  └────────┬────────┘  │
│           ↓           │
│  ┌─────────────────┐  │
│  │      PM2        │  │
│  │  - Auto Restart │  │
│  │  - Clustering   │  │
│  │  - Logging      │  │
│  └────────┬────────┘  │
│           ↓           │
│  ┌─────────────────┐  │
│  │   Next.js App   │  │
│  │   Port: 3000    │  │
│  └────┬───────┬────┘  │
│       │       │       │
│       ↓       ↓       │
│  ┌────────┐ ┌─────┐  │
│  │PostSQL │ │Redis│  │
│  │  :5432 │ │:6379│  │
│  └────────┘ └─────┘  │
│                       │
└───────────────────────┘
        ↑
        │ SSH (Port 22)
        │
┌───────────────────────┐
│   GitHub Actions      │
│   (Automated Deploy)  │
└───────────────────────┘
        ↑
        │ Git Push
        │
┌───────────────────────┐
│   Local Development   │
│   (Your Computer)     │
└───────────────────────┘


═══════════════════════════════════════════════════════════════════════════
                        🔄 AUTOMATIC DEPLOYMENT FLOW
═══════════════════════════════════════════════════════════════════════════

Developer Action:
┌─────────────────────────────┐
│ git push origin main        │  ← You push code to GitHub
└──────────┬──────────────────┘
           ↓
GitHub Detects Push:
┌─────────────────────────────┐
│ GitHub Actions Triggered    │  ← Workflow starts automatically
└──────────┬──────────────────┘
           ↓
Deploy to VPS:
┌─────────────────────────────────────────────────┐
│ 1. Checkout code                                │
│ 2. Setup SSH connection (using secrets)         │
│ 3. Connect to VPS as deploy user                │
│ 4. Pull latest code from GitHub                 │
│ 5. Install/update dependencies (npm ci)         │
│ 6. Generate Prisma Client                       │
│ 7. Run database migrations                      │
│ 8. Build Next.js application                    │
│ 9. Restart application with PM2                 │
│ 10. Run health check                            │
└──────────┬──────────────────────────────────────┘
           ↓
Health Check:
┌─────────────────────────────┐
│ curl localhost:3000/        │
│       api/health            │
└──────────┬──────────────────┘
           ↓
   ┌───────┴────────┐
   │                │
   ↓                ↓
Success           Failure
┌────────┐      ┌──────────┐
│ Save   │      │ Rollback │
│ PM2    │      │ to       │
│ State  │      │ Previous │
│ ✅     │      │ Version  │
└────────┘      └──────────┘
   ↓                ↓
Website Live   Deployment Failed
                (logs available)


═══════════════════════════════════════════════════════════════════════════
                           📚 DOCUMENTATION MAP
═══════════════════════════════════════════════════════════════════════════

Need Quick Help?
├─ IMMEDIATE_ACTION_REQUIRED.md ─────► Start here! (23-min guide)
│
Need Commands?
├─ VPS_QUICK_COMMANDS.md ────────────► Copy-paste commands
│
Need Complete Setup?
├─ VPS_SETUP_COMPLETE_GUIDE.md ──────► Comprehensive guide (500+ lines)
│
Need Fast Deployment?
├─ VPS_DEPLOYMENT_QUICKSTART.md ─────► 2-hour quick start
│
Need Detailed Info?
├─ VPS_DEPLOYMENT_GUIDE.md ──────────► Full documentation (1,500 lines)
│
Need Overview?
├─ VPS_DEPLOYMENT_SUMMARY.md ────────► Architecture & comparisons
│
Need This Visual?
└─ VPS_DEPLOYMENT_VISUAL_ROADMAP.md ─► You are here! 🎯


═══════════════════════════════════════════════════════════════════════════
                          💡 WHAT HAPPENS NEXT?
═══════════════════════════════════════════════════════════════════════════

Every time you push to GitHub main branch:

  1. Code changes detected
       ↓
  2. GitHub Actions starts (automatic)
       ↓
  3. Deploys to VPS (2-3 minutes)
       ↓
  4. Health check validates
       ↓
  5. Website updated! ✅

No manual deployment needed ever again! 🎉


═══════════════════════════════════════════════════════════════════════════
                            🚨 NEED HELP?
═══════════════════════════════════════════════════════════════════════════

Check Status:
┌──────────────────────────────────────┐
│ ssh deploy@66.116.199.219            │
│ pm2 status                           │
│ pm2 logs zyphextech --lines 20       │
└──────────────────────────────────────┘

View Logs:
┌──────────────────────────────────────┐
│ sudo tail -f /var/log/nginx/error.log│
│ pm2 logs zyphextech -f              │
└──────────────────────────────────────┘

Restart Everything:
┌──────────────────────────────────────┐
│ pm2 restart zyphextech               │
│ sudo systemctl restart nginx         │
└──────────────────────────────────────┘

Emergency Rollback:
┌──────────────────────────────────────┐
│ cd /var/www/zyphextech               │
│ git reset --hard HEAD~1              │
│ npm ci && npm run build              │
│ pm2 restart zyphextech               │
└──────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════
                              🎊 SUCCESS!
═══════════════════════════════════════════════════════════════════════════

                    Your VPS is now production-ready!
                    
                    • Fully automated deployments ✅
                    • Secure SSL/HTTPS ✅
                    • Optimized performance ✅
                    • 24/7 monitoring ✅
                    • Cost-effective ($20-50/month) ✅
                    
                Visit: https://www.zyphextech.com 🚀


Last Updated: October 8, 2025
Version: 1.0
Platform: AlmaLinux VPS
```

# 🚀 CI/CD Deployment System with Automatic Rollback

## Overview

This repository includes an advanced CI/CD pipeline that automatically deploys to the VPS with built-in health checks and automatic rollback capabilities. If a deployment fails, the system automatically reverts to the last working version.

## Features

### ✅ Automatic Deployment
- Triggers on every push to `main` branch
- Can also be manually triggered via GitHub Actions

### 🔄 Automatic Rollback
- If deployment fails, automatically rolls back to previous working version
- If health checks fail, restores the last working build
- Website remains live throughout the process

### 🏥 Health Checks
- Multiple retry attempts (5 retries with 10s intervals)
- Checks PM2 process status
- Validates HTTP health endpoint
- Ensures application is fully operational before completing

### 📧 Notifications
- **Success**: Sends notification when deployment succeeds
- **Failure**: Sends alert when deployment fails with rollback confirmation
- Supports Discord and Slack webhooks

### 🛡️ Safety Features
- Backs up current build before deploying
- Stores current Git commit for rollback
- Validates build output before deployment
- Comprehensive error logging
- Timeout protection (30 minutes max)

## Setup Instructions

### 1. Required GitHub Secrets

Navigate to your repository settings → Secrets and variables → Actions, and add:

#### VPS Connection (Required)
```
VPS_HOST          - Your VPS IP address or domain
VPS_USER          - SSH username (usually 'root' or your username)
VPS_PORT          - SSH port (usually 22)
VPS_SSH_PRIVATE_KEY - Your SSH private key
```

#### Notification Webhooks (Optional)
```
DISCORD_WEBHOOK_URL - Discord webhook URL for notifications
SLACK_WEBHOOK_URL   - Slack webhook URL for notifications
```

### 2. Setting up SSH Key

Generate an SSH key pair if you don't have one:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy_key
```

Add the public key to your VPS:

```bash
ssh-copy-id -i ~/.ssh/github_deploy_key.pub user@your-vps-ip
```

Add the private key content to GitHub Secrets as `VPS_SSH_PRIVATE_KEY`:

```bash
cat ~/.ssh/github_deploy_key
```

### 3. Setting up Discord Webhook (Optional)

1. Go to your Discord server settings
2. Navigate to Integrations → Webhooks
3. Click "New Webhook"
4. Copy the webhook URL
5. Add it to GitHub Secrets as `DISCORD_WEBHOOK_URL`

### 4. Setting up Slack Webhook (Optional)

1. Go to https://api.slack.com/apps
2. Create a new app or select existing
3. Enable "Incoming Webhooks"
4. Add webhook to workspace
5. Copy the webhook URL
6. Add it to GitHub Secrets as `SLACK_WEBHOOK_URL`

## Deployment Workflows

### Automatic Deployment (Recommended)

**File:** `.github/workflows/deploy-with-rollback.yml`

This is the **recommended workflow** with automatic rollback:

```bash
# Simply push to main branch
git push origin main

# The workflow will:
# 1. Deploy new code
# 2. Run health checks
# 3. If successful: Complete deployment
# 4. If failed: Automatic rollback + notification
```

### Legacy Deployment

**File:** `.github/workflows/deploy-vps.yml`

Basic deployment without automatic rollback (kept for reference).

## How It Works

### Successful Deployment Flow

```
1. Push to main branch
   ↓
2. GitHub Actions triggered
   ↓
3. Checkout code
   ↓
4. Connect to VPS via SSH
   ↓
5. Backup current build
   ↓
6. Pull latest code
   ↓
7. Install dependencies
   ↓
8. Run Prisma generate & migrate
   ↓
9. Build application
   ↓
10. Restart PM2
   ↓
11. Health check (5 retries, 10s interval)
   ↓
12. ✅ Success notification
   ↓
13. Save PM2 state
```

### Failed Deployment Flow (Automatic Rollback)

```
1-10. Same as successful flow
   ↓
11. Health check fails
   ↓
12. Detect failure
   ↓
13. Restore backed-up build
   ↓
14. Reset Git to previous commit
   ↓
15. Reinstall dependencies
   ↓
16. Restart PM2 with old version
   ↓
17. Verify rollback health check
   ↓
18. 🚨 Failure notification (with rollback confirmation)
   ↓
19. Website continues running on previous version
```

## Notification Examples

### Success Notification
```
🎉 Deployment Successful

Environment: Production VPS
Status: ✅ SUCCESS
Commit: abc1234
Message: feat: Add new feature
Deployed by: john-doe
Time: 2024-10-24 10:30:00 UTC
Website: https://www.zyphextech.com

All health checks passed! 🚀
```

### Failure Notification
```
🚨 Deployment Failed & Rolled Back

Environment: Production VPS
Status: ❌ FAILED
Commit: xyz5678
Message: fix: Update configuration
Deployed by: jane-smith
Time: 2024-10-24 11:45:00 UTC

⚠️ The deployment failed and has been automatically rolled back to the last working version.

Action Required:
1. Check GitHub Actions logs
2. Review build/health check failures
3. Fix issues locally and test before pushing
4. Website remains live on previous version

Last working commit: Previous HEAD
Failed commit: xyz5678
```

## Manual Deployment

If you need to manually trigger deployment:

1. Go to GitHub repository
2. Click "Actions" tab
3. Select "Deploy to VPS with Automatic Rollback"
4. Click "Run workflow"
5. Select `main` branch
6. Click "Run workflow"

## Troubleshooting

### Deployment Fails But No Rollback

Check PM2 logs on VPS:
```bash
pm2 logs zyphextech --lines 100
```

### SSH Connection Issues

Test SSH connection:
```bash
ssh -p YOUR_PORT YOUR_USER@YOUR_VPS_HOST
```

### Health Check Always Fails

Check if health endpoint is accessible:
```bash
# On VPS
curl http://localhost:3000/api/health
```

### Build Failures

Check build logs in GitHub Actions or on VPS:
```bash
# On VPS
cd /var/www/zyphextech
cat build.log
```

## Monitoring

### View Deployment History

GitHub Actions:
- Navigate to Actions tab
- View all deployment runs
- Click on any run for detailed logs

### Check Current Deployment Status

On VPS:
```bash
cd /var/www/zyphextech
cat deployment.status
```

### PM2 Monitoring

```bash
pm2 status
pm2 monit
pm2 logs zyphextech
```

## Best Practices

1. **Always test locally first**
   ```bash
   npm run build
   npm start
   ```

2. **Check for errors before pushing**
   ```bash
   npm run lint
   npm run type-check
   ```

3. **Use meaningful commit messages**
   ```bash
   git commit -m "feat: Add budget tracking page"
   ```

4. **Monitor deployments**
   - Watch GitHub Actions logs
   - Check notifications
   - Verify website functionality

5. **If deployment fails**
   - Review the failure logs
   - Fix issues locally
   - Test thoroughly
   - Push again

## Architecture

```
GitHub Repository (main branch)
        ↓
   Push Trigger
        ↓
   GitHub Actions Runner
        ↓
   SSH to VPS
        ↓
   /var/www/zyphextech
   ├── Backup current state
   ├── Pull new code
   ├── Build application
   ├── Health checks
   └── Success ✅ OR Rollback 🔄
        ↓
   Send Notification
```

## Security Notes

- SSH private keys are stored securely in GitHub Secrets
- Keys are never exposed in logs
- Webhook URLs are optional and encrypted
- All connections use SSH encryption
- Build process runs in isolated environment

## Maintenance

### Update Node.js Version

On VPS:
```bash
nvm install 18.17.0
nvm use 18.17.0
nvm alias default 18.17.0
```

### Update PM2

```bash
npm install -g pm2@latest
pm2 update
```

### Clean Up Old Builds

```bash
cd /var/www/zyphextech
rm -rf .next.backup
rm -rf node_modules
npm ci --legacy-peer-deps
```

## Support

If you encounter issues:

1. Check GitHub Actions logs
2. Check VPS logs: `pm2 logs zyphextech`
3. Review this documentation
4. Check notification messages for details

## Changelog

### v2.0 - Enhanced Deployment with Rollback (Current)
- ✅ Automatic rollback on failure
- ✅ Multiple health check retries
- ✅ Build backup before deployment
- ✅ Enhanced error logging
- ✅ Discord/Slack notifications
- ✅ Comprehensive status reporting

### v1.0 - Basic Deployment
- Basic deployment workflow
- Simple health checks
- Manual rollback required

---

**Last Updated:** October 24, 2025
**Deployment System Version:** 2.0
**Status:** Active & Production Ready

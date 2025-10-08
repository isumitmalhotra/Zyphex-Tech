# CI/CD Pipeline Setup Guide

## Overview
This project uses GitHub Actions for automated deployment to the VPS whenever code is pushed to the `main` branch.

## Prerequisites
1. VPS server with SSH access (root or sudo user)
2. GitHub repository
3. SSH key pair for authentication

## Setup Steps

### 1. Generate SSH Key Pair (if you don't have one)

On your **local machine** or **VPS**, run:

```bash
# Generate SSH key pair
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github-actions

# This creates:
# - ~/.ssh/github-actions (private key)
# - ~/.ssh/github-actions.pub (public key)
```

### 2. Add Public Key to VPS

Copy the **public key** to your VPS:

```bash
# On your local machine:
cat ~/.ssh/github-actions.pub

# Copy the output, then SSH to your VPS:
ssh root@66.116.199.219

# Switch to deploy user:
su - deploy

# Add the public key to authorized_keys:
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
# Paste the public key on a new line
# Save and exit (Ctrl+X, Y, Enter)

# Set proper permissions:
chmod 600 ~/.ssh/authorized_keys
```

### 3. Configure GitHub Secrets

Go to your GitHub repository:
1. Click **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add the following secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `VPS_HOST` | `66.116.199.219` | Your VPS IP address |
| `VPS_USER` | `deploy` | SSH user (deploy user, not root) |
| `VPS_PORT` | `22` | SSH port (default is 22) |
| `VPS_SSH_PRIVATE_KEY` | `[paste private key]` | Contents of `~/.ssh/github-actions` (private key) |

**To get the private key:**
```bash
cat ~/.ssh/github-actions
# Copy the ENTIRE output including:
# -----BEGIN OPENSSH PRIVATE KEY-----
# ... (all the key content)
# -----END OPENSSH PRIVATE KEY-----
```

### 4. Test SSH Connection

Before committing, test that GitHub Actions can connect:

```bash
# On your local machine:
ssh -i ~/.ssh/github-actions deploy@66.116.199.219

# If this works, GitHub Actions will work too!
```

### 5. Verify GitHub Actions Workflow

The workflow is located at `.github/workflows/deploy-vps.yml` and will:
- ✅ Checkout code
- ✅ Validate all secrets are configured
- ✅ Setup SSH connection
- ✅ Pull latest code on VPS
- ✅ Install dependencies
- ✅ Generate Prisma client
- ✅ Run database migrations
- ✅ Build Next.js application
- ✅ Restart PM2 process
- ✅ Run health check
- ✅ Rollback on failure

### 6. Trigger Deployment

**Automatic deployment** happens when you push to `main`:
```bash
git add .
git commit -m "Your changes"
git push origin main
```

**Manual deployment** can be triggered from GitHub:
1. Go to **Actions** tab
2. Select **Deploy to VPS** workflow
3. Click **Run workflow**
4. Select `main` branch
5. Click **Run workflow**

### 7. Monitor Deployment

Watch the deployment progress:
1. Go to **Actions** tab in GitHub
2. Click on the latest workflow run
3. View logs in real-time

### 8. Verify Deployment

After deployment completes:
1. Check the website: https://www.zyphextech.com
2. Check PM2 status: `ssh deploy@66.116.199.219 "pm2 status"`
3. Check logs: `ssh deploy@66.116.199.219 "pm2 logs zyphextech --lines 50"`

## Troubleshooting

### Issue: "Permission denied (publickey)"
**Solution:** 
- Verify the private key is correctly added to GitHub secrets
- Check that the public key is in `/home/deploy/.ssh/authorized_keys`
- Ensure proper permissions: `chmod 600 ~/.ssh/authorized_keys`

### Issue: "Health check failed"
**Solution:**
- Check PM2 logs: `pm2 logs zyphextech`
- Verify application is running: `pm2 status`
- Check if port 3000 is accessible: `curl http://localhost:3000/api/health`

### Issue: "Database migration failed"
**Solution:**
- Check if PostgreSQL is running: `sudo systemctl status postgresql`
- Verify database connection in `.env.production`
- Run migrations manually: `npx prisma migrate deploy`

### Issue: "Build failed"
**Solution:**
- Check for TypeScript errors locally before pushing
- Verify all dependencies are in `package.json`
- Check Node.js version matches VPS: `node --version`

## Current Configuration

**VPS Details:**
- Host: `66.116.199.219`
- User: `deploy`
- Application Path: `/var/www/zyphextech`
- PM2 Process: `zyphextech`
- Website: https://www.zyphextech.com

**Workflow Triggers:**
- Push to `main` branch (automatic)
- Manual dispatch via GitHub Actions UI

**Deployment Steps:**
1. Git pull latest code
2. Install dependencies with `npm ci`
3. Generate Prisma client
4. Run database migrations
5. Clean old build
6. Build Next.js application
7. Restart PM2 with environment update
8. Health check verification
9. Auto-rollback on failure

## Security Best Practices

✅ **DO:**
- Use deploy user (not root) for deployments
- Keep private keys secure in GitHub Secrets
- Use SSH keys instead of passwords
- Regularly rotate SSH keys
- Monitor deployment logs

❌ **DON'T:**
- Commit private keys to repository
- Share GitHub secrets
- Use root user for deployments
- Disable health checks
- Skip database backups

## Next Steps

1. **Setup Notifications:**
   - Add Slack/Discord webhook for deployment notifications
   - Configure email alerts for failures

2. **Add Testing:**
   - Run unit tests before deployment
   - Add integration tests
   - Implement smoke tests post-deployment

3. **Improve Monitoring:**
   - Setup application monitoring (e.g., Sentry)
   - Configure uptime monitoring
   - Setup log aggregation

4. **Database Backups:**
   - Automate daily backups before deployment
   - Test backup restoration procedure

## Support

For issues or questions:
- Check GitHub Actions logs
- Review VPS logs: `ssh deploy@66.116.199.219 "pm2 logs zyphextech"`
- Verify environment variables on VPS
- Check `.env.production` file for correct configuration

---

Last Updated: October 9, 2025

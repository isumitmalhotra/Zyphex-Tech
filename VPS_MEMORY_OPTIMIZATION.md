# VPS Memory Optimization Guide

## Issue Summary
The deployment failed with `ENOMEM` (out of memory) error during npm install on the VPS. This is common on low-resource servers when installing large Node.js projects.

## Immediate Fix Applied

### 1. **Enhanced Deployment Workflow**
Updated `.github/workflows/deploy-with-rollback.yml` with:

- **Memory-efficient npm install:**
  - Changed from `npm ci` to `npm install --prefer-offline --no-audit`
  - Added `NODE_OPTIONS='--max-old-space-size=2048'` to limit memory usage
  - Implemented automatic swap file creation on memory failure

- **Pre-installation cleanup:**
  - Removes `node_modules` when package files change
  - Cleans npm cache to free disk space
  - Removes old build artifacts

- **Optimized build process:**
  - Reduced max memory from 4096MB to 3072MB
  - Disabled telemetry and source maps
  - Better error logging

## VPS Manual Optimization (Run Once)

### Step 1: Create Permanent Swap File

SSH into your VPS and run:

```bash
# Check current swap
free -h
swapon -s

# If no swap or small swap, create 4GB swap
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make it permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimize swap usage (only use when needed)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
echo 'vm.vfs_cache_pressure=50' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Verify
free -h
```

### Step 2: Optimize Node.js Memory Settings

Edit your PM2 ecosystem file:

```bash
cd /var/www/zyphextech
nano ecosystem.config.js
```

Update with optimized settings:

```javascript
module.exports = {
  apps: [{
    name: 'zyphextech',
    script: './server.js',
    instances: 1, // Reduce if using cluster mode
    exec_mode: 'fork', // Use fork instead of cluster to save memory
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024', // Limit Node.js heap
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXT_TELEMETRY_DISABLED: 1
    }
  }]
}
```

Restart PM2:

```bash
pm2 restart zyphextech
pm2 save
```

### Step 3: Clean Up Disk Space

```bash
cd /var/www/zyphextech

# Remove old logs
pm2 flush

# Clean npm cache
npm cache clean --force

# Remove unused dependencies
npm prune --production

# Clean old build artifacts
find . -name "*.log" -type f -delete
find . -name ".next.backup" -type d -exec rm -rf {} +

# Check disk usage
df -h
du -sh node_modules/
```

### Step 4: Install Only Production Dependencies

For production deployments, you can reduce memory by installing only production dependencies:

```bash
# Remove dev dependencies
npm prune --production

# Or reinstall with only production
rm -rf node_modules
NODE_OPTIONS='--max-old-space-size=2048' npm install --production --prefer-offline --no-audit
```

### Step 5: Monitor Memory Usage

Install and configure monitoring:

```bash
# Install htop for real-time monitoring
sudo apt install htop -y

# Monitor during deployment
htop

# Or use watch to monitor memory
watch -n 2 free -h

# Check PM2 memory usage
pm2 monit
```

## Deployment Best Practices

### Before Each Deployment

1. **Check available memory:**
   ```bash
   ssh user@vps "free -h"
   ```

2. **Verify swap is active:**
   ```bash
   ssh user@vps "swapon -s"
   ```

3. **Check disk space:**
   ```bash
   ssh user@vps "df -h"
   ```

### During Deployment

The updated workflow now automatically:
- Checks available memory
- Creates temporary swap if needed
- Uses memory-efficient npm install
- Cleans cache before installation
- Limits Node.js heap size

### After Successful Deployment

```bash
# Verify application is running
pm2 list

# Check memory usage
pm2 monit

# View logs
pm2 logs zyphextech --lines 50

# Test the application
curl http://localhost:3000/api/health
```

## Troubleshooting

### If Deployment Still Fails with Memory Errors

1. **Increase VPS RAM:**
   - Upgrade to at least 2GB RAM (4GB recommended)
   - Most VPS providers allow easy upgrades

2. **Use build server:**
   - Build the app on GitHub Actions (more memory available)
   - Only deploy the built files to VPS
   - See: `BUILD_ON_GITHUB_ACTIONS.md` (create if needed)

3. **Optimize package.json:**
   - Remove unused dependencies
   - Use lighter alternatives for heavy packages
   - Check with `npm ls` for duplicate packages

4. **Temporary fix:**
   ```bash
   # SSH into VPS
   cd /var/www/zyphextech
   
   # Stop PM2 to free memory
   pm2 stop zyphextech
   
   # Run npm install manually with swap
   NODE_OPTIONS='--max-old-space-size=2048' npm install --prefer-offline --no-audit --legacy-peer-deps
   
   # Generate Prisma client
   npx prisma generate
   
   # Build
   NODE_OPTIONS='--max-old-space-size=3072' NEXT_TELEMETRY_DISABLED=1 npm run build
   
   # Restart
   pm2 restart zyphextech
   ```

## VPS Resource Requirements

### Minimum (Will struggle with builds)
- RAM: 1GB
- Swap: 4GB
- CPU: 1 core
- Disk: 20GB

### Recommended (Smooth deployments)
- RAM: 2GB
- Swap: 2GB
- CPU: 2 cores
- Disk: 40GB

### Optimal (Production-ready)
- RAM: 4GB
- Swap: 2GB
- CPU: 2+ cores
- Disk: 60GB+ SSD

## Next Steps

1. **Manual VPS Setup (Run Once):**
   ```bash
   # SSH into VPS
   ssh user@your-vps
   
   # Create permanent swap
   sudo fallocate -l 4G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   
   # Set swappiness
   echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   
   # Verify
   free -h
   ```

2. **Trigger New Deployment:**
   ```bash
   # Commit the workflow changes
   git add .github/workflows/deploy-with-rollback.yml
   git commit -m "fix: Optimize deployment for low-memory VPS"
   git push origin main
   ```

3. **Monitor the deployment:**
   - Watch GitHub Actions: https://github.com/isumitmalhotra/Zyphex-Tech/actions
   - SSH into VPS and monitor: `htop` or `pm2 monit`

## Workflow Changes Summary

### What Changed:

1. **npm install optimization:**
   - Uses `npm install` instead of `npm ci` (more memory efficient)
   - Adds `--prefer-offline` to use cache
   - Adds `--no-audit` to skip audit (saves memory)
   - Limits heap size with `NODE_OPTIONS`

2. **Automatic swap creation:**
   - Detects memory errors
   - Creates 2GB temporary swap file
   - Retries installation with swap enabled

3. **Pre-installation cleanup:**
   - Removes `node_modules` if packages changed
   - Cleans npm cache
   - Removes old artifacts

4. **Build optimization:**
   - Reduced memory allocation (3072MB vs 4096MB)
   - Disables telemetry
   - Disables source maps for production

5. **Better error handling:**
   - Detailed memory error detection
   - Graceful rollback on memory failures
   - Preserves existing dependencies on rollback failure

## Testing

After applying these changes, test with:

```bash
# Commit and push
git add .
git commit -m "fix: VPS memory optimization for deployments"
git push origin main

# Watch the deployment
# Visit: https://github.com/isumitmalhotra/Zyphex-Tech/actions
```

The deployment should now succeed even on low-memory VPS instances!

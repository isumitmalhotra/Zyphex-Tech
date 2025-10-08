/**
 * PM2 Ecosystem Configuration for Zyphex Tech Platform
 * 
 * This file configures PM2 to manage the Next.js application
 * on the production VPS.
 * 
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 restart zyphextech
 *   pm2 stop zyphextech
 *   pm2 logs zyphextech
 *   pm2 monit
 */

module.exports = {
  apps: [
    {
      // Application name
      name: 'zyphextech',
      
      // Script to run
      script: 'npm',
      args: 'start',
      
      // Working directory
      cwd: '/var/www/zyphextech',
      
      // Instances configuration
      instances: 1,  // Use 1 instance for 1 CPU core
      exec_mode: 'cluster',  // Cluster mode for better reliability
      
      // Auto restart configuration
      autorestart: true,
      watch: false,  // Don't watch files (we use git pull)
      max_memory_restart: '1G',  // Restart if memory exceeds 1GB
      
      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      
      // Load environment from file
      env_file: '.env.production',
      
      // Logging
      error_file: '/var/log/pm2/zyphextech-error.log',
      out_file: '/var/log/pm2/zyphextech-out.log',
      log_file: '/var/log/pm2/zyphextech-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Kill timeout
      kill_timeout: 5000,
      
      // Wait for ready signal
      wait_ready: true,
      listen_timeout: 10000,
      
      // Restart delay
      restart_delay: 4000,
      
      // Min uptime before considering successful
      min_uptime: '10s',
      
      // Max restart attempts in 1 minute
      max_restarts: 10,
      
      // Graceful shutdown
      shutdown_with_message: true,
      
      // Health check (requires pm2-health module)
      // health_check: {
      //   endpoint: 'http://localhost:3000/api/health',
      //   interval: 60000,  // 1 minute
      //   timeout: 5000,    // 5 seconds
      // },
      
      // Cron restart (optional - restart daily at 3 AM)
      // cron_restart: '0 3 * * *',
      
      // Post-deploy hooks
      post_update: ['npm install', 'npx prisma generate'],
    },
  ],

  /**
   * Deployment configuration (optional)
   * Used with: pm2 deploy production setup/update
   */
  deploy: {
    production: {
      user: 'deploy',
      host: '66.116.199.219',
      ref: 'origin/main',
      repo: 'git@github.com:isumitmalhotra/Zyphex-Tech.git',
      path: '/var/www/zyphextech',
      'post-deploy': 'npm ci && npx prisma generate && npm run build && pm2 reload ecosystem.config.js --env production && pm2 save',
      'pre-setup': 'npm install -g pm2',
    },
  },
};

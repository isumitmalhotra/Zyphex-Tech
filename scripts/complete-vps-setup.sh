#!/bin/bash

###############################################################################
# Complete VPS Setup Script - FIXED for AlmaLinux 8
# Handles Redis config path correctly
# Run this in a fresh SSH session
###############################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root"
    exit 1
fi

print_header "🚀 Complete VPS Setup - Continuing from Redis Fix"

###############################################################################
# Fix Redis Configuration (Step 6 Fix)
###############################################################################
print_header "🔴 Step 6 (Fix): Configuring Redis"

print_info "Creating Redis configuration..."
cat > /etc/redis.conf << 'EOF'
# Redis Configuration for Zyphex Tech
bind 127.0.0.1 ::1
protected-mode yes
port 6379
tcp-backlog 511
timeout 0
tcp-keepalive 300
daemonize no
supervised systemd
pidfile /var/run/redis_6379.pid
loglevel notice
logfile /var/log/redis/redis.log
databases 16

# Memory Management
maxmemory 512mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /var/lib/redis

# Security
requirepass zyphex_redis_pass_2024

# Append Only File
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
aof-load-truncated yes
EOF

print_info "Restarting Redis..."
systemctl restart redis

print_info "Testing Redis connection..."
if redis-cli -a zyphex_redis_pass_2024 ping > /dev/null 2>&1; then
    print_success "Redis configured and running"
else
    print_error "Redis connection test failed"
fi

###############################################################################
# Step 7: Install Nginx
###############################################################################
print_header "🌐 Step 7: Installing Nginx"

if command -v nginx &> /dev/null; then
    print_success "Nginx already installed: $(nginx -v 2>&1)"
else
    print_info "Installing Nginx..."
    dnf install -y nginx
    
    print_info "Starting Nginx service..."
    systemctl start nginx
    systemctl enable nginx
    
    print_success "Nginx installed"
fi

print_info "Setting up Nginx directory structure..."
mkdir -p /etc/nginx/sites-available
mkdir -p /etc/nginx/sites-enabled

if ! grep -q "sites-enabled" /etc/nginx/nginx.conf; then
    sed -i '/include \/etc\/nginx\/conf.d\/\*.conf;/a\    include /etc/nginx/sites-enabled/*;' /etc/nginx/nginx.conf
fi

print_success "Nginx directory structure created"

###############################################################################
# Step 8: Install Certbot for SSL
###############################################################################
print_header "🔒 Step 8: Installing Certbot"

if command -v certbot &> /dev/null; then
    print_success "Certbot already installed"
else
    print_info "Installing Certbot and Nginx plugin..."
    dnf install -y certbot python3-certbot-nginx
    
    print_success "Certbot installed"
fi

###############################################################################
# Step 9: Create Application Directory
###############################################################################
print_header "📁 Step 9: Creating Application Directory"

APP_DIR="/var/www/zyphextech"

print_info "Creating directory: $APP_DIR"
mkdir -p "$APP_DIR"

print_info "Setting ownership to deploy user"
chown -R deploy:deploy "$APP_DIR"

print_info "Setting permissions..."
chmod 755 "$APP_DIR"

print_success "Application directory created"

###############################################################################
# Step 10: Clone Repository
###############################################################################
print_header "📦 Step 10: Cloning Repository"

if [ -d "$APP_DIR/.git" ]; then
    print_success "Repository already cloned"
else
    print_info "Cloning from GitHub..."
    sudo -u deploy git clone https://github.com/isumitmalhotra/Zyphex-Tech.git "$APP_DIR"
    
    print_success "Repository cloned"
fi

###############################################################################
# Step 11: Setup PM2
###############################################################################
print_header "⚡ Step 11: Installing PM2"

if command -v pm2 &> /dev/null; then
    print_success "PM2 already installed"
else
    print_info "Installing PM2 globally..."
    npm install -g pm2
    
    print_success "PM2 installed"
fi

print_info "Setting up PM2 startup script..."
env PATH=$PATH:/usr/bin pm2 startup systemd -u deploy --hp /home/deploy | tail -n 1 | bash

print_info "Creating PM2 log directory..."
mkdir -p /var/log/pm2
chown -R deploy:deploy /var/log/pm2

print_success "PM2 configured"

###############################################################################
# Step 12: Setup Monitoring
###############################################################################
print_header "📊 Step 12: Setting up Monitoring"

print_info "Creating health check script..."
cat > /usr/local/bin/health-check.sh << 'EOF'
#!/bin/bash
if ! curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "Health check failed at $(date)" >> /var/log/health-check.log
    su - deploy -c "pm2 restart zyphextech" > /dev/null 2>&1
fi
EOF

chmod +x /usr/local/bin/health-check.sh

print_info "Adding health check cron job (every 5 minutes)..."
(crontab -l 2>/dev/null | grep -v health-check.sh; echo "*/5 * * * * /usr/local/bin/health-check.sh") | crontab -

print_success "Monitoring configured"

###############################################################################
# Step 13: Setup Log Rotation
###############################################################################
print_header "📝 Step 13: Setting up Log Rotation"

print_info "Creating logrotate configuration..."
cat > /etc/logrotate.d/zyphextech << 'EOF'
/var/log/pm2/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 deploy deploy
    sharedscripts
    postrotate
        su - deploy -c "pm2 reloadLogs" > /dev/null 2>&1
    endscript
}

/var/log/nginx/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 nginx nginx
    sharedscripts
    postrotate
        systemctl reload nginx > /dev/null 2>&1
    endscript
}
EOF

print_success "Log rotation configured"

###############################################################################
# Step 14: Configure SELinux
###############################################################################
print_header "🛡️  Step 14: Configuring SELinux"

if command -v getenforce &> /dev/null; then
    SELINUX_STATUS=$(getenforce)
    print_info "SELinux status: $SELINUX_STATUS"
    
    if [ "$SELINUX_STATUS" != "Disabled" ]; then
        print_info "Configuring SELinux for Nginx..."
        setsebool -P httpd_can_network_connect 1
        
        print_info "Setting SELinux context for application directory..."
        semanage fcontext -a -t httpd_sys_rw_content_t "$APP_DIR(/.*)?" 2>/dev/null || true
        restorecon -Rv "$APP_DIR" 2>/dev/null || true
        
        print_success "SELinux configured"
    fi
else
    print_info "SELinux not available"
fi

###############################################################################
# Completion Summary
###############################################################################
print_header "✅ VPS Setup Complete!"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              Setup Completed Successfully!                  ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}📋 Next Steps:${NC}"
echo ""
echo "1. Generate SSH key for GitHub Actions:"
echo "   ${YELLOW}su - deploy${NC}"
echo "   ${YELLOW}ssh-keygen -t ed25519 -C 'github-deploy' -f ~/.ssh/github_deploy -N \"\"${NC}"
echo "   ${YELLOW}cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys${NC}"
echo "   ${YELLOW}chmod 600 ~/.ssh/authorized_keys${NC}"
echo "   ${YELLOW}cat ~/.ssh/github_deploy${NC}  ${GREEN}# COPY THIS OUTPUT${NC}"
echo ""
echo "2. Add GitHub Secrets (4 secrets):"
echo "   Go to: ${YELLOW}https://github.com/isumitmalhotra/Zyphex-Tech/settings/secrets/actions${NC}"
echo "   - VPS_SSH_PRIVATE_KEY (paste the private key from step 1)"
echo "   - VPS_HOST = 66.116.199.219"
echo "   - VPS_USER = deploy"
echo "   - VPS_PORT = 22"
echo ""
echo "3. Configure environment file:"
echo "   ${YELLOW}cd /var/www/zyphextech${NC}"
echo "   ${YELLOW}nano .env.production${NC}"
echo "   Add minimum config (see VPS_SETUP_COMPLETE_GUIDE.md)"
echo ""
echo "4. Setup Nginx configuration:"
echo "   ${YELLOW}sudo cp /var/www/zyphextech/configs/nginx/zyphextech.conf /etc/nginx/sites-available/${NC}"
echo "   ${YELLOW}sudo ln -s /etc/nginx/sites-available/zyphextech.conf /etc/nginx/sites-enabled/${NC}"
echo "   ${YELLOW}sudo nginx -t && sudo systemctl reload nginx${NC}"
echo ""
echo "5. Obtain SSL certificate:"
echo "   ${YELLOW}sudo certbot --nginx -d www.zyphextech.com --email admin@zyphextech.com --agree-tos --non-interactive${NC}"
echo ""
echo "6. Deploy application:"
echo "   ${YELLOW}su - deploy${NC}"
echo "   ${YELLOW}cd /var/www/zyphextech${NC}"
echo "   ${YELLOW}npm ci${NC}"
echo "   ${YELLOW}npx prisma generate${NC}"
echo "   ${YELLOW}npx prisma migrate deploy${NC}"
echo "   ${YELLOW}npm run build${NC}"
echo "   ${YELLOW}pm2 start ecosystem.config.js${NC}"
echo "   ${YELLOW}pm2 save${NC}"
echo ""

echo -e "${BLUE}📊 System Status:${NC}"
systemctl is-active nginx && echo "  ✅ Nginx: Running" || echo "  ❌ Nginx: Not running"
systemctl is-active postgresql-15 && echo "  ✅ PostgreSQL: Running" || echo "  ❌ PostgreSQL: Not running"
systemctl is-active redis && echo "  ✅ Redis: Running" || echo "  ❌ Redis: Not running"
command -v node &> /dev/null && echo "  ✅ Node.js: $(node -v)" || echo "  ❌ Node.js: Not installed"
command -v npm &> /dev/null && echo "  ✅ npm: $(npm -v)" || echo "  ❌ npm: Not installed"
command -v pm2 &> /dev/null && echo "  ✅ PM2: $(pm2 -v)" || echo "  ❌ PM2: Not installed"
echo ""

echo -e "${BLUE}🗄️  Credentials:${NC}"
echo "  PostgreSQL:"
echo "    Connection: postgresql://zyphex:zyphex_secure_pass_2024@localhost:5432/zyphextech"
echo "  Redis:"
echo "    Connection: redis://:zyphex_redis_pass_2024@localhost:6379"
echo ""

echo -e "${GREEN}🎉 Your VPS is ready for deployment!${NC}"
echo ""

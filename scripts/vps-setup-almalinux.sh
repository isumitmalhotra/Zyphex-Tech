#!/bin/bash

###############################################################################
# VPS Initial Setup Script for Zyphex Tech Platform
# Optimized for: AlmaLinux 8/9 (also compatible with RHEL, Rocky Linux)
# VPS: 66.116.199.219
# Domain: www.zyphextech.com
# Usage: sudo bash vps-setup-almalinux.sh
###############################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="zyphextech"
APP_DIR="/var/www/zyphextech"
DEPLOY_USER="deploy"
DOMAIN="www.zyphextech.com"
EMAIL="admin@zyphextech.com"
NODE_VERSION="20"
GITHUB_REPO="https://github.com/isumitmalhotra/Zyphex-Tech.git"

# Functions
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (use: sudo bash vps-setup-almalinux.sh)"
    exit 1
fi

print_header "🚀 Starting VPS Setup for Zyphex Tech"
print_info "OS: AlmaLinux $(cat /etc/almalinux-release 2>/dev/null || echo 'Unknown')"
print_info "Target Domain: $DOMAIN"

###############################################################################
# Step 1: System Update and Essential Packages
###############################################################################
step_system_update() {
    print_header "📦 Step 1: Updating System Packages"
    
    print_info "Updating package repositories..."
    dnf update -y
    
    print_info "Installing essential packages..."
    dnf install -y \
        git \
        curl \
        wget \
        vim \
        tar \
        gzip \
        firewalld \
        policycoreutils-python-utils \
        epel-release \
        dnf-plugins-core
    
    print_success "System packages updated"
}

###############################################################################
# Step 2: Create Deploy User
###############################################################################
step_create_user() {
    print_header "👤 Step 2: Creating Deploy User"
    
    if id -u "$DEPLOY_USER" >/dev/null 2>&1; then
        print_warning "User $DEPLOY_USER already exists"
    else
        print_info "Creating user: $DEPLOY_USER"
        useradd -m -s /bin/bash "$DEPLOY_USER"
        
        print_info "Adding $DEPLOY_USER to wheel group (sudo access)"
        usermod -aG wheel "$DEPLOY_USER"
        
        print_info "Configuring passwordless sudo for $DEPLOY_USER"
        echo "$DEPLOY_USER ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/"$DEPLOY_USER"
        chmod 0440 /etc/sudoers.d/"$DEPLOY_USER"
        
        print_success "Deploy user created"
    fi
}

###############################################################################
# Step 3: Configure Firewall
###############################################################################
step_configure_firewall() {
    print_header "🔥 Step 3: Configuring Firewall"
    
    print_info "Starting and enabling firewalld..."
    systemctl start firewalld
    systemctl enable firewalld
    
    print_info "Opening required ports..."
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --permanent --add-service=ssh
    
    # Custom ports if needed
    # firewall-cmd --permanent --add-port=3000/tcp
    
    print_info "Reloading firewall rules..."
    firewall-cmd --reload
    
    print_success "Firewall configured"
    firewall-cmd --list-all
}

###############################################################################
# Step 4: Install Node.js 20
###############################################################################
step_install_nodejs() {
    print_header "📦 Step 4: Installing Node.js $NODE_VERSION"
    
    if command -v node &> /dev/null; then
        print_warning "Node.js already installed: $(node -v)"
    else
        print_info "Adding NodeSource repository for Node.js $NODE_VERSION..."
        curl -fsSL https://rpm.nodesource.com/setup_${NODE_VERSION}.x | bash -
        
        print_info "Installing Node.js..."
        dnf install -y nodejs
        
        print_info "Updating npm to latest version..."
        npm install -g npm@latest
        
        print_success "Node.js installed: $(node -v)"
        print_success "npm installed: $(npm -v)"
    fi
}

###############################################################################
# Step 5: Install PostgreSQL 15
###############################################################################
step_install_postgresql() {
    print_header "🗄️  Step 5: Installing PostgreSQL 15"
    
    if command -v psql &> /dev/null; then
        print_warning "PostgreSQL already installed: $(psql --version)"
    else
        print_info "Installing PostgreSQL 15 repository..."
        dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-$(rpm -E %{rhel})-x86_64/pgdg-redhat-repo-latest.noarch.rpm
        
        print_info "Disabling default PostgreSQL module..."
        dnf -qy module disable postgresql
        
        print_info "Installing PostgreSQL 15..."
        dnf install -y postgresql15-server postgresql15-contrib
        
        print_info "Initializing PostgreSQL database..."
        /usr/pgsql-15/bin/postgresql-15-setup initdb
        
        print_info "Starting PostgreSQL service..."
        systemctl start postgresql-15
        systemctl enable postgresql-15
        
        print_success "PostgreSQL 15 installed"
    fi
    
    # Configure PostgreSQL
    print_info "Configuring PostgreSQL..."
    
    # Create database and user
    sudo -u postgres psql -c "CREATE USER zyphex WITH PASSWORD 'zyphex_secure_pass_2024';" 2>/dev/null || print_warning "User already exists"
    sudo -u postgres psql -c "CREATE DATABASE zyphextech OWNER zyphex;" 2>/dev/null || print_warning "Database already exists"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE zyphextech TO zyphex;" 2>/dev/null || true
    
    # Update authentication method
    print_info "Configuring PostgreSQL authentication..."
    sed -i 's/peer/md5/g' /var/lib/pgsql/15/data/pg_hba.conf
    sed -i 's/ident/md5/g' /var/lib/pgsql/15/data/pg_hba.conf
    
    # Performance tuning for 4GB RAM
    print_info "Optimizing PostgreSQL for 4GB RAM..."
    cat >> /var/lib/pgsql/15/data/postgresql.conf << 'EOF'

# ============================================
# Performance Tuning for 4GB RAM VPS
# ============================================
shared_buffers = 1GB
effective_cache_size = 3GB
maintenance_work_mem = 256MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 10MB
min_wal_size = 1GB
max_wal_size = 4GB
max_connections = 100

# Logging
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%a.log'
log_truncate_on_rotation = on
log_rotation_age = 1d
log_rotation_size = 0
EOF
    
    print_info "Restarting PostgreSQL..."
    systemctl restart postgresql-15
    
    print_success "PostgreSQL configured and optimized"
}

###############################################################################
# Step 6: Install Redis
###############################################################################
step_install_redis() {
    print_header "🔴 Step 6: Installing Redis"
    
    if command -v redis-cli &> /dev/null; then
        print_warning "Redis already installed: $(redis-cli --version)"
    else
        print_info "Installing Redis..."
        dnf install -y redis
        
        print_info "Starting Redis service..."
        systemctl start redis
        systemctl enable redis
        
        print_success "Redis installed"
    fi
    
    # Configure Redis
    print_info "Configuring Redis..."
    
    # Backup original config
    cp /etc/redis/redis.conf /etc/redis/redis.conf.backup || true
    
    # Create optimized config
    cat > /etc/redis/redis.conf << 'EOF'
# Redis Configuration for Zyphex Tech
bind 127.0.0.1 ::1
protected-mode yes
port 6379
tcp-backlog 511
timeout 0
tcp-keepalive 300
daemonize no
supervised systemd
pidfile /var/run/redis/redis.pid
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
    
    print_success "Redis configured"
}

###############################################################################
# Step 7: Install Nginx
###############################################################################
step_install_nginx() {
    print_header "🌐 Step 7: Installing Nginx"
    
    if command -v nginx &> /dev/null; then
        print_warning "Nginx already installed: $(nginx -v 2>&1)"
    else
        print_info "Installing Nginx..."
        dnf install -y nginx
        
        print_info "Starting Nginx service..."
        systemctl start nginx
        systemctl enable nginx
        
        print_success "Nginx installed"
    fi
    
    # Create sites-enabled directory structure (like Debian/Ubuntu)
    print_info "Setting up Nginx directory structure..."
    mkdir -p /etc/nginx/sites-available
    mkdir -p /etc/nginx/sites-enabled
    
    # Add include directive to nginx.conf if not present
    if ! grep -q "sites-enabled" /etc/nginx/nginx.conf; then
        sed -i '/include \/etc\/nginx\/conf.d\/\*.conf;/a\    include /etc/nginx/sites-enabled/*;' /etc/nginx/nginx.conf
    fi
    
    print_success "Nginx directory structure created"
}

###############################################################################
# Step 8: Install Certbot for SSL
###############################################################################
step_install_certbot() {
    print_header "🔒 Step 8: Installing Certbot"
    
    if command -v certbot &> /dev/null; then
        print_warning "Certbot already installed: $(certbot --version)"
    else
        print_info "Installing Certbot and Nginx plugin..."
        dnf install -y certbot python3-certbot-nginx
        
        print_success "Certbot installed"
    fi
}

###############################################################################
# Step 9: Create Application Directory
###############################################################################
step_create_app_directory() {
    print_header "📁 Step 9: Creating Application Directory"
    
    print_info "Creating directory: $APP_DIR"
    mkdir -p "$APP_DIR"
    
    print_info "Setting ownership to $DEPLOY_USER"
    chown -R "$DEPLOY_USER":"$DEPLOY_USER" "$APP_DIR"
    
    print_info "Setting permissions..."
    chmod 755 "$APP_DIR"
    
    print_success "Application directory created"
}

###############################################################################
# Step 10: Clone Repository
###############################################################################
step_clone_repository() {
    print_header "📦 Step 10: Cloning Repository"
    
    if [ -d "$APP_DIR/.git" ]; then
        print_warning "Repository already cloned"
    else
        print_info "Cloning from: $GITHUB_REPO"
        sudo -u "$DEPLOY_USER" git clone "$GITHUB_REPO" "$APP_DIR"
        
        print_success "Repository cloned"
    fi
}

###############################################################################
# Step 11: Setup PM2
###############################################################################
step_setup_pm2() {
    print_header "⚡ Step 11: Installing PM2"
    
    if command -v pm2 &> /dev/null; then
        print_warning "PM2 already installed: $(pm2 -v)"
    else
        print_info "Installing PM2 globally..."
        npm install -g pm2
        
        print_success "PM2 installed"
    fi
    
    print_info "Setting up PM2 startup script..."
    env PATH=$PATH:/usr/bin pm2 startup systemd -u "$DEPLOY_USER" --hp /home/"$DEPLOY_USER" | tail -n 1 | bash
    
    print_info "Creating PM2 log directory..."
    mkdir -p /var/log/pm2
    chown -R "$DEPLOY_USER":"$DEPLOY_USER" /var/log/pm2
    
    print_success "PM2 configured"
}

###############################################################################
# Step 12: Setup Monitoring
###############################################################################
step_setup_monitoring() {
    print_header "📊 Step 12: Setting up Monitoring"
    
    print_info "Creating health check script..."
    cat > /usr/local/bin/health-check.sh << 'EOF'
#!/bin/bash
if ! curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "Health check failed at $(date)" >> /var/log/health-check.log
    pm2 restart zyphextech
fi
EOF
    
    chmod +x /usr/local/bin/health-check.sh
    
    print_info "Adding health check cron job (every 5 minutes)..."
    (crontab -l 2>/dev/null | grep -v health-check.sh; echo "*/5 * * * * /usr/local/bin/health-check.sh") | crontab -
    
    print_success "Monitoring configured"
}

###############################################################################
# Step 13: Setup Log Rotation
###############################################################################
step_setup_logrotate() {
    print_header "📝 Step 13: Setting up Log Rotation"
    
    print_info "Creating logrotate configuration..."
    cat > /etc/logrotate.d/zyphextech << EOF
/var/log/pm2/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 $DEPLOY_USER $DEPLOY_USER
    sharedscripts
    postrotate
        su - $DEPLOY_USER -c "pm2 reloadLogs" > /dev/null 2>&1
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
}

###############################################################################
# Step 14: Configure SELinux
###############################################################################
step_configure_selinux() {
    print_header "🛡️  Step 14: Configuring SELinux"
    
    if command -v getenforce &> /dev/null; then
        SELINUX_STATUS=$(getenforce)
        print_info "SELinux status: $SELINUX_STATUS"
        
        if [ "$SELINUX_STATUS" != "Disabled" ]; then
            print_info "Configuring SELinux for Nginx..."
            setsebool -P httpd_can_network_connect 1
            
            print_info "Setting SELinux context for application directory..."
            semanage fcontext -a -t httpd_sys_rw_content_t "$APP_DIR(/.*)?" || true
            restorecon -Rv "$APP_DIR" || true
            
            print_success "SELinux configured"
        fi
    else
        print_warning "SELinux not available"
    fi
}

###############################################################################
# Main Execution
###############################################################################
main() {
    # Run all setup steps
    step_system_update
    step_create_user
    step_configure_firewall
    step_install_nodejs
    step_install_postgresql
    step_install_redis
    step_install_nginx
    step_install_certbot
    step_create_app_directory
    step_clone_repository
    step_setup_pm2
    step_setup_monitoring
    step_setup_logrotate
    step_configure_selinux
    
    # Print completion summary
    print_header "✅ VPS Setup Complete!"
    
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║              Setup Completed Successfully!                  ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    echo -e "${BLUE}📋 Next Steps:${NC}"
    echo ""
    echo "1. Configure SSH key for GitHub Actions:"
    echo "   ${YELLOW}ssh-keygen -t ed25519 -C 'github-deploy' -f /home/deploy/.ssh/github_deploy${NC}"
    echo "   ${YELLOW}cat /home/deploy/.ssh/github_deploy.pub >> /home/deploy/.ssh/authorized_keys${NC}"
    echo "   ${YELLOW}cat /home/deploy/.ssh/github_deploy${NC}  (copy this to GitHub Secrets)"
    echo ""
    echo "2. Configure environment file:"
    echo "   ${YELLOW}sudo nano $APP_DIR/.env.production${NC}"
    echo "   Update: DATABASE_URL, NEXTAUTH_SECRET, email settings, OAuth credentials"
    echo ""
    echo "3. Setup Nginx configuration:"
    echo "   ${YELLOW}sudo cp $APP_DIR/configs/nginx/zyphextech.conf /etc/nginx/sites-available/${NC}"
    echo "   ${YELLOW}sudo ln -s /etc/nginx/sites-available/zyphextech.conf /etc/nginx/sites-enabled/${NC}"
    echo "   ${YELLOW}sudo nginx -t && sudo systemctl reload nginx${NC}"
    echo ""
    echo "4. Obtain SSL certificate:"
    echo "   ${YELLOW}sudo certbot --nginx -d $DOMAIN --email $EMAIL --agree-tos --non-interactive${NC}"
    echo ""
    echo "5. Deploy application:"
    echo "   ${YELLOW}su - $DEPLOY_USER${NC}"
    echo "   ${YELLOW}cd $APP_DIR && ./scripts/deploy-manual.sh${NC}"
    echo ""
    
    echo -e "${BLUE}📊 System Information:${NC}"
    echo "  • Application Directory: $APP_DIR"
    echo "  • Deploy User: $DEPLOY_USER"
    echo "  • Domain: $DOMAIN"
    echo "  • Node.js: $(node -v)"
    echo "  • npm: $(npm -v)"
    echo "  • PostgreSQL: $(sudo -u postgres psql --version | awk '{print $3}')"
    echo "  • Redis: $(redis-cli --version | awk '{print $2}')"
    echo "  • Nginx: $(nginx -v 2>&1 | awk '{print $3}')"
    echo ""
    
    echo -e "${BLUE}🗄️  Database Credentials:${NC}"
    echo "  • Host: localhost"
    echo "  • Port: 5432"
    echo "  • Database: zyphextech"
    echo "  • User: zyphex"
    echo "  • Password: zyphex_secure_pass_2024"
    echo "  • Connection: postgresql://zyphex:zyphex_secure_pass_2024@localhost:5432/zyphextech"
    echo ""
    
    echo -e "${BLUE}🔴 Redis Credentials:${NC}"
    echo "  • Host: localhost"
    echo "  • Port: 6379"
    echo "  • Password: zyphex_redis_pass_2024"
    echo "  • Connection: redis://:zyphex_redis_pass_2024@localhost:6379"
    echo ""
    
    echo -e "${BLUE}📁 Important Files:${NC}"
    echo "  • Nginx Config: /etc/nginx/sites-available/zyphextech.conf"
    echo "  • PM2 Config: $APP_DIR/ecosystem.config.js"
    echo "  • Environment: $APP_DIR/.env.production"
    echo "  • Application Logs: /var/log/pm2/zyphextech-*.log"
    echo "  • Nginx Logs: /var/log/nginx/access.log & error.log"
    echo "  • Health Check Log: /var/log/health-check.log"
    echo ""
    
    echo -e "${GREEN}🎉 Your VPS is ready for deployment!${NC}"
    echo ""
}

# Run main function
main "$@"

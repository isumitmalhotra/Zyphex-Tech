#!/bin/bash

###############################################################################
# VPS Initial Setup Script for Zyphex Tech Platform
# This script automates the initial setup of your VPS
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
EMAIL="your-email@example.com"  # Change this!
NODE_VERSION="20"

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

check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "Please run as root (use: sudo su)"
        exit 1
    fi
}

###############################################################################
# STEP 1: System Update
###############################################################################
step_system_update() {
    print_info "Step 1: Updating system packages..."
    dnf update -y
    dnf install -y curl wget git nano htop firewalld epel-release
    print_success "System updated"
}

###############################################################################
# STEP 2: Create Deploy User
###############################################################################
step_create_user() {
    print_info "Step 2: Creating deploy user..."
    
    if id "$DEPLOY_USER" &>/dev/null; then
        print_warning "User $DEPLOY_USER already exists"
    else
        useradd -m -s /bin/bash $DEPLOY_USER
        echo "deploy:$(openssl rand -base64 12)" | chpasswd
        usermod -aG wheel $DEPLOY_USER
        echo "$DEPLOY_USER ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/$DEPLOY_USER
        
        mkdir -p /home/$DEPLOY_USER/.ssh
        chmod 700 /home/$DEPLOY_USER/.ssh
        chown -R $DEPLOY_USER:$DEPLOY_USER /home/$DEPLOY_USER/.ssh
        
        print_success "Deploy user created"
    fi
}

###############################################################################
# STEP 3: Configure Firewall
###############################################################################
step_configure_firewall() {
    print_info "Step 3: Configuring firewall..."
    
    systemctl start firewalld
    systemctl enable firewalld
    
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --permanent --add-service=ssh
    firewall-cmd --permanent --add-port=5432/tcp
    firewall-cmd --reload
    
    print_success "Firewall configured"
}

###############################################################################
# STEP 4: Install Node.js
###############################################################################
step_install_nodejs() {
    print_info "Step 4: Installing Node.js ${NODE_VERSION}..."
    
    if command -v node &> /dev/null; then
        print_warning "Node.js already installed: $(node --version)"
    else
        curl -fsSL https://rpm.nodesource.com/setup_${NODE_VERSION}.x | bash -
        dnf install -y nodejs
        npm install -g pm2 pnpm
        print_success "Node.js installed: $(node --version)"
    fi
}

###############################################################################
# STEP 5: Install PostgreSQL
###############################################################################
step_install_postgresql() {
    print_info "Step 5: Installing PostgreSQL 15..."
    
    if systemctl is-active --quiet postgresql-15; then
        print_warning "PostgreSQL already running"
    else
        dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-9-x86_64/pgdg-redhat-repo-latest.noarch.rpm
        dnf -qy module disable postgresql
        dnf install -y postgresql15-server postgresql15-contrib
        
        /usr/pgsql-15/bin/postgresql-15-setup initdb
        
        # Configure PostgreSQL
        cat > /var/lib/pgsql/15/data/pg_hba.conf << 'EOF'
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                peer
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
EOF

        # Performance tuning
        cat >> /var/lib/pgsql/15/data/postgresql.conf << 'EOF'

# Performance tuning for 4GB RAM
shared_buffers = 1GB
effective_cache_size = 3GB
maintenance_work_mem = 256MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 10485kB
min_wal_size = 1GB
max_wal_size = 4GB
max_connections = 100
EOF
        
        systemctl start postgresql-15
        systemctl enable postgresql-15
        print_success "PostgreSQL installed"
    fi
}

###############################################################################
# STEP 6: Install Redis
###############################################################################
step_install_redis() {
    print_info "Step 6: Installing Redis..."
    
    if systemctl is-active --quiet redis; then
        print_warning "Redis already running"
    else
        dnf install -y redis
        
        # Configure Redis
        sed -i 's/^bind 127.0.0.1/bind 127.0.0.1 ::1/' /etc/redis/redis.conf
        sed -i 's/^# maxmemory <bytes>/maxmemory 512mb/' /etc/redis/redis.conf
        sed -i 's/^# maxmemory-policy noeviction/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf
        
        systemctl start redis
        systemctl enable redis
        print_success "Redis installed"
    fi
}

###############################################################################
# STEP 7: Install Nginx
###############################################################################
step_install_nginx() {
    print_info "Step 7: Installing Nginx..."
    
    if systemctl is-active --quiet nginx; then
        print_warning "Nginx already running"
    else
        dnf install -y nginx
        
        mkdir -p /etc/nginx/sites-available
        mkdir -p /etc/nginx/sites-enabled
        mkdir -p /var/www/certbot
        
        # Add include to nginx.conf if not present
        if ! grep -q "include /etc/nginx/sites-enabled/\*;" /etc/nginx/nginx.conf; then
            sed -i '/include \/etc\/nginx\/conf.d\/\*.conf;/a\    include /etc/nginx/sites-enabled/*;' /etc/nginx/nginx.conf
        fi
        
        systemctl start nginx
        systemctl enable nginx
        print_success "Nginx installed"
    fi
}

###############################################################################
# STEP 8: Install Certbot
###############################################################################
step_install_certbot() {
    print_info "Step 8: Installing Certbot..."
    
    if command -v certbot &> /dev/null; then
        print_warning "Certbot already installed"
    else
        dnf install -y certbot python3-certbot-nginx
        print_success "Certbot installed"
    fi
}

###############################################################################
# STEP 9: Create Application Directory
###############################################################################
step_create_app_directory() {
    print_info "Step 9: Creating application directory..."
    
    mkdir -p $APP_DIR
    chown -R $DEPLOY_USER:$DEPLOY_USER $APP_DIR
    
    mkdir -p /var/log/pm2
    chown -R $DEPLOY_USER:$DEPLOY_USER /var/log/pm2
    
    print_success "Application directory created"
}

###############################################################################
# STEP 10: Setup PM2 Startup
###############################################################################
step_setup_pm2() {
    print_info "Step 10: Setting up PM2 startup..."
    
    # Generate and run startup script
    STARTUP_CMD=$(su - $DEPLOY_USER -c "pm2 startup systemd -u $DEPLOY_USER --hp /home/$DEPLOY_USER" | grep "sudo")
    eval $STARTUP_CMD
    
    systemctl enable pm2-$DEPLOY_USER
    print_success "PM2 startup configured"
}

###############################################################################
# STEP 11: Setup Monitoring
###############################################################################
step_setup_monitoring() {
    print_info "Step 11: Setting up monitoring..."
    
    mkdir -p /opt/monitoring
    
    cat > /opt/monitoring/health-check.sh << 'EOFMON'
#!/bin/bash
LOG_FILE="/var/log/health-check.log"

# Check PM2
if ! su - deploy -c "pm2 describe zyphextech" > /dev/null 2>&1; then
    echo "[$(date)] ERROR: Application is not running" >> $LOG_FILE
    su - deploy -c "cd /var/www/zyphextech && pm2 start ecosystem.config.js"
fi

# Check services
for service in nginx postgresql-15 redis; do
    if ! systemctl is-active --quiet $service; then
        echo "[$(date)] ERROR: $service is not running" >> $LOG_FILE
        systemctl start $service
    fi
done

# Check disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    echo "[$(date)] WARNING: Disk usage is at ${DISK_USAGE}%" >> $LOG_FILE
fi
EOFMON

    chmod +x /opt/monitoring/health-check.sh
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "*/5 * * * * /opt/monitoring/health-check.sh") | crontab -
    
    print_success "Monitoring configured"
}

###############################################################################
# STEP 12: Setup Log Rotation
###############################################################################
step_setup_logrotate() {
    print_info "Step 12: Setting up log rotation..."
    
    cat > /etc/logrotate.d/zyphextech << 'EOFLOG'
/var/log/nginx/zyphextech_*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 nginx adm
    sharedscripts
    postrotate
        systemctl reload nginx > /dev/null
    endscript
}

/var/log/pm2/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 deploy deploy
    sharedscripts
    postrotate
        su - deploy -c "pm2 reloadLogs" > /dev/null
    endscript
}
EOFLOG

    print_success "Log rotation configured"
}

###############################################################################
# Main Installation
###############################################################################
main() {
    print_info "Starting VPS setup for Zyphex Tech Platform"
    print_info "This will take 10-15 minutes..."
    echo ""
    
    check_root
    
    step_system_update
    step_create_user
    step_configure_firewall
    step_install_nodejs
    step_install_postgresql
    step_install_redis
    step_install_nginx
    step_install_certbot
    step_create_app_directory
    step_setup_pm2
    step_setup_monitoring
    step_setup_logrotate
    
    echo ""
    print_success "VPS setup complete! 🎉"
    echo ""
    print_info "Next steps:"
    echo "  1. Configure PostgreSQL database (see VPS_DEPLOYMENT_GUIDE.md)"
    echo "  2. Setup Nginx configuration"
    echo "  3. Obtain SSL certificate"
    echo "  4. Clone and deploy application"
    echo "  5. Setup GitHub Actions secrets"
    echo ""
    print_info "Database setup commands:"
    echo "  sudo -u postgres psql"
    echo "  CREATE DATABASE zyphex_tech_production;"
    echo "  CREATE USER zyphex_user WITH ENCRYPTED PASSWORD 'your_password';"
    echo "  GRANT ALL PRIVILEGES ON DATABASE zyphex_tech_production TO zyphex_user;"
    echo ""
}

# Run main function
main

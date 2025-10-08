#!/bin/bash

###############################################################################
# Manual Deployment Script for Zyphex Tech Platform
# Use this for manual deployments when GitHub Actions is not available
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_DIR="/var/www/zyphextech"

print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# Check if running as deploy user
if [ "$USER" != "deploy" ]; then
    print_error "Please run as deploy user: su - deploy"
    exit 1
fi

# Navigate to app directory
cd $APP_DIR

print_info "Starting deployment process..."
echo ""

# Step 1: Backup current version
print_info "Step 1/8: Creating backup..."
BACKUP_DIR="/home/deploy/backups"
mkdir -p $BACKUP_DIR
BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).tar.gz"
tar -czf $BACKUP_FILE .next node_modules package-lock.json 2>/dev/null || true
print_success "Backup created: $BACKUP_FILE"

# Step 2: Pull latest code
print_info "Step 2/8: Pulling latest code from GitHub..."
git stash
git pull origin main
print_success "Code updated"

# Step 3: Install dependencies
print_info "Step 3/8: Installing dependencies..."
npm ci --production=false
print_success "Dependencies installed"

# Step 4: Generate Prisma Client
print_info "Step 4/8: Generating Prisma Client..."
npx prisma generate
print_success "Prisma Client generated"

# Step 5: Run database migrations
print_info "Step 5/8: Running database migrations..."
npx prisma migrate deploy
print_success "Migrations completed"

# Step 6: Build application
print_info "Step 6/8: Building application..."
npm run build
print_success "Build completed"

# Step 7: Restart application
print_info "Step 7/8: Restarting application..."
pm2 restart zyphextech --update-env
sleep 5
print_success "Application restarted"

# Step 8: Health check
print_info "Step 8/8: Running health check..."
sleep 3

if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    print_success "Health check passed!"
    pm2 save
    
    echo ""
    print_success "🎉 Deployment completed successfully!"
    echo ""
    print_info "Application status:"
    pm2 status
    echo ""
    print_info "Website: https://www.zyphextech.com"
    
else
    print_error "Health check failed!"
    print_warning "Rolling back to previous version..."
    
    # Rollback
    git reset --hard HEAD~1
    npm ci --production=false
    npm run build
    pm2 restart zyphextech
    
    print_error "Deployment failed and rolled back"
    exit 1
fi

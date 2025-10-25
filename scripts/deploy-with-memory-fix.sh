#!/bin/bash

# VPS Deployment Script with Memory Fix
# This script handles the complete deployment process with memory optimizations

set -e  # Exit on any error

echo "🚀 Starting deployment with memory optimizations..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
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

# Check available memory
print_status "Checking available memory..."
AVAILABLE_MEM=$(free -m | awk 'NR==2{print $7}')
TOTAL_MEM=$(free -m | awk 'NR==2{print $2}')

echo "Total Memory: ${TOTAL_MEM}MB"
echo "Available Memory: ${AVAILABLE_MEM}MB"

if [ "$AVAILABLE_MEM" -lt 3500 ]; then
    print_warning "Available memory is less than 3.5GB"
    print_status "Stopping PM2 processes to free memory..."
    pm2 stop all || true
    sleep 2
    
    print_status "Clearing cache..."
    sync
    # sudo sh -c 'echo 3 > /proc/sys/vm/drop_caches'  # Uncomment if you have sudo
    
    AVAILABLE_MEM=$(free -m | awk 'NR==2{print $7}')
    echo "Available Memory after cleanup: ${AVAILABLE_MEM}MB"
fi

# Navigate to project directory
cd /var/www/zyphextech || {
    print_error "Failed to navigate to project directory"
    exit 1
}

# Pull latest code
print_status "Pulling latest code from GitHub..."
git pull origin main || {
    print_error "Git pull failed"
    exit 1
}
print_success "Code updated successfully"

# Install dependencies
print_status "Installing dependencies..."
npm install --legacy-peer-deps || {
    print_error "npm install failed"
    exit 1
}
print_success "Dependencies installed"

# Generate Prisma Client
print_status "Generating Prisma Client..."
npx prisma generate || {
    print_error "Prisma generate failed"
    exit 1
}
print_success "Prisma Client generated"

# Run migrations
print_status "Running database migrations..."
npx prisma migrate deploy || {
    print_warning "Migration failed or no pending migrations"
}

# Remove old build
print_status "Removing old build..."
rm -rf .next
print_success "Old build removed"

# Build with new memory settings (4GB heap)
print_status "Building application with 4GB heap size..."
print_warning "This may take 10-15 minutes. Please be patient..."

# Show memory during build in background
(
    for i in {1..900}; do
        CURRENT_MEM=$(free -m | awk 'NR==2{printf "%.0f", ($2-$7)}')
        if [ $((i % 30)) -eq 0 ]; then
            echo "Memory used: ${CURRENT_MEM}MB / ${TOTAL_MEM}MB"
        fi
        sleep 2
    done
) &
MONITOR_PID=$!

# Run the build
if npm run build:vps; then
    kill $MONITOR_PID 2>/dev/null || true
    print_success "Build completed successfully!"
else
    kill $MONITOR_PID 2>/dev/null || true
    print_error "Build failed!"
    print_error "Check memory usage and try again"
    print_status "Attempting to restart previous version..."
    pm2 restart ecosystem.config.js || true
    exit 1
fi

# Restart PM2
print_status "Restarting PM2 application..."
pm2 restart ecosystem.config.js || {
    print_error "PM2 restart failed"
    exit 1
}
print_success "Application restarted"

# Wait for app to start
print_status "Waiting for application to start..."
sleep 5

# Check if app is running
pm2 status zyphextech

# Test the application
print_status "Testing application health..."
if curl -f -s http://localhost:3000 > /dev/null; then
    print_success "Application is responding!"
else
    print_warning "Application may not be responding correctly"
    print_status "Check PM2 logs: pm2 logs zyphextech"
fi

# Show final memory usage
print_status "Final memory status:"
free -h

# Show PM2 status
print_status "PM2 Status:"
pm2 list

print_success "Deployment completed!"
echo ""
echo "📊 Next steps:"
echo "   - Monitor logs: pm2 logs zyphextech"
echo "   - Check memory: pm2 monit"
echo "   - View app: http://your-domain.com"
echo ""
echo "🔧 Troubleshooting:"
echo "   - If build fails: Check DEPLOYMENT_MEMORY_FIX.md"
echo "   - If app crashes: pm2 logs zyphextech --lines 100"
echo "   - Memory issues: Consider adding swap space"
echo ""

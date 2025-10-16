#!/bin/bash

# Zyphex Tech - Production Deployment Script
# Optimized for low-memory VPS environments

set -e  # Exit on error

echo "🚀 Starting Zyphex Tech Deployment..."

# Configuration
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
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

# Step 1: Save local changes
print_status "Saving local changes..."
git stash || print_warning "No local changes to save"

# Step 2: Pull latest code
print_status "Pulling latest code from main branch..."
git fetch origin
git pull origin main
print_success "Code updated successfully"

# Step 3: Install dependencies
print_status "Installing dependencies..."
npm ci --prefer-offline --no-audit
print_success "Dependencies installed"

# Step 4: Generate Prisma Client
print_status "Generating Prisma Client..."
npx prisma generate
print_success "Prisma Client generated"

# Step 5: Run database migrations
print_status "Running database migrations..."
npx prisma migrate deploy
print_success "Migrations completed"

# Step 6: Clean old build
print_status "Cleaning old build artifacts..."
rm -rf .next
rm -rf node_modules/.cache
print_success "Build cleaned"

# Step 7: Build with memory optimization
print_status "Building Next.js application (this may take a few minutes)..."
print_warning "Using optimized memory settings (4GB heap size)"

# Set memory limits and build
NODE_OPTIONS="--max-old-space-size=4096 --max-semi-space-size=128" npm run build

if [ $? -eq 0 ]; then
    print_success "Build completed successfully!"
else
    print_error "Build failed! Check the error log above."
    exit 1
fi

# Step 8: Restart application
print_status "Restarting application with PM2..."

# Check if PM2 process exists
if pm2 describe zyphex-tech > /dev/null 2>&1; then
    print_status "Stopping existing PM2 process..."
    pm2 stop zyphex-tech
    pm2 delete zyphex-tech
fi

# Start new PM2 process
print_status "Starting new PM2 process..."
pm2 start npm --name "zyphex-tech" -- start
pm2 save

print_success "Application restarted successfully!"

# Step 9: Verify deployment
print_status "Verifying deployment..."
sleep 5

# Check if PM2 process is running
if pm2 describe zyphex-tech | grep -q "online"; then
    print_success "Application is running!"
    
    # Show PM2 status
    print_status "Current PM2 status:"
    pm2 status
    
    print_success "🎉 Deployment completed successfully!"
    print_status "Application is now live at your domain"
else
    print_error "Application failed to start. Check PM2 logs:"
    pm2 logs zyphex-tech --lines 50
    exit 1
fi

# Optional: Show logs
print_status "Last 20 lines of application logs:"
pm2 logs zyphex-tech --lines 20 --nostream

print_success "Deployment script completed! ✨"

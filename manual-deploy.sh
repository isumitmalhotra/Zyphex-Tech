#!/bin/bash
# Manual Deployment Script - Run as deploy user
# Usage: ssh root@66.116.199.219 "su - deploy -c 'bash /var/www/zyphextech/manual-deploy.sh'"

set -e

echo "=================================================="
echo "🚀 Zyphex Tech - Manual Deployment"
echo "=================================================="
echo ""

# Navigate to project directory
cd /var/www/zyphextech

# Show current user
echo "👤 Running as: $(whoami)"
echo "📁 Working directory: $(pwd)"
echo ""

# Stash any local changes
echo "🔄 Stashing local changes..."
git stash || true
echo ""

# Pull latest code
echo "🔄 Pulling latest code from GitHub..."
git pull origin main
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps
echo ""

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate
echo ""

# Run migrations
echo "🗄️  Running database migrations..."
npx prisma migrate deploy || true
echo ""

# Stop PM2 to free memory
echo "🛑 Stopping PM2 to free memory..."
pm2 stop zyphextech || true
echo ""

# Build application
echo "🏗️  Building application with 4GB heap..."
NODE_OPTIONS='--max-old-space-size=4096' npm run build
echo ""

# Check if build succeeded
if [ ! -f ".next/BUILD_ID" ]; then
    echo "❌ Build failed - BUILD_ID not found"
    exit 1
fi

echo "✅ Build completed successfully!"
echo ""

# Restart application
echo "🔄 Restarting application with PM2..."
pm2 restart zyphextech || pm2 start ecosystem.config.js
pm2 save
echo ""

# Wait for startup
echo "⏳ Waiting 15 seconds for application to start..."
sleep 15
echo ""

# Health check
echo "🏥 Running health check..."
for i in {1..5}; do
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "✅ Application is healthy!"
        echo ""
        echo "=================================================="
        echo "🎉 Deployment completed successfully!"
        echo "🌐 Site: https://www.zyphextech.com"
        echo "=================================================="
        exit 0
    fi
    echo "Attempt $i/5 failed, retrying..."
    sleep 5
done

echo "⚠️  Health check timeout, checking PM2 status..."
pm2 status
echo ""
echo "📋 Recent logs:"
pm2 logs zyphextech --lines 20 --nostream
echo ""
echo "⚠️  Application may still be starting. Check: pm2 logs zyphextech"

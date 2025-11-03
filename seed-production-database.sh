#!/bin/bash

###############################################################################
# PRODUCTION DATABASE SEEDING - QUICK FIX
# Run this script on production server to populate blog posts and team members
###############################################################################

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   SEEDING PRODUCTION DATABASE                                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📍 Location: $(pwd)"
echo "👤 User: $(whoami)"
echo "🕐 Time: $(date)"
echo ""

# Step 1: Verify we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ ERROR: package.json not found!"
    echo "Please run this from /var/www/zyphextech directory"
    exit 1
fi

echo "✅ Correct directory verified"
echo ""

# Step 2: Check if database is accessible
echo "🔍 Testing database connection..."
npx prisma db pull --force > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Database connection successful"
else
    echo "⚠️  Database connection check skipped (continuing anyway)"
fi
echo ""

# Step 3: Delete old content
echo "🗑️  Step 1/4: Deleting old blog posts and team members..."
npx tsx scripts/reset-and-reseed-content.ts
echo ""

# Step 4: Seed blog posts
echo "📝 Step 2/4: Creating 6 blog posts with Unsplash images..."
npx tsx scripts/seed-blog-posts.ts
echo ""

# Step 5: Seed team members
echo "👥 Step 3/4: Creating 6 team members with UI Avatar photos..."
npx tsx scripts/seed-team-members.ts
echo ""

# Step 6: Verify
echo "🔍 Step 4/4: Verifying database content..."
npx tsx scripts/verify-content-images.ts
echo ""

# Step 7: Restart application
echo "🔄 Restarting application..."
if command -v pm2 &> /dev/null; then
    pm2 restart zyphextech
    echo "✅ PM2 restarted"
elif systemctl is-active --quiet zyphextech.service; then
    sudo systemctl restart zyphextech.service
    echo "✅ Systemd service restarted"
else
    echo "⚠️  Please manually restart your application"
fi
echo ""

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   ✅ SEEDING COMPLETE!                                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 What was created:"
echo "   • 6 Blog Posts (with Unsplash CDN images)"
echo "   • 6 Team Members (with UI Avatar photos)"
echo ""
echo "🌐 Now check your website:"
echo "   • https://zyphextech.com/updates (should show 6 blog posts)"
echo "   • https://zyphextech.com/about (should show 6 team members)"
echo ""
echo "💡 If images still don't show:"
echo "   1. Clear browser cache (Ctrl+Shift+R)"
echo "   2. Wait 1-2 minutes for app to restart"
echo "   3. Check: pm2 logs zyphextech"
echo ""

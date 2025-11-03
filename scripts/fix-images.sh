#!/bin/bash

# Quick Fix Script for Image Loading Issue
# Run this on your production server (Linux/Unix)

echo "🖼️  Fixing Image Loading Issues on Production"
echo "============================================"
echo ""

# Step 1: Update blog post images in database
echo "Step 1: Updating blog post images to Unsplash URLs..."
npm run update:blog-images

if [ $? -ne 0 ]; then
    echo "❌ Failed to update blog images"
    exit 1
fi

echo "✅ Blog images updated successfully!"
echo ""

# Step 2: Clear Next.js cache
echo "Step 2: Clearing Next.js cache..."
if [ -d ".next" ]; then
    rm -rf .next
    echo "✅ Cache cleared"
else
    echo "⏭️  No cache to clear"
fi
echo ""

# Step 3: Rebuild the application
echo "Step 3: Rebuilding application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build completed successfully!"
echo ""

# Step 4: Restart PM2
echo "Step 4: Restarting PM2..."
pm2 restart zyphex-tech

if [ $? -ne 0 ]; then
    echo "❌ Failed to restart PM2"
    echo "💡 Try manually: pm2 restart zyphex-tech"
    exit 1
fi

echo "✅ PM2 restarted successfully!"
echo ""

# Step 5: Verify
echo "🎉 Image fix complete!"
echo ""
echo "Next steps:"
echo "1. Visit https://zyphextech.com/updates"
echo "2. Verify that blog post images are now loading"
echo "3. Check other pages (About, Services, etc.)"
echo ""
echo "If images still don't load:"
echo "- Check Nginx logs: tail -f /var/log/nginx/error.log"
echo "- Check PM2 logs: pm2 logs zyphex-tech"
echo "- Verify CORS settings in next.config.mjs"

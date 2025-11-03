# Quick Fix Script for Image Loading Issue
# Run this on your production server

Write-Host "🖼️  Fixing Image Loading Issues on Production" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Update blog post images in database
Write-Host "Step 1: Updating blog post images to Unsplash URLs..." -ForegroundColor Yellow
npm run update:blog-images

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to update blog images" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Blog images updated successfully!" -ForegroundColor Green
Write-Host ""

# Step 2: Clear Next.js cache
Write-Host "Step 2: Clearing Next.js cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next
    Write-Host "✅ Cache cleared" -ForegroundColor Green
} else {
    Write-Host "⏭️  No cache to clear" -ForegroundColor Gray
}
Write-Host ""

# Step 3: Rebuild the application
Write-Host "Step 3: Rebuilding application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build completed successfully!" -ForegroundColor Green
Write-Host ""

# Step 4: Restart PM2
Write-Host "Step 4: Restarting PM2..." -ForegroundColor Yellow
pm2 restart zyphex-tech

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to restart PM2" -ForegroundColor Red
    Write-Host "💡 Try manually: pm2 restart zyphex-tech" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ PM2 restarted successfully!" -ForegroundColor Green
Write-Host ""

# Step 5: Verify
Write-Host "🎉 Image fix complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Visit https://zyphextech.com/updates" -ForegroundColor White
Write-Host "2. Verify that blog post images are now loading" -ForegroundColor White
Write-Host "3. Check other pages (About, Services, etc.)" -ForegroundColor White
Write-Host ""
Write-Host "If images still don't load:" -ForegroundColor Yellow
Write-Host "- Check Nginx logs: tail -f /var/log/nginx/error.log" -ForegroundColor White
Write-Host "- Check PM2 logs: pm2 logs zyphex-tech" -ForegroundColor White
Write-Host "- Verify CORS settings in next.config.mjs" -ForegroundColor White

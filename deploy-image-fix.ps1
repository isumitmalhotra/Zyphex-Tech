# Production Deployment Script for Image Fix
# Run this after deploying code to production

param(
    [string]$ServerIP = "66.116.199.219",
    [string]$User = "deploy",
    [string]$ProjectPath = "/var/www/zyphextech"
)

Write-Host "🚀 Deploying Image Fix to Production" -ForegroundColor Cyan
Write-Host "=" * 60
Write-Host ""

# Step 1: Commit and push changes
Write-Host "📝 Step 1: Committing changes..." -ForegroundColor Yellow
git add .
git commit -m "fix: Update image URLs to use CDN for production"
git push origin cms-consolidation

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Git push failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Changes pushed to repository" -ForegroundColor Green
Write-Host ""

# Step 2: SSH and deploy
Write-Host "📝 Step 2: Deploying to production server..." -ForegroundColor Yellow
Write-Host "Server: $User@$ServerIP" -ForegroundColor Gray
Write-Host ""

$sshCommands = @"
cd $ProjectPath &&
git pull origin cms-consolidation &&
npm install &&
npx prisma generate &&
pm2 restart all &&
echo '✅ Deployment complete'
"@

Write-Host "Executing deployment commands..." -ForegroundColor Gray
ssh "$User@$ServerIP" $sshCommands

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Code deployed successfully" -ForegroundColor Green
Write-Host ""

# Step 3: Update database
Write-Host "📝 Step 3: Updating production database..." -ForegroundColor Yellow
Write-Host "This will reset and reseed blog posts and team members" -ForegroundColor Gray
Write-Host ""

$dbCommands = @"
cd $ProjectPath &&
npx tsx scripts/reset-and-reseed-content.ts &&
npx tsx scripts/seed-blog-posts.ts &&
npx tsx scripts/seed-team-members.ts &&
npx tsx scripts/verify-content-images.ts
"@

Write-Host "Executing database seed commands..." -ForegroundColor Gray
ssh "$User@$ServerIP" $dbCommands

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Database update had issues - check output above" -ForegroundColor Yellow
} else {
    Write-Host "✅ Database updated successfully" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "=" * 60
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Visit https://zyphextech.com/updates - Verify blog images" -ForegroundColor White
Write-Host "2. Visit https://zyphextech.com/about - Verify team member photos" -ForegroundColor White
Write-Host "3. Check browser console for any errors" -ForegroundColor White
Write-Host "4. Test on mobile devices" -ForegroundColor White
Write-Host ""
Write-Host "✅ All images should now be loading from CDN!" -ForegroundColor Green

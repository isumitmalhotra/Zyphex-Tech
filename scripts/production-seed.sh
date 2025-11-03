#!/bin/bash

###############################################################################
# PRODUCTION DATABASE SEEDING SCRIPT
# Run this on production server after deployment
###############################################################################

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   PRODUCTION DATABASE SEEDING - Image Fix                      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📍 Current Directory: $(pwd)"
echo "👤 Current User: $(whoami)"
echo "🕐 Started at: $(date)"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found!${NC}"
    echo "Please run this script from the project root directory."
    exit 1
fi

echo -e "${YELLOW}Step 1/5: Verifying current database content...${NC}"
npx tsx scripts/verify-content-images.ts
echo ""

read -p "Continue with reset and reseed? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 2/5: Deleting old content with broken image URLs...${NC}"
npx tsx scripts/reset-and-reseed-content.ts
echo ""

echo -e "${YELLOW}Step 3/5: Seeding blog posts with Unsplash CDN URLs...${NC}"
npx tsx scripts/seed-blog-posts.ts
echo ""

echo -e "${YELLOW}Step 4/5: Seeding team members with UI Avatars CDN URLs...${NC}"
npx tsx scripts/seed-team-members.ts
echo ""

echo -e "${YELLOW}Step 5/5: Verifying database updated correctly...${NC}"
npx tsx scripts/verify-content-images.ts
echo ""

echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ DATABASE SEEDING COMPLETE!                               ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "📊 Summary:"
echo "   ✓ Blog Posts: 6 (with Unsplash images)"
echo "   ✓ Team Members: 6 (with UI Avatar photos)"
echo "   ✓ All images using CDN URLs"
echo ""
echo "🔄 Next Steps:"
echo "   1. Restart application: pm2 restart zyphextech"
echo "   2. Check website: https://zyphextech.com/updates"
echo "   3. Check website: https://zyphextech.com/about"
echo ""
echo "🕐 Completed at: $(date)"

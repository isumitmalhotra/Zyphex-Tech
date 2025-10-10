#!/bin/bash

# VPS User Setup Script
# Run this script on your VPS to create all production users

echo "🚀 Zyphex Tech - Production User Setup"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from your project root.${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Step 1: Installing dependencies...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

echo -e "${BLUE}🔧 Step 2: Generating Prisma Client...${NC}"
npx prisma generate
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to generate Prisma client${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Prisma client generated${NC}"
echo ""

echo -e "${BLUE}📊 Step 3: Checking database migrations...${NC}"
npx prisma migrate status
echo ""

echo -e "${YELLOW}⚠️  If migrations are pending, run: npx prisma migrate deploy${NC}"
read -p "Do you want to deploy pending migrations now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx prisma migrate deploy
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Migration failed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Migrations deployed${NC}"
fi
echo ""

echo -e "${BLUE}👥 Step 4: Creating production users...${NC}"
npx ts-node scripts/create-production-users.ts
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to create users${NC}"
    exit 1
fi
echo ""

echo -e "${BLUE}🔍 Step 5: Verifying users...${NC}"
npx ts-node scripts/check-users.ts
echo ""

echo -e "${GREEN}✨ Setup Complete!${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "   1. Test login at: https://yourdomain.com/login"
echo "   2. Share credentials with team members (securely)"
echo "   3. Ask users to change their passwords on first login"
echo ""
echo -e "${BLUE}🔐 Default Password: Haryana@272002${NC}"
echo ""

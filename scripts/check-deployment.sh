#!/bin/bash

# Quick VPS Deployment Checker
# Run this to verify deployment is working correctly

echo "🔍 Zyphex-Tech Deployment Quick Check"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
VPS_URL="https://www.zyphextech.com"
API_HEALTH="${VPS_URL}/api/health"
TIME_TRACKING="${VPS_URL}/project-manager/time-tracking"

echo -e "${BLUE}📊 Checking VPS Status...${NC}"
echo ""

# 1. Check if site is accessible
echo "1️⃣  Testing website accessibility..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -m 10 $VPS_URL 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo -e "   ${GREEN}✅ Website is accessible (HTTP $HTTP_CODE)${NC}"
else
    echo -e "   ${RED}❌ Website is not accessible (HTTP $HTTP_CODE)${NC}"
fi
echo ""

# 2. Check API health
echo "2️⃣  Testing API health endpoint..."
API_CODE=$(curl -s -o /dev/null -w "%{http_code}" -m 10 $API_HEALTH 2>/dev/null || echo "000")

if [ "$API_CODE" = "200" ]; then
    echo -e "   ${GREEN}✅ API is healthy (HTTP $API_CODE)${NC}"
else
    echo -e "   ${RED}❌ API health check failed (HTTP $API_CODE)${NC}"
fi
echo ""

# 3. Check Time Tracking page
echo "3️⃣  Testing Time Tracking page..."
TT_CODE=$(curl -s -o /dev/null -w "%{http_code}" -m 10 $TIME_TRACKING 2>/dev/null || echo "000")

if [ "$TT_CODE" = "200" ]; then
    echo -e "   ${GREEN}✅ Time Tracking page is live (HTTP $TT_CODE)${NC}"
else
    echo -e "   ${YELLOW}⚠️  Time Tracking page returned HTTP $TT_CODE${NC}"
fi
echo ""

# 4. Check GitHub Actions
echo "4️⃣  Check deployment status:"
echo -e "   ${BLUE}🔗 https://github.com/isumitmalhotra/Zyphex-Tech/actions${NC}"
echo ""

# 5. Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📝 Summary${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    if [ "$API_CODE" = "200" ]; then
        echo -e "${GREEN}✅ Deployment Status: HEALTHY${NC}"
        echo ""
        echo "Your application is running correctly!"
        echo ""
        echo "Access your application:"
        echo "  • Main Site: $VPS_URL"
        echo "  • Time Tracking: $TIME_TRACKING"
    else
        echo -e "${YELLOW}⚠️  Deployment Status: PARTIAL${NC}"
        echo ""
        echo "Website is accessible but API may be starting up."
        echo "Wait 1-2 minutes and check again."
    fi
else
    echo -e "${RED}❌ Deployment Status: DOWN${NC}"
    echo ""
    echo "Troubleshooting steps:"
    echo "  1. Check GitHub Actions for deployment errors"
    echo "  2. SSH into VPS: ssh user@your-vps"
    echo "  3. Check PM2 status: pm2 list"
    echo "  4. View logs: pm2 logs zyphextech"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# SSH commands
echo -e "${BLUE}🔧 Useful Commands:${NC}"
echo ""
echo "View GitHub Actions:"
echo "  https://github.com/isumitmalhotra/Zyphex-Tech/actions"
echo ""
echo "SSH into VPS:"
echo "  ssh user@your-vps"
echo ""
echo "Check PM2 status:"
echo "  ssh user@vps 'pm2 list'"
echo ""
echo "View application logs:"
echo "  ssh user@vps 'pm2 logs zyphextech --lines 50'"
echo ""
echo "Monitor deployment:"
echo "  ssh user@vps 'cd /var/www/zyphextech && bash scripts/monitor-deployment.sh'"
echo ""
echo "Watch build progress:"
echo "  ssh user@vps 'tail -f /var/www/zyphextech/build.log'"
echo ""

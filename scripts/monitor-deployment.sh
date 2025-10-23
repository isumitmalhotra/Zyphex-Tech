#!/bin/bash

# VPS Deployment Monitor
# Watch your deployment in real-time from VPS
# Usage: bash monitor-deployment.sh

echo "🔍 Zyphex-Tech Deployment Monitor"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if we're on the VPS
if [ ! -d "/var/www/zyphextech" ]; then
    echo -e "${RED}❌ Error: Not on VPS or zyphextech directory not found${NC}"
    echo ""
    echo "Run this command on your VPS:"
    echo "ssh user@your-vps 'bash -s' < scripts/monitor-deployment.sh"
    exit 1
fi

cd /var/www/zyphextech

echo "📊 System Resources:"
echo "-------------------"
free -h
echo ""

echo "💾 Disk Usage:"
echo "-------------"
df -h / | grep -v "Filesystem"
echo ""

echo "🔄 Git Status:"
echo "-------------"
CURRENT_BRANCH=$(git branch --show-current)
CURRENT_COMMIT=$(git rev-parse --short HEAD)
LATEST_REMOTE=$(git ls-remote origin main | cut -f1 | cut -c1-7)

echo -e "Current Branch: ${GREEN}${CURRENT_BRANCH}${NC}"
echo -e "Current Commit: ${GREEN}${CURRENT_COMMIT}${NC}"
echo -e "Remote Commit:  ${YELLOW}${LATEST_REMOTE}${NC}"

if [ "$CURRENT_COMMIT" != "$LATEST_REMOTE" ]; then
    echo -e "${YELLOW}⚠️  New changes available! Run: git pull${NC}"
else
    echo -e "${GREEN}✅ Up to date with remote${NC}"
fi
echo ""

echo "📦 PM2 Status:"
echo "-------------"
pm2 list
echo ""

echo "🏥 Application Health:"
echo "---------------------"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Application is healthy (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ Application health check failed (HTTP $HTTP_CODE)${NC}"
fi
echo ""

echo "📝 Recent Logs (last 20 lines):"
echo "-------------------------------"
pm2 logs zyphextech --lines 20 --nostream
echo ""

echo "💾 Memory Usage by Process:"
echo "--------------------------"
pm2 show zyphextech | grep -A 10 "Monit"
echo ""

echo "🔧 Quick Commands:"
echo "-----------------"
echo "View live logs:      pm2 logs zyphextech"
echo "Monitor resources:   pm2 monit"
echo "Restart app:         pm2 restart zyphextech"
echo "View full status:    pm2 show zyphextech"
echo ""

# Check if deployment is in progress
if [ -f "npm-install.log" ] && [ $(find npm-install.log -mmin -5 2>/dev/null | wc -l) -gt 0 ]; then
    echo -e "${YELLOW}🔄 Deployment in progress...${NC}"
    echo ""
    echo "Watch install progress:"
    echo "tail -f npm-install.log"
fi

if [ -f "build.log" ] && [ $(find build.log -mmin -5 2>/dev/null | wc -l) -gt 0 ]; then
    echo -e "${YELLOW}🔄 Build in progress...${NC}"
    echo ""
    echo "Watch build progress:"
    echo "tail -f build.log"
fi

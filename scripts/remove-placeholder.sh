#!/bin/bash

# Script to remove DigiYantra Digital placeholder and setup proper Zyphex Tech files
# Run this on your VPS as root

echo "======================================"
echo "Zyphex Tech - Remove Placeholder Setup"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}Please run as root${NC}"
  exit 1
fi

echo "Checking for DigiYantra Digital placeholder files..."
echo ""

# Common locations for placeholder HTML files
LOCATIONS=(
  "/var/www/html/index.html"
  "/var/www/zyphextech/index.html"
  "/usr/share/nginx/html/index.html"
  "/var/www/default/index.html"
  "/home/deploy/index.html"
)

FOUND=false

for location in "${LOCATIONS[@]}"; do
  if [ -f "$location" ]; then
    echo -e "${YELLOW}Found file: $location${NC}"
    
    # Check if it contains DigiYantra
    if grep -q "DigiYantra" "$location"; then
      echo -e "${RED}✗ Contains DigiYantra Digital placeholder${NC}"
      
      # Backup the file
      BACKUP="${location}.backup.$(date +%Y%m%d_%H%M%S)"
      cp "$location" "$BACKUP"
      echo -e "${GREEN}  Backed up to: $BACKUP${NC}"
      
      # Remove the file
      rm "$location"
      echo -e "${GREEN}  ✓ Removed placeholder file${NC}"
      FOUND=true
    else
      echo -e "${GREEN}✓ Does not contain DigiYantra${NC}"
    fi
    echo ""
  fi
done

if [ "$FOUND" = false ]; then
  echo -e "${GREEN}No DigiYantra placeholder files found${NC}"
fi

echo ""
echo "Checking Nginx configuration..."
echo ""

# Check Nginx config for zyphextech.com
NGINX_CONFIGS=(
  "/etc/nginx/sites-available/zyphextech.com"
  "/etc/nginx/sites-enabled/zyphextech.com"
  "/etc/nginx/conf.d/zyphextech.com.conf"
)

for config in "${NGINX_CONFIGS[@]}"; do
  if [ -f "$config" ]; then
    echo -e "${GREEN}Found Nginx config: $config${NC}"
    
    # Check if it has proper root directory
    ROOT_DIR=$(grep -oP '(?<=root\s).*(?=;)' "$config" | head -1 | xargs)
    if [ ! -z "$ROOT_DIR" ]; then
      echo "  Root directory: $ROOT_DIR"
      
      # Check if index.html exists there
      if [ -f "$ROOT_DIR/index.html" ]; then
        if grep -q "DigiYantra" "$ROOT_DIR/index.html"; then
          echo -e "${RED}  ✗ DigiYantra placeholder found in root directory${NC}"
          
          # Backup and remove
          BACKUP="$ROOT_DIR/index.html.backup.$(date +%Y%m%d_%H%M%S)"
          cp "$ROOT_DIR/index.html" "$BACKUP"
          rm "$ROOT_DIR/index.html"
          echo -e "${GREEN}  ✓ Removed and backed up to: $BACKUP${NC}"
        fi
      fi
    fi
    echo ""
  fi
done

echo ""
echo "Checking PM2 process..."
echo ""

# Check if PM2 is running Next.js properly
if command -v pm2 &> /dev/null; then
  echo "PM2 Status:"
  pm2 status
  echo ""
  
  # Check if zyphextech app is running
  if pm2 list | grep -q "zyphextech"; then
    echo -e "${GREEN}✓ Zyphex Tech app is running in PM2${NC}"
  else
    echo -e "${YELLOW}⚠ Zyphex Tech app not found in PM2${NC}"
    echo "  Run: pm2 start ecosystem.config.js"
  fi
else
  echo -e "${YELLOW}⚠ PM2 not found${NC}"
fi

echo ""
echo "======================================"
echo "Cleanup Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Restart Nginx: systemctl restart nginx"
echo "2. Clear browser cache and check: https://zyphextech.com"
echo "3. Request Google to re-crawl: https://search.google.com/search-console"
echo ""
echo "If the placeholder still appears:"
echo "1. Check /var/www/html/ for any index.html files"
echo "2. Verify Nginx is pointing to /var/www/zyphextech"
echo "3. Ensure PM2 is running: pm2 status"
echo "4. Check logs: pm2 logs zyphextech"
echo ""

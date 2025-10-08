#!/bin/bash

###############################################################################
# Quick Fix and Continue Setup
# Run this to complete the remaining steps
###############################################################################

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Continuing Setup from Step 11${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Step 11: Fix PM2 Startup
echo -e "${BLUE}⚡ Step 11 (Fix): Setting up PM2 startup...${NC}"
pm2 startup systemd -u deploy --hp /home/deploy
echo ""
echo -e "${YELLOW}COPY and RUN the command shown above ⬆️${NC}"
echo -e "${YELLOW}Press Enter after running it...${NC}"
read

mkdir -p /var/log/pm2
chown -R deploy:deploy /var/log/pm2
echo -e "${GREEN}✅ PM2 configured${NC}"
echo ""

# Step 12: Setup Monitoring
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}📊 Step 12: Setting up Monitoring${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

cat > /usr/local/bin/health-check.sh << 'EOF'
#!/bin/bash
if ! curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "Health check failed at $(date)" >> /var/log/health-check.log
    su - deploy -c "pm2 restart zyphextech" > /dev/null 2>&1
fi
EOF

chmod +x /usr/local/bin/health-check.sh
(crontab -l 2>/dev/null | grep -v health-check.sh; echo "*/5 * * * * /usr/local/bin/health-check.sh") | crontab -

echo -e "${GREEN}✅ Monitoring configured${NC}"
echo ""

# Step 13: Setup Log Rotation
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}📝 Step 13: Setting up Log Rotation${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

cat > /etc/logrotate.d/zyphextech << 'EOF'
/var/log/pm2/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 deploy deploy
    sharedscripts
    postrotate
        su - deploy -c "pm2 reloadLogs" > /dev/null 2>&1
    endscript
}

/var/log/nginx/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 nginx nginx
    sharedscripts
    postrotate
        systemctl reload nginx > /dev/null 2>&1
    endscript
}
EOF

echo -e "${GREEN}✅ Log rotation configured${NC}"
echo ""

# Step 14: Configure SELinux
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🛡️  Step 14: Configuring SELinux${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

if command -v getenforce &> /dev/null; then
    SELINUX_STATUS=$(getenforce)
    echo -e "${BLUE}SELinux status: $SELINUX_STATUS${NC}"
    
    if [ "$SELINUX_STATUS" != "Disabled" ]; then
        setsebool -P httpd_can_network_connect 1
        semanage fcontext -a -t httpd_sys_rw_content_t "/var/www/zyphextech(/.*)?" 2>/dev/null || true
        restorecon -Rv /var/www/zyphextech 2>/dev/null || true
        echo -e "${GREEN}✅ SELinux configured${NC}"
    fi
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Setup Steps 11-14 Complete! ✅          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""

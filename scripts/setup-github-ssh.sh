#!/bin/bash

###############################################################################
# Quick SSH Key Setup for GitHub Actions
# Run this on your VPS as the deploy user
###############################################################################

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  SSH Key Setup for GitHub Actions Deploy  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Check if running as deploy user
if [ "$USER" != "deploy" ]; then
    echo -e "${YELLOW}⚠️  Please run this as the deploy user${NC}"
    echo "Switch to deploy user with: su - deploy"
    echo "Then run: bash setup-github-ssh.sh"
    exit 1
fi

# Create .ssh directory if it doesn't exist
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Generate SSH key
echo -e "${BLUE}🔑 Generating SSH key pair...${NC}"
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy -N ""

# Add public key to authorized_keys
echo -e "${BLUE}📝 Adding public key to authorized_keys...${NC}"
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

echo ""
echo -e "${GREEN}✅ SSH key generated successfully!${NC}"
echo ""
echo -e "${YELLOW}════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}COPY THE PRIVATE KEY BELOW TO GITHUB SECRETS${NC}"
echo -e "${YELLOW}════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Secret Name:${NC} VPS_SSH_PRIVATE_KEY"
echo ""
echo -e "${BLUE}Secret Value (copy everything below):${NC}"
echo ""
cat ~/.ssh/github_deploy
echo ""
echo -e "${YELLOW}════════════════════════════════════════════════════════${NC}"
echo ""
echo "Steps to add to GitHub:"
echo "1. Go to: https://github.com/isumitmalhotra/Zyphex-Tech/settings/secrets/actions"
echo "2. Click 'New repository secret'"
echo "3. Name: VPS_SSH_PRIVATE_KEY"
echo "4. Value: Paste the ENTIRE private key shown above"
echo "5. Click 'Add secret'"
echo ""
echo -e "${GREEN}Public key (for reference):${NC}"
cat ~/.ssh/github_deploy.pub
echo ""

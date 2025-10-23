#!/bin/bash

# VPS Swap Setup Script
# Run this ONCE on your VPS to create permanent swap space
# Usage: bash setup-vps-swap.sh

set -e

echo "🔧 VPS Swap Space Setup"
echo "======================="
echo ""

# Check if running as root or with sudo
if [ "$EUID" -eq 0 ]; then 
    SUDO=""
else 
    SUDO="sudo"
    echo "⚠️  This script requires sudo privileges"
    echo ""
fi

# Check current memory and swap
echo "📊 Current System Resources:"
free -h
echo ""

# Check if swap already exists
if swapon -s | grep -q "/swapfile"; then
    echo "✅ Swap file already exists!"
    echo ""
    echo "Current swap:"
    swapon -s
    echo ""
    read -p "Do you want to recreate it? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "✅ Keeping existing swap. Exiting..."
        exit 0
    fi
    
    echo "🗑️  Removing existing swap..."
    $SUDO swapoff /swapfile
    $SUDO rm -f /swapfile
fi

# Check available disk space
echo "💾 Checking disk space..."
AVAILABLE_GB=$(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//')
echo "Available space: ${AVAILABLE_GB}GB"
echo ""

if [ "$AVAILABLE_GB" -lt 5 ]; then
    echo "⚠️  Warning: Less than 5GB available. This might not be enough."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Determine swap size (4GB recommended)
SWAP_SIZE="4G"
echo "📝 Creating ${SWAP_SIZE} swap file..."
echo "This may take a few minutes..."
echo ""

# Create swap file
if $SUDO fallocate -l $SWAP_SIZE /swapfile 2>/dev/null; then
    echo "✅ Swap file allocated"
else
    echo "⚠️  fallocate failed, using dd (slower)..."
    $SUDO dd if=/dev/zero of=/swapfile bs=1M count=4096 status=progress
fi

# Set permissions
echo "🔒 Setting permissions..."
$SUDO chmod 600 /swapfile

# Make swap
echo "⚙️  Creating swap space..."
$SUDO mkswap /swapfile

# Enable swap
echo "🚀 Enabling swap..."
$SUDO swapon /swapfile

# Make permanent
echo "💾 Making swap permanent..."
if ! grep -q "/swapfile" /etc/fstab; then
    echo '/swapfile none swap sw 0 0' | $SUDO tee -a /etc/fstab
    echo "✅ Added to /etc/fstab"
else
    echo "✅ Already in /etc/fstab"
fi

# Optimize swap usage
echo "⚙️  Optimizing swap settings..."
if ! grep -q "vm.swappiness" /etc/sysctl.conf; then
    echo 'vm.swappiness=10' | $SUDO tee -a /etc/sysctl.conf
    echo "✅ Set swappiness=10"
fi

if ! grep -q "vm.vfs_cache_pressure" /etc/sysctl.conf; then
    echo 'vm.vfs_cache_pressure=50' | $SUDO tee -a /etc/sysctl.conf
    echo "✅ Set cache pressure=50"
fi

# Apply settings
$SUDO sysctl -p > /dev/null 2>&1

echo ""
echo "✅ Swap setup complete!"
echo ""
echo "📊 Final System Resources:"
free -h
echo ""
swapon -s
echo ""
echo "🎉 Your VPS is now optimized for Node.js deployments!"
echo ""
echo "Next steps:"
echo "1. Return to your local machine"
echo "2. Push your code: git push origin main"
echo "3. Monitor deployment: watch pm2 monit"
echo ""

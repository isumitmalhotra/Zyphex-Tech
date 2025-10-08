# 🔐 GitHub Secrets Configuration - URGENT FIX NEEDED

**Date:** October 8, 2025  
**Status:** ⚠️ CONFIGURATION MISMATCH DETECTED  
**Priority:** 🔴 CRITICAL

---

## 🚨 Problem Identified

Your GitHub Actions workflow is configured with **INCORRECT VPS credentials**. The deployment is trying to connect to the wrong server!

### Current (WRONG) Configuration:
```
VPS_HOST: 116.203.64.91
VPS_PORT: 222
VPS_USER: root (assumed)
Result: Connection refused ❌
```

### Correct Configuration (from your SSH connection):
```
VPS_HOST: 66.116.199.219
VPS_PORT: 22 (standard SSH port)
VPS_USER: deploy
Result: Successfully connected ✅
```

---

## 🔧 How to Fix GitHub Secrets

You need to update the GitHub repository secrets with the correct VPS information.

### Step 1: Go to GitHub Repository Settings

1. Open your browser and go to:
   ```
   https://github.com/isumitmalhotra/Zyphex-Tech/settings/secrets/actions
   ```

2. Or navigate manually:
   - Go to: https://github.com/isumitmalhotra/Zyphex-Tech
   - Click **"Settings"** tab
   - Click **"Secrets and variables"** in left sidebar
   - Click **"Actions"**

### Step 2: Update/Create These Secrets

Click **"New repository secret"** or **"Update"** for each:

#### Secret 1: VPS_HOST
```
Name: VPS_HOST
Value: 66.116.199.219
```

#### Secret 2: VPS_PORT
```
Name: VPS_PORT
Value: 22
```

#### Secret 3: VPS_USER
```
Name: VPS_USER
Value: deploy
```

#### Secret 4: VPS_SSH_PRIVATE_KEY
```
Name: VPS_SSH_PRIVATE_KEY
Value: [Your SSH private key - see below]
```

---

## 🔑 Setting Up SSH Key Authentication

Since you're currently using password authentication, you need to set up SSH key-based authentication for the `deploy` user.

### On Your Local Machine (Windows):

#### Step 1: Generate SSH Key (if you don't have one)

```powershell
# Generate new SSH key
ssh-keygen -t ed25519 -C "github-actions-deploy" -f "$env:USERPROFILE\.ssh\github_actions_deploy"

# Don't set a passphrase (just press Enter when asked)
```

This creates two files:
- `~/.ssh/github_actions_deploy` (private key) - Keep this SECRET!
- `~/.ssh/github_actions_deploy.pub` (public key) - This goes on the server

#### Step 2: View Your Public Key

```powershell
# View the public key
Get-Content "$env:USERPROFILE\.ssh\github_actions_deploy.pub"
```

Copy the entire output (starts with `ssh-ed25519 ...`)

#### Step 3: Add Public Key to VPS

```powershell
# Connect to your VPS
ssh root@66.116.199.219

# Switch to deploy user
su deploy

# Navigate to home directory
cd ~

# Create .ssh directory if it doesn't exist
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add your public key to authorized_keys
nano ~/.ssh/authorized_keys
```

**Paste your public key** (the one from Step 2), then:
- Press `Ctrl+X` to exit
- Press `Y` to save
- Press `Enter` to confirm

```bash
# Set correct permissions
chmod 600 ~/.ssh/authorized_keys

# Exit back to root
exit

# Exit VPS
exit
```

#### Step 4: Test SSH Key Authentication

```powershell
# Test connection with key
ssh -i "$env:USERPROFILE\.ssh\github_actions_deploy" deploy@66.116.199.219
```

If it logs in WITHOUT asking for a password, SUCCESS! ✅

#### Step 5: Add Private Key to GitHub Secrets

```powershell
# View your PRIVATE key (be careful!)
Get-Content "$env:USERPROFILE\.ssh\github_actions_deploy"
```

Copy the **ENTIRE** output, including:
```
-----BEGIN OPENSSH PRIVATE KEY-----
...all the lines...
-----END OPENSSH PRIVATE KEY-----
```

Then:
1. Go to: https://github.com/isumitmalhotra/Zyphex-Tech/settings/secrets/actions
2. Click **"New repository secret"** or update existing `VPS_SSH_PRIVATE_KEY`
3. Name: `VPS_SSH_PRIVATE_KEY`
4. Value: Paste the entire private key
5. Click **"Add secret"**

---

## 🗂️ Alternative: Use Root User with SSH Key

If you prefer to use the `root` user instead of `deploy`:

### Option A: Root User Setup

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions-root" -f "$env:USERPROFILE\.ssh\github_actions_root"

# Copy public key
Get-Content "$env:USERPROFILE\.ssh\github_actions_root.pub"

# SSH to VPS as root
ssh root@66.116.199.219

# Add public key
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
# Paste the public key, save and exit

# Set permissions
chmod 600 ~/.ssh/authorized_keys

# Exit
exit

# Test
ssh -i "$env:USERPROFILE\.ssh\github_actions_root" root@66.116.199.219
```

Then update GitHub secrets:
```
VPS_USER: root
VPS_SSH_PRIVATE_KEY: [content of github_actions_root private key]
```

---

## 📋 Verification Checklist

After updating GitHub secrets, verify:

- [ ] VPS_HOST = `66.116.199.219`
- [ ] VPS_PORT = `22`
- [ ] VPS_USER = `deploy` (or `root` if you chose that)
- [ ] VPS_SSH_PRIVATE_KEY = Your private key (entire content)
- [ ] SSH key authentication works (no password prompt)
- [ ] Application directory exists: `/var/www/zyphextech`
- [ ] Git repository is properly configured on VPS
- [ ] PM2 process named `zyphextech` exists

### Test SSH Connection:

```powershell
# Test with the exact command GitHub Actions will use
ssh -i "$env:USERPROFILE\.ssh\github_actions_deploy" -p 22 deploy@66.116.199.219 "echo 'SSH connection successful!'"
```

Should output: `SSH connection successful!` ✅

---

## 🚀 After Updating Secrets

### Option 1: Manual Deployment Trigger

1. Go to: https://github.com/isumitmalhotra/Zyphex-Tech/actions
2. Click on **"Deploy to VPS"** workflow
3. Click **"Run workflow"** button
4. Select `main` branch
5. Click **"Run workflow"**
6. Watch the deployment logs

### Option 2: Push a Commit

```powershell
# Make a small change to trigger deployment
cd c:\Projects\Zyphex-Tech

# Update the status file
echo "`n## Secrets Updated: $(Get-Date)" >> GITHUB_SECRETS_CONFIGURATION.md

# Commit and push
git add .
git commit -m "fix: update VPS connection details in GitHub secrets"
git push origin main
```

This will automatically trigger deployment with the new secrets.

---

## 🔍 Troubleshooting

### Issue: "Permission denied (publickey)"

**Cause:** Private key not added to GitHub secrets or public key not on server

**Solution:**
1. Verify public key is in `~/.ssh/authorized_keys` on VPS
2. Check permissions: `chmod 600 ~/.ssh/authorized_keys`
3. Verify private key is complete in GitHub secret (including header/footer)

### Issue: "Connection refused"

**Cause:** Wrong IP address or port

**Solution:**
1. Verify VPS_HOST = `66.116.199.219`
2. Verify VPS_PORT = `22`
3. Test connection: `ssh deploy@66.116.199.219`

### Issue: "cd /var/www/zyphextech: No such file or directory"

**Cause:** Application not deployed to VPS yet or wrong path

**Solution:**
```bash
# SSH to VPS
ssh deploy@66.116.199.219

# Check if directory exists
ls -la /var/www/

# If not, the path might be different, check:
ls -la ~
```

Update workflow with correct path if needed.

---

## 📊 Current VPS Information

Based on your terminal output:

```
Server IP: 66.116.199.219
SSH Port: 22 (standard)
Root User: root (requires password)
Deploy User: deploy (recommended for deployments)
Application: Running via PM2 as 'zyphextech'
PM2 User: deploy
Application Status: Running ✅
Last Restart: Multiple times today (2025-10-08)
```

---

## ⚠️ Security Recommendations

1. **Use Deploy User (Not Root)**
   - ✅ Less security risk
   - ✅ Proper permissions separation
   - ✅ Recommended practice

2. **SSH Key Authentication Only**
   - ✅ Disable password authentication
   - ✅ Use strong SSH keys (Ed25519)
   - ✅ Rotate keys periodically

3. **Firewall Configuration**
   - ✅ Only allow SSH from necessary IPs
   - ✅ Use non-standard SSH port (optional)
   - ✅ Enable fail2ban for brute-force protection

4. **GitHub Secrets**
   - ✅ Never commit private keys to repository
   - ✅ Limit access to repository secrets
   - ✅ Rotate SSH keys if compromised

---

## 🎯 Quick Commands Reference

```powershell
# Generate SSH key
ssh-keygen -t ed25519 -C "github-actions" -f "$env:USERPROFILE\.ssh\github_actions_deploy"

# View public key
Get-Content "$env:USERPROFILE\.ssh\github_actions_deploy.pub"

# View private key (for GitHub secret)
Get-Content "$env:USERPROFILE\.ssh\github_actions_deploy"

# Test SSH connection
ssh -i "$env:USERPROFILE\.ssh\github_actions_deploy" deploy@66.116.199.219

# Test deployment command
ssh -i "$env:USERPROFILE\.ssh\github_actions_deploy" deploy@66.116.199.219 "cd /var/www/zyphextech && git status"
```

---

## ✅ Final Steps

1. [ ] Generate SSH key pair
2. [ ] Add public key to VPS (`~/.ssh/authorized_keys`)
3. [ ] Test SSH connection (should work without password)
4. [ ] Update GitHub secrets with correct values
5. [ ] Trigger manual deployment or push commit
6. [ ] Monitor GitHub Actions for successful deployment
7. [ ] Verify website is updated

---

## 🎉 Success Criteria

Deployment is correctly configured when:

- ✅ SSH connection works without password
- ✅ GitHub Actions can connect to VPS
- ✅ Deployment completes successfully
- ✅ Website updates automatically on push
- ✅ No "Connection refused" errors

---

**NEXT ACTION:** Follow the steps above to update your GitHub secrets with the correct VPS information!

**Priority:** 🔴 HIGH - Deployments will fail until secrets are updated

---

**Updated:** October 8, 2025  
**Status:** ⚠️ Awaiting secrets configuration  
**Action Required:** Update GitHub secrets with correct VPS details

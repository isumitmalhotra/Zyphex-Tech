# ⚡ URGENT: GitHub Secrets Setup - Quick Action Checklist

**Status:** ⚠️ ACTION REQUIRED  
**Priority:** 🔴 CRITICAL  
**Estimated Time:** 10-15 minutes

---

## 🎯 Problem

Your CI/CD pipeline is configured with the **WRONG VPS IP ADDRESS**. Deployments are currently failing because GitHub Actions cannot connect to your server.

**Wrong IP:** 116.203.64.91:222 ❌  
**Correct IP:** 66.116.199.219:22 ✅

---

## ✅ Quick Setup Checklist

### Step 1: Generate SSH Key (5 minutes)

```powershell
# Open PowerShell and run:
ssh-keygen -t ed25519 -C "github-actions-deploy" -f "$env:USERPROFILE\.ssh\github_deploy"

# Press Enter for all prompts (no passphrase)
```

✅ Created two files:
- `~/.ssh/github_deploy` (private key)
- `~/.ssh/github_deploy.pub` (public key)

---

### Step 2: Copy Public Key to VPS (3 minutes)

```powershell
# View your public key
Get-Content "$env:USERPROFILE\.ssh\github_deploy.pub"

# Copy the output (it's ONE line starting with ssh-ed25519)
```

Now SSH to your VPS:
```powershell
ssh root@66.116.199.219
```

On the VPS, run:
```bash
# Switch to deploy user
su deploy

# Setup SSH directory
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add your public key
nano ~/.ssh/authorized_keys
# Paste the public key you copied
# Press Ctrl+X, then Y, then Enter to save

# Set permissions
chmod 600 ~/.ssh/authorized_keys

# Exit back to local machine
exit
exit
```

---

### Step 3: Test SSH Connection (1 minute)

```powershell
# Test connection (should NOT ask for password)
ssh -i "$env:USERPROFILE\.ssh\github_deploy" deploy@66.116.199.219

# If it asks for password, something went wrong
# If it logs you in directly, SUCCESS! ✅
```

---

### Step 4: Update GitHub Secrets (5 minutes)

1. **Open GitHub Repository Settings:**
   - Go to: https://github.com/isumitmalhotra/Zyphex-Tech/settings/secrets/actions
   - Or: Repository → Settings → Secrets and variables → Actions

2. **Update/Create These 4 Secrets:**

#### Secret #1: VPS_HOST
- Click "New repository secret" or update existing
- Name: `VPS_HOST`
- Value: `66.116.199.219`
- Click "Add secret"

#### Secret #2: VPS_PORT
- Name: `VPS_PORT`
- Value: `22`
- Click "Add secret"

#### Secret #3: VPS_USER
- Name: `VPS_USER`
- Value: `deploy`
- Click "Add secret"

#### Secret #4: VPS_SSH_PRIVATE_KEY
```powershell
# Get your private key
Get-Content "$env:USERPROFILE\.ssh\github_deploy"

# Copy EVERYTHING including:
# -----BEGIN OPENSSH PRIVATE KEY-----
# ... all lines ...
# -----END OPENSSH PRIVATE KEY-----
```
- Name: `VPS_SSH_PRIVATE_KEY`
- Value: Paste the entire private key
- Click "Add secret"

---

### Step 5: Trigger Deployment (1 minute)

#### Option A: Manual Trigger
1. Go to: https://github.com/isumitmalhotra/Zyphex-Tech/actions
2. Click "Deploy to VPS"
3. Click "Run workflow"
4. Select `main` branch
5. Click "Run workflow"
6. Watch it deploy! 🚀

#### Option B: Push This Commit
```powershell
cd c:\Projects\Zyphex-Tech
git push origin main
```

This will automatically trigger the deployment.

---

## 🔍 Verification

### After secrets are updated, check:

1. **GitHub Actions Status:**
   - Go to: https://github.com/isumitmalhotra/Zyphex-Tech/actions
   - Latest run should show green ✅

2. **VPS Application Status:**
```powershell
ssh deploy@66.116.199.219 "pm2 status"
```
Should show `zyphextech` as `online`

3. **Website:**
   - Open: https://www.zyphextech.com
   - Should be live and updated

---

## 🚨 Troubleshooting

### Problem: SSH key test asks for password

**Solution:**
```bash
# SSH to VPS again
ssh root@66.116.199.219
su deploy

# Check authorized_keys exists and has correct permissions
ls -la ~/.ssh/authorized_keys
# Should show: -rw------- 1 deploy deploy

# If not, fix permissions:
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### Problem: GitHub Actions still fails

**Check:**
1. All 4 secrets are set correctly
2. VPS_SSH_PRIVATE_KEY includes the full key (with BEGIN/END lines)
3. No extra spaces or newlines in secret values
4. VPS_USER is set to `deploy` (not `root`)

### Problem: Can't find the SSH key file

**Location:**
```powershell
# Private key:
$env:USERPROFILE\.ssh\github_deploy

# Public key:
$env:USERPROFILE\.ssh\github_deploy.pub

# List all SSH keys:
Get-ChildItem "$env:USERPROFILE\.ssh"
```

---

## 📋 Summary of Changes Needed

| Secret Name | Old Value (WRONG) | New Value (CORRECT) |
|-------------|-------------------|---------------------|
| VPS_HOST | 116.203.64.91 | **66.116.199.219** |
| VPS_PORT | 222 | **22** |
| VPS_USER | root (assumed) | **deploy** |
| VPS_SSH_PRIVATE_KEY | (unknown) | **Your new SSH private key** |

---

## ⏱️ Time Estimate

- SSH Key Generation: 2 minutes
- Copy to VPS: 3 minutes
- Test Connection: 1 minute
- Update GitHub Secrets: 5 minutes
- Trigger & Monitor: 5 minutes

**Total: ~15 minutes** ⏱️

---

## 🎉 Success Criteria

You'll know it's working when:

- ✅ SSH key connection works without password
- ✅ GitHub Actions workflow completes successfully
- ✅ No "Connection refused" errors
- ✅ PM2 shows application running
- ✅ Website is accessible and updated

---

## 📚 Detailed Documentation

For more details, see:
- **[GITHUB_SECRETS_CONFIGURATION.md](./GITHUB_SECRETS_CONFIGURATION.md)** - Complete setup guide
- **[DEPLOYMENT_MONITORING.md](./DEPLOYMENT_MONITORING.md)** - Monitoring & troubleshooting
- **[CI_CD_BUILD_FIXES.md](./CI_CD_BUILD_FIXES.md)** - Build errors that were fixed

---

## 🆘 Need Help?

If you get stuck:
1. Check the detailed guides above
2. Review GitHub Actions logs for error messages
3. Test SSH connection manually first
4. Verify all secrets are set correctly

---

**START HERE:** Run the commands in Step 1! 🚀

---

**Created:** October 8, 2025  
**Status:** ⚠️ Awaiting setup  
**Next Step:** Generate SSH key (Step 1)

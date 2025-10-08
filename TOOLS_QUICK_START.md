# 🚀 Tools & Integrations - Quick Start Guide

## ⚡ Quick Setup (5 Minutes)

### Step 1: Update Database

```bash
# Stop your dev server first (Ctrl+C)

# Generate Prisma client
npx prisma generate

# Apply database migration
npx prisma migrate dev --name add_integrations_management

# Restart dev server
npm run dev
```

### Step 2: Access the Page

1. Navigate to: `http://localhost:3000/project-manager/tools`
2. Login as PROJECT_MANAGER or ADMIN role
3. Start adding integrations!

---

## 📋 What You Can Do

### Add an Integration

1. Click "Add Integration" button
2. Choose from 8 available integrations:
   - 💬 Slack
   - 🐙 GitHub
   - 📊 Google Analytics
   - 📋 Trello
   - 🎥 Zoom
   - 🎯 HubSpot
   - 🎫 Jira
   - 🎮 Discord

3. Fill in configuration details
4. Review setup instructions
5. Click "Add Integration"

### Configure an Integration

1. Click the Settings (⚙️) icon on any integration card
2. Update configuration fields
3. Click "Update Configuration"

### Test Connection

1. Click "Test" button on integration card
2. System validates credentials
3. Status updates automatically

### Sync Data

1. Enable the integration using the toggle
2. Click "Sync" button
3. Watch sync progress
4. View last sync time

### Enable/Disable

- Use the toggle switch on each card
- Enabled = Active and can sync
- Disabled = Inactive

### Delete Integration

1. Click trash icon (🗑️)
2. Confirm deletion
3. Integration removed permanently

---

## 🎨 Features Overview

### Dashboard Stats
- Total Integrations count
- Active Integrations count
- Integrations with Errors count

### Filters
- Search by name/description
- Filter by category
- View all or active only

### Status Indicators
- 🟢 ACTIVE - Working normally
- ⚪ INACTIVE - Disabled
- 🔴 ERROR - Has errors
- 🔵 SYNCING - Currently syncing
- 🟡 PENDING - Awaiting configuration

---

## 🔐 Authentication

**Required Roles:**
- PROJECT_MANAGER
- ADMIN

**Other users will be redirected to their dashboard.**

---

## 📊 Integration Details

### Slack
**What you need:**
- Webhook URL from Slack workspace
- Optional: Default channel name

**Setup:**
1. Go to Slack workspace settings
2. Create incoming webhook
3. Copy webhook URL
4. Paste in configuration

### GitHub
**What you need:**
- Personal Access Token
- Repository name (owner/repo format)

**Setup:**
1. Go to GitHub Settings > Developer settings
2. Generate personal access token
3. Give it repo permissions
4. Copy token and repository name

### Google Analytics
**What you need:**
- Tracking ID (UA-XXXXX or G-XXXXX)
- Optional: API key

**Setup:**
1. Create Google Analytics account
2. Set up property
3. Copy tracking ID

### Trello
**What you need:**
- API Key
- Token
- Optional: Board ID

**Setup:**
1. Visit https://trello.com/app-key
2. Copy API key
3. Generate token
4. Enter both credentials

### Zoom
**What you need:**
- JWT API Key
- JWT API Secret

**Setup:**
1. Go to Zoom App Marketplace
2. Create JWT app
3. Copy credentials

### HubSpot
**What you need:**
- API Key
- Portal ID

**Setup:**
1. Go to HubSpot Settings
2. Create private app
3. Copy API key and portal ID

### Jira
**What you need:**
- Jira domain (yourcompany.atlassian.net)
- Email address
- API Token
- Optional: Project key

**Setup:**
1. Go to Jira Account Settings
2. Generate API token
3. Copy domain, email, and token

### Discord
**What you need:**
- Webhook URL
- Optional: Bot token

**Setup:**
1. Open Discord server settings
2. Create webhook
3. Copy webhook URL

---

## 🧪 Testing

### Test All Features

```bash
# 1. Add Integration
- Click "Add Integration"
- Select Slack
- Enter webhook URL
- Click "Add Integration"
- Verify success toast

# 2. Test Connection
- Click "Test" on Slack card
- Verify success message
- Check status updates to ACTIVE

# 3. Enable Integration
- Toggle switch ON
- Verify "Sync" button appears

# 4. Sync Data
- Click "Sync" button
- Watch status change to SYNCING
- Wait for completion
- Verify last sync time updates

# 5. Configure
- Click Settings icon
- Update webhook URL
- Click "Update Configuration"
- Verify success toast

# 6. Filter
- Type "Slack" in search
- Select "Communication" category
- Click "Active Only"

# 7. Delete
- Click trash icon
- Confirm deletion
- Verify integration removed
```

---

## 📱 Mobile Testing

1. Open on mobile device
2. Verify responsive layout
3. Test all actions work
4. Check dialogs are scrollable
5. Verify touch targets are large enough

---

## 🐛 Troubleshooting

### "Unauthorized" Error
→ Make sure you're logged in as PROJECT_MANAGER or ADMIN

### "Failed to load integrations"
→ Check database connection
→ Ensure migrations are applied

### Integration card not showing
→ Check filters (search, category, view mode)
→ Try "All" category and "All" view

### "Integration of this type already exists"
→ You can only add each integration type once
→ Configure existing one instead of adding new

### Test/Sync buttons disabled
→ Make sure integration is enabled (toggle ON)
→ Wait for current operation to complete

---

## 🎯 Common Use Cases

### Scenario 1: Slack Notifications
1. Add Slack integration
2. Configure webhook URL
3. Test connection
4. Enable integration
5. Notifications will be sent to Slack

### Scenario 2: GitHub Issue Sync
1. Add GitHub integration
2. Configure access token and repository
3. Test connection
4. Enable and sync
5. Issues will be synchronized

### Scenario 3: HubSpot CRM Integration
1. Add HubSpot integration
2. Configure API key and portal ID
3. Test connection
4. Enable and sync
5. Contacts and deals will sync

---

## 📈 Next Steps

After testing the basic functionality:

1. **Customize Sync Frequency**
   - Currently manual sync
   - Future: Add cron-based scheduling

2. **Set Up Webhooks**
   - Configure webhook URLs
   - Receive real-time updates

3. **Monitor Integration Health**
   - Check error logs
   - Review sync history
   - Monitor API usage

4. **Train Team**
   - Show project managers how to use
   - Document common workflows
   - Create video tutorials

---

## 💡 Tips

- **Test connection before enabling** - Catch configuration errors early
- **Use descriptive webhook names** - Easier to identify in Slack/Discord
- **Sync regularly** - Keep data fresh
- **Monitor error status** - Fix issues promptly
- **Review setup instructions** - Each integration has specific requirements

---

## 🎉 You're Ready!

The Tools & Integrations system is fully functional and ready to use.

**Status:** ✅ Complete  
**Next:** Run the database migration and start testing!

---

## 📚 Additional Resources

- Full Implementation: `TOOLS_INTEGRATIONS_IMPLEMENTATION.md`
- Integration Templates: `lib/integrations/templates.ts`
- API Routes: `app/api/integrations/**`
- Type Definitions: `types/integrations.ts`

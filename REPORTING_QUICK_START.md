# 🚀 Reporting System - Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Database Migration (Required)

```bash
# Stop dev server if running (Ctrl+C)

# Generate Prisma client with Report models
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name add_reporting_system

# Restart dev server
npm run dev
```

### Step 2: Access the Reports Dashboard

Navigate to: **http://localhost:3000/project-manager/reports**

Login as:
- Role: `PROJECT_MANAGER` or `ADMIN`

Done! 🎉

---

## 📊 Generate Your First Report

### Option 1: From Dashboard (Easiest)

1. Click **"Generate New Report"** button
2. Fill in:
   - **Report Name**: "My First Report"
   - **Category**: Select "Projects"
   - **Type**: Select "Project Status Summary"
   - **Date Range**: Optional (leave blank for all-time)
3. Click **"Generate Report"**
4. Wait for success toast
5. Find report in "Recent Reports" section

### Option 2: From Templates

1. Go to **"Templates"** tab
2. Browse 19 pre-built templates across 5 categories
3. Click any template card
4. Dialog opens with template pre-selected
5. Enter report name and generate

### Option 3: From History

1. Go to **"History"** tab
2. Use search or filters to find existing reports
3. Click download buttons to export in different formats

---

## 📅 Schedule Automated Reports

### Create Your First Schedule

1. Go to **"Schedules"** tab
2. Click **"New Schedule"** button
3. Fill in:
   - **Schedule Name**: "Weekly Team Report"
   - **Category**: "Team"
   - **Type**: "Team Productivity"
   - **Frequency**: "Weekly"
   - **Format**: "PDF"
   - **Recipients**: "manager@company.com, team@company.com"
4. Click **"Create Schedule"**

The report will now:
- Generate automatically every week
- Export as PDF
- Email to all recipients
- Track success/failure

### Manage Schedules

- **Pause**: Click ⏸️ icon to temporarily disable
- **Resume**: Click ▶️ icon to re-activate
- **Delete**: Click 🗑️ icon to remove permanently

---

## 📁 Export Reports

### Download Options

1. Find report in **History** tab
2. Click format button:
   - **📄 PDF** - Professional formatted document
   - **📊 Excel** - Data analysis (XLSX)
   - **📋 CSV** - Raw data export
   - **🔧 JSON** - API/programmatic use

### PDF Features

- Company branding
- Professional layout
- Charts and tables
- Summary statistics
- Page numbers

### Excel/CSV Features

- Structured data tables
- Import into Excel/Google Sheets
- Data analysis ready
- Pivot table compatible

---

## 📈 Available Report Types

### 📂 Project Reports (5 types)

1. **Project Status Summary**
   - Overview of all projects
   - Budget vs spent
   - Task completion
   - Team size & risks

2. **Project Timeline**
   - Milestones & phases
   - Task grouping
   - Progress tracking

3. **Task Completion**
   - Completion rates
   - By priority & project
   - Average completion time

4. **Resource Allocation**
   - Team member utilization
   - Hours by project
   - Available capacity

5. **Risk Assessment**
   - Active risks
   - Mitigation status

### 💰 Financial Reports (5 types)

1. **Revenue by Project**
   - Revenue breakdown
   - By project & client
   - Monthly trends

2. **Profitability Analysis**
   - Profit margins
   - Cost breakdown
   - Variance analysis

3. **Budget vs Actual**
   - Budget comparison
   - Spending patterns

4. **Invoice Status**
   - Paid/unpaid amounts
   - Aging analysis
   - By client breakdown

5. **Payment Collection**
   - Collection rates
   - Overdue tracking

### 👥 Team Reports (5 types)

1. **Team Productivity**
   - Billable hours
   - Tasks completed
   - Individual performance

2. **Individual Performance**
   - Per-person metrics
   - Output tracking

3. **Time Tracking Summary**
   - Time entry analysis
   - Billable vs non-billable

4. **Workload Distribution**
   - Task allocation
   - Balance analysis

5. **Skill Utilization**
   - Skills usage patterns
   - Team capabilities

### 👤 Client Reports (4 types)

1. **Client Satisfaction**
   - Ratings & feedback
   - On-time delivery
   - Budget adherence

2. **Project Deliverables**
   - Completion status
   - Quality metrics

3. **Communication Logs**
   - Contact history
   - Response times

4. **Service Level Reports**
   - SLA compliance
   - Performance metrics

---

## 🎯 Common Use Cases

### Weekly Status Update

**Schedule Setup:**
- Type: Project Status Summary
- Frequency: Weekly
- Day: Monday 9 AM
- Format: PDF
- Recipients: Stakeholders

**Contains:**
- All active projects
- Budget status
- Team allocation
- Risk overview

### Monthly Financial Review

**Schedule Setup:**
- Type: Revenue by Project
- Frequency: Monthly
- Day: 1st of month
- Format: Excel
- Recipients: Finance team

**Contains:**
- Monthly revenue
- Project breakdown
- Client analysis
- Growth trends

### Quarterly Business Review

**Manual Generation:**
- Type: Profitability Analysis
- Date Range: Last quarter
- Format: PDF with branding
- Present to executives

**Contains:**
- Profit margins
- Cost analysis
- Project performance
- Strategic insights

---

## 🔧 Advanced Features

### Custom Date Ranges

When generating reports, specify:
- **Start Date**: Beginning of period
- **End Date**: End of period
- **Leave blank**: All-time data

### Search & Filter

In History tab:
- **Search**: Type in name/description
- **Category Filter**: Filter by category
- **Combine**: Use both together

### Download Tracking

System automatically tracks:
- View count
- Download count
- Last accessed
- Popular reports

### Report Sharing

(Coming soon)
- Share with specific users
- Make public reports
- Access control

---

## 📞 Quick Reference

### Dashboard Shortcuts

| Action | Location | Button |
|--------|----------|--------|
| Generate Report | Dashboard | "Generate New Report" |
| Schedule Report | Dashboard | "Schedule Report" |
| View Templates | Dashboard | "Browse Templates" |
| Download Report | History | Download icons |
| Manage Schedule | Schedules | Play/Pause/Delete |

### Keyboard Shortcuts

- **Search Reports**: Click search box, start typing
- **Close Dialog**: Click outside or Esc key
- **Refresh**: Click refresh button

### API Endpoints

- **Templates**: `GET /api/reports/templates`
- **Generate**: `POST /api/reports/generate`
- **Schedules**: `GET/POST/PUT/DELETE /api/reports/schedule`
- **Export**: `GET /api/reports/[id]/export?format=PDF`
- **Raw Data**: `GET /api/reports/data/[type]`

---

## 🐛 Troubleshooting

### "No reports shown"
→ Generate your first report using the button

### "Failed to generate"
→ Check database connection and filters

### "Download not working"
→ Wait for report to complete generating

### "Schedule not running"
→ Ensure it's active (green dot) and check next run time

### "Email not received"
→ Verify recipient emails are correct

---

## 💡 Pro Tips

### 🎨 For Better Reports

1. **Use descriptive names**: "Q4 2024 Revenue" instead of "Report 1"
2. **Add descriptions**: Help others understand what report shows
3. **Set date ranges**: Focus on specific periods
4. **Choose right format**: 
   - PDF for sharing
   - Excel for analysis
   - CSV for imports

### ⚡ For Performance

1. **Use caching**: Common reports load instantly
2. **Schedule off-peak**: Generate large reports at night
3. **Limit date ranges**: Smaller periods = faster generation
4. **Use filters**: Only get data you need

### 📧 For Schedules

1. **Test first**: Generate manually before scheduling
2. **Start with weekly**: Daily might be too frequent
3. **Use clear subjects**: Recipients know what to expect
4. **Multiple recipients**: Separate emails with commas
5. **Monitor failures**: Check last status regularly

---

## 📚 Next Steps

### Explore Templates
Browse all 19 templates to see what's available

### Create Schedules
Automate your most common reports

### Customize Exports
Try different formats for different audiences

### Review History
Track which reports are most useful

### Share Insights
Use reports in meetings and presentations

---

## 🎉 You're Ready!

The reporting system is now fully set up and ready to use.

**Quick Actions:**
1. ✅ Generate your first report
2. ✅ Schedule a weekly report
3. ✅ Export in different formats
4. ✅ Browse all templates
5. ✅ Share insights with team

**Need Help?**
- Full docs: `REPORTING_SYSTEM_COMPLETE.md`
- API reference: See full documentation
- Code examples: In documentation

**Enjoy your new reporting system!** 📊

---

**Version:** 1.0.0
**Last Updated:** January 8, 2025

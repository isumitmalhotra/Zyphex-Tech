# 🚀 Meetings Scheduler - Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Database Migration (Required)

```bash
# Stop dev server if running (Ctrl+C)

# Generate Prisma client with Meeting models
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name add_meetings_system

# Restart dev server
npm run dev
```

### Step 2: Access the Meetings Page

Navigate to: **http://localhost:3000/project-manager/meetings**

Login as:
- Role: `PROJECT_MANAGER` or `ADMIN`

### Step 3: Create Your First Meeting

1. Click **"Schedule Meeting"** button
2. Fill in:
   - **Title**: "Team Standup"
   - **Date**: Tomorrow
   - **Start Time**: 09:00
   - **End Time**: 09:30
   - **Type**: Video Call
3. Click **"Schedule Meeting"**

Done! 🎉

---

## 📅 Calendar Views

### Switch Between Views

- **Month View**: See meetings across entire month
- **Week View**: Focus on this week
- **Day View**: Detailed single day view
- **List View**: All meetings chronologically

Use the tabs at top right to switch.

### Navigate Dates

- **← →** arrows: Move between months/weeks/days
- **Today** button: Jump back to today
- Click any date in month view to select it

---

## 🔍 Search & Filter

### Quick Search
Type in the search box to find meetings by:
- Meeting title
- Description text

### Filter by Status
- **All Status**: Show everything
- **Scheduled**: Upcoming meetings
- **Completed**: Past meetings
- **Cancelled**: Cancelled meetings
- **In Progress**: Currently happening

### Filter by Type
- **All Types**: Show all
- **Video Call**: Zoom, Teams, etc.
- **Phone Call**: Conference calls
- **In Person**: Office meetings
- **Conference**: Large events

### Combine Filters
Use search + status + type together for precise results.

---

## ✨ Meeting Actions

### Create Meeting
1. Click "Schedule Meeting"
2. Enter details
3. Click "Schedule Meeting"
4. Meeting appears in calendar

### View Meeting
1. Click any meeting card or calendar event
2. See full details:
   - Description
   - Date/time
   - Location
   - Organizer
   - Attendees
   - Action items

### Cancel Meeting
1. Open meeting details
2. Click trash icon (🗑️)
3. Confirm cancellation
4. Meeting status → CANCELLED

### Edit Meeting (Coming Soon)
- Click "Edit Meeting" in details dialog
- Modify details
- Save changes

---

## 📊 Understanding the Dashboard

### Stats Cards

**Total Meetings**
- Count of all meetings (any status)
- Blue indicator

**Upcoming**
- Scheduled meetings in the future
- Green indicator

**Today**
- Meetings happening today
- Orange indicator

**This Week**
- Meetings from Mon-Sun this week
- Purple indicator

---

## 🎯 Meeting Types

### Video Call 📹
- Default type
- For Zoom, Teams, Google Meet
- Add link in "Location" field

### Phone Call ☎️
- For conference calls
- Add dial-in number in "Location"

### In Person 📍
- Office or client site meetings
- Add physical address in "Location"

### Conference 👥
- Large events
- Webinars, all-hands meetings

---

## 📧 Email Notifications (Setup Required)

The system includes beautiful email templates for:

### Meeting Invitation
- Sent when meeting created
- RSVP buttons (Accept/Decline/Tentative)
- Meeting details
- Join link
- Agenda items

### Meeting Reminder
- Send 24h or 1h before meeting
- Quick join button
- Time until meeting

### Meeting Cancellation
- Sent when meeting cancelled
- Reason for cancellation
- Proposed new time (if rescheduling)

### Meeting Summary
- Sent after meeting
- Attendance record
- Meeting notes
- Action items with assignees
- Recording link

**Note:** Email sending logic is placeholder. Integrate with your email service (Resend already configured).

---

## 🔧 Troubleshooting

### "Unauthorized" Error
→ Make sure you're logged in as PROJECT_MANAGER or ADMIN

### "Failed to fetch meetings"
→ Check database connection
→ Ensure migrations are applied

### Calendar not showing meetings
→ Check filters (status, type)
→ Try "All Status" and "All Types"

### Meeting conflict detected
→ You have overlapping meetings
→ Change time or cancel conflicting meeting

### Can't create meeting
→ Ensure title is filled
→ Ensure end time is after start time
→ Check you have proper role

---

## 💡 Pro Tips

### 🎨 Visual Indicators

**Status Colors:**
- 🔵 Blue = Scheduled
- 🟢 Green = Completed
- 🔴 Red = Cancelled
- 🟡 Yellow = In Progress
- 🟠 Orange = Rescheduled
- ⚪ Gray = No Show

### ⌨️ Keyboard Shortcuts
- Click outside dialog to close
- Use Tab to navigate form fields

### 📱 Mobile Usage
- All views work on mobile
- Swipe to see more meetings
- Tap meeting to view details

### 🔗 Share Meeting Links
- Copy location/link from details
- Share with attendees
- Works for Zoom, Teams, Meet

---

## 🚀 Advanced Features

### Coming Soon
- [ ] Add multiple attendees
- [ ] Recurring meetings
- [ ] Meeting notes editor
- [ ] Action items tracking
- [ ] Calendar sync (Google, Outlook)
- [ ] Find meeting times
- [ ] Availability checking

### Already Available
- ✅ Conflict detection
- ✅ Multiple calendar views
- ✅ Search & filter
- ✅ Stats dashboard
- ✅ Email templates
- ✅ Mobile responsive

---

## 📋 Quick Reference

### API Endpoints
```bash
GET    /api/meetings              # List meetings
POST   /api/meetings              # Create meeting
GET    /api/meetings/[id]         # Get meeting
PUT    /api/meetings/[id]         # Update meeting
DELETE /api/meetings/[id]         # Cancel meeting
GET    /api/meetings/[id]/notes   # Get notes
POST   /api/meetings/[id]/notes   # Save notes
```

### Meeting Object
```typescript
{
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  duration: number (minutes)
  type: "VIDEO_CALL" | "PHONE_CALL" | "IN_PERSON" | "CONFERENCE"
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | ...
  location?: string
  organizer: User
  attendees: Attendee[]
  actionItems: ActionItem[]
}
```

---

## 📞 Need Help?

### Documentation
- Full implementation: `MEETINGS_IMPLEMENTATION_COMPLETE.md`
- Database schema: `prisma/schema.prisma`
- API routes: `app/api/meetings/**`

### Common Tasks

**Add Attendees:**
Currently only organizer is added. UI for adding attendees coming soon.
Use API endpoint: `POST /api/meetings/[id]/attendees`

**Export Meetings:**
Use list view and copy meeting details.
CSV/PDF export coming soon.

**Integrate with Calendar:**
Calendar sync templates ready.
See: `TOOLS_INTEGRATIONS_IMPLEMENTATION.md`

---

## ✅ Quick Checklist

**Before Using:**
- [ ] Run `npx prisma migrate dev --name add_meetings_system`
- [ ] Run `npx prisma generate`
- [ ] Restart dev server
- [ ] Login as PROJECT_MANAGER or ADMIN

**First Meeting:**
- [ ] Navigate to /project-manager/meetings
- [ ] Click "Schedule Meeting"
- [ ] Fill in title and time
- [ ] Select meeting type
- [ ] Click "Schedule Meeting"
- [ ] Verify in calendar view

**Test Features:**
- [ ] Try month view
- [ ] Try list view
- [ ] Search for meeting
- [ ] Filter by status
- [ ] View meeting details
- [ ] Cancel a meeting

---

## 🎉 You're Ready!

The meetings scheduler is now fully set up and ready to use.

**Next Steps:**
1. Create your first meeting ✅
2. Invite team members (API ready, UI coming)
3. Add meeting notes after meetings
4. Track action items
5. Review meeting history

**Enjoy your new meetings system!** 📅

---

**Quick Links:**
- Meetings Page: `/project-manager/meetings`
- Full Docs: `MEETINGS_IMPLEMENTATION_COMPLETE.md`
- API Reference: See full docs
- Email Templates: `lib/email/templates/meeting.ts`

**Version:** 1.0.0
**Last Updated:** October 8, 2025

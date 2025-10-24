# Quick Start Guide - Client Communications

## 🚀 Start the Server

```powershell
npm run dev:custom
```

This starts Next.js with Socket.io support on `http://localhost:3000`

---

## 📍 Access the Page

Navigate to: `http://localhost:3000/project-manager/client-comms`

(You must be logged in with a valid session)

---

## 🧪 Quick Test Checklist

### Basic Functionality
- [ ] Can see client list
- [ ] Can select a client
- [ ] Can send a message
- [ ] Can see stats dashboard

### Real-time Features (Open 2 tabs)
- [ ] Send message in Tab 1 → appears in Tab 2 instantly
- [ ] Type in Tab 1 → typing indicator shows in Tab 2
- [ ] Read message in Tab 2 → read receipt shows in Tab 1

### File Attachments
- [ ] Click paperclip icon
- [ ] Select file(s)
- [ ] Verify upload success
- [ ] Send message with attachment
- [ ] Download attachment from received message

### Advanced Features
- [ ] Filter messages by type
- [ ] Filter by date
- [ ] Schedule a meeting
- [ ] Log a call
- [ ] Send an email (with subject)
- [ ] Enable/disable notifications

---

## 🔑 API Endpoints

### Clients
```
GET /api/project-manager/client-comms/clients
```

### Messages
```
GET /api/project-manager/client-comms/messages?clientId=USER_ID
POST /api/project-manager/client-comms/messages
POST /api/project-manager/client-comms/messages/mark-read
```

### Stats
```
GET /api/project-manager/client-comms/stats
```

### Actions
```
POST /api/project-manager/client-comms/meetings
POST /api/project-manager/client-comms/calls
POST /api/project-manager/client-comms/upload
```

---

## 🔌 Socket.io Connection

**Path:** `/api/socket/io`

**Authentication:**
```javascript
{
  auth: {
    token: Base64(JSON.stringify({
      userId: "user-id",
      email: "email@example.com",
      name: "User Name"
    }))
  }
}
```

**Events to Emit:**
- `join` - Join personal room
- `message` - Send message
- `typing` - Typing indicator
- `messageRead` - Mark as read

**Events to Listen:**
- `connected` - Connection success
- `message` - New message received
- `typing` - Someone is typing
- `messageRead` - Message was read

---

## 📁 File Structure

```
app/
├── api/
│   └── project-manager/
│       └── client-comms/
│           ├── clients/route.ts          ✅
│           ├── messages/route.ts         ✅
│           ├── messages/mark-read/route.ts ✅
│           ├── stats/route.ts            ✅
│           ├── meetings/route.ts         ✅
│           ├── calls/route.ts            ✅
│           └── upload/route.ts           ✅
├── project-manager/
│   └── client-comms/
│       └── page.tsx                      ✅ (1,347 lines)
└── api/
    └── socketio/route.ts                 ✅

server.js                                  ✅ (Socket.io integrated)

public/
└── uploads/
    └── client-comms/                     📁 (created on first upload)
```

---

## 🎯 Common Issues & Fixes

### Server won't start
```powershell
# Kill any process on port 3000
Get-Process -Name node | Stop-Process -Force

# Start again
npm run dev:custom
```

### Socket.io not connecting
- Check browser console for errors
- Verify server.js is running (not `npm run dev`)
- Check authentication token is valid

### Files not uploading
- Check file size (max 10MB)
- Verify `public/uploads/client-comms/` directory exists
- Check browser console for upload errors

### Messages not appearing
- Check database connection
- Verify user IDs are correct
- Check browser console for API errors

---

## 📊 Test with Multiple Users

### Option 1: Multiple Browsers
1. Chrome → Login as User A
2. Firefox → Login as User B
3. Send messages between them

### Option 2: Incognito Windows
1. Normal window → Login as User A
2. Incognito window → Login as User B
3. Test real-time features

### Option 3: Multiple Accounts
1. Create test users in database
2. Login to different accounts
3. Test all features

---

## ✅ Feature Checklist

```
✅ Client list with unread counts
✅ Real-time messaging
✅ Typing indicators
✅ Read receipts
✅ Push notifications
✅ File attachments (upload/download)
✅ Advanced filtering (type/date/project)
✅ Meeting scheduler
✅ Call logging
✅ Email composer with templates
✅ Stats dashboard
✅ Socket.io real-time server
✅ 8 API routes
✅ Authentication on all routes
✅ Error handling
✅ Security measures
```

---

## 🎉 You're Ready!

Everything is set up and ready to use. Start the server and test away!

```powershell
npm run dev:custom
```

Then navigate to:
```
http://localhost:3000/project-manager/client-comms
```

**Happy testing! 🚀**

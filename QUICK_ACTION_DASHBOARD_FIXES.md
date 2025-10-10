# Quick Action Guide - Database Migration & Testing

## Step 1: Database Migration (REQUIRED)

Run these commands in your terminal:

```powershell
# Navigate to project directory
cd c:\Projects\Zyphex-Tech

# Run Prisma migration to create Notification table
npx prisma migrate dev --name add_notification_model

# Generate updated Prisma client
npx prisma generate
```

**What this does**:
- Creates the `Notification` table in your PostgreSQL database
- Adds the `NotificationType` enum
- Updates Prisma client with new types

## Step 2: Test Message Fixes (Immediate)

These fixes are already working and can be tested right away:

### Test Message Sender Display
1. Open your app: http://localhost:3000
2. Login as a user
3. Navigate to Messages page: http://localhost:3000/user/messages
4. **Check**: Do messages show the actual sender's name instead of "Unknown Sender"?
5. **Check**: Do messages show the sender's email correctly?

### Test Message Subject
1. Send a new message from the Messages page
2. **Check**: Does the message subject show "Support Request from [Your Name]"?
3. **Check**: If you type a custom subject, does it use that instead?

## Step 3: Update Notification API (Required for Persistence)

After migration, update the notification API to use the persistent model:

**File**: `app/api/user/notifications/route.ts`

### Update GET endpoint (lines 6-200)
Replace the dynamic notification generation with:

```typescript
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Fetch notifications from database
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    // Count unread notifications
    const unreadCount = await prisma.notification.count({
      where: { 
        userId: user.id, 
        read: false 
      }
    })

    return NextResponse.json({
      notifications,
      unreadCount,
      success: true
    })

  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
```

### Update PUT endpoint (lines 214-255)
Replace with:

```typescript
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { notificationId } = await request.json()

    if (!notificationId) {
      return NextResponse.json({ error: "Notification ID is required" }, { status: 400 })
    }

    // Update notification read status in database
    const notification = await prisma.notification.update({
      where: { 
        id: notificationId,
        userId: user.id // Ensure user owns this notification
      },
      data: { 
        read: true, 
        readAt: new Date() 
      }
    })
    
    return NextResponse.json({
      success: true,
      notification
    })

  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
```

## Step 4: Test Notification Persistence

After updating the API:

### Test Notification Read State
1. Restart your development server
2. Navigate to Notifications: http://localhost:3000/user/notifications
3. Mark a notification as read
4. **Refresh the page** - Check: Does the notification stay marked as read?
5. **Logout and login again** - Check: Is the notification still marked as read?

### Test Notification Badge
1. Check the sidebar badge count
2. Mark a notification as read
3. **Check**: Does the badge count decrease by 1?
4. Mark all notifications as read
5. **Check**: Does the badge disappear or show 0?

## Step 5: Create Test Notifications

To test the system, manually create some notifications:

```powershell
# Open Prisma Studio
npx prisma studio
```

Or use the API - create a POST endpoint in `app/api/user/notifications/route.ts`:

```typescript
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { title, message, type, projectId, actionUrl } = await request.json()

    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        title: title || "Test Notification",
        message: message || "This is a test notification",
        type: type || "INFO",
        projectId,
        actionUrl
      }
    })

    return NextResponse.json({
      success: true,
      notification
    })

  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
```

## Step 6: Production Deployment

Once everything works in development:

### 1. Commit Changes
```powershell
git add .
git commit -m "Fix: Message sender display and notification persistence

- Fixed 'Unknown Sender' issue by updating Message interface
- Added personalized message subjects with user name
- Created Notification model for persistent notification tracking
- Added NotificationType enum with proper categories
- Prepared notification API for persistent storage"
```

### 2. Push to Production Branch
```powershell
git checkout production
git merge main
git push origin production
```

### 3. SSH to VPS and Deploy
```powershell
ssh root@66.116.199.219

cd /var/www/zyphex-tech

# Pull latest changes
git pull origin production

# Run migration (CRITICAL)
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Rebuild application
npm run build

# Restart PM2
pm2 restart zyphex-tech
pm2 save

# Check logs
pm2 logs zyphex-tech --lines 50
```

## Verification Checklist

### Messages ✅ (Already Fixed)
- [ ] Messages show actual sender names
- [ ] Messages show actual sender emails
- [ ] Message subjects are personalized
- [ ] "Unknown Sender" no longer appears

### Notifications ⏳ (After Migration + API Update)
- [ ] Notifications persist across page refreshes
- [ ] Notifications persist across login sessions
- [ ] Badge count updates when marking as read
- [ ] Badge count is accurate (matches unread notifications)
- [ ] Notifications don't reappear after being marked as read

## Troubleshooting

### If Migration Fails
```powershell
# Check migration status
npx prisma migrate status

# If stuck, reset and try again (DEV ONLY)
npx prisma migrate reset
npx prisma migrate dev --name add_notification_model
```

### If Prisma Client Errors
```powershell
# Clear cache and regenerate
rm -rf node_modules/.prisma
npx prisma generate
```

### If Notifications Still Don't Persist
1. Check if migration ran successfully: `npx prisma studio` and look for Notification table
2. Check API is using new code (restart server)
3. Check browser console for errors
4. Check server logs: `pm2 logs zyphex-tech`

## Success Indicators

✅ **Messages Working**: No "Unknown Sender", names display correctly  
✅ **Message Subjects**: Show "Support Request from [Name]"  
⏳ **Notifications Persist**: Stay read after refresh (after migration)  
⏳ **Badge Count Accurate**: Updates in real-time (after API update)  

## Next Enhancement Ideas

1. **Real-time Notifications**: Use Socket.io to push notifications instantly
2. **Notification Preferences**: Let users control notification types
3. **Notification History**: Add pagination and search
4. **Bulk Actions**: Mark all as read, clear all
5. **Notification Categories**: Filter by type (tasks, messages, billing)

## Support

If you encounter any issues:
1. Check the detailed documentation: `USER_DASHBOARD_FIXES_COMPLETE_V2.md`
2. Review error logs in browser console and server logs
3. Verify database migration completed successfully
4. Ensure all files are saved and server is restarted

**Status**: Ready for migration and testing! 🚀

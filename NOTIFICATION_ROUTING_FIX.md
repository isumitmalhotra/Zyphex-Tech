# Fix Message Notifications Script

## Problem
Notifications with old/incorrect `/user/messages` routes showing up for super-admin users.

## What Was Fixed

### 1. Super Admin Messages API
**File:** `app/api/super-admin/messages/route.ts`
- **Before:** Hardcoded `/user/messages` for all recipients
- **After:** Dynamic routing based on recipient's role

### 2. Messaging API
**File:** `app/api/messaging/messages/route.ts`
- **Before:** Hardcoded `/messages?channel=` for all users
- **After:** Dynamic routing based on each user's role

## How It Works Now

When a notification is created, the system checks the recipient's role and routes accordingly:

```typescript
SUPER_ADMIN    → /super-admin/messages
ADMIN          → /admin/messages
PROJECT_MANAGER → /project-manager/messages
TEAM_MEMBER    → /team-member/messages
CLIENT         → /client/messages
USER           → /user/messages (default)
```

## Clear Old Notifications

To remove old notifications with incorrect routes, run this in your database:

```sql
-- Delete old message notifications with incorrect routes
DELETE FROM "Notification" 
WHERE type = 'MESSAGE' 
AND "actionUrl" NOT LIKE '%' || (
  SELECT CASE 
    WHEN u.role = 'SUPER_ADMIN' THEN '/super-admin/messages%'
    WHEN u.role = 'ADMIN' THEN '/admin/messages%'
    WHEN u.role = 'PROJECT_MANAGER' THEN '/project-manager/messages%'
    WHEN u.role = 'TEAM_MEMBER' THEN '/team-member/messages%'
    WHEN u.role = 'CLIENT' THEN '/client/messages%'
    ELSE '/user/messages%'
  END
  FROM "User" u 
  WHERE u.id = "Notification"."userId"
);
```

Or simpler - just delete all message notifications and let them regenerate:

```sql
DELETE FROM "Notification" WHERE type = 'MESSAGE';
```

## Test

1. **Clear browser cache** and refresh
2. **Send a test message** from one user to another
3. **Check notification** - should route to correct dashboard
4. **Click notification** - should open messages in correct dashboard

## Files Modified

✅ `app/api/super-admin/messages/route.ts` - Added role-based routing
✅ `app/api/messaging/messages/route.ts` - Added role-based routing  
✅ Super-admin notifications API already correct

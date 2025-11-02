# 🔐 CMS Super Admin Access Control
## Simplified Access Model - Super Admin Only

**Date:** November 2, 2025  
**Security Level:** Critical  
**Implementation Status:** To Be Implemented

---

## 🎯 Access Control Philosophy

**Simple Rule:** Only **SUPER_ADMIN** role has CMS access. Period.

This simplifies the original architecture document which had multiple roles (Admin, Publisher, Editor, Contributor, Viewer). For Zyphex Tech, we don't need complex role hierarchies.

---

## 👤 User Roles (Simplified)

### Current System Roles
From `prisma/schema.prisma`:
```prisma
enum Role {
  SUPER_ADMIN
  ADMIN
  PROJECT_MANAGER
  TEAM_MEMBER
  CLIENT
  USER
}
```

### CMS Access Matrix

| Role             | CMS Access | Reason                          |
|------------------|:----------:|---------------------------------|
| SUPER_ADMIN      | ✅ FULL    | Complete control of website     |
| ADMIN            | ❌ NONE    | Project management only         |
| PROJECT_MANAGER  | ❌ NONE    | Project-specific work           |
| TEAM_MEMBER      | ❌ NONE    | Task execution only             |
| CLIENT           | ❌ NONE    | View projects only              |
| USER             | ❌ NONE    | Limited access                  |

**Summary:** Only you (SUPER_ADMIN) can manage website content.

---

## 🛡️ Implementation Strategy

### Middleware Protection

**File:** `middleware.ts`

Add CMS route protection:

```typescript
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all /super-admin/cms routes
  if (pathname.startsWith('/super-admin/cms')) {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    // Check if user is logged in
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check if user is SUPER_ADMIN
    if (token.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    // Allow access
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/super-admin/cms/:path*',
    '/api/cms/:path*', // Protect API endpoints too
  ],
};
```

---

### API Route Protection

**Pattern for all CMS API routes:**

```typescript
// app/api/cms/pages/route.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // 1. Check authentication
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized - Please login' },
      { status: 401 }
    );
  }

  // 2. Check super admin role
  if (session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { error: 'Forbidden - Super Admin access required' },
      { status: 403 }
    );
  }

  // 3. Proceed with CMS operation
  try {
    // Your CMS logic here
    return NextResponse.json({ success: true, data: [] });
  } catch (error) {
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
```

---

### Reusable Auth Check

**Create:** `lib/cms/auth-guard.ts`

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized - Please login' },
      { status: 401 }
    );
  }

  if (session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { error: 'Forbidden - Super Admin access required' },
      { status: 403 }
    );
  }

  return session; // Return session for use in route
}

// Usage in API routes:
export async function GET(request: Request) {
  const authCheck = await requireSuperAdmin();
  if (authCheck instanceof NextResponse) {
    return authCheck; // Return error response
  }
  
  // authCheck is the session object
  const session = authCheck;
  
  // Your CMS logic here with session.user access
}
```

---

### Frontend Protection

**Protect CMS navigation in sidebar:**

```tsx
// components/admin-sidebar.tsx

import { useSession } from 'next-auth/react';

export function AdminSidebar() {
  const { data: session } = useSession();
  
  return (
    <aside>
      {/* Only show CMS menu to SUPER_ADMIN */}
      {session?.user?.role === 'SUPER_ADMIN' && (
        <div>
          <h3>Content Management</h3>
          <nav>
            <Link href="/super-admin/cms/pages">Pages</Link>
            <Link href="/super-admin/cms/media">Media</Link>
            <Link href="/super-admin/cms/templates">Templates</Link>
            <Link href="/super-admin/cms/navigation">Navigation</Link>
            <Link href="/super-admin/cms/settings">Settings</Link>
          </nav>
        </div>
      )}
      
      {/* Other menu items for other roles */}
    </aside>
  );
}
```

---

## 🔒 Security Checklist

### ✅ Middleware Level
- [ ] All `/super-admin/cms/*` routes protected
- [ ] All `/api/cms/*` routes protected
- [ ] Redirect to login if not authenticated
- [ ] Redirect to unauthorized if not SUPER_ADMIN

### ✅ API Level
- [ ] Every CMS API checks authentication
- [ ] Every CMS API checks SUPER_ADMIN role
- [ ] Proper error messages (401 vs 403)
- [ ] Session data includes user info

### ✅ Frontend Level
- [ ] CMS menu only visible to SUPER_ADMIN
- [ ] CMS pages redirect if unauthorized
- [ ] Proper loading states
- [ ] Error messages displayed

### ✅ Database Level
- [ ] User ID tracked in all CMS operations
- [ ] Audit logs record all changes
- [ ] No direct database access from frontend

---

## 🧪 Testing Access Control

### Test Cases

**Test 1: Not Logged In**
```bash
# Attempt to access CMS without login
curl http://localhost:3000/api/cms/pages

# Expected: 401 Unauthorized
```

**Test 2: Logged In as Non-Super Admin**
```bash
# Login as TEAM_MEMBER, try to access CMS
# Expected: 403 Forbidden
```

**Test 3: Logged In as Super Admin**
```bash
# Login as SUPER_ADMIN, access CMS
# Expected: 200 OK with data
```

**Test 4: Session Expiry**
```bash
# Access CMS with expired session
# Expected: 401 Unauthorized, redirect to login
```

---

## 👨‍💼 Current Super Admin

**User:** Sumit Malhotra  
**Email:** (from your database)  
**Role:** SUPER_ADMIN  
**Access:** Full CMS control

**Verification:**
```sql
-- Check in database
SELECT id, email, name, role FROM "User" WHERE role = 'SUPER_ADMIN';
```

---

## 🚨 Security Best Practices

### DO ✅
- Always check session on every CMS request
- Use middleware for route protection
- Log all CMS operations with user ID
- Invalidate session on logout
- Use HTTPS in production
- Implement CSRF protection
- Rate limit API endpoints

### DON'T ❌
- Never trust client-side checks alone
- Don't expose sensitive data in errors
- Don't allow role escalation
- Don't hardcode credentials
- Don't skip authentication checks
- Don't log sensitive data (passwords, tokens)

---

## 🔄 Adding Another Super Admin (Future)

If you need to grant CMS access to someone else:

1. **Create User Account**
   ```sql
   INSERT INTO "User" (id, email, name, role, password)
   VALUES (
     gen_random_uuid(),
     'new-admin@zyphextech.com',
     'New Admin Name',
     'SUPER_ADMIN',
     'hashed_password_here'
   );
   ```

2. **Notify User**
   - Send login credentials
   - Require password change on first login
   - Enable MFA (future enhancement)

3. **Monitor Activity**
   - Check audit logs regularly
   - Review all CMS changes
   - Set up alerts for critical operations

---

## 📊 Audit Logging

All CMS actions logged with:

```typescript
// Example audit log entry
{
  userId: "uuid-of-super-admin",
  action: "UPDATE_PAGE",
  entityType: "CmsPage",
  entityId: "page-uuid",
  changes: {
    old: { title: "Old Title" },
    new: { title: "New Title" }
  },
  ipAddress: "123.45.67.89",
  userAgent: "Mozilla/5.0...",
  createdAt: "2025-11-02T18:00:00Z"
}
```

**View Audit Logs:**
- Go to `/super-admin/cms/activity-log`
- Filter by user, action, date
- Export to CSV for analysis

---

## 🎯 Implementation Priority

### Phase 1: Critical (Week 1)
1. ✅ Add middleware protection
2. ✅ Create auth guard utility
3. ✅ Protect all existing CMS API routes
4. ✅ Test authentication flow

### Phase 2: Important (Week 2)
5. ✅ Hide CMS menu from non-super admins
6. ✅ Add audit logging to all operations
7. ✅ Implement rate limiting
8. ✅ Add CSRF protection

### Phase 3: Enhanced (Week 3+)
9. ✅ MFA for super admin login (optional)
10. ✅ Session timeout warning
11. ✅ Activity alerts (email on critical changes)
12. ✅ IP whitelist (optional)

---

## 📝 Code Templates

### API Route Template with Auth

```typescript
// app/api/cms/[resource]/route.ts
import { requireSuperAdmin } from '@/lib/cms/auth-guard';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  // Auth check
  const authCheck = await requireSuperAdmin();
  if (authCheck instanceof NextResponse) return authCheck;
  const session = authCheck;

  try {
    // Your logic here
    const data = await prisma.cmsPage.findMany();
    
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('CMS API Error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const authCheck = await requireSuperAdmin();
  if (authCheck instanceof NextResponse) return authCheck;
  const session = authCheck;

  try {
    const body = await request.json();
    
    // Create with user tracking
    const created = await prisma.cmsPage.create({
      data: {
        ...body,
        createdBy: session.user.id,
        updatedBy: session.user.id,
      },
    });

    // Audit log
    await prisma.cmsActivityLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE_PAGE',
        entityType: 'CmsPage',
        entityId: created.id,
        changes: { new: created },
      },
    });

    return NextResponse.json({
      success: true,
      data: created,
    });
  } catch (error) {
    console.error('CMS API Error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
```

---

## ✅ Acceptance Criteria

Access control is correctly implemented when:

1. ✅ Non-authenticated users redirected to login
2. ✅ Non-super admins get 403 Forbidden
3. ✅ Super admin can access all CMS features
4. ✅ All CMS operations logged with user ID
5. ✅ CMS menu hidden from non-super admins
6. ✅ Session expiry handled gracefully
7. ✅ No console errors on access denied
8. ✅ Proper error messages displayed

---

## 🔐 Summary

**What:** Super Admin only access to CMS  
**Why:** Simplified security model, single point of control  
**How:** Middleware + API guards + Frontend checks  
**When:** Implement in Week 1 (Critical)  
**Who:** Only SUPER_ADMIN role (you)  

**Key Takeaway:** Three-layer protection (middleware, API, frontend) ensures only super admins can manage content.

---

**Status:** 📋 Ready for Implementation  
**Next Step:** Add middleware protection (Task in Week 1)  
**Priority:** 🔴 Critical - Implement immediately

---

*"Security first, features second. Protect the CMS before building it."*

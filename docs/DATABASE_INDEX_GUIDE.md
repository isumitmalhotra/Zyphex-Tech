# Database Index Quick Reference Guide

## 🎯 Purpose
This guide provides quick reference for all database indexes implemented for query optimization.

---

## 📋 INDEX CATEGORIES

### 1. AUTHENTICATION & AUTHORIZATION (User)
```prisma
@@index([email])                    // Login by email
@@index([role])                     // Role filtering
@@index([deletedAt])                // Active users
@@index([email, deletedAt])         // Active user login
@@index([role, deletedAt])          // Active users by role
@@index([role, createdAt])          // Recent users by role
```

**Use Cases:**
- User login: `WHERE email = ? AND deletedAt IS NULL`
- Admin queries: `WHERE role = 'ADMIN' AND deletedAt IS NULL`
- Recent users: `WHERE role = ? ORDER BY createdAt DESC`

---

### 2. PROJECT MANAGEMENT (Project)
```prisma
@@index([clientId])                        // Client projects
@@index([managerId])                       // Manager projects
@@index([status])                          // Status filtering
@@index([priority])                        // Priority filtering
@@index([clientId, status])                // Client projects by status
@@index([managerId, status])               // Manager projects by status
@@index([status, priority, createdAt])     // Complex filtering
@@index([managerId, priority, status])     // Manager priority view
```

**Use Cases:**
- Client dashboard: `WHERE clientId = ? AND status = 'IN_PROGRESS'`
- Manager view: `WHERE managerId = ? AND status IN (?) ORDER BY priority`
- Active projects: `WHERE status = 'IN_PROGRESS' AND priority = 'HIGH'`

---

### 3. TASK MANAGEMENT (Task)
```prisma
@@index([projectId])                       // Project tasks
@@index([assigneeId])                      // User tasks
@@index([status])                          // Status filtering
@@index([priority])                        // Priority filtering
@@index([dueDate])                         // Due date sorting
@@index([projectId, status])               // Project tasks by status
@@index([assigneeId, status])              // User tasks by status
@@index([assigneeId, dueDate, status])     // User upcoming tasks
@@index([status, priority, dueDate])       // Complex task queries
```

**Use Cases:**
- User task list: `WHERE assigneeId = ? AND status IN ('TODO', 'IN_PROGRESS') ORDER BY dueDate`
- Project board: `WHERE projectId = ? AND status = ? ORDER BY priority`
- Overdue tasks: `WHERE status != 'DONE' AND dueDate < NOW()`

---

### 4. TIME TRACKING (TimeEntry)
```prisma
@@index([userId])                          // User time entries
@@index([projectId])                       // Project time
@@index([date])                            // Date-based queries
@@index([billable])                        // Billable filtering
@@index([userId, date])                    // User timesheet
@@index([projectId, date])                 // Project time tracking
@@index([billable, status, date])          // Billing queries
@@index([userId, projectId, date])         // User project tracking
```

**Use Cases:**
- User timesheet: `WHERE userId = ? AND date >= ? AND date <= ?`
- Project hours: `WHERE projectId = ? AND billable = true`
- Billing report: `WHERE billable = true AND status = 'APPROVED' AND date BETWEEN ? AND ?`

---

### 5. FINANCIAL MANAGEMENT (Invoice)
```prisma
@@index([clientId])                        // Client invoices
@@index([projectId])                       // Project invoices
@@index([status])                          // Status filtering
@@index([dueDate])                         // Due date sorting
@@index([clientId, status])                // Client invoices by status
@@index([status, dueDate])                 // Overdue invoices
@@index([clientId, status, dueDate])       // Client payment dashboard
```

**Use Cases:**
- Client invoices: `WHERE clientId = ? ORDER BY dueDate DESC`
- Overdue: `WHERE status = 'SENT' AND dueDate < NOW()`
- Payment tracking: `WHERE clientId = ? AND status = 'PAID' ORDER BY paidAt DESC`

---

### 6. MESSAGING (Message, Notification)
```prisma
// Message
@@index([senderId])                        // Sent messages
@@index([receiverId])                      // Received messages
@@index([channelId])                       // Channel messages
@@index([receiverId, readAt])              // Unread messages
@@index([channelId, createdAt])            // Channel timeline

// Notification
@@index([userId])                          // User notifications
@@index([read])                            // Read status
@@index([userId, read, createdAt])         // Recent unread
```

**Use Cases:**
- Inbox: `WHERE receiverId = ? AND readAt IS NULL ORDER BY createdAt DESC`
- Channel: `WHERE channelId = ? ORDER BY createdAt ASC`
- Unread count: `WHERE userId = ? AND read = false`

---

## 🔍 QUERY PATTERN EXAMPLES

### Example 1: User Dashboard Query
```typescript
// Optimized query uses multiple indexes
const dashboard = await prisma.$transaction([
  // Uses: User_email_deletedAt_idx
  prisma.user.findUnique({
    where: { email, deletedAt: null }
  }),
  
  // Uses: Project_managerId_status_idx
  prisma.project.findMany({
    where: { managerId: userId, status: 'IN_PROGRESS' }
  }),
  
  // Uses: Task_assigneeId_dueDate_status_idx
  prisma.task.findMany({
    where: { 
      assigneeId: userId,
      status: { in: ['TODO', 'IN_PROGRESS'] },
      dueDate: { gte: new Date() }
    },
    orderBy: { dueDate: 'asc' }
  })
]);
```

### Example 2: Project Time Report
```typescript
// Uses: TimeEntry_projectId_date_idx
const timeReport = await prisma.timeEntry.findMany({
  where: {
    projectId,
    date: {
      gte: startDate,
      lte: endDate
    },
    billable: true
  },
  orderBy: { date: 'desc' }
});
```

### Example 3: Client Invoice Dashboard
```typescript
// Uses: Invoice_clientId_status_dueDate_idx
const invoices = await prisma.invoice.findMany({
  where: {
    clientId,
    status: { in: ['SENT', 'OVERDUE'] }
  },
  orderBy: { dueDate: 'asc' },
  take: 20
});
```

---

## 📊 INDEX NAMING CONVENTION

Prisma auto-generates index names following this pattern:
```
{ModelName}_{field1}_{field2}_idx
```

Examples:
- `User_email_idx` - Simple index on User.email
- `Project_clientId_status_idx` - Compound index on Project (clientId, status)
- `Task_assigneeId_dueDate_status_idx` - Triple compound index

---

## 🧪 TESTING INDEX USAGE

### Check if query uses index (PostgreSQL)
```sql
EXPLAIN ANALYZE
SELECT * FROM "User" WHERE email = 'test@example.com' AND "deletedAt" IS NULL;

-- Look for: "Index Scan using User_email_deletedAt_idx"
-- Avoid: "Seq Scan" (means not using index)
```

### Prisma query with explain
```typescript
const result = await prisma.$queryRaw`
  EXPLAIN ANALYZE
  SELECT * FROM "Project" 
  WHERE "clientId" = ${clientId} 
    AND status = 'IN_PROGRESS';
`;
```

---

## 📈 PERFORMANCE MONITORING

### Check index usage statistics
```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### Find unused indexes
```sql
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexname NOT LIKE '%_pkey';
```

---

## ⚡ OPTIMIZATION TIPS

### 1. Use Compound Indexes Effectively
```typescript
// ✅ GOOD: Uses compound index efficiently
WHERE userId = ? AND status = 'ACTIVE' AND createdAt > ?

// ❌ BAD: Breaks compound index (non-leftmost prefix)
WHERE status = 'ACTIVE' AND createdAt > ?
```

### 2. Include Soft Delete in Queries
```typescript
// ✅ GOOD: Uses User_email_deletedAt_idx
WHERE email = ? AND deletedAt IS NULL

// ❌ BAD: Only uses User_email_idx
WHERE email = ?
```

### 3. Limit Result Sets
```typescript
// ✅ GOOD: Efficient pagination
.findMany({ take: 20, skip: 0 })

// ❌ BAD: Fetches entire table
.findMany()
```

---

## 🔄 MAINTENANCE

### Regular Tasks
1. **Daily:** Monitor slow query log
2. **Weekly:** Check index usage statistics
3. **Monthly:** Identify and remove unused indexes
4. **Quarterly:** Run VACUUM ANALYZE

### Commands
```bash
# Verify indexes
npm run db:verify-indexes

# Database studio (visual inspection)
npm run db:studio

# Generate migration
npx prisma migrate dev --name index_updates
```

---

## 📚 ADDITIONAL RESOURCES

- **Prisma Documentation:** https://www.prisma.io/docs/concepts/components/prisma-schema/indexes
- **PostgreSQL Indexes:** https://www.postgresql.org/docs/current/indexes.html
- **Query Optimization:** https://www.prisma.io/docs/guides/performance-and-optimization

---

**Last Updated:** October 17, 2025  
**Maintained by:** Zyphex-Tech DevOps Team

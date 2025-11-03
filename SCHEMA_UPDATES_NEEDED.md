# Database Schema Updates Required for Tasks #21 & #22

## Overview
Tasks #21 (Workflow Automation) and #22 (Comment System) require new Prisma models to be added to the database schema.

---

## Task #21: Automation System Models

### CmsAutomationRule Model
```prisma
model CmsAutomationRule {
  id          String   @id @default(cuid())
  name        String
  description String?
  isActive    Boolean  @default(true)
  trigger     Json     // AutomationTrigger type
  conditions  Json     // AutomationCondition[] type
  actions     Json     // AutomationAction[] type
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  executions  CmsAutomationExecution[]

  @@index([isActive])
  @@index([createdBy])
  @@map("cms_automation_rules")
}
```

### CmsAutomationExecution Model
```prisma
model CmsAutomationExecution {
  id           String   @id @default(cuid())
  ruleId       String
  triggeredBy  String   // TriggerType
  triggeredAt  DateTime @default(now())
  status       String   // 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  context      Json     // ExecutionContext type
  actions      Json     // ActionExecution[] type
  completedAt  DateTime?
  error        String?  @db.Text

  rule         CmsAutomationRule @relation(fields: [ruleId], references: [id], onDelete: Cascade)

  @@index([ruleId])
  @@index([status])
  @@index([triggeredAt])
  @@map("cms_automation_executions")
}
```

---

## Task #22: Comment System Models

### CmsComment Model
```prisma
model CmsComment {
  id          String   @id @default(cuid())
  pageId      String
  sectionId   String?
  content     String   @db.Text
  authorId    String
  authorName  String
  authorEmail String
  parentId    String?  // For threaded replies
  isResolved  Boolean  @default(false)
  resolvedBy  String?
  resolvedAt  DateTime?
  mentions    Json     // string[] of user IDs mentioned
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  page        CmsPage  @relation(fields: [pageId], references: [id], onDelete: Cascade)
  author      User     @relation(fields: [authorId], references: [id])
  parent      CmsComment?  @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies     CmsComment[] @relation("CommentReplies")

  @@index([pageId])
  @@index([sectionId])
  @@index([authorId])
  @@index([parentId])
  @@index([isResolved])
  @@index([createdAt])
  @@map("cms_comments")
}
```

---

## Required Updates to Existing Models

### CmsPage Model
Add relation to comments:
```prisma
model CmsPage {
  // ... existing fields ...
  
  comments    CmsComment[]  // Add this line
}
```

### User Model
Add relation to comments:
```prisma
model User {
  // ... existing fields ...
  
  comments    CmsComment[]  // Add this line
}
```

---

## Migration Commands

After adding these models to `prisma/schema.prisma`:

```bash
# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name add_automation_and_comments

# Apply migration to production
npx prisma migrate deploy
```

---

## Database Indexes

The models include strategic indexes for:
- **Automation Rules:** isActive, createdBy
- **Automation Executions:** ruleId, status, triggeredAt
- **Comments:** pageId, sectionId, authorId, parentId, isResolved, createdAt

These indexes optimize common queries and improve performance.

---

## JSON Field Structures

### AutomationTrigger (Json)
```typescript
{
  type: 'page_created' | 'page_updated' | 'page_published' | ...,
  config: {
    // Trigger-specific configuration
  }
}
```

### AutomationCondition (Json array)
```typescript
[
  {
    field: 'status',
    operator: 'equals',
    value: 'published',
    logic: 'AND' | 'OR'
  }
]
```

### AutomationAction (Json array)
```typescript
[
  {
    type: 'publish_page',
    config: { /* action-specific config */ },
    order: 1
  }
]
```

### Comment Mentions (Json array)
```typescript
['user-id-1', 'user-id-2']
```

---

## Rollback Plan

If needed, rollback migration:
```bash
npx prisma migrate resolve --rolled-back <migration-name>
```

---

## Testing After Migration

1. **Verify Schema:**
   ```bash
   npx prisma validate
   npx prisma format
   ```

2. **Test Automation:**
   - Create automation rule
   - Trigger execution
   - Verify execution history

3. **Test Comments:**
   - Create comment
   - Reply to comment
   - Resolve thread
   - Verify mentions

4. **Check Indexes:**
   ```sql
   -- PostgreSQL
   SELECT * FROM pg_indexes WHERE tablename IN ('cms_automation_rules', 'cms_automation_executions', 'cms_comments');
   ```

---

## Notes

- All models use `@default(cuid())` for IDs (consistent with existing CMS models)
- Cascade deletes ensure data integrity
- Json fields allow flexible configuration without schema changes
- Timestamps (createdAt, updatedAt) are standard across all models
- Relations are properly defined for referential integrity

---

**Status:** Schema definition complete, awaiting migration
**Created:** November 3, 2025
**Tasks:** #21 (Automation), #22 (Comments)

# Database Schema Quick Reference

## Core Models Overview

### 👤 User Management
```typescript
User {
  id: String @id @default(uuid())
  email: String @unique
  name: String?
  role: Role (ADMIN|MANAGER|DEVELOPER|CLIENT|USER)
  // Relations: projects, teams, tasks, timeEntries, messages, etc.
}

ResourceProfile {
  userId: String @unique
  skills: String // JSON array
  hourlyRate: Decimal?
  capacity: Int // Hours per week
  availability: String // JSON schedule
}
```

### 🏢 Client & Project Management
```typescript
Client {
  id: String @id
  name: String
  email: String @unique
  company: String?
  website: String?
  timezone: String?
  // Relations: projects, invoices, contactLogs
}

Project {
  id: String @id
  name: String
  status: ProjectStatus
  priority: Priority
  budget: Decimal?
  budgetUsed: Decimal?
  hourlyRate: Decimal?
  estimatedHours: Int?
  actualHours: Int?
  completionRate: Int // Percentage
  // Relations: client, users, teams, tasks, invoices
}
```

### 📋 Task & Time Management
```typescript
Task {
  id: String @id
  projectId: String
  assigneeId: String?
  title: String
  status: TaskStatus (TODO|IN_PROGRESS|REVIEW|TESTING|DONE)
  priority: Priority
  dueDate: DateTime?
  estimatedHours: Int?
  actualHours: Int?
  dependencies: String? // JSON array of task IDs
}

TimeEntry {
  id: String @id
  userId: String
  taskId: String?
  projectId: String?
  hours: Decimal
  billable: Boolean
  date: DateTime
  rate: Decimal?
  status: TimeEntryStatus (DRAFT|SUBMITTED|APPROVED)
}
```

### 💰 Financial Management
```typescript
Invoice {
  id: String @id
  clientId: String
  projectId: String?
  invoiceNumber: String @unique
  amount: Decimal
  tax: Decimal?
  total: Decimal
  status: InvoiceStatus (DRAFT|SENT|PAID|OVERDUE)
  dueDate: DateTime
  lineItems: String // JSON array
}

Lead {
  id: String @id
  companyName: String
  contactName: String
  email: String
  source: LeadSource (WEBSITE|REFERRAL|SOCIAL_MEDIA|etc.)
  status: LeadStatus (NEW|CONTACTED|QUALIFIED|WON|LOST)
  value: Decimal?
}

Deal {
  leadId: String
  title: String
  value: Decimal
  stage: DealStage (PROSPECT|QUALIFIED|PROPOSAL|CLOSED_WON)
  probability: Int // Percentage
  closeDate: DateTime?
}
```

### 💬 Communication & Documentation
```typescript
Message {
  id: String @id
  senderId: String
  receiverId: String?
  projectId: String?
  content: String
  messageType: MessageType (DIRECT|BROADCAST|NOTIFICATION)
  priority: Priority
  readAt: DateTime?
  parentId: String? // For threading
}

Document {
  id: String @id
  projectId: String?
  userId: String
  filename: String
  filePath: String
  fileSize: Int
  mimeType: String
  version: Int
  category: String? // CONTRACT|PROPOSAL|DELIVERABLE
}

ContactLog {
  id: String @id
  clientId: String
  userId: String
  type: ContactType (EMAIL|PHONE|MEETING|VIDEO_CALL)
  content: String
  outcome: String?
  nextAction: String?
  scheduledAt: DateTime?
}
```

### 👥 Team Management
```typescript
Team {
  id: String @id
  name: String
  description: String?
  // Relations: users, projects, teamMembers
}

TeamMember {
  id: String @id
  userId: String
  projectId: String?
  teamId: String?
  role: TeamRole (LEAD|SENIOR|MEMBER|OBSERVER)
  hourlyRate: Decimal?
  allocatedHours: Int?
  capacity: Int? // Percentage
}
```

### 📊 Activity Tracking
```typescript
ActivityLog {
  id: String @id
  userId: String
  action: String // CREATE|UPDATE|DELETE
  entityType: String // PROJECT|TASK|CLIENT|etc.
  entityId: String
  changes: String? // JSON object
  ipAddress: String?
  createdAt: DateTime
}
```

## Common Query Patterns

### Get Projects with Full Details
```typescript
const projects = await prisma.project.findMany({
  include: {
    client: true,
    users: true,
    tasks: {
      include: {
        assignee: true,
        timeEntries: true
      }
    },
    invoices: true,
    teamMembers: {
      include: {
        user: true
      }
    }
  }
})
```

### Get User Dashboard Data
```typescript
const userDashboard = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    assignedTasks: {
      where: { status: { not: 'DONE' } },
      include: { project: true }
    },
    timeEntries: {
      where: { 
        date: { gte: startOfWeek, lte: endOfWeek }
      }
    },
    projects: {
      include: { client: true }
    }
  }
})
```

### Get Client with Projects and Invoices
```typescript
const clientDetails = await prisma.client.findUnique({
  where: { id: clientId },
  include: {
    projects: {
      include: {
        tasks: true,
        teamMembers: { include: { user: true } }
      }
    },
    invoices: {
      orderBy: { createdAt: 'desc' }
    },
    contactLogs: {
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    }
  }
})
```

### Time Tracking Analytics
```typescript
const timeAnalytics = await prisma.timeEntry.groupBy({
  by: ['userId', 'projectId'],
  where: {
    date: { gte: startDate, lte: endDate },
    billable: true
  },
  _sum: { hours: true, amount: true },
  _count: { id: true }
})
```

## Useful Indexes

All models include strategic indexes for performance:

- **User**: `email`, `role`, `deletedAt`
- **Project**: `clientId`, `status`, `priority`, `startDate+endDate`
- **Task**: `projectId+status`, `assigneeId+status`, `dueDate`
- **TimeEntry**: `userId+date`, `projectId+date`, `billable`
- **Invoice**: `clientId+status`, `status+dueDate`, `invoiceNumber`
- **Message**: `senderId+createdAt`, `receiverId+readAt`, `projectId+createdAt`

## Environment Setup

```env
DATABASE_URL="postgresql://username:password@localhost:5432/zyphextech_dev"
```

## Quick Commands

```bash
# View database in browser
npx prisma studio

# Create and apply migration
npx prisma migrate dev --name "description"

# Seed database with test data
npx prisma db seed

# Generate Prisma client
npx prisma generate

# Reset database completely
npx prisma migrate reset --force
```
# Testing Dashboard with Real Data

## Overview
This guide explains how to test the Super Admin Dashboard with real data. Currently showing zeros for team metrics is **expected behavior** when there's no data in the database.

## Dashboard Metrics Explained

### Team Performance Metrics
The dashboard calculates team performance based on **real database data**:

- **Total Hours**: Sum of all `timeEntries` for the user in the last 30 days
- **Total Tasks**: Count of `assignedTasks` created in the last 30 days  
- **Completed Tasks**: Count of tasks with `status = 'DONE'`
- **Efficiency**: `(completedTasks / totalTasks) * 100`

### Why Metrics Show 0

If team member metrics show all zeros, this means:
- ✅ **Code is working correctly**
- ❌ **No time entries logged in database**
- ❌ **No tasks assigned/completed**

## How to Add Test Data

### Option 1: Use the Application UI

#### 1. Create Projects
1. Navigate to **Super Admin > Projects**
2. Click "New Project"
3. Fill in project details (name, client, dates, budget)
4. Assign team members to the project

#### 2. Create Tasks
1. Open a project
2. Add tasks with:
   - Title and description
   - Status (TODO, IN_PROGRESS, DONE)
   - Priority (LOW, MEDIUM, HIGH, URGENT)
   - Due dates
   - **Assign to team members**

#### 3. Log Time Entries
1. Navigate to **Time Tracking** (if available)
2. Or use Project Manager dashboard to log hours
3. Add time entries for the last 30 days

### Option 2: Direct Database Seeding

Create a seed script to populate test data:

```typescript
// prisma/seed.ts
import { prisma } from '@/lib/prisma';

async function main() {
  // Get or create users
  const teamMembers = await prisma.user.findMany({
    where: { role: { in: ['TEAM_MEMBER', 'PROJECT_MANAGER'] } },
    take: 5
  });

  // Get or create a project
  const project = await prisma.project.findFirst() || await prisma.project.create({
    data: {
      name: 'Test Project',
      status: 'IN_PROGRESS',
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    }
  });

  // Create tasks for last 30 days
  const tasks = [];
  for (let i = 0; i < 10; i++) {
    tasks.push({
      title: `Test Task ${i + 1}`,
      description: 'Sample task for testing',
      status: i < 6 ? 'DONE' : 'IN_PROGRESS', // 60% completion rate
      priority: 'MEDIUM',
      projectId: project.id,
      assigneeId: teamMembers[i % teamMembers.length]?.id,
      createdById: teamMembers[0]?.id,
      createdAt: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000)
    });
  }

  await prisma.task.createMany({ data: tasks });

  // Create time entries
  const timeEntries = [];
  for (let day = 0; day < 20; day++) {
    for (const member of teamMembers) {
      timeEntries.push({
        userId: member.id,
        projectId: project.id,
        duration: Math.random() * 8, // Random 0-8 hours
        description: 'Development work',
        date: new Date(Date.now() - day * 24 * 60 * 60 * 1000),
        billable: true
      });
    }
  }

  await prisma.timeEntry.createMany({ data: timeEntries });

  console.log('✅ Test data created successfully!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run the seed script:
```bash
npx tsx prisma/seed.ts
```

### Option 3: Manual Database Population

Use Prisma Studio for visual data entry:

```bash
npx prisma studio
```

This opens a web interface at `http://localhost:5555` where you can:
- View all database tables
- Add/edit/delete records
- See relationships between data

## Expected Dashboard Values After Adding Data

Once you add test data, you should see:

### Team Performance Section
```
John Doe
PM
Hours: 45.5 | Tasks: 8/10 | Efficiency: 80%
```

### System Health
- Active Projects: Number of projects with IN_PROGRESS or REVIEW status
- Overdue Tasks: Tasks past due date without DONE status
- Inactive Users: Users with no time entries in last 30 days

### Monthly Stats
- New Users: Users created in last 30 days
- New Projects: Projects created in last 30 days
- Completed Projects: Projects marked COMPLETED in last 30 days

## Verifying the Fix

1. **Before Adding Data**: Dashboard should show 0s (expected)
2. **After Adding Data**: Dashboard should display calculated metrics
3. **Refresh**: Click refresh button to reload latest data

## API Endpoint Reference

The dashboard data comes from:
- **Endpoint**: `GET /api/super-admin/dashboard`
- **Hook**: `useSuperAdminDashboard()` in `hooks/use-super-admin-dashboard.ts`
- **Auto-refresh**: Every 30 seconds

## Code Location

Dashboard calculation logic:
```
File: app/api/super-admin/dashboard/route.ts
Lines: 217-236 (teamPerformanceWithStats calculation)
```

## Troubleshooting

### Metrics still showing 0 after adding data?
1. Check browser console for API errors
2. Verify data is in database: `npx prisma studio`
3. Check that dates are within last 30 days
4. Force refresh: Click the refresh button on dashboard

### Empty state instead of metrics?
- Ensure at least one user has role: ADMIN, PROJECT_MANAGER, or TEAM_MEMBER
- Check that projects and tasks exist in database

## Summary

The dashboard is **working as designed**. Zero values indicate:
- ✅ No bugs in calculation logic
- ✅ Proper database queries
- ❌ Missing test/production data

To see realistic metrics, populate the database with time entries, tasks, and project data using any of the methods above.

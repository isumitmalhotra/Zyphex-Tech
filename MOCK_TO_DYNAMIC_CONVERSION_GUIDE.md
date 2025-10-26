# Dynamic Data Implementation Guide

## Overview

This document catalogs all pages with hardcoded test/mock data and provides patterns for converting them to dynamic database-driven pages.

## Pages with Mock Data (Priority Order)

### 🔴 **HIGH PRIORITY** - Super Admin Dashboards

#### Projects
1. **`/super-admin/projects/active`** - Active projects list
   - ✅ **COMPLETED** - Dynamic data from Project model (IN_PROGRESS status)
   - API: `/api/super-admin/projects/active` (GET) ✅
   - Page updated to fetch from database with loading states
   - Features: Project cards with progress tracking, task counts, team size, budget utilization
   - Statistics: total, planning, inProgress, review, completed, cancelled, totalBudget, totalHours
   - Relations: Includes client, manager, tasks, team members, documents count
   - Removed all mock project data - 100% database-driven

2. **`/super-admin/projects/completed`** - Completed projects
   - ✅ **COMPLETED** - Dynamic data from Project model (COMPLETED status)
   - API: `/api/super-admin/projects/completed` (GET) ✅
   - Page updated to fetch from database with loading states
   - Features: Project cards with completion metrics, final budget, actual hours
   - Statistics: total completed, on time, delayed, over budget, total value delivered
   - Relations: Includes client, manager, tasks, team members, completion date
   - Removed all mock project data - 100% database-driven

3. **`/super-admin/projects/proposals`** - Project proposals
   - ✅ **COMPLETED** - Dynamic data from Deal model
   - API: `/api/super-admin/projects/proposals` (GET) ✅
   - Page updated to fetch from database with loading states
   - Features: Proposal cards with status, value, probability, priority
   - Statistics: total, pending, approved, rejected, under review, total value, avg probability
   - Relations: Includes lead details, deal stage, activities
   - Actions: Approve, reject, request revision, convert to project, send to client, export
   - Removed all mock proposal data - 100% database-driven

#### Clients
4. **`/super-admin/clients/active`** - Active clients list
   - ✅ **COMPLETED** - Dynamic data from Client model
   - API: `/api/super-admin/clients/active` (GET) ✅
   - Page updated to fetch from database with loading states
   - Features: Client cards with projects, revenue, satisfaction metrics
   - Statistics: total clients, active projects, total revenue, avg satisfaction, new this month
   - Relations: Includes projects, invoices, contact logs, meetings
   - Removed all mock client data - 100% database-driven

5. **`/super-admin/clients/leads`** - Leads management
   - ✅ **COMPLETED** - Dynamic data from Lead model
   - API: `/api/super-admin/clients/leads` (GET) ✅
   - Page updated to fetch from database with loading states
   - Features: Lead cards with stage, source, score, estimated value, days in pipeline
   - Statistics: total, new, contacted, qualified, proposal, negotiation, conversion rate, total value
   - Relations: Includes activities, deals, assigned user
   - Actions: Qualify, disqualify, convert to client, schedule follow-up
   - Removed all mock lead data - 100% database-driven

6. **`/super-admin/clients/portal`** - Client portal accounts
   - ✅ **COMPLETED** - Dynamic data from Client model with portal access
   - API: `/api/super-admin/clients/portal` (GET) ✅
   - Page updated to fetch from database with loading states
   - Features: Portal access management, credentials, login tracking, analytics
   - Statistics: total clients, active portals, inactive portals, custom branding count
   - Relations: Includes projects, documents, messages, contact logs
   - Actions: Toggle portal, generate credentials, view analytics
   - Removed all mock portal data - 100% database-driven

#### Analytics
7. **`/super-admin/analytics/traffic`** - Traffic analytics (400+ lines)
   - ✅ **COMPLETED** - Using Google Analytics 4 API with mock fallback
   - Real data from GA4 when configured, otherwise uses intelligent mock data
   - Action: Configure GA4 credentials for real analytics

8. **`/super-admin/analytics/conversions`** - Conversion analytics (400+ lines)
   - ✅ **COMPLETED** - Fully integrated with database
   - Dynamic data from Lead and Deal models
   - Action: No further action needed

9. **`/super-admin/analytics/performance`** - Performance metrics (500+ lines)
   - ✅ **COMPLETED** - Database-driven with mock fallback
   - Tracking: Performance metrics, API metrics, error logs, health checks
   - Action: Implement performance tracking middleware to collect real metrics
   - Note: Run `prisma migrate dev` to create performance tracking tables

#### Content Management
10. **`/super-admin/content/manage`** - CMS content
    - ✅ **COMPLETED** - Dynamic data from DynamicContentItem, DynamicContentSection, and ContentType models
    - API: `/api/super-admin/content/manage` (GET, POST, PUT, DELETE)
    - Page updated to fetch from database with loading states
    - Statistics: total, published, draft, archived content items

11. **`/super-admin/content/pages`** - Page management
    - ✅ **COMPLETED** - Dynamic data from Page model
    - API: `/api/super-admin/content/pages` (GET, POST, PUT, DELETE)
    - Page updated to fetch from database with loading states
    - Statistics: total, published, draft, archived pages

12. **`/super-admin/content/media`** - Media library
    - ✅ **COMPLETED** - Fully integrated with MediaAsset model
    - API: `/api/super-admin/content/media` (GET, POST, PUT, DELETE) ✅
    - Page updated to fetch from database with loading states
    - Features: File upload with FormData, statistics, delete operations
    - Statistics: total files, total size, images, videos, unused files

### 🟡 **MEDIUM PRIORITY** - Project Manager Dashboards

#### Tasks & Projects
13. **`/project-manager/tasks`** - Task management
    - ✅ **COMPLETED** - Dynamic data from Task model with full relations
    - API: `/api/project-manager/tasks` (GET, POST, PUT, DELETE) ✅
    - Page updated to fetch from database with loading states
    - Features: Filters (status, priority, project, assignee), statistics, task assignments
    - Statistics: total, todo, in progress, review, done, blocked, high priority, overdue, unassigned

14. **`/project-manager/projects`** - Projects list
    - ✅ **COMPLETED** - Already using dynamic data from API
    - API: `/api/projects` (existing)
    - Page fetches from database with error handling

15. **`/project-manager/team`** - Team members
    - ✅ **COMPLETED** - Dynamic data from User model (TEAM_MEMBER, PROJECT_MANAGER roles)
    - API: `/api/project-manager/team` (GET, PUT) ✅
    - Page updated to fetch from database with loading states
    - Features: Filters (availability), team statistics, project/task counts
    - Statistics: total, available, busy, on vacation, team members, project managers, total projects, total tasks completed

16. **`/project-manager/time-tracking`** - Time entries (200+ lines)
    - ✅ **COMPLETED** - Dynamic data from TimeEntry model
    - API: `/api/project-manager/time-tracking` (GET, POST, PUT, DELETE) ✅
    - Page updated to fetch from database with loading states
    - Features: Timer, manual entry, filters (project, status, billable), approval workflow
    - Statistics: total hours, billable/non-billable hours, total revenue, status breakdown
    - CRUD: Create, update, delete time entries, submit for approval, approve/reject

17. **`/project-manager/budget`** - Budget tracking (300+ lines)
    - ✅ **COMPLETED** - Dynamic data from Expense and Project models
    - API: `/api/project-manager/budget` (GET, POST, PUT, DELETE) ✅
    - Page updated to fetch from database with loading states
    - Features: Expense tracking by category, project budget tracking, filters (project, category, date range)
    - Statistics: total/billable/reimbursed expenses, budget utilization %, remaining budget, expenses by category
    - CRUD: Create, update, delete expenses with automatic project budget updates

18. **`/project-manager/workload`** - Team workload
    - ✅ **COMPLETED** - Dynamic data calculated from Task and TimeEntry models
    - API: `/api/project-manager/workload` (GET) ✅
    - Page updated to fetch from database with loading states
    - Features: Workload distribution, capacity planning, utilization metrics
    - Statistics: team member workload (active/completed tasks, hours, capacity, utilization, availability), project distribution, team-wide stats
    - Calculations: Capacity = 40hrs/week * weeks, Utilization = (hours worked / capacity) * 100, Availability = capacity - hours worked

19. **`/project-manager/milestones`** - ✅ **COMPLETED**
    - API: `/api/project-manager/milestones` - Full CRUD with comprehensive milestone tracking
    - GET features: Filter by projectId, status (PENDING/IN_PROGRESS/COMPLETED/DELAYED/CANCELLED), isKey flag, date range (targetDate)
    - POST/PUT/DELETE: Create, update, and delete milestones with validation
    - Statistics: total, pending, inProgress, completed, delayed, cancelled, keyMilestones count, upcomingMilestones (next 30 days), overdueMilestones, completionRate %, averageDelayDays
    - Relations: Includes project details (id, name, status, client info)
    - Page features: Loading states, milestone list with project names, target dates, progress indicators, key milestone badges, status-based badge colors
    - Data model: ProjectMilestone with title, description, targetDate, actualDate, status, order, isKey, deliverables (JSON)

20. **`/project-manager/resources`** - ✅ **COMPLETED**
    - API: `/api/project-manager/resources` - Resource allocation management with utilization tracking
    - GET features: Filter by projectId, userId, isActive, date range with overlap detection
    - POST/PUT/DELETE: Allocate, update, remove resource allocations with validation (0-100% allocation, unique constraint per user/project/startDate)
    - Statistics: total, active, inactive allocations, totalAllocationPercentage, avgAllocationPercentage, totalMonthlyRate (hourlyRate × 160hrs × allocation%)
    - User Utilization: Per-user total allocation tracking, categorized as overallocated (>100%), optimal (50-100%), underutilized (<50%), includes project count
    - Project Resources: Aggregated allocation per project with resourceCount and avgAllocation
    - Page features: User-centric view (grouped by userId), loading states, availability calculation (Overallocated/Busy/Available based on totalAllocation), skills parsing from JSON, project lists, color-coded allocation bars
    - Data model: ResourceAllocation with projectId, userId, role, allocationPercentage, hourlyRate, startDate, endDate, isActive, skills (JSON)
    - Transformation: API returns allocations per project-user pair, frontend aggregates to user-centric view with total allocation and merged project/skill lists

21. **`/project-manager/analytics`** - ✅ **COMPLETED**
    - API: `/api/project-manager/analytics` - Comprehensive analytics with aggregate queries and health scoring
    - GET features: Filter by projectId, date range (defaults to last 90 days)
    - Project Statistics: total, active, completed, onHold, cancelled projects
    - Task Statistics: total, todo, inProgress, review, done, highPriority, overdue, completionRate %
    - Time Tracking: totalHours, billableHours, nonBillableHours, approvedHours, pendingHours, totalRevenue, billabilityRate %
    - Budget Analytics: totalBudget, totalBudgetUsed, totalBudgetRemaining, avgBudgetUtilization %, totalExpenses, billableExpenses, reimbursedExpenses, per-project budget breakdown
    - Milestone Tracking: total, completed, delayed, onTime, completionRate %, onTimeRate %
    - Team Performance: Per-member statistics (tasksCompleted placeholder, hoursLogged, revenueGenerated)
    - Velocity Tracking: 8-week rolling window with weekly breakdown (tasksCompleted, hoursLogged, revenue), plus averages
    - Health Scoring: 0-100 score calculated from 4 weighted factors (25% each): Budget health (≤90% util = 25pts, ≤100% = 15pts, >100% = 0pts), Task health (≥80% completion = 25pts, ≥60% = 15pts, ≥40% = 10pts, <40% = 5pts), Milestone health (≥80% on-time = 25pts, ≥60% = 15pts, <60% = 10pts), Time tracking health (≥80% approved = 25pts, ≥60% = 15pts, <60% = 10pts)
    - Health Status: excellent (≥80), good (≥60), fair (≥40), poor (<40)
    - Page features: Multi-tab interface (Performance, Resources, Time, Financial, Team, Clients, Reports), date range selector (7/30/90/180 days, all time), KPI cards (total projects, productivity score, budget utilization, health score), comprehensive charts (bar, line, pie, area charts), project performance visualization, team workload analysis, time tracking breakdown, financial summaries

22. **`/project-manager/reports`** - ✅ **COMPLETED**
    - API: `/api/reports` - Comprehensive report generation system with database-backed data
    - GET features: Filter by category, type, status, search, pagination
    - Report Types: 19 different report types across 5 categories (Projects, Financial, Team, Clients, Time)
    - Categories:
      * **Projects**: PROJECT_STATUS, PROJECT_TIMELINE, TASK_COMPLETION, RESOURCE_ALLOCATION, RISK_ASSESSMENT
      * **Financial**: REVENUE_BY_PROJECT, PROFITABILITY_ANALYSIS, BUDGET_VS_ACTUAL, INVOICE_STATUS, PAYMENT_COLLECTION
      * **Team**: TEAM_PRODUCTIVITY, INDIVIDUAL_PERFORMANCE, TIME_TRACKING, WORKLOAD_DISTRIBUTION, SKILL_UTILIZATION
      * **Clients**: CLIENT_SATISFACTION, PROJECT_DELIVERABLES, COMMUNICATION_LOGS, SERVICE_LEVEL
      * **Time**: TIME_TRACKING
    - Generate endpoint (`/api/reports/generate`): Creates reports from real database data using report-service
    - Export formats: PDF, Excel, CSV, JSON via `/api/reports/[id]/export`
    - Schedule endpoint (`/api/reports/schedule`): Automated report generation with frequency (ONCE, DAILY, WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY, YEARLY)
    - Report templates (`/api/reports/templates`): Pre-built report configurations
    - Data generation: Uses real Prisma queries for projects, tasks, time entries, invoices, users, expenses
    - Caching: Report data cached for 30 minutes for performance
    - Page features: Multi-tab interface (Dashboard, Templates, History, Schedules), report generation dialog, schedule creation, download options, search/filter functionality
    - Statistics: Total reports, active schedules, total downloads, monthly report count
    - No mock data - 100% database-driven

23. **`/project-manager/client-comms`** - ✅ **COMPLETED**
    - API: Multiple endpoints for comprehensive client communication management
    - `/api/project-manager/client-comms/clients`: GET all client users with unread message counts, last message info
    - `/api/project-manager/client-comms/messages`: GET messages between project manager and clients with filters (type, date)
    - `/api/project-manager/client-comms/messages/mark-read`: POST to mark messages as read
    - `/api/project-manager/client-comms/stats`: GET communication statistics (emails sent, messages sent, calls, meetings)
    - `/api/project-manager/client-comms/calls`: POST to log calls
    - `/api/project-manager/client-comms/meetings`: POST to schedule meetings
    - `/api/project-manager/client-comms/upload`: POST to upload message attachments
    - Page features: Real-time messaging with Socket.IO, client list with unread counts, message history, typing indicators, file attachments
    - Statistics: Email count, message count, call count, meeting count
    - Removed all fallback mock data - Now shows proper error messages on API failures instead of displaying mock data
    - Error handling: User-friendly toast notifications on API failures
    - No mock data - 100% database-driven with WebSocket support

### 🟢 **LOW PRIORITY** - Public & User Pages

#### Public Pages
24. **`/careers`** - Careers page (200+ lines)
    - ✅ **COMPLETED** - Dynamic data from JobPosting model
    - API: `/api/careers` (GET with filters: department, type, remote) ✅
    - Page updated to fetch from database with loading states
    - Features: Job filters (search, department, location, type), application form
    - Statistics: Active job postings by department, location, and type
    - **Note**: Testimonials, benefits, and company values kept as static content (rarely change)
    - **Migration Required**: Run `npx prisma migrate dev --name add_job_posting` to create JobPosting table
    - Model Fields: title, department, location, type, remote, salary, description, requirements[], responsibilities[], postedDate, closingDate, isActive

25. **`/updates` (blog)** - Blog posts
    - ✅ **COMPLETED** - Dynamic data from CMS (DynamicContentItem model)
    - API: `/api/content?type=Blog` (existing CMS content API)
    - Page updated to fetch from database with loading states
    - Features: Category filtering, featured posts, blog post grid
    - Data Transformation: Maps CMS items to blog post format (excerpt, readTime, views, image, featured)
    - Note: Uses existing content management system with ContentType filter

26. **`/services`** - Services page
    - ✅ **COMPLETED** - Fully dynamic, removed fallback mock data
    - API: `/api/services` (existing)
    - Page updated to rely entirely on API data (removed 94-line fallback array)
    - Features: Service grid with features, technologies, pricing, timeline
    - Note: Originally had fallback mock data, now 100% API-driven

#### User Dashboard
27. **`/user/documents`** - User documents
    - ✅ **COMPLETED** - Dynamic data from Document model
    - API: `/api/user/documents` (GET, POST) ✅
    - Page updated to fetch from database with loading states
    - Features: Document search, filters (project, category, mimeType), statistics
    - Statistics: total, uploaded, shared, recent count, total/avg size, by category, by mime type
    - Dynamic folder generation from document categories
    - Removed all mock folder data - 100% database-driven

28. **`/user/downloads`** - Downloadable resources
    - ✅ **COMPLETED** - Dynamic data from DownloadableResource model
    - API: `/api/user/downloads` (GET, POST, PUT, PATCH) ✅
    - Model: DownloadableResource with title, description, category, fileType, fileSize, downloads, rating, featured
    - Page updated to fetch from database with loading states and error handling
    - Features: Resource search, category filters, download tracking, featured resources
    - Statistics: total, featured, total downloads, total size, avg rating, by category/fileType, recent updates
    - Download counter incrementation via PATCH endpoint
    - Removed all mock download data - 100% database-driven
    - **Migration Required**: Run `npx prisma migrate dev --name add_downloadable_resource` to create DownloadableResource table

29. **`/user/help`** - Help/FAQ page
    - Current: Static FAQ data
    - Recommendation: Keep as static content (FAQs rarely change)
    - Alternative: Can be moved to CMS for easier updates if needed
    - No action required for now

30. **`/user/notifications`** - Notifications
    - ✅ **COMPLETED** - Already using API, removed fallback comments
    - API: `/api/user/notifications` (GET, PUT, POST, DELETE) ✅
    - Page relies entirely on API with no mock data fallback
    - Features: Mark as read, delete, filter by priority/unread
    - Statistics: unread count, today count, week count, high priority count
    - Real-time notification generation from tasks, messages, invoices, documents, projects
    - 100% database-driven with persistent read state

#### Team Member Pages
31. **`/team-member/tasks`** - Team member tasks
    - ✅ **COMPLETED** - Dynamic data from Task model (assigned to user)
    - API: `/api/team-member/tasks` (GET, PUT) ✅
    - Page updated to fetch from database with loading states
    - Features: Filters (search, status, priority), task status updates
    - Statistics: total, todo, inProgress, review, testing, done, cancelled, highPriority, overdue, completedThisWeek
    - Task Actions: Start Task (IN_PROGRESS), Mark for Review (REVIEW), Complete (DONE)
    - Hours Tracking: estimatedHours, actualHours displayed with progress bars
    - Removed all mock task data - 100% database-driven

32. **`/team-member/projects`** - Assigned projects
    - ✅ **COMPLETED** - Dynamic data from Project model (where user is team member)
    - API: `/api/team-member/projects` (GET) ✅
    - Page updated to fetch from database with loading states
    - Features: Project cards with progress tracking, task counts, team size
    - Statistics: total, active, planning, onHold, completed, myTasks count
    - Project Details: Progress %, myTasksCount, myCompletedTasksCount, totalTasksCount, totalCompletedTasksCount, teamMembersCount, documentsCount
    - Relations: Includes client, manager, timeline (startDate/endDate)
    - Removed all mock project data - 100% database-driven

33. **`/team-member/time`** - Time tracking
    - ✅ **COMPLETED** - Dynamic data from TimeEntry model with full CRUD
    - API: `/api/team-member/time` (GET, POST, PUT, DELETE) ✅
    - Page updated with comprehensive time tracking features
    - Features:
      * Real-time timer with start/pause/stop functionality
      * Manual time entry creation and editing
      * Submit entries for approval workflow
      * Project and task selection dropdowns
      * Billable/non-billable tracking
      * Entry status management (DRAFT, SUBMITTED, APPROVED, REJECTED)
    - Statistics: totalHours, billableHours, nonBillableHours, totalRevenue, status breakdown
    - CRUD Operations: Create, update, delete time entries (only DRAFT entries can be edited/deleted)
    - Timer: Live timer with HH:MM:SS display, saves elapsed time as hours on stop
    - Validation: Can only edit/delete DRAFT entries, SUBMITTED/APPROVED are read-only
    - Removed all mock time entry data - 100% database-driven

#### Misc
34. **`/not-found` (404 page)** - Popular pages list
    - Current: Static popular pages list
    - Recommendation: Keep as static content (rarely changes)
    - Alternative: Could fetch from analytics if tracking page views
    - No action required for now

## Conversion Patterns

### Pattern 1: Server Component with Prisma (Recommended)

```typescript
// app/super-admin/projects/active/page.tsx
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function ActiveProjectsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    redirect('/auth/login')
  }

  // Fetch real data from database
  const projects = await prisma.project.findMany({
    where: {
      status: 'IN_PROGRESS',
      deletedAt: null
    },
    include: {
      client: {
        select: { name: true, email: true, image: true }
      },
      manager: {
        select: { name: true, email: true, image: true }
      },
      tasks: {
        select: {
          id: true,
          status: true,
          priority: true
        }
      },
      team: {
        include: {
          user: {
            select: { name: true, image: true, email: true }
          }
        }
      },
      _count: {
        select: { tasks: true, documents: true }
      }
    },
    orderBy: { updatedAt: 'desc' }
  })

  // Calculate project statistics
  const projectStats = projects.map(project => ({
    ...project,
    progress: calculateProgress(project.tasks),
    tasksStats: {
      total: project._count.tasks,
      completed: project.tasks.filter(t => t.status === 'DONE').length,
      inProgress: project.tasks.filter(t => t.status === 'IN_PROGRESS').length,
      todo: project.tasks.filter(t => t.status === 'TODO').length
    }
  }))

  return <ActiveProjectsView projects={projectStats} />
}

function calculateProgress(tasks: any[]) {
  if (tasks.length === 0) return 0
  const completed = tasks.filter(t => t.status === 'DONE').length
  return Math.round((completed / tasks.length) * 100)
}
```

### Pattern 2: Client Component with API Route

```typescript
// app/api/super-admin/projects/active/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'IN_PROGRESS'
  const search = searchParams.get('search') || ''
  
  const projects = await prisma.project.findMany({
    where: {
      status,
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' }},
          { description: { contains: search, mode: 'insensitive' }}
        ]
      })
    },
    include: {
      client: true,
      manager: true,
      tasks: true,
      team: { include: { user: true }}
    },
    orderBy: { updatedAt: 'desc' }
  })
  
  return NextResponse.json({ projects })
}
```

```typescript
// app/super-admin/projects/active/page.tsx (Client Component)
"use client"

import { useState, useEffect } from "react"

export default function ActiveProjectsPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch('/api/super-admin/projects/active')
        const data = await res.json()
        setProjects(data.projects)
      } catch (error) {
        console.error('Failed to fetch projects:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchProjects()
  }, [])

  if (loading) return <LoadingSpinner />
  
  return <ActiveProjectsView projects={projects} />
}
```

### Pattern 3: Using SWR for Client-Side Fetching

```typescript
"use client"

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function ActiveProjectsPage() {
  const { data, error, isLoading } = useSWR(
    '/api/super-admin/projects/active',
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true
    }
  )

  if (error) return <ErrorView />
  if (isLoading) return <LoadingSpinner />
  
  return <ActiveProjectsView projects={data.projects} />
}
```

## API Routes to Create

Create these API endpoints to replace mock data:

### Super Admin APIs
- `/api/super-admin/projects/active` - Active projects
- `/api/super-admin/projects/completed` - Completed projects  
- `/api/super-admin/projects/proposals` - Project proposals
- `/api/super-admin/clients/active` - Active clients
- `/api/super-admin/clients/leads` - Lead management
- `/api/super-admin/clients/portal` - Portal accounts
- `/api/super-admin/content/pages` - Content pages (already exists?)
- `/api/super-admin/content/media` - Media library

### Project Manager APIs
- `/api/project-manager/tasks` - All tasks with filters
- `/api/project-manager/team` - Team members
- `/api/project-manager/time-tracking` - Time entries
- `/api/project-manager/budget` - Budget data
- `/api/project-manager/workload` - Team workload calculations
- `/api/project-manager/milestones` - Project milestones
- `/api/project-manager/resources` - Resource allocations
- `/api/project-manager/analytics` - Project analytics

### User APIs
- `/api/user/documents` - User documents
- `/api/user/downloads` - Available downloads
- `/api/user/tasks` - Assigned tasks

### Team Member APIs
- `/api/team-member/tasks` - Assigned tasks
- `/api/team-member/projects` - Assigned projects
- `/api/team-member/time` - Time entries

### Public APIs
- `/api/careers/jobs` - Job listings
- `/api/blog/posts` - Blog posts (if not using CMS)

## Special Cases

### Analytics Pages
Analytics pages (traffic, conversions, performance) contain metrics that should come from:
1. **External Analytics Services** (Google Analytics, Plausible, Mixpanel)
2. **Application Performance Monitoring** (New Relic, Datadog, Sentry)
3. **Custom Tracking** (Build your own with database logging)

**Recommendation**: For MVP, keep mock data OR integrate with a simple analytics service like Plausible.

### CMS Content
Some pages already fetch from the CMS system. Just remove fallback mock data.

### Static Content
Some content (like testimonials, benefits, company values) might be better suited to stay in code or be managed through CMS rather than database tables.

## Implementation Priority

### Phase 1: Core Project Management (Week 1)
- Super Admin: Active Projects, Completed Projects
- Project Manager: Tasks, Team Members
- API routes for projects and tasks

### Phase 2: Client & User Data (Week 2)
- Super Admin: Clients, Leads
- Project Manager: Time Tracking, Budget
- User: Documents, Tasks
- Team Member: Tasks, Time

### Phase 3: Analytics & Reports (Week 3)
- Project Manager: Analytics, Reports, Workload
- Super Admin: Content Management (cleanup)
- Decide on analytics solution

### Phase 4: Public Pages (Week 4)
- Careers page dynamic jobs
- Blog posts from CMS
- Polish and optimize

## Testing Checklist

After converting each page:
- [ ] Page loads without errors
- [ ] Data displays correctly
- [ ] Search/filters work
- [ ] Pagination works (if applicable)
- [ ] Loading states display
- [ ] Error states handle gracefully
- [ ] Performance is acceptable (< 3s load)
- [ ] Empty states display when no data
- [ ] Authorization checks work
- [ ] Mobile responsive

## Performance Optimization

1. **Use Prisma select/include** to only fetch needed fields
2. **Add pagination** to large datasets
3. **Cache frequently accessed data** with Redis
4. **Use database indexes** on filtered fields
5. **Consider using** `unstable_cache` for static data
6. **Lazy load** heavy data on client components

## Example: Converting Super Admin Active Projects

I'll provide a complete example in the next message showing exactly how to convert one full page from mock to dynamic data.

---

**Total Pages to Convert**: ~34 pages  
**Estimated Effort**: 3-4 weeks for full conversion  
**Immediate Impact**: Focus on project management pages first


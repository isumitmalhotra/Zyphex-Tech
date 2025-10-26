# Dynamic Data Implementation Guide

## Overview

This document catalogs all pages with hardcoded test/mock data and provides patterns for converting them to dynamic database-driven pages.

## Pages with Mock Data (Priority Order)

### 🔴 **HIGH PRIORITY** - Super Admin Dashboards

#### Projects
1. **`/super-admin/projects/active`** - Active projects list (170 lines of mock data)
   - Mock: 6 active projects with tasks, team, budgets
   - Convert to: Prisma query with Project.findMany({ where: { status: 'IN_PROGRESS' }})

2. **`/super-admin/projects/completed`** - Completed projects (310 lines)
   - Mock: 6 completed projects with metrics
   - Convert to: Project.findMany({ where: { status: 'COMPLETED' }})

3. **`/super-admin/projects/proposals`** - Project proposals (120 lines)
   - Mock: Proposals array
   - Convert to: Fetch from proposals table or create Proposal model

#### Clients
4. **`/super-admin/clients/active`** - Active clients list (200+ lines)
   - Mock: 8 clients with projects, revenue, satisfaction
   - Convert to: User.findMany({ where: { role: 'CLIENT' }}) with relations

5. **`/super-admin/clients/leads`** - Leads management (250+ lines)
   - Mock: 10 leads with stages, sources
   - Convert to: Lead model or User with lead status

6. **`/super-admin/clients/portal`** - Client portal accounts (150+ lines)
   - Mock: Portal access data
   - Convert to: User accounts with client role

#### Analytics
7. **`/super-admin/analytics/traffic`** - Traffic analytics (400+ lines)
   - Mock: Traffic metrics, sources, countries, devices
   - **Note**: These are analytics that should come from actual tracking service (Google Analytics API, Plausible, etc.)
   - Action: Keep mock data OR integrate real analytics service

8. **`/super-admin/analytics/conversions`** - Conversion analytics (400+ lines)
   - Mock: Conversion funnel, lead sources
   - Action: Integrate with CRM or lead tracking system

9. **`/super-admin/analytics/performance`** - Performance metrics (500+ lines)
   - Mock: System performance, API metrics
   - Action: Integrate with monitoring service (New Relic, Datadog, or build custom)

#### Content Management
10. **`/super-admin/content/manage`** - CMS content
    - Already has dynamic CMS integration ✅
    - Just remove mock fallbacks

11. **`/super-admin/content/pages`** - Page management
    - Already has dynamic page fetching ✅

12. **`/super-admin/content/media`** - Media library
    - Has mock data comment, check if fully dynamic

### 🟡 **MEDIUM PRIORITY** - Project Manager Dashboards

#### Tasks & Projects
13. **`/project-manager/tasks`** - Task management (200+ lines mock)
    - Mock: 20+ tasks with assignments
    - Convert to: Task.findMany() with filters

14. **`/project-manager/projects`** - Projects list
    - Check if already using dynamic data

15. **`/project-manager/team`** - Team members (150+ lines)
    - Mock: Team member data
    - Convert to: User.findMany({ where: { role: { in: ['TEAM_MEMBER', 'PROJECT_MANAGER'] }}})

16. **`/project-manager/time-tracking`** - Time entries (200+ lines)
    - Mock: Time entry data
    - Convert to: TimeEntry.findMany()

17. **`/project-manager/budget`** - Budget tracking (300+ lines)
    - Mock: Budget categories, expenses
    - Convert to: Project budgets and Expense.findMany()

18. **`/project-manager/workload`** - Team workload
    - Mock: Workload distribution
    - Convert to: Calculate from tasks and time entries

19. **`/project-manager/milestones`** - Project milestones
    - Mock: Milestone data
    - Convert to: Milestone.findMany()

20. **`/project-manager/resources`** - Resource management
    - Mock: Resource data
    - Convert to: ResourceAllocation queries

21. **`/project-manager/analytics`** - Project analytics
    - Mock: Analytics charts
    - Convert to: Aggregate queries on projects/tasks

22. **`/project-manager/reports`** - Report generation
    - Mock: Report templates
    - Keep templates, generate from real data

23. **`/project-manager/client-comms`** - Client communications
    - Has fallback mock data in API failure scenarios
    - Remove fallbacks after ensuring API works

### 🟢 **LOW PRIORITY** - Public & User Pages

#### Public Pages
24. **`/careers`** - Careers page (200+ lines)
    - Mock: Job listings, testimonials, benefits
    - Convert to: Fetch from CMS or Job model

25. **`/updates` (blog)** - Blog posts
    - Mock: 6 blog posts
    - Convert to: Fetch from CMS content items

26. **`/services`** - Services page
    - Has fallback, mostly uses CMS ✅

#### User Dashboard
27. **`/user/documents`** - User documents
    - Mock: Document folders
    - Convert to: Document.findMany({ where: { userId }})

28. **`/user/downloads`** - Downloadable resources
    - Mock: Download items
    - Convert to: Resource or Download model

29. **`/user/help`** - Help/FAQ page
    - Mock: FAQ items
    - Can stay static OR move to CMS

30. **`/user/notifications`** - Notifications
    - Mock fallback mentioned
    - Already has API, remove fallbacks

#### Team Member Pages
31. **`/team-member/tasks`** - Team member tasks
    - Mock: Task list
    - Convert to: Task.findMany({ where: { assigneeId }})

32. **`/team-member/projects`** - Assigned projects
    - Mock: Project list
    - Convert to: Projects where user is team member

33. **`/team-member/time`** - Time tracking
    - Mock: Time entries
    - Convert to: TimeEntry.findMany({ where: { userId }})

#### Misc
34. **`/not-found` (404 page)** - Popular pages list
    - Mock: Popular pages
    - Can stay static or fetch from analytics

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


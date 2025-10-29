# CMS Phase 4 & 5 Implementation Plan

## 🎯 Overview

This document outlines the implementation plan for **Phase 4: Polish & Integration** and **Phase 5: Testing & Deployment** to complete the comprehensive CMS system.

**Status**: Ready to Begin  
**Timeline**: 4 weeks (2 weeks per phase)  
**Current State**: All Phase 1-3 features complete, 0 compilation errors  

---

## 📊 Phase 4: Polish & Integration (2 weeks)

### 4.1 Full-Text Search & Advanced Filtering (3 days)

**Current State**:
- ✅ Basic search implemented (LIKE queries)
- ✅ Simple filtering by status, category
- ❌ No full-text search engine
- ❌ No advanced multi-field filtering
- ❌ No search performance optimization

**Implementation Tasks**:

#### 4.1.1 Database Full-Text Search Setup (Day 1)
```prisma
// Add to schema.prisma
model CmsPage {
  // ... existing fields
  @@fulltext([pageTitle, slug, metaDescription])
  @@index([pageTitle, slug, metaDescription])
}

model CmsMediaAsset {
  // ... existing fields
  @@fulltext([filename, originalName, altText, caption])
}

model CmsTemplate {
  // ... existing fields
  @@fulltext([name, description])
}
```

**Files to Create**:
- `lib/cms/search-engine.ts` - Full-text search utilities
- `app/api/cms/search/route.ts` - Global search API
- `components/cms/advanced-search.tsx` - Advanced search UI

**API Endpoints**:
- `GET /api/cms/search` - Global search across all entities
- `GET /api/cms/search/suggestions` - Search autocomplete

#### 4.1.2 Advanced Filtering System (Day 2)
**Files to Create**:
- `lib/cms/filter-builder.ts` - Dynamic filter query builder
- `components/cms/advanced-filters.tsx` - Filter UI component
- `hooks/use-cms-filters.ts` - Filter state management

**Features**:
- Multi-field filtering
- Date range filters
- Tag-based filtering
- Author filtering
- Status filtering (published, draft, scheduled)
- Custom field filtering

#### 4.1.3 Search Performance Optimization (Day 3)
**Files to Update**:
- Add search indexes to database
- Implement query result caching
- Add search result pagination
- Add search analytics tracking

---

### 4.2 Bulk Operations (2 days)

**Current State**:
- ✅ Individual CRUD operations
- ❌ No bulk operations
- ❌ No batch processing

**Implementation Tasks**:

#### 4.2.1 Bulk API Endpoints (Day 1)
**Files to Create**:
- `app/api/cms/pages/bulk/route.ts` - Bulk page operations
- `app/api/cms/media/bulk/route.ts` - Bulk media operations
- `app/api/cms/sections/bulk/route.ts` - Bulk section operations
- `lib/cms/bulk-processor.ts` - Bulk operation processor

**API Endpoints**:
```typescript
POST /api/cms/pages/bulk
{
  action: 'publish' | 'unpublish' | 'delete' | 'duplicate' | 'update',
  ids: string[],
  data?: Record<string, any> // For update operations
}

POST /api/cms/media/bulk
{
  action: 'delete' | 'move' | 'tag' | 'update',
  ids: string[],
  data?: { folderId?: string, tags?: string[] }
}

POST /api/cms/sections/bulk
{
  action: 'delete' | 'duplicate' | 'reorder' | 'update',
  ids: string[],
  data?: Record<string, any>
}
```

#### 4.2.2 Bulk Operation UI Components (Day 2)
**Files to Create**:
- `components/cms/bulk-actions-toolbar.tsx` - Bulk action toolbar
- `components/cms/bulk-progress-dialog.tsx` - Progress indicator
- `hooks/use-bulk-selection.ts` - Bulk selection state

**Features**:
- Multi-select checkbox system
- Bulk action dropdown menu
- Progress tracking for long operations
- Success/error reporting
- Undo functionality for bulk deletes

---

### 4.3 Activity Log & Audit Trail (2 days)

**Current State**:
- ✅ CmsActivityLog model exists
- ✅ Basic activity logging in some APIs
- ❌ Inconsistent logging across all endpoints
- ❌ No audit trail UI
- ❌ No activity filtering/search

**Implementation Tasks**:

#### 4.3.1 Complete Activity Logging (Day 1)
**Files to Update**:
- All CMS API routes (`app/api/cms/**/*.ts`)
- Add consistent activity logging middleware

**Files to Create**:
- `middleware/cms/activity-logger.ts` - Activity logging middleware
- `lib/cms/activity-tracker.ts` - Activity tracking utilities
- `types/cms-activity.ts` - Activity log types

**Logged Actions**:
```typescript
// Pages
- page_create, page_update, page_delete, page_publish, page_unpublish
- page_duplicate, page_restore_version, page_save_as_template

// Sections
- section_create, section_update, section_delete, section_reorder
- section_duplicate, section_visibility_change

// Templates
- template_create, template_update, template_delete, template_apply

// Media
- media_upload, media_update, media_delete, media_move

// Workflows
- workflow_create, workflow_update, workflow_delete
- workflow_start, workflow_complete, workflow_cancel

// Schedules
- schedule_create, schedule_update, schedule_delete, schedule_execute
```

#### 4.3.2 Activity Log UI (Day 2)
**Files to Create**:
- `app/admin/cms/activity/page.tsx` - Activity log page
- `components/cms/activity-log-table.tsx` - Activity table
- `components/cms/activity-filters.tsx` - Activity filters
- `components/cms/activity-details-dialog.tsx` - Activity details

**Features**:
- Activity timeline view
- Filter by user, action, entity type, date range
- Export activity logs (CSV/JSON)
- Detailed change tracking (before/after)
- Search activity logs

---

### 4.4 Performance Optimization - Redis Caching (3 days)

**Current State**:
- ✅ IORedis installed
- ✅ Basic cache scripts exist
- ❌ No Redis integration in CMS APIs
- ❌ No cache invalidation strategy
- ❌ No cache warming

**Implementation Tasks**:

#### 4.4.1 Redis Cache Setup (Day 1)
**Files to Create**:
- `lib/cache/redis-client.ts` - Redis connection manager
- `lib/cache/cache-manager.ts` - Cache abstraction layer
- `lib/cache/cache-keys.ts` - Cache key generator
- `lib/cache/cache-strategies.ts` - Caching strategies

**Configuration**:
```typescript
// lib/cache/redis-client.ts
import Redis from 'ioredis';

export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
});

// Cache TTL configurations
export const CACHE_TTL = {
  PAGES_LIST: 60 * 5,        // 5 minutes
  PAGE_DETAIL: 60 * 10,      // 10 minutes
  TEMPLATES_LIST: 60 * 30,   // 30 minutes
  TEMPLATE_DETAIL: 60 * 60,  // 1 hour
  MEDIA_LIST: 60 * 5,        // 5 minutes
  SECTIONS: 60 * 15,         // 15 minutes
  ANALYTICS: 60 * 10,        // 10 minutes
  PERMISSIONS: 60 * 30,      // 30 minutes
};
```

#### 4.4.2 Cache Integration (Day 2)
**Files to Update**:
- `app/api/cms/pages/route.ts` - Add page list caching
- `app/api/cms/pages/[id]/route.ts` - Add page detail caching
- `app/api/cms/templates/route.ts` - Add template caching
- `app/api/cms/media/route.ts` - Add media caching
- `app/api/cms/analytics/route.ts` - Add analytics caching

**Caching Pattern**:
```typescript
// Example: app/api/cms/pages/route.ts
import { cacheManager } from '@/lib/cache/cache-manager';

export async function GET(request: NextRequest) {
  const cacheKey = `cms:pages:${queryString}`;
  
  // Try cache first
  const cached = await cacheManager.get(cacheKey);
  if (cached) {
    return NextResponse.json({
      ...cached,
      cached: true,
      cacheAge: Date.now() - cached.timestamp
    });
  }
  
  // Fetch from database
  const pages = await prisma.cmsPage.findMany({ ... });
  
  // Cache result
  await cacheManager.set(cacheKey, { pages, timestamp: Date.now() }, CACHE_TTL.PAGES_LIST);
  
  return NextResponse.json({ pages, cached: false });
}
```

#### 4.4.3 Cache Invalidation Strategy (Day 3)
**Files to Create**:
- `lib/cache/cache-invalidator.ts` - Cache invalidation utilities
- `middleware/cms/cache-invalidator.ts` - Auto-invalidation middleware

**Invalidation Rules**:
```typescript
// lib/cache/cache-invalidator.ts
export async function invalidatePage(pageId: string) {
  await Promise.all([
    redis.del(`cms:page:${pageId}`),
    redis.del(`cms:pages:*`), // Invalidate all lists
    redis.del(`cms:analytics:page:${pageId}:*`),
  ]);
}

export async function invalidatePageList() {
  const keys = await redis.keys('cms:pages:*');
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

export async function invalidateTemplate(templateId: string) {
  await Promise.all([
    redis.del(`cms:template:${templateId}`),
    redis.del(`cms:templates:*`),
  ]);
}
```

**Files to Update**:
- Add cache invalidation to all POST/PATCH/DELETE operations
- Implement cache warming on server startup

---

### 4.5 Responsive Design for Mobile/Tablets (2 days)

**Current State**:
- ✅ Desktop-optimized UI
- ⚠️ Partial mobile responsiveness
- ❌ Mobile-specific components needed
- ❌ Touch gesture support

**Implementation Tasks**:

#### 4.5.1 Mobile UI Components (Day 1)
**Files to Create**:
- `components/cms/mobile-page-list.tsx` - Mobile page cards
- `components/cms/mobile-media-grid.tsx` - Mobile media gallery
- `components/cms/mobile-section-editor.tsx` - Touch-friendly section editor
- `components/cms/mobile-navigation.tsx` - Mobile menu

**Files to Update**:
- Update all data tables to be responsive
- Add mobile-friendly forms
- Optimize dialogs for mobile screens
- Add swipe gestures for navigation

#### 4.5.2 Responsive Layout Optimization (Day 2)
**Files to Update**:
- `app/admin/cms/*/page.tsx` - All CMS pages
- `components/admin-sidebar.tsx` - Collapsible mobile sidebar
- `components/cms/*.tsx` - All CMS components

**Breakpoints**:
```typescript
// tailwind.config.js adjustments
{
  screens: {
    'xs': '320px',   // Mobile
    'sm': '640px',   // Large mobile
    'md': '768px',   // Tablet
    'lg': '1024px',  // Desktop
    'xl': '1280px',  // Large desktop
    '2xl': '1536px'  // Extra large
  }
}
```

**Features**:
- Touch-optimized drag & drop
- Mobile-friendly file uploads
- Responsive data tables
- Bottom sheet modals for mobile
- Mobile-optimized form inputs

---

### 4.6 Complete Documentation (2 days)

**Implementation Tasks**:

#### 4.6.1 API Documentation (Day 1)
**Files to Create**:
- `docs/cms/API_DOCUMENTATION.md` - Complete API reference
- `docs/cms/AUTHENTICATION.md` - Auth & permissions guide
- `docs/cms/SEARCH_AND_FILTERING.md` - Search guide
- `docs/cms/BULK_OPERATIONS.md` - Bulk operations guide
- `docs/cms/CACHING.md` - Caching strategy documentation

#### 4.6.2 User & Developer Guides (Day 2)
**Files to Create**:
- `docs/cms/USER_GUIDE.md` - End-user documentation
- `docs/cms/DEVELOPER_GUIDE.md` - Developer setup guide
- `docs/cms/COMPONENT_LIBRARY.md` - Component documentation
- `docs/cms/TROUBLESHOOTING.md` - Common issues & solutions
- `docs/cms/DEPLOYMENT.md` - Deployment guide

**Additional Documentation**:
- Update README.md with CMS features
- Add inline JSDoc comments to all functions
- Create video tutorials (optional)

---

## 🧪 Phase 5: Testing & Deployment (2 weeks)

### 5.1 Unit Testing - 80%+ Coverage (3 days)

**Current State**:
- ✅ Jest configured
- ✅ Some existing tests
- ❌ Low CMS test coverage
- ❌ No component tests for CMS

**Implementation Tasks**:

#### 5.1.1 API Route Unit Tests (Day 1)
**Files to Create**:
- `__tests__/api/cms/pages.test.ts` - Page API tests
- `__tests__/api/cms/sections.test.ts` - Section API tests
- `__tests__/api/cms/templates.test.ts` - Template API tests
- `__tests__/api/cms/media.test.ts` - Media API tests
- `__tests__/api/cms/versions.test.ts` - Version API tests
- `__tests__/api/cms/workflows.test.ts` - Workflow API tests
- `__tests__/api/cms/schedules.test.ts` - Schedule API tests
- `__tests__/api/cms/analytics.test.ts` - Analytics API tests

**Test Coverage**:
```typescript
// Example: __tests__/api/cms/pages.test.ts
describe('CMS Pages API', () => {
  describe('GET /api/cms/pages', () => {
    it('should return paginated pages', async () => { ... });
    it('should filter by status', async () => { ... });
    it('should search pages', async () => { ... });
    it('should return cached results', async () => { ... });
    it('should require authentication', async () => { ... });
  });

  describe('POST /api/cms/pages', () => {
    it('should create a new page', async () => { ... });
    it('should validate required fields', async () => { ... });
    it('should check permissions', async () => { ... });
    it('should log activity', async () => { ... });
  });

  describe('PATCH /api/cms/pages/[id]', () => {
    it('should update a page', async () => { ... });
    it('should create a version', async () => { ... });
    it('should invalidate cache', async () => { ... });
  });

  describe('DELETE /api/cms/pages/[id]', () => {
    it('should delete a page', async () => { ... });
    it('should delete related sections', async () => { ... });
  });
});
```

#### 5.1.2 Component Unit Tests (Day 2)
**Files to Create**:
- `__tests__/components/cms/page-form.test.tsx`
- `__tests__/components/cms/section-editor.test.tsx`
- `__tests__/components/cms/template-form.test.tsx`
- `__tests__/components/cms/media-library.test.tsx`
- `__tests__/components/cms/version-history.test.tsx`
- `__tests__/components/cms/workflow-builder.test.tsx`
- `__tests__/components/cms/schedule-form.test.tsx`
- `__tests__/components/cms/analytics-dashboard.test.tsx`

#### 5.1.3 Utility & Hook Tests (Day 3)
**Files to Create**:
- `__tests__/lib/cms/search-engine.test.ts`
- `__tests__/lib/cms/filter-builder.test.ts`
- `__tests__/lib/cms/bulk-processor.test.ts`
- `__tests__/lib/cache/cache-manager.test.ts`
- `__tests__/hooks/use-cms-permissions.test.ts`
- `__tests__/hooks/use-cms-filters.test.ts`
- `__tests__/hooks/use-bulk-selection.test.ts`

**Target Coverage**: 80%+ across all CMS modules

---

### 5.2 Integration Testing (2 days)

**Implementation Tasks**:

#### 5.2.1 CMS Workflow Integration Tests (Day 1)
**Files to Create**:
- `__tests__/integration/cms/page-lifecycle.test.ts`
- `__tests__/integration/cms/template-workflow.test.ts`
- `__tests__/integration/cms/media-pipeline.test.ts`
- `__tests__/integration/cms/version-restore.test.ts`
- `__tests__/integration/cms/workflow-execution.test.ts`
- `__tests__/integration/cms/schedule-processing.test.ts`

**Test Scenarios**:
```typescript
// Example: Page lifecycle integration test
describe('Page Lifecycle Integration', () => {
  it('should complete full page creation workflow', async () => {
    // 1. Create page
    const page = await createPage({ ... });
    
    // 2. Add sections
    await addSection(page.id, { ... });
    
    // 3. Save as template
    const template = await saveAsTemplate(page.id);
    
    // 4. Publish page
    await publishPage(page.id);
    
    // 5. Create schedule
    await scheduleUnpublish(page.id, futureDate);
    
    // 6. Verify all created correctly
    expect(page).toBeDefined();
    expect(template).toBeDefined();
  });
});
```

#### 5.2.2 Permission & Authentication Integration (Day 2)
**Files to Create**:
- `__tests__/integration/cms/permissions.test.ts`
- `__tests__/integration/cms/role-based-access.test.ts`

---

### 5.3 E2E Testing with Playwright (3 days)

**Current State**:
- ✅ Playwright installed
- ✅ Basic E2E tests exist
- ❌ No CMS E2E tests

**Implementation Tasks**:

#### 5.3.1 CMS E2E Test Suite (Day 1-2)
**Files to Create**:
- `e2e/cms/page-management.spec.ts` - Page CRUD operations
- `e2e/cms/section-builder.spec.ts` - Section editor
- `e2e/cms/template-system.spec.ts` - Template operations
- `e2e/cms/media-library.spec.ts` - Media upload & management
- `e2e/cms/version-control.spec.ts` - Version management
- `e2e/cms/workflow-management.spec.ts` - Workflow operations
- `e2e/cms/schedule-management.spec.ts` - Schedule operations
- `e2e/cms/analytics-dashboard.spec.ts` - Analytics viewing

**E2E Test Examples**:
```typescript
// e2e/cms/page-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('CMS Page Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/cms/pages');
  });

  test('should create a new page', async ({ page }) => {
    await page.click('button:has-text("New Page")');
    await page.fill('input[name="pageTitle"]', 'Test Page');
    await page.fill('input[name="slug"]', 'test-page');
    await page.click('button:has-text("Create Page")');
    
    await expect(page.locator('text=Page created successfully')).toBeVisible();
  });

  test('should edit an existing page', async ({ page }) => {
    await page.click('tr:has-text("Test Page") button[aria-label="Edit"]');
    await page.fill('input[name="pageTitle"]', 'Updated Test Page');
    await page.click('button:has-text("Save Changes")');
    
    await expect(page.locator('text=Page updated successfully')).toBeVisible();
  });

  test('should publish a page', async ({ page }) => {
    await page.click('tr:has-text("Test Page") button[aria-label="More actions"]');
    await page.click('button:has-text("Publish")');
    await page.click('button:has-text("Confirm")');
    
    await expect(page.locator('text=Page published successfully')).toBeVisible();
  });

  test('should delete a page', async ({ page }) => {
    await page.click('tr:has-text("Test Page") button[aria-label="More actions"]');
    await page.click('button:has-text("Delete")');
    await page.fill('input[name="confirmation"]', 'DELETE');
    await page.click('button:has-text("Confirm Delete")');
    
    await expect(page.locator('text=Page deleted successfully')).toBeVisible();
  });
});
```

#### 5.3.2 Visual Regression Testing (Day 3)
**Files to Create**:
- `e2e/cms/visual/page-list.spec.ts` - Page list screenshots
- `e2e/cms/visual/page-editor.spec.ts` - Page editor screenshots
- `e2e/cms/visual/section-builder.spec.ts` - Section builder screenshots
- `e2e/cms/visual/media-library.spec.ts` - Media library screenshots

**Configuration**:
```typescript
// playwright.config.ts - Add visual testing
export default defineConfig({
  use: {
    screenshot: 'only-on-failure',
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 100,
    },
  },
});
```

---

### 5.4 User Acceptance Testing (1 day)

**Implementation Tasks**:

#### 5.4.1 UAT Test Plan
**Files to Create**:
- `docs/testing/UAT_TEST_PLAN.md` - UAT test scenarios
- `docs/testing/UAT_CHECKLIST.md` - UAT checklist
- `docs/testing/UAT_FEEDBACK_FORM.md` - Feedback template

**UAT Scenarios**:
1. Content Editor Role
   - Create and edit pages
   - Manage sections
   - Upload media
   - Submit for review

2. Content Manager Role
   - Review and approve content
   - Publish pages
   - Manage workflows
   - View analytics

3. Administrator Role
   - Manage templates
   - Configure permissions
   - Manage users
   - View audit logs

#### 5.4.2 UAT Execution
- Conduct UAT sessions with stakeholders
- Document feedback and issues
- Create bug reports for critical issues
- Prioritize and fix UAT findings

---

### 5.5 Performance & Load Testing (2 days)

**Implementation Tasks**:

#### 5.5.1 Performance Benchmarking (Day 1)
**Files to Create**:
- `scripts/performance/cms-benchmark.ts` - CMS performance tests
- `scripts/performance/cache-performance.ts` - Cache performance tests
- `scripts/performance/database-queries.ts` - Query performance tests

**Performance Metrics**:
```typescript
// scripts/performance/cms-benchmark.ts
import { performance } from 'perf_hooks';

async function benchmarkCMSOperations() {
  const results = {
    pageList: await measureOperation('Page List', () => fetchPages()),
    pageDetail: await measureOperation('Page Detail', () => fetchPage()),
    pageCreate: await measureOperation('Page Create', () => createPage()),
    pageUpdate: await measureOperation('Page Update', () => updatePage()),
    sectionCreate: await measureOperation('Section Create', () => createSection()),
    mediaUpload: await measureOperation('Media Upload', () => uploadFile()),
    templateApply: await measureOperation('Apply Template', () => applyTemplate()),
  };

  console.table(results);
  
  // Assert performance thresholds
  expect(results.pageList).toBeLessThan(500); // < 500ms
  expect(results.pageDetail).toBeLessThan(200); // < 200ms
  expect(results.pageCreate).toBeLessThan(1000); // < 1s
}
```

**Performance Targets**:
- Page list load: < 500ms
- Page detail load: < 200ms
- Page creation: < 1s
- Section operations: < 300ms
- Media upload: < 2s (for 5MB file)
- Template application: < 500ms
- Cache hit rate: > 80%

#### 5.5.2 Load Testing (Day 2)
**Files to Create**:
- `scripts/load-testing/cms-load-test.ts` - Concurrent user simulation
- `scripts/load-testing/api-stress-test.ts` - API stress testing

**Load Test Scenarios**:
```typescript
// Simulate 100 concurrent users
async function loadTestCMS() {
  const users = 100;
  const duration = 60 * 1000; // 1 minute
  
  const scenarios = [
    { name: 'Browse Pages', weight: 40, fn: browsePage },
    { name: 'Edit Page', weight: 30, fn: editPage },
    { name: 'Create Page', weight: 15, fn: createPage },
    { name: 'Upload Media', weight: 10, fn: uploadMedia },
    { name: 'Apply Template', weight: 5, fn: applyTemplate },
  ];
  
  const results = await runLoadTest(users, duration, scenarios);
  
  console.log('Load Test Results:');
  console.log(`Total Requests: ${results.totalRequests}`);
  console.log(`Successful: ${results.successful}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Avg Response Time: ${results.avgResponseTime}ms`);
  console.log(`95th Percentile: ${results.p95}ms`);
  console.log(`99th Percentile: ${results.p99}ms`);
}
```

**Load Testing Targets**:
- Support 100 concurrent users
- < 1% error rate under load
- 95th percentile response time < 1s
- 99th percentile response time < 2s

---

### 5.6 Production Deployment & Monitoring (2 days)

**Implementation Tasks**:

#### 5.6.1 Deployment Preparation (Day 1)
**Files to Create/Update**:
- `scripts/deploy/pre-deploy-checklist.ts` - Pre-deployment checks
- `scripts/deploy/post-deploy-verification.ts` - Post-deployment tests
- `scripts/deploy/rollback.ts` - Rollback script
- `.env.production.example` - Production environment template

**Pre-Deployment Checklist**:
```bash
# scripts/deploy/pre-deploy-checklist.sh
#!/bin/bash

echo "🔍 Running Pre-Deployment Checks..."

# 1. Run all tests
npm run test:ci
if [ $? -ne 0 ]; then
  echo "❌ Tests failed!"
  exit 1
fi

# 2. Type check
npm run type-check
if [ $? -ne 0 ]; then
  echo "❌ Type check failed!"
  exit 1
fi

# 3. Build project
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

# 4. Run security audit
npm run audit:security
if [ $? -ne 0 ]; then
  echo "❌ Security audit failed!"
  exit 1
fi

# 5. Database migration check
npx prisma migrate diff --to-migrations
if [ $? -ne 0 ]; then
  echo "⚠️  Pending database migrations"
fi

# 6. Backup database
npm run db:backup

echo "✅ All pre-deployment checks passed!"
```

#### 5.6.2 Monitoring & Alerting Setup (Day 2)
**Files to Create**:
- `lib/monitoring/cms-metrics.ts` - CMS-specific metrics
- `lib/monitoring/cms-health-check.ts` - CMS health checks
- `app/api/health/cms/route.ts` - CMS health endpoint

**Monitoring Metrics**:
```typescript
// lib/monitoring/cms-metrics.ts
export const CMS_METRICS = {
  // Performance Metrics
  pageLoadTime: 'cms.page.load.time',
  pageCreateTime: 'cms.page.create.time',
  sectionOperationTime: 'cms.section.operation.time',
  mediaUploadTime: 'cms.media.upload.time',
  
  // Cache Metrics
  cacheHitRate: 'cms.cache.hit.rate',
  cacheMissRate: 'cms.cache.miss.rate',
  cacheSize: 'cms.cache.size',
  
  // Usage Metrics
  activeSessions: 'cms.sessions.active',
  pagesCreated: 'cms.pages.created',
  pagesPublished: 'cms.pages.published',
  mediaUploaded: 'cms.media.uploaded',
  
  // Error Metrics
  apiErrors: 'cms.api.errors',
  databaseErrors: 'cms.database.errors',
  cacheErrors: 'cms.cache.errors',
};

export async function collectCMSMetrics() {
  return {
    performance: await getPerformanceMetrics(),
    cache: await getCacheMetrics(),
    usage: await getUsageMetrics(),
    errors: await getErrorMetrics(),
  };
}
```

**Health Check Endpoint**:
```typescript
// app/api/health/cms/route.ts
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    cache: await checkRedis(),
    storage: await checkFileStorage(),
    permissions: await checkPermissions(),
  };
  
  const healthy = Object.values(checks).every(c => c.status === 'ok');
  
  return NextResponse.json({
    status: healthy ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString(),
  }, {
    status: healthy ? 200 : 503,
  });
}
```

**Alerting Rules**:
- API error rate > 5% → Alert
- Cache hit rate < 70% → Warning
- Page load time > 2s → Warning
- Database query time > 1s → Alert
- Disk usage > 90% → Critical

---

## 📋 Implementation Checklist

### Phase 4: Polish & Integration
- [ ] 4.1 Full-Text Search & Advanced Filtering
  - [ ] Database full-text indexes
  - [ ] Global search API
  - [ ] Advanced search UI
  - [ ] Filter builder system
  - [ ] Search performance optimization
  
- [ ] 4.2 Bulk Operations
  - [ ] Bulk API endpoints (pages, media, sections)
  - [ ] Bulk processor utility
  - [ ] Bulk actions toolbar UI
  - [ ] Progress tracking
  - [ ] Error handling & rollback
  
- [ ] 4.3 Activity Log & Audit Trail
  - [ ] Complete activity logging middleware
  - [ ] Activity log UI
  - [ ] Activity filters & search
  - [ ] Export functionality
  - [ ] Change tracking
  
- [ ] 4.4 Performance Optimization - Redis Caching
  - [ ] Redis client setup
  - [ ] Cache manager implementation
  - [ ] Cache integration in all APIs
  - [ ] Cache invalidation strategy
  - [ ] Cache warming scripts
  
- [ ] 4.5 Responsive Design
  - [ ] Mobile UI components
  - [ ] Touch gesture support
  - [ ] Responsive layouts
  - [ ] Mobile-optimized forms
  - [ ] Bottom sheet modals
  
- [ ] 4.6 Complete Documentation
  - [ ] API documentation
  - [ ] User guide
  - [ ] Developer guide
  - [ ] Deployment guide
  - [ ] Troubleshooting guide

### Phase 5: Testing & Deployment
- [ ] 5.1 Unit Testing (80%+ Coverage)
  - [ ] API route tests
  - [ ] Component tests
  - [ ] Utility & hook tests
  - [ ] Achieve 80%+ coverage
  
- [ ] 5.2 Integration Testing
  - [ ] Page lifecycle tests
  - [ ] Template workflow tests
  - [ ] Media pipeline tests
  - [ ] Permission & auth tests
  
- [ ] 5.3 E2E Testing with Playwright
  - [ ] Page management E2E
  - [ ] Section builder E2E
  - [ ] Template system E2E
  - [ ] Media library E2E
  - [ ] Version control E2E
  - [ ] Workflow management E2E
  - [ ] Visual regression tests
  
- [ ] 5.4 User Acceptance Testing
  - [ ] UAT test plan
  - [ ] UAT execution
  - [ ] Feedback collection
  - [ ] Bug fixes from UAT
  
- [ ] 5.5 Performance & Load Testing
  - [ ] Performance benchmarking
  - [ ] Load testing (100 concurrent users)
  - [ ] Stress testing
  - [ ] Performance optimization
  
- [ ] 5.6 Production Deployment
  - [ ] Pre-deployment checklist
  - [ ] Database migration
  - [ ] Deployment script
  - [ ] Post-deployment verification
  - [ ] Monitoring & alerting setup
  - [ ] Rollback plan

---

## 🎯 Success Criteria

### Phase 4 Success Metrics
- ✅ Full-text search returns results in < 300ms
- ✅ Advanced filters support 5+ filter types
- ✅ Bulk operations handle 100+ items
- ✅ Cache hit rate > 80%
- ✅ All pages responsive on mobile/tablet
- ✅ Complete documentation published

### Phase 5 Success Metrics
- ✅ Unit test coverage > 80%
- ✅ All integration tests passing
- ✅ All E2E tests passing
- ✅ UAT approved by stakeholders
- ✅ Performance targets met
- ✅ Zero critical bugs in production
- ✅ Monitoring dashboards active

---

## 🚀 Getting Started

To begin Phase 4 implementation:

```bash
# 1. Create feature branch
git checkout -b feature/cms-phase-4

# 2. Start with full-text search (Task 4.1)
npm run dev

# 3. Run tests continuously
npm run test:watch
```

---

## 📊 Project Timeline

```
Week 1 (Phase 4)
├── Mon-Tue: Full-text search & filtering (4.1)
├── Wed-Thu: Bulk operations (4.2)
└── Fri: Activity logging (4.3 - Day 1)

Week 2 (Phase 4)
├── Mon: Activity logging UI (4.3 - Day 2)
├── Tue-Thu: Redis caching (4.4)
└── Fri: Responsive design (4.5 - Day 1)

Week 3 (Phase 5)
├── Mon: Responsive design + Docs (4.5-4.6)
├── Tue-Thu: Unit testing (5.1)
└── Fri: Integration testing (5.2 - Day 1)

Week 4 (Phase 5)
├── Mon: Integration testing (5.2 - Day 2)
├── Tue-Wed: E2E testing (5.3)
├── Thu: Performance testing (5.5)
└── Fri: Deployment (5.6)
```

---

## 📝 Notes

- All Phase 1-3 features are complete with 0 compilation errors
- Database schema is stable and ready
- Permission system is fully functional
- All existing tests are passing
- Ready to begin Phase 4 implementation

**Next Action**: Begin with Task 4.1 - Full-Text Search & Advanced Filtering

---

*Document Created*: Phase 4 & 5 Implementation Plan  
*Last Updated*: After Phase 3.5 completion  
*Status*: Ready to implement

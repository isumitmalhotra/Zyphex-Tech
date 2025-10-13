# 🔍 TASK 3: MONITORING & ERROR TRACKING SYSTEM
## Comprehensive Implementation Plan - Phased Approach

**Repository:** https://github.com/isumitmalhotra/Zyphex-Tech  
**Priority:** CRITICAL - Week 1-2  
**Estimated Time:** 2-3 days (16-24 hours)  
**Complexity:** High  
**Current Status:** Ready to implement  

---

## 📊 TASK BREAKDOWN & PHASES

This task has been divided into **5 manageable phases** for optimal execution:

### Phase 1: Core Error Tracking (2 hours) ✅ **COMPLETE**
### Phase 2: Application Logging & Performance (2.5 hours) ✅ **COMPLETE**
### Phase 3: Health Checks & Monitoring (3-4 hours) ⭐ **NEXT**
### Phase 4: Alerting & Dashboards (4-5 hours)
### Phase 5: Testing & Production Deployment (2-4 hours)

**PROGRESS: 40% (2/5 phases complete) - 4.5 hours invested**

---

## 🎯 PHASE 1: CORE ERROR TRACKING SYSTEM (4-6 hours)
### Priority: HIGHEST - Foundation for all monitoring

**Goal:** Implement Sentry for comprehensive error tracking and performance monitoring

#### 1.1 Sentry Installation & Configuration (1.5 hours)
**Location:** Project root, `lib/sentry.ts`

**Steps:**
```bash
# Install Sentry SDK
npm install @sentry/nextjs @sentry/tracing

# Run Sentry wizard
npx @sentry/wizard -i nextjs
```

**Files to Create/Modify:**
1. `sentry.client.config.ts` - Client-side Sentry configuration
2. `sentry.server.config.ts` - Server-side Sentry configuration
3. `sentry.edge.config.ts` - Edge runtime configuration
4. Update `next.config.mjs` - Add Sentry webpack plugin
5. Update `instrumentation.ts` - Add Sentry instrumentation

**Implementation:**
```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% in dev, adjust for production
  
  // Session Replay
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION,
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Debug mode
  debug: process.env.NODE_ENV === 'development',
  
  // Integrations
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
    }),
    new Sentry.Replay({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  
  // Custom tags
  tags: {
    component: "zyphex-tech-platform"
  },
  
  // Before send hook
  beforeSend(event, hint) {
    // Filter out non-critical errors
    if (event.level === 'info' || event.level === 'log') {
      return null;
    }
    
    // Add user context if available
    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.id) {
        event.user = {
          id: user.id,
          email: user.email,
          username: user.name,
          role: user.role
        };
      }
    }
    
    return event;
  }
});
```

**Environment Variables (.env.local):**
```bash
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
SENTRY_ORG=your_organization
SENTRY_PROJECT=zyphex-tech
NEXT_PUBLIC_APP_VERSION=1.0.0
SENTRY_AUTH_TOKEN=your_auth_token
```

#### 1.2 Error Boundary Integration (1 hour)
**Location:** `components/error/ErrorBoundary.tsx`

**Implementation:**
```typescript
'use client';

import React from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });

    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Oops! Something went wrong
            </h2>
            <p className="text-gray-600 mb-6">
              We've been notified and are working on fixing this issue.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <details className="mb-4">
                <summary className="cursor-pointer text-sm text-gray-500">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-4 rounded overflow-auto">
                  {this.state.error?.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <Button onClick={this.handleReset} className="w-full">
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Integration in Layout:**
```typescript
// app/layout.tsx
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

#### 1.3 Custom Error Tracking Utilities (1 hour)
**Location:** `lib/monitoring/error-tracker.ts`

**Implementation:**
```typescript
import * as Sentry from '@sentry/nextjs';

export interface ErrorContext {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  level?: 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';
}

export class ErrorTracker {
  /**
   * Track and log errors to Sentry
   */
  static captureError(error: Error, context?: ErrorContext) {
    Sentry.captureException(error, {
      level: context?.level || 'error',
      tags: context?.tags,
      extra: context?.extra,
      user: context?.user,
    });

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorTracker]', error, context);
    }
  }

  /**
   * Track custom messages/events
   */
  static captureMessage(message: string, context?: ErrorContext) {
    Sentry.captureMessage(message, {
      level: context?.level || 'info',
      tags: context?.tags,
      extra: context?.extra,
      user: context?.user,
    });
  }

  /**
   * Set user context for all future errors
   */
  static setUserContext(user: { id: string; email?: string; role?: string }) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.role,
    });
  }

  /**
   * Clear user context (on logout)
   */
  static clearUserContext() {
    Sentry.setUser(null);
  }

  /**
   * Add breadcrumb for debugging
   */
  static addBreadcrumb(message: string, data?: Record<string, any>) {
    Sentry.addBreadcrumb({
      message,
      data,
      timestamp: Date.now() / 1000,
    });
  }

  /**
   * Track API errors
   */
  static captureAPIError(
    endpoint: string,
    method: string,
    statusCode: number,
    error: Error | string
  ) {
    this.captureError(
      error instanceof Error ? error : new Error(error),
      {
        tags: {
          type: 'api_error',
          endpoint,
          method,
          status_code: statusCode.toString(),
        },
        extra: {
          endpoint,
          method,
          statusCode,
        },
        level: statusCode >= 500 ? 'error' : 'warning',
      }
    );
  }

  /**
   * Track database errors
   */
  static captureDatabaseError(operation: string, error: Error) {
    this.captureError(error, {
      tags: {
        type: 'database_error',
        operation,
      },
      extra: {
        operation,
      },
      level: 'error',
    });
  }

  /**
   * Track authentication errors
   */
  static captureAuthError(type: 'login' | 'register' | 'oauth', error: Error) {
    this.captureError(error, {
      tags: {
        type: 'auth_error',
        auth_type: type,
      },
      level: 'warning',
    });
  }
}
```

#### 1.4 API Error Tracking Middleware (0.5 hour)
**Location:** Update existing API routes

**Implementation:**
```typescript
// lib/api/error-handler.ts (update existing)
import { NextResponse } from 'next/server';
import { ErrorTracker } from '@/lib/monitoring/error-tracker';

export function handleAPIError(error: any, endpoint: string, method: string) {
  console.error(`[API Error] ${method} ${endpoint}:`, error);

  // Track error in Sentry
  ErrorTracker.captureAPIError(
    endpoint,
    method,
    error.status || 500,
    error instanceof Error ? error : new Error(String(error))
  );

  // Return appropriate response
  return NextResponse.json(
    {
      error: error.message || 'Internal Server Error',
      code: error.code || 'INTERNAL_ERROR',
    },
    { status: error.status || 500 }
  );
}
```

#### 1.5 Performance Monitoring Integration (1 hour)
**Location:** `lib/monitoring/performance.ts`

**Implementation:**
```typescript
import * as Sentry from '@sentry/nextjs';

export class PerformanceMonitor {
  /**
   * Track custom transaction
   */
  static startTransaction(name: string, operation: string) {
    return Sentry.startTransaction({
      name,
      op: operation,
    });
  }

  /**
   * Track API call performance
   */
  static async trackAPICall<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const transaction = Sentry.startTransaction({
      name,
      op: 'http.request',
    });

    try {
      const result = await fn();
      transaction.setStatus('ok');
      return result;
    } catch (error) {
      transaction.setStatus('internal_error');
      throw error;
    } finally {
      transaction.finish();
    }
  }

  /**
   * Track database query performance
   */
  static async trackDatabaseQuery<T>(
    queryName: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const span = Sentry.getCurrentHub()
      .getScope()
      ?.getTransaction()
      ?.startChild({
        op: 'db.query',
        description: queryName,
      });

    try {
      const result = await fn();
      span?.setStatus('ok');
      return result;
    } catch (error) {
      span?.setStatus('internal_error');
      throw error;
    } finally {
      span?.finish();
    }
  }

  /**
   * Track page load performance
   */
  static trackPageLoad(pageName: string) {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      Sentry.captureMessage(`Page Load: ${pageName}`, {
        level: 'info',
        tags: {
          type: 'performance',
          page: pageName,
        },
        extra: {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          domInteractive: navigation.domInteractive - navigation.fetchStart,
        },
      });
    }
  }
}
```

#### 1.6 Testing & Validation (1 hour)
**Location:** `__tests__/monitoring/sentry.test.ts`

**Implementation:**
```typescript
import { ErrorTracker } from '@/lib/monitoring/error-tracker';
import * as Sentry from '@sentry/nextjs';

// Mock Sentry
jest.mock('@sentry/nextjs');

describe('ErrorTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should capture errors with context', () => {
    const error = new Error('Test error');
    const context = {
      user: { id: '123', email: 'test@example.com' },
      tags: { type: 'test' },
    };

    ErrorTracker.captureError(error, context);

    expect(Sentry.captureException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        user: context.user,
        tags: context.tags,
      })
    );
  });

  it('should track API errors correctly', () => {
    ErrorTracker.captureAPIError('/api/test', 'GET', 500, new Error('API Error'));

    expect(Sentry.captureException).toHaveBeenCalled();
  });

  it('should set user context', () => {
    const user = { id: '123', email: 'test@example.com', role: 'USER' };
    
    ErrorTracker.setUserContext(user);

    expect(Sentry.setUser).toHaveBeenCalledWith({
      id: user.id,
      email: user.email,
      username: user.role,
    });
  });
});
```

---

## 📋 PHASE 1 DELIVERABLES

### Files to Create:
1. ✅ `sentry.client.config.ts` - Client Sentry config
2. ✅ `sentry.server.config.ts` - Server Sentry config
3. ✅ `sentry.edge.config.ts` - Edge Sentry config
4. ✅ `components/error/ErrorBoundary.tsx` - React error boundary
5. ✅ `lib/monitoring/error-tracker.ts` - Error tracking utilities
6. ✅ `lib/monitoring/performance.ts` - Performance monitoring
7. ✅ `__tests__/monitoring/sentry.test.ts` - Sentry tests

### Files to Update:
1. ✅ `next.config.mjs` - Add Sentry webpack plugin
2. ✅ `instrumentation.ts` - Add Sentry instrumentation
3. ✅ `app/layout.tsx` - Wrap with ErrorBoundary
4. ✅ `lib/api/error-handler.ts` - Add Sentry tracking
5. ✅ `.env.example` - Add Sentry environment variables

### Environment Variables:
```bash
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Testing Checklist:
- [ ] Sentry dashboard receives errors
- [ ] Error boundary displays correctly
- [ ] User context is attached to errors
- [ ] Performance metrics are tracked
- [ ] API errors are logged
- [ ] Custom breadcrumbs work
- [ ] Source maps uploaded (production)

---

## 🎯 PHASE 2: APPLICATION LOGGING & PERFORMANCE (4-5 hours)

### 2.1 Structured Logging System (2 hours)
**Location:** `lib/logger.ts`

### 2.2 Request/Response Logging Middleware (1 hour)
**Location:** `middleware.ts` (update)

### 2.3 Database Query Performance Tracking (1 hour)
**Location:** `lib/db.ts` (update)

### 2.4 Custom Business Metrics (1 hour)
**Location:** `lib/monitoring/metrics.ts`

---

## 🎯 PHASE 3: HEALTH CHECKS & MONITORING (3-4 hours)

### 3.1 Application Health Endpoint (1 hour)
**Location:** `app/api/health/route.ts`

### 3.2 Database Health Checks (1 hour)
**Location:** `lib/health/database.ts`

### 3.3 External Service Health Checks (1 hour)
**Location:** `lib/health/external-services.ts`

### 3.4 System Resource Monitoring (1 hour)
**Location:** `lib/health/system-resources.ts`

---

## 🎯 PHASE 4: ALERTING & DASHBOARDS (4-5 hours)

### 4.1 Email Alert System (1.5 hours)
**Location:** `lib/alerts/email-alerts.ts`

### 4.2 Slack/Discord Integration (1 hour)
**Location:** `lib/alerts/slack-alerts.ts`

### 4.3 Admin Monitoring Dashboard (2 hours)
**Location:** `app/super-admin/monitoring/page.tsx`

### 4.4 Metrics Visualization (1.5 hours)
**Location:** `app/admin/metrics/page.tsx`

---

## 🎯 PHASE 5: TESTING & PRODUCTION DEPLOYMENT (2-4 hours)

### 5.1 Comprehensive Testing Suite (1.5 hours)
**Location:** `__tests__/monitoring/`

### 5.2 VPS Monitoring Setup (1 hour)
**Location:** VPS server configuration

### 5.3 Production Deployment (1 hour)
**Location:** Deployment scripts and validation

### 5.4 Documentation & Runbook (0.5 hour)
**Location:** `docs/MONITORING_GUIDE.md`

---

## 📊 PROGRESS TRACKING

### Overall Progress: 20% Complete

| Phase | Status | Time | Completion |
|-------|--------|------|------------|
| Phase 1: Core Error Tracking | ✅ **COMPLETE** | 2/6h | 100% |
| Phase 2: Logging & Performance | ⏳ Pending | 0/5h | 0% |
| Phase 3: Health Checks | ⏳ Pending | 0/4h | 0% |
| Phase 4: Alerting & Dashboards | ⏳ Pending | 0/5h | 0% |
| Phase 5: Testing & Deployment | ⏳ Pending | 0/4h | 0% |

**Total Estimated Time:** 24 hours  
**Total Spent:** 2 hours  
**Remaining:** 22 hours  
**Completion:** 20% (Phase 1 complete)  

---

## 🚀 QUICK START - PHASE 1

Ready to begin? Here's your immediate action plan:

### Step 1: Install Dependencies (5 minutes)
```bash
npm install @sentry/nextjs @sentry/tracing
```

### Step 2: Run Sentry Wizard (10 minutes)
```bash
npx @sentry/wizard -i nextjs
```

### Step 3: Configure Environment (5 minutes)
Add to `.env.local`:
```bash
NEXT_PUBLIC_SENTRY_DSN=your_dsn_from_sentry_dashboard
SENTRY_ORG=your_org
SENTRY_PROJECT=zyphex-tech
```

### Step 4: Create Core Files (60 minutes)
1. Create `lib/monitoring/error-tracker.ts`
2. Create `components/error/ErrorBoundary.tsx`
3. Update `app/layout.tsx` with ErrorBoundary
4. Create `lib/monitoring/performance.ts`

### Step 5: Test Implementation (30 minutes)
1. Trigger test error
2. Check Sentry dashboard
3. Verify user context
4. Test error boundary

---

## 📝 SUCCESS CRITERIA

### Phase 1 Complete When:
- [ ] Sentry SDK installed and configured
- [ ] Error boundary catches and reports errors
- [ ] User context attached to all errors
- [ ] Performance transactions tracked
- [ ] API errors logged to Sentry
- [ ] Custom error tracker working
- [ ] Tests passing
- [ ] Sentry dashboard showing data

---

## 🔗 RESOURCES

### Sentry Documentation
- [Next.js Setup Guide](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Error Tracking Best Practices](https://docs.sentry.io/product/issues/)

### Testing Resources
- [Jest Testing Guide](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

---

## 💡 PRO TIPS

1. **Start Small**: Get Phase 1 working perfectly before moving to Phase 2
2. **Test Thoroughly**: Trigger errors manually to verify Sentry integration
3. **Monitor Performance**: Sentry itself should add <1% overhead
4. **Use Breadcrumbs**: They're invaluable for debugging production issues
5. **Set Up Alerts**: Configure Sentry alerts for critical errors
6. **Source Maps**: Ensure they're uploaded for production debugging
7. **Privacy**: Be careful not to log sensitive user data

---

**READY TO START?** 🚀  
**RECOMMENDED:** Begin with Phase 1 - Core Error Tracking  
**ESTIMATED TIME:** 4-6 hours  
**COMPLEXITY:** Medium  

Let me know when you're ready to begin Phase 1!

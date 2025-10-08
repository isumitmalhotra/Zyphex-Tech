# Monitoring & Observability Setup

**Complete guide to production monitoring**

---

## 📊 Overview

### Monitoring Stack

```
┌─────────────────────────────────────────────────┐
│           Application Monitoring                │
├─────────────────────────────────────────────────┤
│  Error Tracking  │  Sentry                      │
│  Uptime         │  UptimeRobot                  │
│  Performance    │  Vercel Analytics             │
│  Logs           │  Vercel Logs + DataDog        │
│  APM            │  Sentry Performance           │
│  RUM            │  Vercel Web Analytics         │
└─────────────────────────────────────────────────┘
```

### Metrics Coverage

- ✅ Application uptime
- ✅ API response times
- ✅ Error rates and types
- ✅ Database performance
- ✅ Cache hit rates
- ✅ User experience metrics
- ✅ Business metrics
- ✅ Infrastructure health

---

## 🔍 Sentry Setup (Error Tracking)

### 1. Create Sentry Account

```bash
# Go to https://sentry.io
# Create organization: zyphex-tech
# Create project: zyphex-platform
# Select platform: Next.js
```

### 2. Install Sentry

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### 3. Configure Sentry

**sentry.client.config.ts**:
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Environment
  environment: process.env.SENTRY_ENVIRONMENT || 'production',
  release: process.env.SENTRY_RELEASE || '1.0.0',
  
  // Performance Monitoring
  tracesSampleRate: 1.0,
  
  // Session Replay
  replaysSessionSampleRate: 0.1,  // 10% of sessions
  replaysOnErrorSampleRate: 1.0,  // 100% of sessions with errors
  
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: [
        "localhost",
        /^https:\/\/app\.zyphex-tech\.com/,
      ],
    }),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  // Error Filtering
  beforeSend(event, hint) {
    // Don't send 404 errors
    if (event.exception?.values?.[0]?.value?.includes('404')) {
      return null;
    }
    
    // Don't send known third-party errors
    if (event.exception?.values?.[0]?.value?.includes('ResizeObserver')) {
      return null;
    }
    
    return event;
  },
  
  // Set user context
  beforeSendTransaction(event) {
    // Remove sensitive data
    delete event.request?.cookies;
    return event;
  },
});
```

**sentry.server.config.ts**:
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  environment: process.env.SENTRY_ENVIRONMENT || 'production',
  release: process.env.SENTRY_RELEASE || '1.0.0',
  
  tracesSampleRate: 1.0,
  
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Prisma({ client: prisma }),
  ],
  
  // Server-side error filtering
  beforeSend(event) {
    // Don't send internal errors
    if (event.request?.url?.includes('/internal/')) {
      return null;
    }
    
    return event;
  },
});
```

**sentry.edge.config.ts**:
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT || 'production',
  tracesSampleRate: 1.0,
});
```

### 4. Add Custom Error Tracking

**lib/monitoring/sentry.ts**:
```typescript
import * as Sentry from "@sentry/nextjs";

export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  Sentry.captureMessage(message, level);
}

export function setUser(user: { id: string; email: string; name: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
  });
}

export function clearUser() {
  Sentry.setUser(null);
}

export function addBreadcrumb(message: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    data,
    timestamp: Date.now() / 1000,
  });
}

export function startTransaction(name: string, op: string) {
  return Sentry.startTransaction({
    name,
    op,
  });
}
```

**Usage in API routes**:
```typescript
import { captureException, addBreadcrumb } from '@/lib/monitoring/sentry';

export async function GET(request: NextRequest) {
  try {
    addBreadcrumb('Fetching projects', { userId: session.user.id });
    
    const projects = await prisma.project.findMany();
    
    return NextResponse.json(projects);
  } catch (error) {
    captureException(error as Error, {
      endpoint: '/api/projects',
      method: 'GET',
      userId: session?.user?.id,
    });
    
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}
```

### 5. Configure Alerts

**In Sentry Dashboard**:

1. Go to **Alerts** → **Create Alert**

2. **High Error Rate Alert**:
   - Condition: Error count > 10 in 1 minute
   - Action: Send to Slack #production-alerts
   - Send to: oncall@zyphex-tech.com

3. **New Error Alert**:
   - Condition: First seen error
   - Action: Send to Slack #production-alerts
   - Send to: oncall@zyphex-tech.com

4. **Performance Degradation**:
   - Condition: P95 response time > 1000ms
   - Action: Send to Slack #production-alerts

### 6. Environment Variables

```bash
# .env.production
NEXT_PUBLIC_SENTRY_DSN="https://xxxxx@sentry.io/xxxxx"
SENTRY_ORG="zyphex-tech"
SENTRY_PROJECT="zyphex-platform"
SENTRY_AUTH_TOKEN="your-auth-token"
SENTRY_ENVIRONMENT="production"
SENTRY_RELEASE="1.0.0"
```

---

## 🔔 UptimeRobot Setup (Uptime Monitoring)

### 1. Create Account

- Go to https://uptimerobot.com
- Sign up for Pro account (recommended)
- Verify email

### 2. Add Monitors

**Main Application Monitor**:
```
Name: Zyphex Platform - Main
Type: HTTP(s)
URL: https://app.zyphex-tech.com
Interval: 5 minutes
Timeout: 30 seconds
```

**API Health Monitor**:
```
Name: Zyphex Platform - API Health
Type: HTTP(s)  
URL: https://app.zyphex-tech.com/api/health
Interval: 5 minutes
Expected Response: 200 OK
Keyword: "healthy"
```

**Authentication Monitor**:
```
Name: Zyphex Platform - Auth
Type: HTTP(s)
URL: https://app.zyphex-tech.com/auth/signin
Interval: 10 minutes
Expected Response: 200 OK
```

**Database Monitor** (via health endpoint):
```
Name: Zyphex Platform - Database
Type: HTTP(s) - Keyword
URL: https://app.zyphex-tech.com/api/health
Keyword: "database"
Keyword Type: exists
Interval: 5 minutes
```

### 3. Configure Alerts

**Email Alerts**:
- Add: oncall@zyphex-tech.com
- On: Down, Up
- Send notification: Immediately

**SMS Alerts** (for P0 incidents):
- Add: +1234567890
- On: Down only
- Send notification: After 2 failed checks

**Slack Integration**:
```bash
# In UptimeRobot:
# 1. Go to My Settings → Add Alert Contact
# 2. Select "Web-Hook"
# 3. Add Slack webhook URL
# 4. Format: JSON

# Slack webhook format:
{
  "text": "*MONITOR_NAME* is *MONITOR_STATUS*",
  "attachments": [{
    "color": "ALERT_COLOR",
    "fields": [{
      "title": "Details",
      "value": "MONITOR_URL"
    }]
  }]
}
```

### 4. Status Page

**Create Public Status Page**:
```
Name: Zyphex Tech Status
URL: status.zyphex-tech.com
Monitors: All monitors
Show: Uptime, Response Time
Custom Domain: Enable (optional)
```

---

## 📈 Vercel Analytics Setup

### 1. Enable Web Analytics

```bash
# In Vercel Dashboard:
# 1. Go to Project → Analytics
# 2. Enable "Web Analytics"
# 3. Enable "Audience"
```

### 2. Add Analytics to Site

**layout.tsx**:
```typescript
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### 3. Track Custom Events

```typescript
import { track } from '@vercel/analytics';

// Track button clicks
track('Button Clicked', {
  button: 'Create Project',
  location: 'Dashboard'
});

// Track conversions
track('Project Created', {
  projectId: project.id,
  userId: user.id
});

// Track errors
track('Error Occurred', {
  error: error.message,
  page: window.location.pathname
});
```

---

## 📊 Custom Application Metrics

### 1. Business Metrics API

**app/api/metrics/business/route.ts**:
```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const [
      totalUsers,
      activeUsers,
      newUsersToday,
      newUsersThisMonth,
      totalProjects,
      activeProjects,
      completedProjects,
      totalRevenue,
      revenueThisMonth
    ] = await Promise.all([
      // Users
      prisma.user.count(),
      prisma.user.count({
        where: {
          lastLoginAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.user.count({
        where: { createdAt: { gte: today } }
      }),
      prisma.user.count({
        where: { createdAt: { gte: thisMonth } }
      }),
      
      // Projects
      prisma.project.count(),
      prisma.project.count({
        where: { status: 'ACTIVE' }
      }),
      prisma.project.count({
        where: { status: 'COMPLETED' }
      }),
      
      // Revenue
      prisma.invoice.aggregate({
        _sum: { total: true },
        where: { status: 'PAID' }
      }),
      prisma.invoice.aggregate({
        _sum: { total: true },
        where: {
          status: 'PAID',
          paidAt: { gte: thisMonth }
        }
      })
    ]);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      users: {
        total: totalUsers,
        active: activeUsers,
        newToday: newUsersToday,
        newThisMonth: newUsersThisMonth,
        churnRate: 0  // Calculate based on your logic
      },
      projects: {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects,
        completionRate: (completedProjects / totalProjects * 100).toFixed(2)
      },
      revenue: {
        total: totalRevenue._sum.total || 0,
        thisMonth: revenueThisMonth._sum.total || 0,
        averageProjectValue: totalRevenue._sum.total / totalProjects || 0
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
```

### 2. System Metrics API

**app/api/metrics/system/route.ts**:
```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRedisClient } from '@/lib/cache/redis';

export async function GET() {
  try {
    // Database metrics
    const dbStats = await prisma.$queryRaw<any[]>`
      SELECT 
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
        (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections,
        (SELECT avg(total_exec_time) FROM pg_stat_statements LIMIT 100) as avg_query_time
    `;
    
    // Cache metrics
    const redis = getRedisClient();
    let cacheMetrics = null;
    
    if (redis) {
      const info = await redis.info('stats');
      const keyspaceHits = parseInt(info.match(/keyspace_hits:(\d+)/)?.[1] || '0');
      const keyspaceMisses = parseInt(info.match(/keyspace_misses:(\d+)/)?.[1] || '0');
      const totalRequests = keyspaceHits + keyspaceMisses;
      
      cacheMetrics = {
        totalKeys: await redis.dbsize(),
        hits: keyspaceHits,
        misses: keyspaceMisses,
        hitRate: totalRequests > 0 ? (keyspaceHits / totalRequests * 100).toFixed(2) : 0
      };
    }
    
    // Memory metrics
    const memoryUsage = process.memoryUsage();
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      database: {
        activeConnections: dbStats[0].active_connections,
        maxConnections: dbStats[0].max_connections,
        connectionUtilization: (dbStats[0].active_connections / dbStats[0].max_connections * 100).toFixed(2),
        avgQueryTime: dbStats[0].avg_query_time
      },
      cache: cacheMetrics,
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        usage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
        rss: Math.round(memoryUsage.rss / 1024 / 1024)
      },
      uptime: process.uptime()
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch system metrics' },
      { status: 500 }
    );
  }
}
```

### 3. Performance Metrics

**lib/monitoring/performance.ts**:
```typescript
import { performance } from 'perf_hooks';

export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  
  startTimer(name: string): () => void {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(name, duration);
    };
  }
  
  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    this.metrics.get(name)!.push(value);
    
    // Keep only last 100 measurements
    const values = this.metrics.get(name)!;
    if (values.length > 100) {
      values.shift();
    }
  }
  
  getMetrics(name: string) {
    const values = this.metrics.get(name) || [];
    
    if (values.length === 0) {
      return null;
    }
    
    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    
    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / values.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }
  
  getAllMetrics() {
    const result: Record<string, any> = {};
    
    for (const [name, _values] of this.metrics.entries()) {
      result[name] = this.getMetrics(name);
    }
    
    return result;
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Usage in API routes:
export async function GET(request: NextRequest) {
  const stopTimer = performanceMonitor.startTimer('api.projects.get');
  
  try {
    const projects = await prisma.project.findMany();
    return NextResponse.json(projects);
  } finally {
    stopTimer();
  }
}
```

---

## 📱 Monitoring Dashboard

### Create Admin Dashboard

**app/admin/monitoring/page.tsx**:
```typescript
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function MonitoringDashboard() {
  const [businessMetrics, setBusinessMetrics] = useState<any>(null);
  const [systemMetrics, setSystemMetrics] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  
  useEffect(() => {
    const fetchMetrics = async () => {
      const [business, system, healthData] = await Promise.all([
        fetch('/api/metrics/business').then(r => r.json()),
        fetch('/api/metrics/system').then(r => r.json()),
        fetch('/api/health').then(r => r.json())
      ]);
      
      setBusinessMetrics(business);
      setSystemMetrics(system);
      setHealth(healthData);
    };
    
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30s
    
    return () => clearInterval(interval);
  }, []);
  
  if (!businessMetrics || !systemMetrics || !health) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">System Monitoring</h1>
      
      {/* System Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Database</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {health.checks.database.status === 'healthy' ? '✅' : '❌'}
            </div>
            <div className="text-sm text-muted-foreground">
              Latency: {health.checks.database.latency}ms
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Cache</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {health.checks.cache.status === 'healthy' ? '✅' : '❌'}
            </div>
            <div className="text-sm text-muted-foreground">
              Latency: {health.checks.cache.latency}ms
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Memory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {health.checks.memory.percentage}%
            </div>
            <div className="text-sm text-muted-foreground">
              {health.checks.memory.usage} MB used
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Business Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{businessMetrics.users.total}</div>
            <div className="text-sm text-green-600">
              +{businessMetrics.users.newToday} today
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{businessMetrics.projects.active}</div>
            <div className="text-sm text-muted-foreground">
              {businessMetrics.projects.completionRate}% completion rate
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Revenue (Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${(businessMetrics.revenue.thisMonth / 100).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Cache Hit Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {systemMetrics.cache?.hitRate || 0}%
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Database Connections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Active:</span>
                <span className="font-bold">{systemMetrics.database.activeConnections}</span>
              </div>
              <div className="flex justify-between">
                <span>Max:</span>
                <span>{systemMetrics.database.maxConnections}</span>
              </div>
              <div className="flex justify-between">
                <span>Utilization:</span>
                <span>{systemMetrics.database.connectionUtilization}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Memory Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Used:</span>
                <span className="font-bold">{systemMetrics.memory.heapUsed} MB</span>
              </div>
              <div className="flex justify-between">
                <span>Total:</span>
                <span>{systemMetrics.memory.heapTotal} MB</span>
              </div>
              <div className="flex justify-between">
                <span>Usage:</span>
                <span>{systemMetrics.memory.usage}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

## 🔔 Alert Configuration

### Slack Integration

**Create Slack Webhook**:
```bash
# 1. Go to api.slack.com/apps
# 2. Create New App
# 3. Add Incoming Webhooks
# 4. Create webhook for #production-alerts
# 5. Copy webhook URL
```

**Add to environment**:
```bash
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

**Send alerts**:
```typescript
// lib/monitoring/slack.ts
export async function sendSlackAlert(message: string, severity: 'info' | 'warning' | 'error' = 'info') {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) return;
  
  const colors = {
    info: '#36a64f',
    warning: '#ff9800',
    error: '#f44336'
  };
  
  const payload = {
    attachments: [{
      color: colors[severity],
      title: `Alert: ${severity.toUpperCase()}`,
      text: message,
      ts: Math.floor(Date.now() / 1000)
    }]
  };
  
  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}
```

---

## ✅ Monitoring Checklist

### Daily
- [ ] Check UptimeRobot status
- [ ] Review Sentry error count
- [ ] Check response times in Vercel
- [ ] Review business metrics

### Weekly
- [ ] Review error trends in Sentry
- [ ] Analyze performance metrics
- [ ] Check database performance
- [ ] Review cache hit rates
- [ ] Update dashboards

### Monthly
- [ ] Review all alert configurations
- [ ] Analyze uptime trends
- [ ] Review incident response times
- [ ] Update monitoring documentation
- [ ] Optimize alert thresholds

---

**Last Updated**: December 2024  
**Status**: Production Ready ✅

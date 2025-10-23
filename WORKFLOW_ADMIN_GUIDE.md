# Workflow Automation - Administrator Guide

**Version**: 1.0  
**Last Updated**: October 21, 2025  
**Target Audience**: System Administrators, DevOps Engineers, Platform Engineers

---

## 📋 Table of Contents

1. [System Architecture](#system-architecture)
2. [Installation & Setup](#installation--setup)
3. [Configuration](#configuration)
4. [Database Management](#database-management)
5. [Performance Tuning](#performance-tuning)
6. [Monitoring & Alerts](#monitoring--alerts)
7. [Maintenance](#maintenance)
8. [Security](#security)
9. [Troubleshooting](#troubleshooting)
10. [Scaling](#scaling)

---

## System Architecture

### Overview

The Workflow Automation System is built with:
- **Backend**: Next.js 14+ API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for workflow execution queue
- **Queue**: Bull/BullMQ for job processing
- **Frontend**: React 18+ with TypeScript

### Component Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Next.js Application                 │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Workflow UI  │  │  API Routes  │  │ Auth Middleware│
│  └──────────────┘  └──────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────┤
│                    Workflow Engine Layer                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Trigger Sys  │  │ Condition    │  │ Action       │ │
│  │              │  │ Evaluator    │  │ Executor     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────┤
│                   Data & Queue Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ PostgreSQL   │  │ Redis Cache  │  │ Bull Queue   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Key Components

**1. Workflow Engine** (`lib/workflow/engine.ts`)
- Core execution logic
- Trigger detection
- Condition evaluation
- Action execution
- Error handling and retries

**2. Trigger System** (`lib/workflow/triggers/`)
- Event listeners
- Webhook handlers
- Schedule manager (cron jobs)
- Trigger registration

**3. Action Handlers** (`lib/workflow/actions/`)
- Email service
- SMS service
- Slack integration
- Teams integration
- Webhook caller
- Task/Project/Invoice creators

**4. API Layer** (`app/api/workflows/`)
- REST endpoints
- Authentication
- Validation
- Error handling

**5. Database Layer** (`prisma/schema.prisma`)
- Workflow model
- WorkflowExecution model
- WorkflowExecutionLog model
- Relationships and indexes

---

## Installation & Setup

### Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ running
- Redis 6+ running (optional but recommended)
- SMTP server for emails
- Slack/Teams webhooks (optional)
- SMS provider credentials (optional)

### Initial Setup

#### 1. Environment Variables

Create `.env` file with required variables:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/zyphex_tech"

# Redis (optional but recommended)
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD=""

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Email Configuration (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@your-domain.com"

# SMS Configuration (Twilio example)
TWILIO_ACCOUNT_SID="your-account-sid"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"

# Slack Configuration
SLACK_BOT_TOKEN="xoxb-your-bot-token"
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."

# Microsoft Teams Configuration
TEAMS_WEBHOOK_URL="https://outlook.office.com/webhook/..."

# Workflow Settings
WORKFLOW_MAX_CONCURRENT_EXECUTIONS="10"
WORKFLOW_DEFAULT_TIMEOUT="300"
WORKFLOW_QUEUE_CONCURRENCY="5"

# Monitoring
SENTRY_DSN="your-sentry-dsn" # Optional
LOG_LEVEL="info" # debug, info, warn, error
```

#### 2. Database Setup

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Verify database
npx prisma studio
```

#### 3. Redis Setup (Optional)

```bash
# Install Redis (macOS)
brew install redis
brew services start redis

# Install Redis (Ubuntu)
sudo apt-get install redis-server
sudo systemctl start redis

# Install Redis (Windows)
# Download from https://redis.io/download
```

#### 4. Verify Installation

```bash
# Start development server
npm run dev

# Test API endpoints
curl http://localhost:3000/api/workflows
```

---

## Configuration

### Workflow Engine Configuration

Edit `lib/workflow/config.ts`:

```typescript
export const WORKFLOW_CONFIG = {
  // Execution Settings
  maxConcurrentExecutions: 10,      // Max parallel executions
  defaultTimeout: 300,               // Default timeout (seconds)
  defaultMaxRetries: 3,              // Default retry count
  defaultRetryDelay: 60,             // Default retry delay (seconds)
  
  // Queue Settings
  queueConcurrency: 5,               // Queue worker concurrency
  queueRetentionDays: 30,            // How long to keep completed jobs
  
  // Performance
  enableCaching: true,               // Cache workflow configurations
  cacheT TL: 3600,                    // Cache TTL (seconds)
  
  // Logging
  logLevel: 'info',                  // debug, info, warn, error
  logRetention Days: 90,              // How long to keep logs
  
  // Security
  maxWebhookRetries: 3,              // Max webhook retry attempts
  webhookTimeout: 30,                // Webhook timeout (seconds)
  enableRateLimiting: true,          // Enable API rate limiting
  rateLimitPerMinute: 60,            // Requests per minute per IP
}
```

### Email Configuration

SMTP settings in `.env`:

```bash
# Gmail Example
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password" # Generate in Gmail settings

# SendGrid Example
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"

# AWS SES Example
SMTP_HOST="email-smtp.us-east-1.amazonaws.com"
SMTP_PORT="587"
SMTP_USER="your-ses-smtp-username"
SMTP_PASS="your-ses-smtp-password"
```

### SMS Configuration

Twilio settings in `.env`:

```bash
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"
```

### Slack Configuration

```bash
# Bot Token (for posting messages)
SLACK_BOT_TOKEN="xoxb-your-bot-token"

# Webhook URL (alternative method)
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/T00/B00/xxx"
```

### Teams Configuration

```bash
TEAMS_WEBHOOK_URL="https://outlook.office.com/webhook/xxx"
```

---

## Database Management

### Schema Overview

**Workflow Table:**
```sql
CREATE TABLE "Workflow" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "enabled" BOOLEAN DEFAULT false,
  "version" INTEGER DEFAULT 1,
  "triggers" JSONB NOT NULL,
  "conditions" JSONB,
  "actions" JSONB NOT NULL,
  "priority" INTEGER DEFAULT 5,
  "maxRetries" INTEGER DEFAULT 3,
  "retryDelay" INTEGER DEFAULT 60,
  "timeout" INTEGER DEFAULT 300,
  "category" TEXT,
  "tags" TEXT[],
  "executionCount" INTEGER DEFAULT 0,
  "successCount" INTEGER DEFAULT 0,
  "failureCount" INTEGER DEFAULT 0,
  "lastExecutionAt" TIMESTAMP,
  "avgExecutionMs" REAL,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("createdById") REFERENCES "User"("id")
);
```

**WorkflowExecution Table:**
```sql
CREATE TABLE "WorkflowExecution" (
  "id" TEXT PRIMARY KEY,
  "workflowId" TEXT NOT NULL,
  "status" TEXT NOT NULL, -- PENDING, RUNNING, SUCCESS, FAILED
  "triggerType" TEXT NOT NULL,
  "triggerData" JSONB NOT NULL,
  "context" JSONB,
  "result" JSONB,
  "error" TEXT,
  "startedAt" TIMESTAMP NOT NULL,
  "completedAt" TIMESTAMP,
  "durationMs" REAL,
  "retryCount" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE
);
```

**WorkflowExecutionLog Table:**
```sql
CREATE TABLE "WorkflowExecutionLog" (
  "id" TEXT PRIMARY KEY,
  "executionId" TEXT NOT NULL,
  "level" TEXT NOT NULL, -- DEBUG, INFO, WARNING, ERROR
  "message" TEXT NOT NULL,
  "data" JSONB,
  "timestamp" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("executionId") REFERENCES "WorkflowExecution"("id") ON DELETE CASCADE
);
```

### Database Indexes

Critical indexes for performance:

```sql
-- Workflow indexes
CREATE INDEX "idx_workflow_enabled" ON "Workflow"("enabled");
CREATE INDEX "idx_workflow_category" ON "Workflow"("category");
CREATE INDEX "idx_workflow_created_by" ON "Workflow"("createdById");
CREATE INDEX "idx_workflow_updated_at" ON "Workflow"("updatedAt");

-- WorkflowExecution indexes
CREATE INDEX "idx_execution_workflow_id" ON "WorkflowExecution"("workflowId");
CREATE INDEX "idx_execution_status" ON "WorkflowExecution"("status");
CREATE INDEX "idx_execution_trigger_type" ON "WorkflowExecution"("triggerType");
CREATE INDEX "idx_execution_started_at" ON "WorkflowExecution"("startedAt");
CREATE INDEX "idx_execution_workflow_status" ON "WorkflowExecution"("workflowId", "status");

-- WorkflowExecutionLog indexes
CREATE INDEX "idx_log_execution_id" ON "WorkflowExecutionLog"("executionId");
CREATE INDEX "idx_log_level" ON "WorkflowExecutionLog"("level");
CREATE INDEX "idx_log_timestamp" ON "WorkflowExecutionLog"("timestamp");
```

### Backup & Recovery

**Automated Backups:**

```bash
#!/bin/bash
# backup-workflows.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/workflow"

# Backup database
pg_dump -h localhost -U postgres -d zyphex_tech \
  -t Workflow -t WorkflowExecution -t WorkflowExecutionLog \
  > "$BACKUP_DIR/workflow_backup_$DATE.sql"

# Compress backup
gzip "$BACKUP_DIR/workflow_backup_$DATE.sql"

# Remove backups older than 30 days
find "$BACKUP_DIR" -name "workflow_backup_*.sql.gz" -mtime +30 -delete
```

**Restore from Backup:**

```bash
#!/bin/bash
# restore-workflows.sh

BACKUP_FILE=$1

# Decompress
gunzip -c "$BACKUP_FILE" > /tmp/restore.sql

# Restore
psql -h localhost -U postgres -d zyphex_tech < /tmp/restore.sql

# Cleanup
rm /tmp/restore.sql
```

### Database Maintenance

**Weekly Maintenance Script:**

```sql
-- Vacuum and analyze tables
VACUUM ANALYZE "Workflow";
VACUUM ANALYZE "WorkflowExecution";
VACUUM ANALYZE "WorkflowExecutionLog";

-- Reindex tables
REINDEX TABLE "Workflow";
REINDEX TABLE "WorkflowExecution";
REINDEX TABLE "WorkflowExecutionLog";

-- Update statistics
ANALYZE "Workflow";
ANALYZE "WorkflowExecution";
ANALYZE "WorkflowExecutionLog";
```

**Cleanup Old Logs:**

```sql
-- Delete execution logs older than 90 days
DELETE FROM "WorkflowExecutionLog"
WHERE "timestamp" < NOW() - INTERVAL '90 days';

-- Delete completed executions older than 30 days
DELETE FROM "WorkflowExecution"
WHERE "status" IN ('SUCCESS', 'FAILED')
AND "completedAt" < NOW() - INTERVAL '30 days';

-- Vacuum after cleanup
VACUUM "WorkflowExecutionLog";
VACUUM "WorkflowExecution";
```

---

## Performance Tuning

### Database Optimization

**Connection Pooling:**

```typescript
// prisma/client.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Configure connection pool
// In DATABASE_URL: ?connection_limit=20&pool_timeout=20
```

**Query Optimization:**

```typescript
// Use select to fetch only needed fields
const workflow = await prisma.workflow.findUnique({
  where: { id },
  select: {
    id: true,
    name: true,
    enabled: true,
    triggers: true,
    actions: true,
    // Don't fetch all fields
  },
})

// Use pagination for large result sets
const executions = await prisma.workflowExecution.findMany({
  where: { workflowId },
  take: 50,
  skip: page * 50,
  orderBy: { startedAt: 'desc' },
})

// Use indexes for filtering
const workflows = await prisma.workflow.findMany({
  where: {
    enabled: true, // Indexed
    category: 'project_management', // Indexed
  },
})
```

### Redis Caching

**Cache Workflow Configurations:**

```typescript
import { redis } from '@/lib/redis'

async function getWorkflow(id: string) {
  // Try cache first
  const cached = await redis.get(`workflow:${id}`)
  if (cached) {
    return JSON.parse(cached)
  }
  
  // Fetch from database
  const workflow = await prisma.workflow.findUnique({ where: { id } })
  
  // Cache for 1 hour
  await redis.setex(`workflow:${id}`, 3600, JSON.stringify(workflow))
  
  return workflow
}

// Invalidate cache on update
async function updateWorkflow(id: string, data: any) {
  const workflow = await prisma.workflow.update({
    where: { id },
    data,
  })
  
  // Invalidate cache
  await redis.del(`workflow:${id}`)
  
  return workflow
}
```

### Queue Optimization

**Configure Bull Queue:**

```typescript
import Queue from 'bull'

export const workflowQueue = new Queue('workflow-execution', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 500,     // Keep last 500 failed jobs
  },
})

// Process jobs with concurrency
workflowQueue.process('execute', 5, async (job) => {
  return await executeWorkflow(job.data)
})
```

### Application Optimization

**Enable Response Compression:**

```typescript
// next.config.js
module.exports = {
  compress: true,
  // ... other config
}
```

**Optimize API Routes:**

```typescript
// app/api/workflows/route.ts
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // Set cache headers
  const response = NextResponse.json(data)
  response.headers.set('Cache-Control', 'public, max-age=60')
  return response
}
```

---

## Monitoring & Alerts

### Application Monitoring

**Log Levels:**

```typescript
// lib/logger.ts
import winston from 'winston'

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }))
}
```

**Workflow Execution Monitoring:**

```typescript
// Log execution metrics
logger.info('Workflow executed', {
  workflowId: workflow.id,
  executionId: execution.id,
  status: execution.status,
  durationMs: execution.durationMs,
  retryCount: execution.retryCount,
})

// Log errors with context
logger.error('Workflow execution failed', {
  workflowId: workflow.id,
  executionId: execution.id,
  error: error.message,
  stack: error.stack,
  triggerType: execution.triggerType,
})
```

### Health Checks

**Create Health Check Endpoint:**

```typescript
// app/api/health/workflows/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'

export async function GET() {
  const checks = {
    database: false,
    redis: false,
    workflows: {
      total: 0,
      enabled: 0,
      executing: 0,
    },
  }
  
  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`
    checks.database = true
    
    // Check Redis
    await redis.ping()
    checks.redis = true
    
    // Check workflow stats
    const [total, enabled, executing] = await Promise.all([
      prisma.workflow.count(),
      prisma.workflow.count({ where: { enabled: true } }),
      prisma.workflowExecution.count({ where: { status: 'RUNNING' } }),
    ])
    
    checks.workflows = { total, enabled, executing }
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks,
    })
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      checks,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
```

### Performance Metrics

**Track Key Metrics:**

1. **Execution Metrics**
   - Total executions per hour
   - Success rate
   - Average duration
   - Queue depth

2. **System Metrics**
   - API response times
   - Database query times
   - Redis hit rate
   - Memory usage

3. **Business Metrics**
   - Workflows created per day
   - Most used templates
   - Most executed workflows
   - Failure reasons

**Metrics Dashboard Query:**

```sql
-- Daily execution statistics
SELECT 
  DATE(started_at) as date,
  COUNT(*) as total_executions,
  SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed,
  AVG(duration_ms) as avg_duration_ms
FROM "WorkflowExecution"
WHERE started_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(started_at)
ORDER BY date DESC;

-- Top failing workflows
SELECT 
  w.id,
  w.name,
  COUNT(*) as failure_count,
  MAX(we.completed_at) as last_failure
FROM "Workflow" w
JOIN "WorkflowExecution" we ON w.id = we.workflow_id
WHERE we.status = 'FAILED'
AND we.started_at >= NOW() - INTERVAL '7 days'
GROUP BY w.id, w.name
ORDER BY failure_count DESC
LIMIT 10;
```

### Alerting

**Set Up Alerts:**

```typescript
// lib/alerts.ts
import { logger } from './logger'

export async function sendAlert(alert: {
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  data?: any
}) {
  // Log alert
  logger.error('ALERT', alert)
  
  // Send to monitoring service (Sentry, PagerDuty, etc.)
  if (process.env.SENTRY_DSN) {
    // Sentry.captureMessage(alert.title, { level: alert.severity, extra: alert.data })
  }
  
  // Send email for critical alerts
  if (alert.severity === 'critical') {
    await sendEmail({
      to: process.env.ALERT_EMAIL,
      subject: `CRITICAL ALERT: ${alert.title}`,
      body: `${alert.message}\n\nData: ${JSON.stringify(alert.data, null, 2)}`,
    })
  }
}

// Example usage
if (failureRate > 0.5) {
  await sendAlert({
    severity: 'high',
    title: 'High Workflow Failure Rate',
    message: `Workflow ${workflow.name} has 50%+ failure rate`,
    data: { workflowId: workflow.id, failureRate },
  })
}
```

---

## Maintenance

### Regular Maintenance Tasks

**Daily:**
- Check error logs for failures
- Monitor execution queue depth
- Verify external integrations (Slack, email)

**Weekly:**
- Review workflow success rates
- Clean up old execution logs
- Check database performance
- Review system metrics

**Monthly:**
- Audit workflow configurations
- Review and optimize slow workflows
- Update documentation
- Plan capacity scaling

### Maintenance Scripts

**Clean Old Logs Script:**

```typescript
// scripts/clean-old-logs.ts
import { prisma } from '@/lib/prisma'

async function cleanOldLogs() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  // Delete old execution logs
  const deletedLogs = await prisma.workflowExecutionLog.deleteMany({
    where: {
      timestamp: {
        lt: thirtyDaysAgo,
      },
    },
  })
  
  console.log(`Deleted ${deletedLogs.count} old execution logs`)
  
  // Delete old completed executions
  const deletedExecutions = await prisma.workflowExecution.deleteMany({
    where: {
      status: {
        in: ['SUCCESS', 'FAILED'],
      },
      completedAt: {
        lt: thirtyDaysAgo,
      },
    },
  })
  
  console.log(`Deleted ${deletedExecutions.count} old executions`)
}

cleanOldLogs()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
```

**Run via cron:**

```bash
# Add to crontab
0 2 * * * cd /path/to/app && npm run clean-logs
```

---

## Security

### Authentication & Authorization

**Role-Based Access:**

```typescript
// middleware/auth.ts
export function requireAdmin(handler: any) {
  return async (req: Request) => {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return new Response('Unauthorized', { status: 401 })
    }
    
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return new Response('Forbidden', { status: 403 })
    }
    
    return handler(req)
  }
}
```

### API Security

**Rate Limiting:**

```typescript
// lib/rate-limit.ts
import { redis } from './redis'

export async function rateLimit(identifier: string, limit = 60) {
  const key = `rate-limit:${identifier}`
  const current = await redis.incr(key)
  
  if (current === 1) {
    await redis.expire(key, 60) // 1 minute window
  }
  
  if (current > limit) {
    throw new Error('Rate limit exceeded')
  }
  
  return { remaining: limit - current }
}
```

**Webhook Security:**

```typescript
// Verify webhook signatures
import crypto from 'crypto'

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}
```

### Data Security

**Encrypt Sensitive Data:**

```typescript
// lib/encryption.ts
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!
const IV_LENGTH = 16

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv)
  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

export function decrypt(text: string): string {
  const parts = text.split(':')
  const iv = Buffer.from(parts.shift()!, 'hex')
  const encryptedText = Buffer.from(parts.join(':'), 'hex')
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv)
  let decrypted = decipher.update(encryptedText)
  decrypted = Buffer.concat([decrypted, decipher.final()])
  return decrypted.toString()
}
```

---

## Troubleshooting

### Common Admin Issues

#### High Memory Usage

**Symptoms:** Application using excessive RAM

**Possible Causes:**
- Memory leaks in workflow execution
- Too many cached workflows
- Large execution logs in memory

**Solutions:**
```bash
# Check Node.js memory usage
node --inspect app.js

# Increase memory limit if needed
NODE_OPTIONS="--max-old-space-size=4096" npm start

# Monitor with PM2
pm2 monit
```

#### Database Connection Issues

**Symptoms:** "Too many connections" errors

**Solutions:**
```sql
-- Check current connections
SELECT count(*) FROM pg_stat_activity;

-- Kill idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
AND state_change < NOW() - INTERVAL '1 hour';

-- Adjust connection pool in DATABASE_URL
?connection_limit=20&pool_timeout=20
```

#### Queue Backup

**Symptoms:** Workflow executions queuing up

**Solutions:**
```typescript
// Increase queue concurrency
workflowQueue.process('execute', 10, async (job) => {
  return await executeWorkflow(job.data)
})

// Check queue health
const jobCounts = await workflowQueue.getJobCounts()
console.log('Queue status:', jobCounts)

// Clean stalled jobs
await workflowQueue.clean(5000, 'failed')
await workflowQueue.clean(5000, 'completed')
```

---

## Scaling

### Horizontal Scaling

**Load Balancing:**

```nginx
# nginx.conf
upstream workflow_app {
  least_conn;
  server app1:3000;
  server app2:3000;
  server app3:3000;
}

server {
  listen 80;
  location / {
    proxy_pass http://workflow_app;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

### Vertical Scaling

**Increase Resources:**

```yaml
# docker-compose.yml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
```

### Database Scaling

**Read Replicas:**

```typescript
// Use read replicas for queries
const readReplica = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_READ_URL,
    },
  },
})

// Write to primary
await prisma.workflow.create({ data })

// Read from replica
const workflows = await readReplica.workflow.findMany()
```

---

**End of Administrator Guide**

*For user instructions, see WORKFLOW_USER_GUIDE.md*  
*For API details, see WORKFLOW_API_REFERENCE.md*

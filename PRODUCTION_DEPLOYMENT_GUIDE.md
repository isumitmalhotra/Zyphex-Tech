# Production Deployment Guide

**Complete guide for deploying Zyphex Tech Platform to production**

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [Vercel Deployment](#vercel-deployment)
5. [Monitoring Setup](#monitoring-setup)
6. [Security Configuration](#security-configuration)
7. [Post-Deployment Validation](#post-deployment-validation)
8. [Rollback Procedure](#rollback-procedure)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Pre-Deployment Checklist

### Code Readiness

- [ ] All tests passing (`npm run test`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Performance audit score ≥ 85%
- [ ] Security audit score ≥ 80%

### Documentation

- [ ] README.md updated with production info
- [ ] API documentation complete
- [ ] Environment variables documented
- [ ] Deployment procedures documented
- [ ] Rollback plan documented

### Security

- [ ] All secrets rotated for production
- [ ] OAuth redirect URIs configured
- [ ] Stripe webhook endpoint configured
- [ ] Security headers enabled
- [ ] CORS properly configured
- [ ] Rate limiting enabled

### Infrastructure

- [ ] Production database provisioned
- [ ] Redis cache provisioned
- [ ] Email service configured
- [ ] File storage configured
- [ ] CDN configured
- [ ] SSL certificates ready

---

## 🔧 Environment Setup

### 1. Create Production Environment File

```bash
# Copy the example file
cp .env.production.example .env.production

# Edit with production values (use a secure editor)
# NEVER commit .env.production to git
```

### 2. Required Environment Variables

**Critical Variables (Must Configure):**

```bash
# Database
DATABASE_URL="postgresql://user:pass@prod-db:5432/zyphex?connection_limit=20"
DIRECT_URL="postgresql://user:pass@prod-db:5432/zyphex"

# Authentication
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="https://app.zyphex-tech.com"

# Redis
REDIS_URL="redis://prod-redis:6379"

# Email
SMTP_HOST="smtp.sendgrid.net"
SMTP_PASSWORD="your-sendgrid-api-key"
SMTP_FROM="noreply@zyphex-tech.com"

# Stripe (LIVE keys)
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# OAuth
GOOGLE_CLIENT_ID="your-production-client-id"
GOOGLE_CLIENT_SECRET="your-production-secret"

# Azure Storage
AZURE_STORAGE_ACCOUNT_NAME="zyphexprod"
AZURE_STORAGE_ACCOUNT_KEY="your-storage-key"

# Sentry
NEXT_PUBLIC_SENTRY_DSN="https://...@sentry.io/..."
```

### 3. Generate Secure Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate CSRF_SECRET
openssl rand -hex 32

# Generate API keys (if needed)
openssl rand -base64 24
```

---

## 🗄️ Database Configuration

### 1. Provision Production Database

**Option A: Vercel Postgres**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Create Postgres database
vercel postgres create zyphex-production
```

**Option B: DigitalOcean Managed PostgreSQL**
1. Go to DigitalOcean Console
2. Create Managed Database → PostgreSQL 14+
3. Enable connection pooling (recommended)
4. Note connection string

**Option C: AWS RDS**
1. Create RDS PostgreSQL instance
2. Configure security groups
3. Enable automated backups
4. Note endpoint and credentials

### 2. Configure Connection Pooling

Add to your `DATABASE_URL`:
```
?connection_limit=20&pool_timeout=30&connect_timeout=15
```

**Recommended Pool Sizes:**
- Small app (< 1K users): 10-20 connections
- Medium app (1K-10K users): 20-50 connections
- Large app (> 10K users): 50-100 connections

### 3. Run Database Migrations

```bash
# Set production database URL
export DATABASE_URL="your-production-database-url"

# Generate Prisma Client
npx prisma generate

# Run migrations (creates all tables)
npx prisma migrate deploy

# Verify migration status
npx prisma migrate status
```

### 4. Seed Essential Data

```bash
# Create seed script: prisma/seed-production.ts
npx ts-node prisma/seed-production.ts

# Or use Prisma seed command
npx prisma db seed
```

**Essential Data to Seed:**
- Admin user account
- Default roles and permissions
- System settings
- Email templates
- Billing plans

### 5. Set Up Automated Backups

**For Vercel Postgres:**
- Backups are automatic (point-in-time recovery)

**For DigitalOcean:**
1. Enable daily backups in dashboard
2. Set backup window to low-traffic hours
3. Retention: 7 days minimum

**For AWS RDS:**
1. Enable automated backups
2. Retention period: 7-30 days
3. Backup window: 02:00-04:00 UTC
4. Enable point-in-time recovery

**Manual Backup Script:**
```bash
# Create backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# Compress backup
gzip backup-*.sql

# Upload to Azure Blob Storage
az storage blob upload \
  --account-name zyphexprod \
  --container-name backups \
  --file backup-*.sql.gz
```

---

## 🚀 Vercel Deployment

### 1. Install Vercel CLI

```bash
npm i -g vercel
vercel login
```

### 2. Link Project to Vercel

```bash
# Navigate to project directory
cd c:\Projects\Zyphex-Tech

# Link to Vercel
vercel link

# Follow prompts:
# - Select your team/account
# - Link to existing project or create new
# - Set project name: zyphex-tech-platform
```

### 3. Configure Environment Variables

**Option A: Via Vercel Dashboard**
1. Go to project settings
2. Navigate to "Environment Variables"
3. Add all variables from `.env.production`
4. Select "Production" environment
5. Save changes

**Option B: Via CLI**
```bash
# Add environment variables one by one
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add REDIS_URL production
# ... add all required variables

# Or import from file
vercel env pull .env.production
```

### 4. Configure Build Settings

**vercel.json:**
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NODE_ENV": "production"
  },
  "build": {
    "env": {
      "NEXT_TELEMETRY_DISABLED": "1"
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ]
}
```

### 5. Deploy to Production

```bash
# Deploy to production
vercel --prod

# Or use Git integration (recommended)
git push origin main
# Vercel will auto-deploy from main branch
```

### 6. Configure Custom Domain

**Via Vercel Dashboard:**
1. Go to project settings → Domains
2. Add custom domain: `app.zyphex-tech.com`
3. Add DNS records as shown:
   ```
   Type: A
   Name: app
   Value: 76.76.21.21
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
4. Wait for DNS propagation (5-60 minutes)
5. Vercel automatically provisions SSL certificate

**Enable HTTPS Redirect:**
Already configured in `next.config.mjs` via security headers.

---

## 📊 Monitoring Setup

### 1. Sentry Error Tracking

**Install Sentry:**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**Configure Sentry:**
```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT || 'production',
  tracesSampleRate: 1.0,
  
  // Performance Monitoring
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: ["localhost", "app.zyphex-tech.com"],
    }),
  ],
  
  // Error Filtering
  beforeSend(event, hint) {
    // Don't send 404 errors
    if (event.exception?.values?.[0]?.value?.includes('404')) {
      return null;
    }
    return event;
  },
});
```

```typescript
// sentry.server.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT || 'production',
  tracesSampleRate: 1.0,
  
  // Server-side specific config
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],
});
```

**Test Sentry:**
```typescript
// Test error tracking
throw new Error('Sentry test error');
```

### 2. UptimeRobot Monitoring

**Setup:**
1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Create account
3. Add new monitor:
   - **Type**: HTTP(s)
   - **URL**: `https://app.zyphex-tech.com/api/health`
   - **Interval**: 5 minutes
   - **Alert Contacts**: Your email/phone

**Configure Alerts:**
- Email notifications
- SMS for critical downtime
- Slack webhook integration

### 3. Vercel Analytics

**Enable in Vercel Dashboard:**
1. Go to project → Analytics
2. Enable Web Analytics
3. Enable Audience insights
4. View metrics:
   - Page views
   - Unique visitors
   - Top pages
   - Performance metrics

### 4. Custom Application Monitoring

**Create monitoring dashboard endpoint:**

```typescript
// app/api/admin/monitoring/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRedisClient } from '@/lib/cache/redis';

export async function GET() {
  try {
    const [
      userCount,
      projectCount,
      activeProjects,
      todaySignups,
      cacheStats,
      dbStats
    ] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.project.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      getCacheStats(),
      getDatabaseStats()
    ]);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      metrics: {
        users: {
          total: userCount,
          newToday: todaySignups
        },
        projects: {
          total: projectCount,
          active: activeProjects
        },
        cache: cacheStats,
        database: dbStats
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}

async function getCacheStats() {
  const redis = getRedisClient();
  if (!redis) return null;
  
  const info = await redis.info('stats');
  return {
    totalKeys: await redis.dbsize(),
    hitRate: parseFloat(info.match(/keyspace_hits:(\d+)/)?.[1] || '0'),
    missRate: parseFloat(info.match(/keyspace_misses:(\d+)/)?.[1] || '0')
  };
}

async function getDatabaseStats() {
  const stats = await prisma.$queryRaw`
    SELECT 
      (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
      (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections
  `;
  return stats;
}
```

---

## 🔒 Security Configuration

### 1. Environment Security

**Verify security headers are enabled:**

Check `next.config.mjs` includes:
```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload'
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY'
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block'
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin'
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()'
        }
      ]
    }
  ];
}
```

### 2. Rate Limiting

**Already configured in:**
- `middleware.ts` - API rate limiting
- Individual API routes - Per-endpoint limits

**Verify configuration:**
```typescript
// middleware.ts
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
};
```

### 3. CORS Configuration

**Update allowed origins in production:**

```typescript
// middleware.ts or api routes
const allowedOrigins = [
  'https://app.zyphex-tech.com',
  'https://www.zyphex-tech.com'
];
```

### 4. OAuth Security

**Update OAuth redirect URIs:**

**Google OAuth Console:**
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Select project
3. APIs & Services → Credentials
4. Edit OAuth 2.0 Client ID
5. Add authorized redirect URIs:
   ```
   https://app.zyphex-tech.com/api/auth/callback/google
   ```

**GitHub OAuth:**
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Edit application
3. Update Authorization callback URL:
   ```
   https://app.zyphex-tech.com/api/auth/callback/github
   ```

### 5. Stripe Webhook Security

**Configure webhook endpoint:**

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://app.zyphex-tech.com/api/webhooks/stripe`
3. Select events to listen:
   - `payment_intent.succeeded`
   - `payment_intent.failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copy webhook signing secret
5. Add to environment: `STRIPE_WEBHOOK_SECRET`

**Test webhook:**
```bash
stripe listen --forward-to https://app.zyphex-tech.com/api/webhooks/stripe
```

---

## ✅ Post-Deployment Validation

### 1. Smoke Tests

**Critical Path Testing:**

```bash
# Health check
curl https://app.zyphex-tech.com/api/health

# Expected: {"success":true,"status":"healthy",...}
```

**Test checklist:**
- [ ] Homepage loads
- [ ] User can sign up
- [ ] User can log in
- [ ] OAuth login works (Google, GitHub)
- [ ] Dashboard loads after login
- [ ] Can create a project
- [ ] Can create a client
- [ ] Can create an invoice
- [ ] Email notifications send
- [ ] File upload works
- [ ] Payment processing works (test mode first)
- [ ] User can log out

### 2. Performance Validation

**Run Lighthouse audit:**
```bash
# Install Lighthouse
npm install -g lighthouse

# Run audit
lighthouse https://app.zyphex-tech.com --view

# Expected scores:
# Performance: 85+
# Accessibility: 90+
# Best Practices: 95+
# SEO: 90+
```

**Test API response times:**
```bash
# Test with curl
time curl https://app.zyphex-tech.com/api/projects

# Expected: < 200ms for cached, < 500ms for fresh
```

### 3. Monitoring Validation

**Check Sentry:**
1. Go to Sentry dashboard
2. Verify events are coming in
3. Check error rate (should be < 1%)

**Check UptimeRobot:**
1. Verify monitor shows "Up"
2. Check response time (should be < 500ms)

**Check Vercel Analytics:**
1. Go to Vercel dashboard
2. View Analytics
3. Verify requests are being tracked

### 4. Database Validation

```bash
# Check database connection
npx prisma db pull

# Verify tables exist
npx prisma studio
```

### 5. Security Validation

**Run security headers check:**
```bash
curl -I https://app.zyphex-tech.com

# Verify headers present:
# - Strict-Transport-Security
# - X-Frame-Options
# - X-Content-Type-Options
# - X-XSS-Protection
```

**SSL/TLS validation:**
```bash
# Check SSL certificate
openssl s_client -connect app.zyphex-tech.com:443 -servername app.zyphex-tech.com

# Verify:
# - Valid certificate
# - Not expired
# - Correct domain
# - Strong cipher suites
```

---

## 🔄 Rollback Procedure

### Quick Rollback (Vercel)

**Via Dashboard:**
1. Go to Vercel Dashboard → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"
4. Confirm rollback

**Via CLI:**
```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]
```

### Database Rollback

**If migration needs rollback:**

```bash
# Don't use Prisma's built-in rollback (not recommended for production)
# Instead, restore from backup

# 1. Download backup
az storage blob download \
  --account-name zyphexprod \
  --container-name backups \
  --name backup-YYYYMMDD.sql.gz \
  --file backup.sql.gz

# 2. Decompress
gunzip backup.sql.gz

# 3. Restore (BE VERY CAREFUL)
psql $DATABASE_URL < backup.sql
```

### Emergency Maintenance Mode

**Enable maintenance mode:**

```bash
# Set environment variable in Vercel
vercel env add MAINTENANCE_MODE production
# Value: true

# Redeploy
vercel --prod
```

**Maintenance page:**
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  if (process.env.MAINTENANCE_MODE === 'true') {
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Maintenance Mode</title>
          <style>
            body {
              font-family: system-ui;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔧 Scheduled Maintenance</h1>
            <p>We're performing scheduled maintenance.</p>
            <p>We'll be back shortly. Thank you for your patience!</p>
          </div>
        </body>
      </html>
      `,
      {
        status: 503,
        headers: {
          'Content-Type': 'text/html',
          'Retry-After': '3600'
        }
      }
    );
  }
  // ... rest of middleware
}
```

---

## 🔧 Troubleshooting

### Common Issues

**1. Database Connection Failed**

```bash
# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check firewall rules
# - Add Vercel IP ranges to database whitelist
# - Enable SSL connections
```

**2. OAuth Login Not Working**

- Verify redirect URIs are correct
- Check OAuth credentials (production vs development)
- Verify NEXTAUTH_URL is set correctly
- Check browser console for errors

**3. Emails Not Sending**

```bash
# Test SMTP connection
npx nodemailer-test-smtp \
  --host $SMTP_HOST \
  --port $SMTP_PORT \
  --user $SMTP_USER \
  --pass $SMTP_PASSWORD
```

**4. High Error Rate**

1. Check Sentry for error details
2. Review recent deployments
3. Check database performance
4. Verify environment variables
5. Check Redis connection
6. Review application logs in Vercel

**5. Slow Performance**

- Check database query performance
- Verify Redis cache is working
- Check CDN configuration
- Review API response times
- Check database connection pool

---

## 📞 Emergency Contacts

**On-Call Engineer:** oncall@zyphex-tech.com  
**Emergency Phone:** +1234567890  
**Slack Channel:** #production-alerts  
**PagerDuty:** [Configure integration]

---

## 📊 Production Metrics

### Target SLAs

- **Uptime**: 99.9% (43 minutes downtime/month max)
- **API Response Time**: < 200ms (p95)
- **Error Rate**: < 0.1%
- **Database Response Time**: < 50ms (p95)

### Monitoring Dashboards

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Sentry**: https://sentry.io/organizations/zyphex-tech
- **UptimeRobot**: https://uptimerobot.com/dashboard
- **Database**: [Your database provider dashboard]

---

**Deployment Status**: Ready ✅  
**Last Updated**: December 2024  
**Version**: 1.0.0

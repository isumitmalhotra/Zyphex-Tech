# Workflow Automation - Deployment Guide

**Version**: 1.0  
**Last Updated**: October 21, 2025  
**Deployment Target**: Production Environment

---

## 📋 Pre-Deployment Checklist

### Code Review
- [ ] All code reviewed and approved
- [ ] No console.log or debug statements in production code
- [ ] Error handling implemented for all API routes
- [ ] TypeScript compile errors resolved
- [ ] Lint errors resolved or documented

### Testing
- [ ] Unit tests pass: `npm run test`
- [ ] Integration tests pass
- [ ] E2E tests pass (if applicable)
- [ ] Manual testing completed for all workflows
- [ ] Template instantiation tested
- [ ] Workflow execution tested
- [ ] All 16 templates tested

### Database
- [ ] Migrations reviewed and tested
- [ ] Database indexes created
- [ ] Backup strategy in place
- [ ] Rollback plan documented

### Documentation
- [ ] User guide completed (WORKFLOW_USER_GUIDE.md)
- [ ] Admin guide completed (WORKFLOW_ADMIN_GUIDE.md)
- [ ] API reference completed (WORKFLOW_API_REFERENCE.md)
- [ ] Deployment guide completed (this file)
- [ ] README.md updated

### Security
- [ ] Environment variables documented
- [ ] API keys and secrets secured
- [ ] HTTPS enabled
- [ ] Authentication configured
- [ ] Authorization rules tested
- [ ] Rate limiting enabled
- [ ] CORS configured
- [ ] Input validation implemented

### Performance
- [ ] Database connection pooling configured
- [ ] Redis caching enabled (if applicable)
- [ ] Response compression enabled
- [ ] API response times acceptable (<500ms avg)
- [ ] Load testing completed (if high traffic expected)

### Monitoring
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Logging configured
- [ ] Health check endpoints working
- [ ] Performance monitoring setup
- [ ] Alerts configured

---

## 🔧 Environment Configuration

### Required Environment Variables

Create `.env.production` file:

```bash
# ============================================================================
# DATABASE
# ============================================================================
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public&connection_limit=20&pool_timeout=20"

# ============================================================================
# REDIS (Optional but recommended)
# ============================================================================
REDIS_URL="redis://redis-host:6379"
REDIS_PASSWORD="your-redis-password"

# ============================================================================
# AUTHENTICATION
# ============================================================================
NEXTAUTH_URL="https://your-production-domain.com"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# ============================================================================
# EMAIL (SMTP)
# ============================================================================
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"
SMTP_FROM="noreply@your-domain.com"

# ============================================================================
# SMS (Twilio)
# ============================================================================
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your-production-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"

# ============================================================================
# SLACK
# ============================================================================
SLACK_BOT_TOKEN="xoxb-your-production-bot-token"
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."

# ============================================================================
# MICROSOFT TEAMS
# ============================================================================
TEAMS_WEBHOOK_URL="https://outlook.office.com/webhook/..."

# ============================================================================
# WORKFLOW SETTINGS
# ============================================================================
WORKFLOW_MAX_CONCURRENT_EXECUTIONS="20"
WORKFLOW_DEFAULT_TIMEOUT="300"
WORKFLOW_QUEUE_CONCURRENCY="10"
WORKFLOW_ENABLE_CACHING="true"
WORKFLOW_CACHE_TTL="3600"

# ============================================================================
# MONITORING
# ============================================================================
SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"
LOG_LEVEL="info"
NODE_ENV="production"

# ============================================================================
# SECURITY
# ============================================================================
RATE_LIMIT_PER_MINUTE="120"
ENABLE_RATE_LIMITING="true"
WEBHOOK_SIGNATURE_SECRET="your-webhook-secret-key"

# ============================================================================
# PERFORMANCE
# ============================================================================
NODE_OPTIONS="--max-old-space-size=2048"
```

### Generate Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate webhook signature secret
openssl rand -hex 32
```

---

## 🚀 Deployment Steps

### Step 1: Prepare Code

```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
npm ci --production

# 3. Build application
npm run build

# 4. Verify build
ls .next/
```

### Step 2: Database Migration

```bash
# 1. Backup current database
pg_dump -h localhost -U postgres -d production_db > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Run migrations
npx prisma migrate deploy

# 3. Verify migrations
npx prisma migrate status

# 4. Generate Prisma Client
npx prisma generate

# 5. Seed database (if needed)
# npm run db:seed
```

### Step 3: Database Indexes

Ensure all required indexes are created:

```sql
-- Connect to production database
psql -h host -U user -d database

-- Create workflow indexes
CREATE INDEX IF NOT EXISTS "idx_workflow_enabled" ON "Workflow"("enabled");
CREATE INDEX IF NOT EXISTS "idx_workflow_category" ON "Workflow"("category");
CREATE INDEX IF NOT EXISTS "idx_workflow_created_by" ON "Workflow"("createdById");

-- Create execution indexes
CREATE INDEX IF NOT EXISTS "idx_execution_workflow_id" ON "WorkflowExecution"("workflowId");
CREATE INDEX IF NOT EXISTS "idx_execution_status" ON "WorkflowExecution"("status");
CREATE INDEX IF NOT EXISTS "idx_execution_started_at" ON "WorkflowExecution"("startedAt");

-- Create log indexes
CREATE INDEX IF NOT EXISTS "idx_log_execution_id" ON "WorkflowExecutionLog"("executionId");
CREATE INDEX IF NOT EXISTS "idx_log_timestamp" ON "WorkflowExecutionLog"("timestamp");

-- Verify indexes
\di

-- Exit
\q
```

### Step 4: Deploy Application

#### Option A: Vercel Deployment

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Link project
vercel link

# 4. Set environment variables
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
# ... add all required variables

# 5. Deploy
vercel --prod
```

#### Option B: Docker Deployment

```bash
# 1. Build Docker image
docker build -t workflow-app:latest .

# 2. Run container
docker run -d \
  --name workflow-app \
  -p 3000:3000 \
  --env-file .env.production \
  workflow-app:latest

# 3. Verify container
docker ps
docker logs workflow-app
```

#### Option C: PM2 Deployment (VPS)

```bash
# 1. Install PM2
npm install -g pm2

# 2. Start application
pm2 start npm --name "workflow-app" -- start

# 3. Save PM2 config
pm2 save

# 4. Setup startup script
pm2 startup

# 5. Monitor
pm2 monit
```

### Step 5: Verify Deployment

```bash
# 1. Check application health
curl https://your-domain.com/api/health/workflows

# 2. Test API endpoints
curl https://your-domain.com/api/workflows

# 3. Check logs
# Vercel: vercel logs
# Docker: docker logs workflow-app
# PM2: pm2 logs workflow-app

# 4. Verify database connection
# Check first workflow execution
```

### Step 6: Configure Services

#### Redis Setup

```bash
# If using Redis Cloud or managed Redis
# Ensure REDIS_URL is set in environment variables

# Test Redis connection
redis-cli -h your-redis-host -p 6379 -a your-password
PING
# Should return: PONG
```

#### Email (SMTP) Verification

```bash
# Send test email via workflow
curl -X POST https://your-domain.com/api/workflows/{id}/execute \
  -H "Content-Type: application/json" \
  -d '{"triggerData": {...}}'

# Check email logs for delivery status
```

#### Slack Verification

```bash
# Test Slack webhook
curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
  -H "Content-Type: application/json" \
  -d '{"text":"Test message from workflow deployment"}'
```

### Step 7: Enable Monitoring

```bash
# 1. Verify Sentry integration
# Check Sentry dashboard for incoming events

# 2. Setup log rotation (if using file logs)
# Add to logrotate.d

# 3. Configure uptime monitoring
# Add health check endpoint to monitoring service

# 4. Setup alerts
# Configure alerts in monitoring dashboard
```

---

## 🔄 Post-Deployment Tasks

### Immediate (Day 1)

- [ ] Verify all workflows are functioning
- [ ] Test template instantiation
- [ ] Execute test workflows
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify email delivery
- [ ] Test Slack notifications
- [ ] Review first 24 hours of logs

### Short-term (Week 1)

- [ ] Monitor workflow execution success rates
- [ ] Review and optimize slow workflows
- [ ] Check database performance
- [ ] Verify backup procedures
- [ ] Train admin users
- [ ] Create initial workflows from templates
- [ ] Gather user feedback

### Long-term (Month 1)

- [ ] Review workflow statistics
- [ ] Optimize database queries
- [ ] Scale if needed
- [ ] Document common issues
- [ ] Update documentation
- [ ] Plan feature enhancements

---

## 🔙 Rollback Procedure

### If Deployment Fails

#### Step 1: Identify Issue

```bash
# Check logs
# Vercel: vercel logs
# Docker: docker logs workflow-app
# PM2: pm2 logs workflow-app

# Check error tracking
# Review Sentry dashboard

# Check database
# Verify migrations applied correctly
```

#### Step 2: Rollback Application

**Vercel:**
```bash
# Rollback to previous deployment
vercel rollback
```

**Docker:**
```bash
# Stop current container
docker stop workflow-app
docker rm workflow-app

# Run previous version
docker run -d \
  --name workflow-app \
  -p 3000:3000 \
  --env-file .env.production \
  workflow-app:previous-tag
```

**PM2:**
```bash
# Revert code
git reset --hard HEAD~1

# Rebuild
npm run build

# Restart
pm2 restart workflow-app
```

#### Step 3: Rollback Database

```bash
# Only if migrations caused issues

# 1. Stop application
pm2 stop workflow-app

# 2. Restore database from backup
psql -h host -U user -d database < backup_YYYYMMDD_HHMMSS.sql

# 3. Verify data
psql -h host -U user -d database
SELECT COUNT(*) FROM "Workflow";

# 4. Restart application
pm2 start workflow-app
```

#### Step 4: Verify Rollback

```bash
# 1. Check application health
curl https://your-domain.com/api/health/workflows

# 2. Test critical workflows
curl https://your-domain.com/api/workflows

# 3. Execute test workflow
# Verify workflow execution works

# 4. Monitor for 30 minutes
# Watch logs and error rates
```

---

## 📊 Monitoring & Maintenance

### Daily Checks

```bash
# Check application health
curl https://your-domain.com/api/health/workflows

# Check error logs
# Vercel: vercel logs --follow
# PM2: pm2 logs workflow-app --lines 100

# Check workflow execution rates
# Review dashboard or query database:
psql -h host -U user -d database -c "
  SELECT 
    DATE(started_at) as date,
    COUNT(*) as executions,
    SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as successful
  FROM \"WorkflowExecution\"
  WHERE started_at >= NOW() - INTERVAL '1 day'
  GROUP BY DATE(started_at);
"
```

### Weekly Maintenance

```bash
# 1. Review workflow statistics
# Check dashboard at /workflows

# 2. Clean old logs
npm run clean-logs

# 3. Database maintenance
psql -h host -U user -d database -c "VACUUM ANALYZE;"

# 4. Check disk space
df -h

# 5. Review slow queries
# Check database slow query log
```

### Monthly Tasks

```bash
# 1. Database backup verification
# Restore backup to test database and verify

# 2. Security updates
npm audit
npm audit fix

# 3. Dependency updates
npm outdated
npm update

# 4. Review and archive old executions
# Consider archiving executions > 90 days old

# 5. Performance review
# Check average execution times
# Optimize slow workflows
```

---

## 🆘 Troubleshooting

### Common Issues

#### Application Won't Start

**Check:**
```bash
# 1. Environment variables
printenv | grep -E "(DATABASE_URL|NEXTAUTH_SECRET)"

# 2. Port availability
lsof -i :3000

# 3. Database connection
psql $DATABASE_URL -c "SELECT 1;"

# 4. Node version
node --version  # Should be 18+

# 5. Build artifacts
ls -la .next/
```

#### Workflows Not Executing

**Check:**
```bash
# 1. Workflow enabled status
# Query database or check UI

# 2. Trigger registration
# Check application logs for trigger errors

# 3. Queue status
# If using Bull Queue, check Redis

# 4. Worker processes
# Ensure queue workers are running
```

#### Email Not Sending

**Check:**
```bash
# 1. SMTP configuration
env | grep SMTP

# 2. SMTP server connectivity
telnet smtp-host 587

# 3. Email logs
# Check workflow execution logs

# 4. Spam folder
# Verify emails not being filtered
```

#### High Memory Usage

**Check:**
```bash
# 1. Current usage
free -m
docker stats (if using Docker)
pm2 monit (if using PM2)

# 2. Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096"

# 3. Check for memory leaks
# Use Node.js profiler or Clinic.js

# 4. Optimize workflow execution
# Reduce concurrent executions
```

---

## 📝 Deployment Log Template

```
DEPLOYMENT LOG
================

Date: YYYY-MM-DD HH:MM:SS
Deployed By: [Name]
Version/Commit: [git commit hash]
Environment: Production

PRE-DEPLOYMENT CHECKLIST:
☑ Code reviewed
☑ Tests passing
☑ Database backed up
☑ Environment variables set
☑ Documentation updated

DEPLOYMENT STEPS:
1. [Timestamp] Backed up database
2. [Timestamp] Ran migrations
3. [Timestamp] Built application
4. [Timestamp] Deployed to production
5. [Timestamp] Verified health checks
6. [Timestamp] Tested critical workflows

POST-DEPLOYMENT VERIFICATION:
☑ Application healthy
☑ Database connected
☑ Workflows executing
☑ Email sending
☑ Slack notifications working
☑ No error spikes in logs

ISSUES ENCOUNTERED:
[None / List any issues and resolutions]

ROLLBACK REQUIRED:
[Yes/No] [If yes, reason and steps taken]

NOTES:
[Any additional notes or observations]
```

---

## 🎯 Success Criteria

Deployment is considered successful when:

✅ Application is accessible at production URL  
✅ Health check endpoint returns healthy status  
✅ Database migrations completed successfully  
✅ All environment variables configured  
✅ At least one test workflow executes successfully  
✅ Email sending works  
✅ External integrations (Slack/Teams) work  
✅ No error spikes in first hour  
✅ Response times are acceptable (<500ms avg)  
✅ Monitoring and alerts are active  

---

**End of Deployment Guide**

*For operational procedures, see WORKFLOW_ADMIN_GUIDE.md*  
*For user training, see WORKFLOW_USER_GUIDE.md*  
*For API integration, see WORKFLOW_API_REFERENCE.md*

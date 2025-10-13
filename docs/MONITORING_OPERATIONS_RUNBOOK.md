# 📘 MONITORING SYSTEM OPERATIONS RUNBOOK

**Version:** 1.0.0  
**Date:** October 13, 2025  
**Status:** Production Ready  

---

## 🎯 Purpose

This runbook provides step-by-step procedures for responding to monitoring alerts, troubleshooting common issues, and maintaining the monitoring system.

---

## 📋 Table of Contents

1. [Alert Response Procedures](#alert-response-procedures)
2. [Common Issues & Solutions](#common-issues--solutions)
3. [Performance Optimization](#performance-optimization)
4. [Incident Management](#incident-management)
5. [Escalation Procedures](#escalation-procedures)
6. [Monitoring System Maintenance](#monitoring-system-maintenance)

---

## 🚨 Alert Response Procedures

### Critical Alert: Service Down

**Alert Example:**
```
Subject: [CRITICAL] Service Down: Database
Message: Database connection failed - Connection timeout
```

**Immediate Actions (5 minutes):**

1. **Verify the Alert:**
```bash
# Check application health
curl https://zyphex.com/api/health

# SSH into server
ssh zyphex@your-server-ip

# Check service status
pm2 status
systemctl status postgresql
```

2. **Check System Resources:**
```bash
# Check memory
free -h

# Check disk space
df -h

# Check CPU
top -bn1 | head -20
```

3. **Review Recent Logs:**
```bash
# Application logs
pm2 logs zyphex-tech --lines 50

# PostgreSQL logs
sudo tail -100 /var/log/postgresql/postgresql-14-main.log

# Nginx logs
sudo tail -100 /var/log/nginx/error.log
```

**Resolution Steps:**

**If Database is Down:**
```bash
# Restart PostgreSQL
sudo systemctl restart postgresql

# Verify database connection
psql -U zyphex_user -d zyphex_tech -c "SELECT 1;"

# Restart application
pm2 restart zyphex-tech

# Verify health
curl https://zyphex.com/api/health
```

**If Application is Down:**
```bash
# Check PM2 process
pm2 list

# Restart application
pm2 restart zyphex-tech

# If restart fails, check logs
pm2 logs zyphex-tech --err --lines 100

# Try manual start
cd /home/zyphex/Zyphex-Tech
npm start
```

**Post-Resolution:**
```bash
# Send resolution alert
curl -X POST https://zyphex.com/api/send-resolution-alert \
  -H "Content-Type: application/json" \
  -d '{"incident": "database-down", "resolvedAt": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}'

# Update status page (if applicable)
# Document in incident log
```

---

### Warning Alert: High Memory Usage

**Alert Example:**
```
Subject: [WARNING] High Memory Usage
Message: Memory usage at 85% (13.6 GB / 16 GB)
```

**Immediate Actions:**

1. **Identify Memory Consumers:**
```bash
# Top memory processes
ps aux --sort=-%mem | head -10

# PM2 memory usage
pm2 monit

# Node.js heap usage
node -e "console.log(process.memoryUsage())"
```

2. **Analyze Memory Leak:**
```bash
# Check for memory leaks in application
pm2 logs zyphex-tech | grep -i "memory\|heap"

# Review Sentry for memory-related errors
# Check: https://sentry.io/your-project/issues/?query=memory
```

**Resolution Steps:**

**Option 1: Restart Application (Quick Fix)**
```bash
# Graceful restart
pm2 restart zyphex-tech

# Monitor memory after restart
watch -n 5 'free -h'
```

**Option 2: Scale Down Instances**
```bash
# Reduce PM2 instances
pm2 scale zyphex-tech 2

# Set memory limit
pm2 restart zyphex-tech --max-memory-restart 800M
```

**Option 3: Optimize Code (Long-term)**
```bash
# Profile memory usage
node --inspect server.js

# Use Chrome DevTools to analyze heap snapshot
# Fix memory leaks in code
# Deploy updated version
```

---

### Warning Alert: High CPU Load

**Alert Example:**
```
Subject: [WARNING] High CPU Load
Message: CPU load at 106% (8.5 / 8 cores)
```

**Immediate Actions:**

1. **Identify CPU Consumers:**
```bash
# Top CPU processes
top -bn1 | head -20

# PM2 CPU usage
pm2 monit

# Check load average
uptime
```

2. **Analyze Slow Queries:**
```bash
# Check database query performance
psql -U zyphex_user -d zyphex_tech << EOF
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 seconds'
AND state = 'active';
EOF
```

**Resolution Steps:**

**Option 1: Kill Long-Running Queries**
```bash
# Identify and kill slow queries
psql -U zyphex_user -d zyphex_tech -c "
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE (now() - query_start) > interval '60 seconds';
"
```

**Option 2: Scale Application**
```bash
# Increase PM2 instances (if memory allows)
pm2 scale zyphex-tech +2

# Or restart to clear any stuck processes
pm2 restart zyphex-tech
```

**Option 3: Optimize Code**
```bash
# Profile CPU usage
node --prof server.js

# Analyze profile
node --prof-process isolate-*-v8.log > profile.txt
cat profile.txt | head -50

# Fix performance bottlenecks
# Deploy optimized code
```

---

### Info Alert: Performance Degradation

**Alert Example:**
```
Subject: [INFO] Performance Degradation
Message: API response time: 1200ms (threshold: 1000ms)
```

**Immediate Actions:**

1. **Check API Performance:**
```bash
# Test API endpoint
time curl https://zyphex.com/api/users

# Check Sentry performance metrics
# URL: https://sentry.io/your-project/performance/
```

2. **Review Database Performance:**
```bash
# Check slow queries
psql -U zyphex_user -d zyphex_tech -c "
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
"
```

**Resolution Steps:**

**Option 1: Database Optimization**
```bash
# Analyze and vacuum database
psql -U zyphex_user -d zyphex_tech << EOF
ANALYZE;
VACUUM;
REINDEX DATABASE zyphex_tech;
EOF
```

**Option 2: Cache Optimization**
```bash
# Clear application cache (if implemented)
curl -X POST https://zyphex.com/api/admin/clear-cache \
  -H "Authorization: Bearer your-admin-token"

# Restart Redis (if used)
sudo systemctl restart redis
```

**Option 3: CDN/Static Assets**
```bash
# Verify CDN is working
curl -I https://zyphex.com/_next/static/somefile.js

# Check Nginx caching
sudo nginx -T | grep cache
```

---

## 🔧 Common Issues & Solutions

### Issue 1: Authentication Service Timeout

**Symptoms:**
- Users cannot log in
- /api/auth/signin endpoint slow
- Alert: "Auth service degraded"

**Diagnosis:**
```bash
# Test auth endpoint
curl -X POST https://zyphex.com/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'

# Check database connections
psql -U zyphex_user -d zyphex_tech -c "
SELECT count(*) as connections FROM pg_stat_activity;
"
```

**Solution:**
```bash
# Restart application
pm2 restart zyphex-tech

# If database connections are maxed out:
psql -U zyphex_user -d zyphex_tech -c "
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle' AND query_start < now() - interval '10 minutes';
"

# Increase database connection pool (in .env):
# DATABASE_POOL_SIZE=30
```

---

### Issue 2: Email Alerts Not Sending

**Symptoms:**
- No email alerts received
- Resend API errors in logs
- Alert delivery failures

**Diagnosis:**
```bash
# Check environment variables
echo $RESEND_API_KEY
echo $ALERT_RECIPIENTS

# Test Resend API
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "alerts@zyphex.com",
    "to": "test@example.com",
    "subject": "Test",
    "html": "<p>Test email</p>"
  }'
```

**Solution:**
```bash
# Verify API key is valid
# Check Resend dashboard: https://resend.com/dashboard

# Update environment variable
pm2 restart zyphex-tech --update-env

# Check email quotas
# Resend free tier: 100 emails/day
# Consider upgrading plan if hitting limits
```

---

### Issue 3: Webhook Alerts Failing

**Symptoms:**
- Slack/Discord not receiving alerts
- Webhook errors in logs
- Partial alert delivery

**Diagnosis:**
```bash
# Test Slack webhook
curl -X POST $SLACK_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"text":"Test alert from runbook"}'

# Test Discord webhook
curl -X POST $DISCORD_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"content":"Test alert from runbook"}'
```

**Solution:**
```bash
# Verify webhook URLs are correct
# Slack: https://api.slack.com/messaging/webhooks
# Discord: https://discord.com/developers/docs/resources/webhook

# Update webhook URLs in .env
# Restart application
pm2 restart zyphex-tech --update-env

# Check webhook rate limits:
# Slack: 1 message per second
# Discord: 5 messages per second
```

---

### Issue 4: Dashboard Not Loading

**Symptoms:**
- /admin/monitoring returns error
- Dashboard shows "Loading..."
- Health API returns 500

**Diagnosis:**
```bash
# Test health API directly
curl https://zyphex.com/api/health

# Check browser console for JavaScript errors
# Check Nginx logs
sudo tail -50 /var/log/nginx/error.log

# Check application logs
pm2 logs zyphex-tech --lines 50
```

**Solution:**
```bash
# Clear Next.js cache
cd /home/zyphex/Zyphex-Tech
rm -rf .next/cache

# Rebuild application
npm run build

# Restart application
pm2 restart zyphex-tech

# Clear browser cache and reload
```

---

## ⚡ Performance Optimization

### Database Query Optimization

**Identify Slow Queries:**
```sql
-- Enable pg_stat_statements (if not enabled)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Find slowest queries
SELECT query, calls, total_time, mean_time, min_time, max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;

-- Find most frequent queries
SELECT query, calls, total_time
FROM pg_stat_statements
ORDER BY calls DESC
LIMIT 20;
```

**Add Missing Indexes:**
```sql
-- Find missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY abs(correlation) DESC;

-- Create index example
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_projects_client_id ON projects(client_id);
```

**Optimize Queries:**
```sql
-- Use EXPLAIN ANALYZE to understand query plans
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';

-- Add appropriate WHERE clauses
-- Use LIMIT for pagination
-- Avoid SELECT * (specify columns)
-- Use prepared statements
```

### Application Performance

**Optimize Next.js Build:**
```bash
# Enable production optimizations
export NODE_ENV=production

# Build with analyze
npm run build -- --analyze

# Review bundle size
# Remove unused dependencies
# Enable code splitting
```

**Enable Caching:**
```typescript
// In API routes - add caching headers
export async function GET(request: Request) {
  const data = await fetchData();
  
  return new Response(JSON.stringify(data), {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
```

**Implement Rate Limiting:**
```bash
# Already implemented in middleware.ts
# Monitor rate limit hits in logs
pm2 logs zyphex-tech | grep "Rate limit"
```

---

## 🚑 Incident Management

### Severity Levels

**P0 - Critical (Response: Immediate)**
- Complete service outage
- Data loss or corruption
- Security breach
- Revenue-impacting issues

**P1 - High (Response: Within 1 hour)**
- Partial service outage
- Severe performance degradation
- Authentication/authorization failures
- Critical feature broken

**P2 - Medium (Response: Within 4 hours)**
- Minor performance issues
- Non-critical feature broken
- Intermittent errors
- Degraded monitoring

**P3 - Low (Response: Within 24 hours)**
- Cosmetic issues
- Minor bugs
- Enhancement requests
- Documentation updates

### Incident Response Template

```markdown
# Incident Report: [INCIDENT-YYYY-MM-DD-XXX]

## Summary
**Severity:** P0/P1/P2/P3
**Start Time:** YYYY-MM-DD HH:MM:SS UTC
**End Time:** YYYY-MM-DD HH:MM:SS UTC
**Duration:** X hours Y minutes
**Impact:** [Description of impact]

## Timeline
- **HH:MM** - Alert received: [Alert details]
- **HH:MM** - Investigation started
- **HH:MM** - Root cause identified: [Description]
- **HH:MM** - Fix applied: [Action taken]
- **HH:MM** - Service restored
- **HH:MM** - Monitoring confirmed stable

## Root Cause
[Detailed explanation of what caused the incident]

## Resolution
[Detailed explanation of how it was resolved]

## Prevention
[Steps to prevent this from happening again]

## Action Items
- [ ] Item 1: [Owner] [Due date]
- [ ] Item 2: [Owner] [Due date]

## Metrics
- **MTTD (Mean Time To Detect):** X minutes
- **MTTR (Mean Time To Resolve):** X minutes
- **Users Affected:** X
- **Requests Failed:** X

## Post-Incident Review Scheduled
**Date:** YYYY-MM-DD
**Attendees:** [List]
```

---

## 📞 Escalation Procedures

### Level 1: On-Call Engineer

**Contact:** ops@zyphex.com  
**Response Time:** 15 minutes  
**Handles:** All P0-P3 incidents

**Actions:**
1. Acknowledge alert within 15 minutes
2. Begin investigation immediately
3. Escalate to Level 2 if unresolved in 30 minutes (P0/P1)
4. Document all actions in incident report

### Level 2: Senior Engineer

**Contact:** admin@zyphex.com  
**Response Time:** 30 minutes  
**Handles:** P0-P1 incidents

**Actions:**
1. Review Level 1 actions
2. Provide technical guidance
3. Escalate to Level 3 if needed
4. Coordinate with external vendors

### Level 3: Technical Lead

**Contact:** +1-XXX-XXX-XXXX  
**Response Time:** 1 hour  
**Handles:** P0 incidents only

**Actions:**
1. Take command of incident
2. Coordinate all resources
3. Make critical decisions (e.g., rollback, failover)
4. Communicate with stakeholders

### External Escalation

**Sentry Support:**
- Email: support@sentry.io
- Response: 1-2 business days
- For: Performance monitoring issues

**Resend Support:**
- Email: support@resend.com
- Response: 4-8 hours
- For: Email delivery issues

**VPS Provider:**
- Support portal: [Your provider]
- Response: Varies by plan
- For: Infrastructure issues

---

## 🔧 Monitoring System Maintenance

### Weekly Health Check

```bash
#!/bin/bash
# weekly-health-check.sh

echo "=== Zyphex Monitoring System Health Check ==="
echo "Date: $(date)"
echo ""

echo "1. Application Status:"
pm2 status

echo ""
echo "2. System Resources:"
free -h
df -h

echo ""
echo "3. Database Connections:"
psql -U zyphex_user -d zyphex_tech -c "
SELECT count(*) as total_connections,
       count(*) FILTER (WHERE state = 'active') as active,
       count(*) FILTER (WHERE state = 'idle') as idle
FROM pg_stat_activity;
"

echo ""
echo "4. Recent Errors (last 24 hours):"
pm2 logs zyphex-tech --err --lines 10

echo ""
echo "5. Alert Statistics:"
curl -s https://zyphex.com/api/admin/alert-stats | jq .

echo ""
echo "6. SSL Certificate:"
echo | openssl s_client -servername zyphex.com -connect zyphex.com:443 2>/dev/null | openssl x509 -noout -dates

echo ""
echo "=== Health Check Complete ==="
```

### Monthly Maintenance Tasks

**1. Update Dependencies:**
```bash
cd /home/zyphex/Zyphex-Tech
npm audit
npm update
npm run build
pm2 restart zyphex-tech
```

**2. Database Maintenance:**
```bash
psql -U zyphex_user -d zyphex_tech << EOF
-- Analyze tables
ANALYZE;

-- Vacuum database
VACUUM;

-- Reindex
REINDEX DATABASE zyphex_tech;

-- Check database size
SELECT pg_size_pretty(pg_database_size('zyphex_tech'));
EOF
```

**3. Log Rotation:**
```bash
# Clear PM2 logs
pm2 flush

# Rotate Nginx logs
sudo logrotate /etc/logrotate.d/nginx

# Archive old logs
cd /var/log/zyphex
tar -czf logs_archive_$(date +%Y%m).tar.gz *.log
rm *.log
```

**4. Backup Verification:**
```bash
# Test latest database backup
LATEST_BACKUP=$(ls -t /home/zyphex/backups/db_backup_*.sql | head -1)
psql -U zyphex_user test_restore < $LATEST_BACKUP
psql -U zyphex_user -c "DROP DATABASE test_restore;"
```

---

## 📊 Monitoring Metrics Dashboard

**Key Metrics to Track:**

1. **Availability:**
   - Target: 99.9% uptime
   - Measure: UptimeRobot + health API
   
2. **Performance:**
   - Target: <500ms P95 response time
   - Measure: Sentry performance monitoring

3. **Error Rate:**
   - Target: <0.1% error rate
   - Measure: Sentry issues dashboard

4. **Alert Response:**
   - Target: <15 min MTTD
   - Target: <30 min MTTR (P0/P1)
   - Measure: Incident reports

**Dashboard URLs:**
- Application: https://zyphex.com/admin/monitoring
- Sentry: https://sentry.io/organizations/your-org/projects/zyphex-tech/
- UptimeRobot: https://uptimerobot.com/dashboard

---

**Runbook Last Updated:** October 13, 2025  
**Next Review:** November 13, 2025  
**Maintained By:** Zyphex Tech Operations Team

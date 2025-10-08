# Incident Response Plan

**Emergency procedures for production incidents**

---

## 🚨 Severity Levels

### P0 - Critical (Immediate Response)
**Response Time**: < 15 minutes  
**Examples**:
- Complete service outage
- Data breach or security incident
- Payment processing completely broken
- Database corruption

**Actions**:
1. Page on-call engineer immediately
2. Create incident channel in Slack
3. Start incident log
4. Assess impact
5. Implement emergency fix or rollback

### P1 - High (Urgent Response)
**Response Time**: < 1 hour  
**Examples**:
- Partial service degradation
- Critical feature broken (auth, payments)
- High error rate (> 5%)
- Database performance issues

**Actions**:
1. Notify on-call engineer
2. Create incident ticket
3. Begin investigation
4. Prepare fix or mitigation
5. Deploy within 2 hours

### P2 - Medium (Same Day Response)
**Response Time**: < 4 hours  
**Examples**:
- Non-critical feature broken
- Performance degradation
- Email delivery issues
- UI bugs affecting workflow

**Actions**:
1. Create ticket
2. Assign to appropriate team
3. Investigate and plan fix
4. Deploy in next release window

### P3 - Low (Next Business Day)
**Response Time**: < 24 hours  
**Examples**:
- Minor UI issues
- Documentation errors
- Non-blocking bugs
- Feature requests

**Actions**:
1. Create ticket
2. Add to backlog
3. Fix in next sprint

---

## 📞 Emergency Contacts

### On-Call Rotation
- **Primary**: oncall@zyphex-tech.com
- **Phone**: +1234567890
- **Backup**: backup-oncall@zyphex-tech.com

### Escalation Path
1. **Level 1**: On-call Engineer (15 min response)
2. **Level 2**: Engineering Lead (30 min response)
3. **Level 3**: CTO (1 hour response)
4. **Level 4**: CEO (critical incidents only)

### External Contacts
- **Vercel Support**: support@vercel.com
- **Stripe Support**: https://support.stripe.com
- **Database Provider**: [Your provider support]
- **Email Provider**: [Your provider support]

---

## 🔍 Detection & Alerting

### Automated Alerts

**UptimeRobot** → Slack #production-alerts
- Service downtime
- Slow response times (> 5s)
- SSL certificate expiry

**Sentry** → Slack #production-alerts
- Error rate spike (> 10 errors/min)
- New error types
- Performance regression

**Vercel** → Email
- Build failures
- Deployment failures
- Function timeout

**Custom Alerts** → PagerDuty
- Database connection pool exhausted
- Redis unavailable
- Memory usage > 90%
- Disk space < 10%

### Manual Detection

**Daily Health Checks** (9 AM):
```bash
# Check system health
curl https://app.zyphex-tech.com/api/health | jq

# Check error rate
# Review Sentry dashboard

# Check performance
# Review Vercel analytics
```

---

## 🛠️ Common Incidents & Resolutions

### 1. Service Downtime

**Symptoms**:
- 502/503 errors
- Timeout errors
- UptimeRobot alerts

**Investigation**:
```bash
# Check Vercel status
vercel ls

# Check logs
vercel logs

# Check health endpoint
curl https://app.zyphex-tech.com/api/health
```

**Resolution**:
```bash
# Option 1: Redeploy
vercel --prod

# Option 2: Rollback
vercel rollback

# Option 3: Enable maintenance mode
vercel env add MAINTENANCE_MODE production
# Set value to: true
vercel --prod
```

### 2. High Error Rate

**Symptoms**:
- Sentry alerts
- Multiple errors in logs
- Users reporting issues

**Investigation**:
1. Check Sentry dashboard for error patterns
2. Review recent deployments
3. Check database connectivity
4. Review API logs

**Resolution**:
```bash
# If caused by recent deployment
vercel rollback

# If database issue
# Check connection pool
# Restart connections
# Scale database if needed

# If external service issue
# Check service status pages
# Implement fallback logic
```

### 3. Database Connection Issues

**Symptoms**:
- "Too many connections" errors
- Slow queries
- Timeout errors

**Investigation**:
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Check connection details
SELECT * FROM pg_stat_activity;

-- Check slow queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE state = 'active' 
ORDER BY duration DESC;
```

**Resolution**:
```bash
# Increase connection pool
# Update DATABASE_URL with higher connection_limit

# Kill long-running queries
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE pid <> pg_backend_pid() AND state = 'active' 
AND query_start < now() - interval '5 minutes';

# Scale database (if managed service)
```

### 4. Redis Cache Failure

**Symptoms**:
- Slow response times
- Redis connection errors
- Cache misses increasing

**Investigation**:
```bash
# Check Redis status
redis-cli -u $REDIS_URL ping

# Check memory usage
redis-cli -u $REDIS_URL info memory

# Check key count
redis-cli -u $REDIS_URL dbsize
```

**Resolution**:
```bash
# Option 1: Restart Redis (if self-hosted)
# Option 2: Clear cache
redis-cli -u $REDIS_URL FLUSHDB

# Option 3: Disable cache temporarily
vercel env add CACHE_ENABLED production
# Set value to: false
vercel --prod

# Option 4: Scale Redis (if managed)
```

### 5. Payment Processing Issues

**Symptoms**:
- Stripe webhook failures
- Payment errors
- Stuck subscriptions

**Investigation**:
1. Check Stripe Dashboard → Events
2. Review webhook logs
3. Check API logs for Stripe calls
4. Verify webhook endpoint is accessible

**Resolution**:
```bash
# Verify webhook endpoint
curl -X POST https://app.zyphex-tech.com/api/webhooks/stripe

# Retry failed webhooks in Stripe Dashboard

# Update webhook secret if needed
vercel env add STRIPE_WEBHOOK_SECRET production

# Contact Stripe support for critical issues
```

### 6. Email Delivery Failure

**Symptoms**:
- Users not receiving emails
- SMTP errors
- Bounce notifications

**Investigation**:
1. Check email service dashboard
2. Review SMTP logs
3. Test email endpoint
4. Check spam folders

**Resolution**:
```bash
# Test email configuration
curl -X POST https://app.zyphex-tech.com/api/admin/test-email \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com"}'

# Update SMTP credentials
vercel env add SMTP_PASSWORD production

# Switch to backup email provider (if configured)
vercel env add EMAIL_SERVICE production
# Set value to: backup-smtp
```

### 7. High Memory Usage

**Symptoms**:
- Function timeouts
- Slow performance
- Out of memory errors

**Investigation**:
```bash
# Check health endpoint for memory stats
curl https://app.zyphex-tech.com/api/health | jq '.checks.memory'

# Review Vercel function logs
vercel logs --follow

# Check for memory leaks in Sentry
```

**Resolution**:
```bash
# Increase function memory in vercel.json
# "functions": {
#   "api/**/*.ts": {
#     "memory": 2048  // Increase from 1024
#   }
# }

# Deploy changes
vercel --prod

# Investigate and fix memory leak in code
```

### 8. SSL Certificate Issues

**Symptoms**:
- Certificate expired warnings
- HTTPS not working
- Mixed content warnings

**Investigation**:
```bash
# Check certificate
openssl s_client -connect app.zyphex-tech.com:443 -servername app.zyphex-tech.com

# Check expiry
echo | openssl s_client -connect app.zyphex-tech.com:443 2>/dev/null | openssl x509 -noout -dates
```

**Resolution**:
- Vercel auto-renews certificates
- Check domain DNS settings
- Remove and re-add domain in Vercel
- Contact Vercel support if persistent

---

## 📝 Incident Response Procedure

### 1. Detection (0-5 minutes)

**Actions**:
- [ ] Receive alert (automated or manual)
- [ ] Acknowledge alert
- [ ] Verify incident
- [ ] Classify severity

### 2. Response (5-15 minutes)

**Actions**:
- [ ] Create incident channel: `#incident-YYYYMMDD-description`
- [ ] Start incident log (use template below)
- [ ] Notify stakeholders
- [ ] Begin investigation
- [ ] Identify affected users/services

### 3. Investigation (15-30 minutes)

**Actions**:
- [ ] Check recent deployments
- [ ] Review error logs
- [ ] Check system health
- [ ] Review external dependencies
- [ ] Identify root cause

### 4. Mitigation (30-60 minutes)

**Actions**:
- [ ] Implement emergency fix
- [ ] OR rollback to last known good state
- [ ] OR enable maintenance mode
- [ ] Verify mitigation worked
- [ ] Monitor for additional issues

### 5. Recovery (1-2 hours)

**Actions**:
- [ ] Deploy permanent fix
- [ ] Verify all services operational
- [ ] Run smoke tests
- [ ] Clear maintenance mode (if enabled)
- [ ] Monitor stability

### 6. Post-Incident (2-24 hours)

**Actions**:
- [ ] Update incident log
- [ ] Notify stakeholders of resolution
- [ ] Schedule post-mortem
- [ ] Create action items
- [ ] Update runbooks

---

## 📋 Incident Log Template

```markdown
# Incident: [Brief Description]

**Incident ID**: INC-YYYYMMDD-NNN
**Severity**: P0/P1/P2/P3
**Status**: Investigating/Mitigating/Resolved
**Started**: YYYY-MM-DD HH:MM UTC
**Resolved**: YYYY-MM-DD HH:MM UTC
**Duration**: X hours Y minutes

## Impact
- Affected services:
- Affected users:
- Revenue impact:
- Data loss: Yes/No

## Timeline
- HH:MM - Alert received
- HH:MM - Investigation started
- HH:MM - Root cause identified
- HH:MM - Mitigation deployed
- HH:MM - Service restored
- HH:MM - Incident resolved

## Root Cause
[Detailed explanation of what caused the incident]

## Resolution
[What was done to resolve the incident]

## Action Items
- [ ] Item 1 - Owner - Due date
- [ ] Item 2 - Owner - Due date

## Post-Mortem
Link to post-mortem document: [URL]
```

---

## 🔄 Rollback Procedures

### Immediate Rollback (< 5 minutes)

```bash
# Via Vercel CLI
vercel rollback

# Or via Dashboard
# 1. Go to Vercel Dashboard → Deployments
# 2. Find last working deployment
# 3. Click "..." → "Promote to Production"
```

### Database Rollback (15-30 minutes)

```bash
# 1. Download latest backup
az storage blob download \
  --account-name zyphexprod \
  --container-name backups \
  --name backup-latest.sql.gz \
  --file backup.sql.gz

# 2. Decompress
gunzip backup.sql.gz

# 3. Restore (CAUTION: This will overwrite data)
psql $DATABASE_URL < backup.sql

# 4. Verify
psql $DATABASE_URL -c "SELECT count(*) FROM users;"
```

### Configuration Rollback

```bash
# Revert environment variable
vercel env rm VARIABLE_NAME production
vercel env add VARIABLE_NAME production
# Enter previous value

# Redeploy
vercel --prod
```

---

## 📊 Post-Incident Review

### Schedule Within 48 Hours

**Attendees**:
- Incident responders
- Engineering lead
- Product manager
- Customer support (if customer-facing)

**Agenda**:
1. **Timeline review** (10 min)
   - What happened and when
   
2. **Root cause analysis** (15 min)
   - Why did it happen
   - Contributing factors
   
3. **Response evaluation** (10 min)
   - What went well
   - What could be improved
   
4. **Action items** (15 min)
   - Preventive measures
   - Monitoring improvements
   - Documentation updates
   
5. **Communication review** (10 min)
   - Internal communication
   - Customer communication

### Post-Mortem Template

```markdown
# Post-Mortem: [Incident Title]

**Date**: YYYY-MM-DD
**Severity**: P0/P1/P2/P3
**Duration**: X hours
**Attendees**: [Names]

## Executive Summary
[2-3 sentence summary of incident and resolution]

## Impact
- Users affected: X,XXX (X%)
- Downtime: X hours
- Revenue impact: $X,XXX
- Data loss: Yes/No

## Timeline
[Detailed timeline from incident log]

## Root Cause
[Detailed technical explanation]

## What Went Well
- Quick detection via monitoring
- Fast response time
- Effective communication
- Successful rollback

## What Went Wrong
- Insufficient testing
- Missing alerts
- Unclear runbook
- Slow escalation

## Action Items
### Prevent Recurrence
- [ ] Add integration test for X
- [ ] Improve error handling in Y
- [ ] Add monitoring for Z

### Improve Detection
- [ ] Add alert for condition A
- [ ] Improve logging in component B
- [ ] Add dashboard for metric C

### Improve Response
- [ ] Update runbook for scenario D
- [ ] Train team on procedure E
- [ ] Improve tooling for task F

### Improve Communication
- [ ] Update status page template
- [ ] Create customer communication guide
- [ ] Improve alert routing

## Lessons Learned
1. Always test in staging first
2. Have rollback plan ready
3. Monitor closely after deployment
4. Communicate early and often
```

---

## 🎯 Prevention Strategies

### Before Deployment
- [ ] All tests passing
- [ ] Code review completed
- [ ] Staging deployment successful
- [ ] Rollback plan documented
- [ ] Database migrations tested
- [ ] Monitoring configured

### During Deployment
- [ ] Deploy during low-traffic hours
- [ ] Monitor error rates
- [ ] Watch performance metrics
- [ ] Check health endpoints
- [ ] Verify critical paths

### After Deployment
- [ ] Run smoke tests
- [ ] Monitor for 30 minutes
- [ ] Check error rates
- [ ] Review logs
- [ ] Verify monitoring alerts

---

## 📚 Resources

### Dashboards
- **Vercel**: https://vercel.com/dashboard
- **Sentry**: https://sentry.io/organizations/zyphex-tech
- **UptimeRobot**: https://uptimerobot.com/dashboard
- **Stripe**: https://dashboard.stripe.com

### Documentation
- [Production Deployment Guide](./PRODUCTION_DEPLOYMENT_GUIDE.md)
- [Database Backup Procedures](./DATABASE_BACKUP.md)
- [Security Incident Response](./SECURITY_INCIDENT_RESPONSE.md)

### Runbooks
- [Service Degradation Runbook](#)
- [Database Issues Runbook](#)
- [Payment Processing Runbook](#)
- [Email Delivery Runbook](#)

---

**Last Updated**: December 2024  
**Owner**: Engineering Team  
**Review Frequency**: Quarterly

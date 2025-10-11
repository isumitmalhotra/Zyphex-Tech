# 🧪 QUICK TEST: Error Logging & Monitoring System

## Test the Complete Implementation

This guide provides quick tests to validate the error logging system after deployment.

### 1. Basic Error Logging Test

**Test API Error Logging:**
```bash
# Test API error logging endpoint
curl -X POST http://localhost:3000/api/test/error \
  -H "Content-Type: application/json" \
  -d '{"message": "Test API error", "severity": "medium"}'
```

**Expected Result:** Error should be logged to database and Sentry with full context.

### 2. Admin Dashboard Test

**Access Dashboard:**
1. Navigate to `/admin/errors` 
2. Login with admin credentials
3. Verify error statistics display
4. Check error logs table
5. Test filtering functionality

**Expected Result:** Dashboard displays error statistics and logs.

### 3. Database Verification

**Check Error Logs Table:**
```sql
-- Verify error was logged
SELECT id, message, severity, route, user_id, created_at 
FROM error_logs 
ORDER BY created_at DESC 
LIMIT 5;

-- Check aggregated statistics
SELECT * FROM error_log_aggregates WHERE date = CURDATE();

-- Verify retention policies
SHOW EVENTS LIKE 'cleanup_error_logs';
```

**Expected Result:** Error records appear in database with complete context.

### 4. Error Logger Service Test

**Test in React Component:**
```typescript
import { useErrorLogger } from '@/lib/services/error-logger';

function TestComponent() {
  const { logError, addBreadcrumb } = useErrorLogger();
  
  const testError = async () => {
    addBreadcrumb('Testing error logging', 'user');
    await logError(
      new Error('Test client error'), 
      { component: 'TestComponent', action: 'testError' }
    );
  };
  
  return <button onClick={testError}>Test Error Logging</button>;
}
```

**Expected Result:** Error logged with breadcrumb trail and component context.

### 5. Performance & Rate Limiting Test

**Test Rate Limiting:**
```javascript
// Send multiple errors rapidly
for (let i = 0; i < 15; i++) {
  await logError(new Error(`Spam test ${i}`), {}, 'LOW');
}
```

**Expected Result:** Only first 10 errors logged, remaining blocked by rate limiter.

### 6. Integration Test

**Test Error Handler Integration:**
```typescript
// Trigger existing error handler
throw new Error('Integration test error');
```

**Expected Result:** Error captured by both existing handler and new logging service.

## ✅ Validation Checklist

- [ ] Errors logged to database with complete context
- [ ] Admin dashboard displays error statistics 
- [ ] Error filtering and search working
- [ ] Sentry integration capturing errors
- [ ] Rate limiting preventing spam
- [ ] Browser context captured correctly
- [ ] User context preserved
- [ ] Performance metrics recorded
- [ ] Breadcrumb trails working
- [ ] Alert notifications triggered
- [ ] Database retention policies active
- [ ] Error resolution tracking functional

## 🚨 Troubleshooting

**No errors appearing in dashboard:**
- Check database connection
- Verify error_logs table exists
- Check browser console for API errors

**Rate limiting too aggressive:**
- Adjust `maxErrorsPerMinute` in error logger config
- Check rate limit window settings

**Missing error context:**
- Verify middleware configuration
- Check request object availability
- Confirm user session handling

**Dashboard not loading:**
- Check admin authentication
- Verify database queries
- Check console for React errors

## 🎯 Quick Validation Commands

```bash
# 1. Check database tables
mysql -e "SHOW TABLES LIKE 'error%';" your_database

# 2. Test API endpoint
curl -X POST localhost:3000/api/test/error -d '{"test":true}'

# 3. Check error counts
mysql -e "SELECT COUNT(*) FROM error_logs;" your_database

# 4. Verify recent errors
mysql -e "SELECT message, severity, created_at FROM error_logs ORDER BY created_at DESC LIMIT 3;" your_database
```

---

**Status**: Ready for testing ✅  
**Time to Test**: ~10 minutes  
**Expected Results**: All error logging features functional
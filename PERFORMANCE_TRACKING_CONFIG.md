# Performance Tracking Configuration

## Environment Variables

Add these to your `.env.local` file:

```env
# ============================================================================
# PERFORMANCE TRACKING CONFIGURATION
# ============================================================================

# Enable/Disable Performance Tracking
# Set to 'true' to start collecting performance metrics
ENABLE_PERFORMANCE_TRACKING=false

# Client-side performance tracking (web vitals, page load times)
# Set to 'true' to enable browser-based performance tracking
NEXT_PUBLIC_ENABLE_PERFORMANCE_TRACKING=false

# Track all API endpoints (can generate lots of data)
# Set to 'true' to track all APIs, 'false' to only track monitored paths
TRACK_ALL_APIS=false

# ============================================================================
# GOOGLE ANALYTICS 4 CONFIGURATION
# ============================================================================

# Your GA4 Property ID (numbers only, e.g., 123456789)
GA4_PROPERTY_ID=

# GA4 Service Account Credentials (JSON as single line)
# Copy entire JSON content from your downloaded credentials file
GA4_CREDENTIALS_JSON=

# Alternative: Path to credentials file (for development)
# GA4_CREDENTIALS_PATH=./config/ga4-credentials.json

# ============================================================================
# DATA RETENTION (CLEANUP CONFIGURATION)
# ============================================================================

# How many days to keep performance metrics (default: 90)
CLEANUP_PERFORMANCE_METRICS_DAYS=90

# How many days to keep API metrics (default: 90)
CLEANUP_API_METRICS_DAYS=90

# How many days to keep resolved errors (default: 30)
CLEANUP_RESOLVED_ERRORS_DAYS=30

# How many days to keep unresolved errors (default: 180)
CLEANUP_UNRESOLVED_ERRORS_DAYS=180

# How many days to keep database query logs (default: 30)
CLEANUP_QUERY_LOGS_DAYS=30

# How many days to keep health checks (default: 30)
CLEANUP_HEALTH_CHECKS_DAYS=30
```

## Quick Start Guide

### Step 1: Enable Performance Tracking (Optional)

To start collecting performance metrics:

```env
ENABLE_PERFORMANCE_TRACKING=true
NEXT_PUBLIC_ENABLE_PERFORMANCE_TRACKING=true
```

### Step 2: Configure GA4 (Optional)

Follow the [GA4_CONFIGURATION_GUIDE.md](./GA4_CONFIGURATION_GUIDE.md) to set up:

```env
GA4_PROPERTY_ID=your_property_id
GA4_CREDENTIALS_JSON={"type":"service_account",...}
```

### Step 3: Restart Your Application

```powershell
# Stop the dev server (Ctrl+C)
# Start it again
npm run dev
```

### Step 4: Verify Setup

1. Visit: http://localhost:3000/super-admin/analytics/traffic
   - Should show "📊 Live GA4 Data" if GA4 configured
   
2. Visit: http://localhost:3000/super-admin/analytics/performance
   - Will show "🔧 Demo Data" until metrics are collected

3. Check tracking: http://localhost:3000/api/tracking/health
   - Should return { "status": "healthy" }

## Testing Performance Tracking

### Test 1: Health Check

```powershell
curl http://localhost:3000/api/tracking/health
```

Expected: `{"success":true,"status":"healthy",...}`

### Test 2: Manual Performance Metric

```powershell
curl -X POST http://localhost:3000/api/tracking/performance `
  -H "Content-Type: application/json" `
  -d '{"page":"/test","metricType":"PAGE_LOAD","value":1234}'
```

Expected: `{"success":true}`

### Test 3: Manual Error Log

```powershell
curl -X POST http://localhost:3000/api/tracking/error `
  -H "Content-Type: application/json" `
  -d '{"errorType":"Test","message":"Test error","severity":"low"}'
```

Expected: `{"success":true}`

### Test 4: Check Database

```powershell
npx prisma studio
```

Navigate to:
- `PerformanceMetric` table - should see your test metric
- `ErrorLog` table - should see your test error

## Automated Cleanup

### Manual Cleanup

Run the cleanup script manually:

```powershell
npx tsx scripts/cleanup-performance-data.ts
```

### API-based Cleanup

Call the cleanup endpoint (requires SUPER_ADMIN auth):

```powershell
curl -X POST http://localhost:3000/api/admin/cleanup `
  -H "Authorization: Bearer your_token"
```

### Check Cleanup Statistics

```powershell
curl http://localhost:3000/api/admin/cleanup `
  -H "Authorization: Bearer your_token"
```

### Schedule Automatic Cleanup

#### Option 1: Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Name: "Cleanup Performance Data"
4. Trigger: Daily at 2:00 AM
5. Action: Start a program
6. Program: `C:\Program Files\nodejs\node.exe`
7. Arguments: `C:\Projects\Zyphex-Tech\scripts\cleanup-performance-data.ts`
8. Start in: `C:\Projects\Zyphex-Tech`

#### Option 2: Node.js Cron Job

Install node-cron:

```powershell
npm install node-cron @types/node-cron
```

Create cron job (add to your server startup):

```typescript
// server.ts or separate cron service
import cron from 'node-cron'
import { cleanupPerformanceData } from './scripts/cleanup-performance-data'

// Run cleanup daily at 2:00 AM
cron.schedule('0 2 * * *', async () => {
  console.log('Running scheduled performance data cleanup...')
  try {
    await cleanupPerformanceData()
    console.log('Cleanup completed successfully')
  } catch (error) {
    console.error('Cleanup failed:', error)
  }
})
```

#### Option 3: Vercel Cron (for production)

Create `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/admin/cleanup",
    "schedule": "0 2 * * *"
  }]
}
```

## Performance Impact

### With Tracking Enabled

- **Client-side**: ~1-2ms overhead per page load
- **Server-side**: ~5-10ms per API request
- **Database**: Minimal impact with proper indexing

### Recommendations

- ✅ Enable in production for insights
- ✅ Monitor database size
- ✅ Run cleanup weekly
- ⚠️ Consider disabling for high-traffic APIs
- ⚠️ Set `TRACK_ALL_APIS=false` to reduce data

## Troubleshooting

### No Data Collecting

1. Check environment variables are set
2. Restart dev server
3. Check browser console for errors
4. Verify database tables exist

### High Database Size

1. Run cleanup script
2. Reduce retention days
3. Disable tracking for high-traffic endpoints

### GA4 Not Working

1. Follow [GA4_CONFIGURATION_GUIDE.md](./GA4_CONFIGURATION_GUIDE.md)
2. Verify credentials format
3. Check service account permissions

## Production Checklist

- [ ] Database tables created (`npx prisma db push`)
- [ ] GA4 configured (optional)
- [ ] Performance tracking enabled (optional)
- [ ] Cleanup schedule configured
- [ ] Monitoring alerts set up
- [ ] Data retention policy documented
- [ ] GDPR/privacy compliance reviewed

---

**Status**: Configuration Ready ✅
**Next**: Enable tracking and configure GA4

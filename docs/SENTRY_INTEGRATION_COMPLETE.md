# Sentry Error Monitoring Integration - Complete Setup

**Date**: October 11, 2025  
**Status**: ✅ **INSTALLED & CONFIGURED**  
**Package**: `@sentry/nextjs@10.19.0`

---

## 📦 What Was Installed

```bash
npm install @sentry/nextjs --legacy-peer-deps
# Added 111 packages
# Total packages: 1,366
```

---

## 📁 Files Created

### 1. `sentry.client.config.ts` ✅
**Purpose**: Client-side error monitoring (browser)
- Session replay integration
- Performance monitoring (10% sample rate in production)
- Filters common browser extension errors
- Masks sensitive data in replays

### 2. `sentry.server.config.ts` ✅
**Purpose**: Server-side error monitoring (API routes, SSR)
- Performance monitoring
- Server-side exception tracking
- Same error filtering as client

### 3. `sentry.edge.config.ts` ✅
**Purpose**: Edge runtime monitoring (Middleware, Edge API routes)
- Lightweight configuration for edge functions
- Performance tracking

### 4. Updated `next.config.mjs` ✅
**Changes**:
- Integrated `withSentryConfig` wrapper
- Configured source map upload
- Added monitoring tunnel route (`/monitoring`)
- Automatic instrumentation enabled

### 5. Updated `.env.example` ✅
**Added**:
```bash
NEXT_PUBLIC_SENTRY_DSN="your-sentry-dsn-here"
SENTRY_DEV_MODE="false"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

---

## 🔑 Sentry Project Details

From the wizard setup:

**Organization**: `zyphex-tech`  
**Project**: `javascript-nextjs`  
**Platform**: Next.js  
**Account**: Created during wizard run  

**Get Your DSN**:
1. Go to: https://sentry.io/settings/zyphex-tech/projects/javascript-nextjs/keys/
2. Copy the "Client Keys (DSN)" value
3. Add to `.env` file

---

## ⚙️ Configuration Setup

### Step 1: Add Sentry DSN to `.env`

```bash
# Add to your .env file (NOT .env.example)
NEXT_PUBLIC_SENTRY_DSN="https://your-key@your-org.ingest.sentry.io/your-project-id"

# Optional: Enable Sentry in development
SENTRY_DEV_MODE="true"

# Set your app version for release tracking
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

### Step 2: Verify Installation

```bash
# Type check should pass
npm run type-check

# Build should succeed
npm run build

# Dev server should start
npm run dev
```

### Step 3: Test Error Tracking

Create a test error in any component:

```typescript
// Example: In any page or component
<button onClick={() => {
  throw new Error("Test Sentry Error!");
}}>
  Trigger Test Error
</button>
```

Then check Sentry dashboard: https://sentry.io/organizations/zyphex-tech/issues/

---

## 🎯 Sentry Features Enabled

### ✅ Error Tracking
- Automatic exception capture
- Stack traces with source maps
- User context (if authenticated)
- Breadcrumbs (user actions before error)

### ✅ Performance Monitoring
- **Sample Rate**: 10% in production, 100% in development
- Transaction tracking
- API route performance
- Page load times
- Server-side rendering metrics

### ✅ Session Replay
- **Enabled**: On errors (100% sample rate)
- **Regular Sessions**: 10% in production
- **Privacy**: All text masked, media blocked
- **Use Case**: See exactly what user did before error

### ✅ Release Tracking
- Linked to `NEXT_PUBLIC_APP_VERSION` env var
- Track errors per deployment
- Monitor regression between releases

### ✅ Environment Separation
- Development vs Production tracking
- Option to disable in development (`SENTRY_DEV_MODE=false`)

---

## 🔒 Security & Privacy

### Data Masking
```typescript
// In sentry.client.config.ts
integrations: [
  Sentry.replayIntegration({
    maskAllText: true,        // Masks all text content
    blockAllMedia: true,      // Blocks images/videos
  }),
]
```

### Filtered Errors
The following are **NOT** sent to Sentry:
- Browser extension errors
- Facebook SDK errors
- Third-party plugin errors
- Chrome extension interference
- Development environment errors (unless `SENTRY_DEV_MODE=true`)

### Source Map Privacy
```typescript
// In next.config.mjs
hideSourceMaps: true,  // Source maps hidden from production bundles
```

---

## 📊 Sentry Dashboard Access

### Main Dashboard
https://sentry.io/organizations/zyphex-tech/projects/javascript-nextjs/

### Key Sections

1. **Issues** - All captured errors
   https://sentry.io/organizations/zyphex-tech/issues/

2. **Performance** - Transaction monitoring
   https://sentry.io/organizations/zyphex-tech/performance/

3. **Replays** - Session recordings
   https://sentry.io/organizations/zyphex-tech/replays/

4. **Releases** - Version tracking
   https://sentry.io/organizations/zyphex-tech/releases/

5. **Alerts** - Configure notifications
   https://sentry.io/organizations/zyphex-tech/alerts/

---

## 🚀 Usage Examples

### Manual Error Capture

```typescript
import * as Sentry from "@sentry/nextjs";

try {
  // Your code
  await riskyOperation();
} catch (error) {
  // Capture with additional context
  Sentry.captureException(error, {
    tags: {
      section: "payment-processing",
      user_role: "admin"
    },
    extra: {
      orderId: "12345",
      amount: 100.50
    }
  });
}
```

### Custom Events

```typescript
import * as Sentry from "@sentry/nextjs";

// Log important business events
Sentry.captureMessage("User completed onboarding", {
  level: "info",
  tags: { feature: "onboarding" }
});
```

### Add User Context

```typescript
import * as Sentry from "@sentry/nextjs";

// In your authentication code
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.name,
  role: user.role
});

// Clear on logout
Sentry.setUser(null);
```

### Performance Tracking

```typescript
import * as Sentry from "@sentry/nextjs";

// Track custom performance
const transaction = Sentry.startTransaction({
  name: "Process Large Report",
  op: "task"
});

const span = transaction.startChild({
  op: "db.query",
  description: "Fetch report data"
});

// Your code
await fetchReportData();

span.finish();
transaction.finish();
```

---

## 🎛️ Configuration Options

### Adjust Sample Rates

Edit `sentry.client.config.ts` and `sentry.server.config.ts`:

```typescript
// More aggressive in production
tracesSampleRate: 0.5,  // 50% of transactions

// More replays
replaysSessionSampleRate: 0.2,  // 20% of sessions
```

### Enable Development Tracking

```bash
# In .env
SENTRY_DEV_MODE="true"
```

### Filter Specific Errors

Add to `ignoreErrors` array in config files:

```typescript
ignoreErrors: [
  'NetworkError',
  'ResizeObserver loop limit exceeded',
  // Add your patterns here
],
```

---

## 📈 Monitoring Recommendations

### Set Up Alerts
1. Go to Sentry → Alerts
2. Create alert for:
   - New issues
   - Issue spike (>10% increase)
   - High error rate (>100 errors/hour)
   - Performance degradation

### Weekly Review
- Check top errors by volume
- Review new issues
- Monitor performance trends
- Check user feedback

### Monthly Audit
- Review alert thresholds
- Update ignored errors list
- Check source map uploads
- Verify release tracking

---

## 🐛 Troubleshooting

### Errors Not Appearing in Sentry

1. **Check DSN is set**:
   ```bash
   echo $NEXT_PUBLIC_SENTRY_DSN
   ```

2. **Verify Sentry is initialized**:
   ```bash
   # Check browser console for Sentry logs
   # Should see "Sentry initialized" (if debug: true)
   ```

3. **Test with manual capture**:
   ```typescript
   Sentry.captureMessage("Test from production");
   ```

### Source Maps Not Uploading

1. **Check authentication**:
   ```bash
   # Add to .env
   SENTRY_AUTH_TOKEN="your-auth-token"
   ```

2. **Verify organization/project names** in `next.config.mjs`

### Performance Issues

If Sentry impacts performance:
1. Reduce `tracesSampleRate` to 0.01 (1%)
2. Disable session replay: `replaysSessionSampleRate: 0`
3. Use `tunnelRoute` to bypass ad-blockers

---

## 💰 Sentry Pricing Notes

**Free Tier Includes**:
- 5,000 errors/month
- 10,000 performance units/month
- 50 replays/month
- 1 team member

**When to Upgrade**:
- Exceeding error quota
- Need more team members
- Want longer data retention (90 days on paid plans)
- Need priority support

---

## ✅ Next Steps

1. **Add DSN to `.env`** - Get from Sentry dashboard
2. **Test in development** - Trigger test errors
3. **Deploy to production** - Verify errors are captured
4. **Set up alerts** - Get notified of critical issues
5. **Integrate with Slack/Discord** - Real-time notifications
6. **Review weekly** - Monitor error trends

---

## 📚 Additional Resources

- **Sentry Next.js Docs**: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Best Practices**: https://docs.sentry.io/platforms/javascript/best-practices/
- **Performance Monitoring**: https://docs.sentry.io/product/performance/
- **Session Replay**: https://docs.sentry.io/product/session-replay/

---

**Status**: ✅ Sentry fully integrated and ready to use  
**Action Required**: Add `NEXT_PUBLIC_SENTRY_DSN` to `.env` file  
**Estimated Setup Time**: 5 minutes


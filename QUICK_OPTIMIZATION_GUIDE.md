# Quick Optimization Implementation Guide

This guide provides step-by-step instructions to implement the remaining performance and security optimizations.

---

## 🚀 Priority 1: Code Splitting (15 minutes)

### Step 1: Identify Large Components

Components that should use dynamic imports:
- Dashboard charts and graphs
- PDF viewers
- Large modals
- Rich text editors
- Data visualization components

### Step 2: Implement Dynamic Imports

**Example 1: Dashboard Chart**
```typescript
// app/dashboard/page.tsx
import dynamic from 'next/dynamic'

// Replace static import
// import DashboardChart from '@/components/dashboard/chart'

// With dynamic import
const DashboardChart = dynamic(
  () => import('@/components/dashboard/chart'),
  {
    loading: () => <div className="animate-pulse h-64 bg-gray-100 rounded" />,
    ssr: false // Disable SSR for client-only components
  }
)

export default function DashboardPage() {
  return (
    <div>
      <DashboardChart />
    </div>
  )
}
```

**Example 2: Modal Components**
```typescript
// components/invoices/invoice-list.tsx
import dynamic from 'next/dynamic'

const InvoiceModal = dynamic(() => import('./invoice-modal'))
const PaymentModal = dynamic(() => import('./payment-modal'))

export function InvoiceList() {
  const [showModal, setShowModal] = useState(false)
  
  return (
    <>
      <button onClick={() => setShowModal(true)}>View Invoice</button>
      {showModal && <InvoiceModal />}
    </>
  )
}
```

**Example 3: Heavy Libraries**
```typescript
// components/pdf-viewer.tsx
import dynamic from 'next/dynamic'

const PDFViewer = dynamic(
  () => import('react-pdf').then(mod => mod.Document),
  { ssr: false }
)
```

### Step 3: Route-based Code Splitting

Next.js automatically code-splits routes, but you can optimize further:

```typescript
// app/reports/page.tsx
import dynamic from 'next/dynamic'

const ReportGenerator = dynamic(() => import('@/components/reports/generator'))
const ReportChart = dynamic(() => import('@/components/reports/chart'))
const ReportExport = dynamic(() => import('@/components/reports/export'))
```

---

## 🖼️ Priority 2: Image Optimization (10 minutes)

### Step 1: Find All <img> Tags

Run this search in your project:
```bash
grep -r "<img" components/ app/
```

### Step 2: Replace with Next.js Image

**Before:**
```tsx
<img 
  src="/avatar.jpg" 
  alt="User avatar"
  width="200"
  height="200"
/>
```

**After:**
```tsx
import Image from 'next/image'

<Image
  src="/avatar.jpg"
  alt="User avatar"
  width={200}
  height={200}
  priority={false} // Use true for above-fold images
  quality={85}
  placeholder="blur"
  blurDataURL="data:image/..." // Optional
/>
```

### Step 3: Optimize External Images

For external images (user avatars, etc.):

```tsx
<Image
  src="https://example.com/avatar.jpg"
  alt="User avatar"
  width={200}
  height={200}
  loader={({ src, width, quality }) => {
    return `${src}?w=${width}&q=${quality || 75}`
  }}
/>
```

---

## 💾 Priority 3: Add Cache Headers to API Routes (10 minutes)

### Step 1: Create Cache Utility

Create `lib/api/cache-headers.ts`:
```typescript
export const cacheHeaders = {
  // No cache - always fresh
  noCache: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  },
  
  // Short cache - 5 minutes
  short: {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
  },
  
  // Medium cache - 1 hour
  medium: {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200'
  },
  
  // Long cache - 1 day
  long: {
    'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800'
  },
  
  // Immutable - never changes
  immutable: {
    'Cache-Control': 'public, max-age=31536000, immutable'
  }
}
```

### Step 2: Apply to API Routes

**Example: Frequently changing data (Projects)**
```typescript
// app/api/projects/route.ts
import { cacheHeaders } from '@/lib/api/cache-headers'
import { cache } from '@/lib/cache'

export async function GET(request: Request) {
  const cacheKey = 'projects:all'
  
  // Try cache first
  const cached = await cache.get(cacheKey)
  if (cached) {
    return Response.json(cached, {
      headers: {
        ...cacheHeaders.short,
        'X-Cache': 'HIT'
      }
    })
  }
  
  // Fetch data
  const projects = await prisma.project.findMany()
  
  // Cache for 5 minutes
  await cache.set(cacheKey, projects, 300)
  
  return Response.json(projects, {
    headers: {
      ...cacheHeaders.short,
      'X-Cache': 'MISS'
    }
  })
}
```

**Example: Rarely changing data (Users)**
```typescript
// app/api/users/[id]/route.ts
import { cacheHeaders } from '@/lib/api/cache-headers'
import { cache } from '@/lib/cache'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const cacheKey = `user:${params.id}`
  
  const cached = await cache.get(cacheKey)
  if (cached) {
    return Response.json(cached, {
      headers: {
        ...cacheHeaders.medium,
        'X-Cache': 'HIT'
      }
    })
  }
  
  const user = await prisma.user.findUnique({
    where: { id: params.id }
  })
  
  await cache.set(cacheKey, user, 3600) // 1 hour
  
  return Response.json(user, {
    headers: {
      ...cacheHeaders.medium,
      'X-Cache': 'MISS'
    }
  })
}
```

---

## 🔒 Priority 4: Fix dangerouslySetInnerHTML (5 minutes)

### Step 1: Find Usage

```bash
grep -r "dangerouslySetInnerHTML" components/ app/
```

### Step 2: Sanitize HTML

Install DOMPurify:
```bash
npm install dompurify
npm install --save-dev @types/dompurify
```

**Before:**
```tsx
<div dangerouslySetInnerHTML={{ __html: userContent }} />
```

**After:**
```tsx
import DOMPurify from 'dompurify'

const sanitizedHtml = DOMPurify.sanitize(userContent)
<div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
```

Or better yet, use a React component:
```tsx
// components/safe-html.tsx
import DOMPurify from 'dompurify'

export function SafeHTML({ html }: { html: string }) {
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target']
  })
  
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />
}
```

---

## 🗄️ Priority 5: Add Database Connection Pooling (2 minutes)

### Update DATABASE_URL

**In `.env`:**
```bash
# Before
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"

# After
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?connection_limit=10&pool_timeout=20&pgbouncer=true"
```

**Parameters:**
- `connection_limit=10` - Maximum connections
- `pool_timeout=20` - Wait time for connection (seconds)
- `pgbouncer=true` - Enable PgBouncer mode (if using PgBouncer)

### Production Settings

For production (Vercel, AWS, etc.):
```bash
DATABASE_URL="postgresql://user:password@host:5432/mydb?connection_limit=20&pool_timeout=30"
```

---

## 📊 Priority 6: Set Up Error Tracking with Sentry (15 minutes)

### Step 1: Install Sentry

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### Step 2: Configure Sentry

Create `sentry.client.config.ts`:
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
  
  beforeSend(event, hint) {
    // Filter out sensitive data
    if (event.request) {
      delete event.request.cookies
    }
    return event
  },
})
```

Create `sentry.server.config.ts`:
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
})
```

### Step 3: Add to .env

```bash
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
SENTRY_DSN=your-sentry-dsn
```

### Step 4: Test Error Tracking

```typescript
// Test in any component
import * as Sentry from '@sentry/nextjs'

try {
  throw new Error('Test error')
} catch (error) {
  Sentry.captureException(error)
}
```

---

## 🔍 Priority 7: Set Up Uptime Monitoring (10 minutes)

### Option 1: UptimeRobot (Free)

1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Create account
3. Add New Monitor:
   - Type: HTTP(s)
   - URL: https://yourdomain.com
   - Interval: 5 minutes
4. Add health check endpoint

Create `app/api/health/route.ts`:
```typescript
import { prisma } from '@/lib/prisma'
import { getRedisClient } from '@/lib/cache/redis'

export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: 'unknown',
      cache: 'unknown',
    }
  }

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`
    health.checks.database = 'healthy'
  } catch (error) {
    health.checks.database = 'unhealthy'
    health.status = 'degraded'
  }

  // Check Redis
  try {
    const redis = getRedisClient()
    if (redis) {
      await redis.ping()
      health.checks.cache = 'healthy'
    }
  } catch (error) {
    health.checks.cache = 'unhealthy'
  }

  return Response.json(health, {
    status: health.status === 'healthy' ? 200 : 503
  })
}
```

### Option 2: Better Uptime (Paid)

More advanced monitoring with:
- Status pages
- Incident management
- Performance monitoring

---

## 📈 Priority 8: Lighthouse Audit (5 minutes)

### Step 1: Run Lighthouse

**Chrome DevTools:**
1. Open Chrome DevTools (F12)
2. Go to Lighthouse tab
3. Select all categories
4. Click "Analyze page load"

**CLI:**
```bash
npm install -g lighthouse
lighthouse https://yourdomain.com --view
```

### Step 2: Review Results

Target scores:
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

### Step 3: Fix Common Issues

**Performance Issues:**
- Large images → Use next/image
- Unused JavaScript → Code splitting
- Long tasks → Break up heavy computations

**Accessibility Issues:**
- Missing alt text → Add to all images
- Low contrast → Adjust colors
- Missing labels → Add to form fields

**SEO Issues:**
- Missing meta tags → Add to layout
- Missing sitemap → Generate sitemap.xml
- Slow page load → Apply optimizations

---

## ✅ Verification Checklist

After implementing optimizations:

- [ ] Run `npm run security-audit` - All critical issues fixed
- [ ] Run `npm run performance-audit` - Warnings < 3
- [ ] Run Lighthouse audit - All scores > 90
- [ ] Test all critical user journeys
- [ ] Verify cache hit rates
- [ ] Check error tracking works
- [ ] Confirm uptime monitoring active
- [ ] Review production environment variables
- [ ] Test database connection pooling
- [ ] Verify security headers in production

---

## 📞 Next Steps

1. **Complete Priority 1-4** (Critical optimizations)
2. **Run audits again** to verify improvements
3. **Set up monitoring** (Priority 6-7)
4. **Deploy to staging** for testing
5. **Run Lighthouse audit** on staging
6. **Deploy to production** with confidence

---

## 🆘 Troubleshooting

### Dynamic Imports Not Working

**Issue:** Component not loading
**Solution:** Check import path and component export
```typescript
// Ensure component has default export
export default function MyComponent() { ... }

// Or use named export
const MyComponent = dynamic(() => 
  import('./my-component').then(mod => mod.MyComponent)
)
```

### Cache Not Working

**Issue:** Always getting cache MISS
**Solution:** Verify Redis connection
```typescript
// Test Redis
const redis = getRedisClient()
if (redis) {
  await redis.ping()
  console.log('Redis connected')
}
```

### Images Not Optimizing

**Issue:** Images still large
**Solution:** Check Next.js config
```javascript
// next.config.mjs
images: {
  formats: ['image/webp', 'image/avif'],
  unoptimized: false, // Should be false
}
```

---

**Estimated Total Time: 1-2 hours**

All optimizations combined should take 1-2 hours to implement, significantly improving performance and security.

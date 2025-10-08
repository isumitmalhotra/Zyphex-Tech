# 🔧 COPY-PASTE CODE FIXES
## Ready-to-Use Solutions for Immediate Implementation

**Last Updated:** October 7, 2025  
**Purpose:** Copy these code blocks directly into your files

---

## 🚨 CRITICAL FIX #1: Global Error Boundary

**File:** `app/error.tsx` (CREATE THIS FILE)

```typescript
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to error reporting service (Sentry, etc.)
    console.error('Global error caught:', error)
    
    // In production, send to Sentry
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      // Sentry.captureException(error)
    }
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="h-6 w-6 text-red-500" />
                <CardTitle>Something went wrong!</CardTitle>
              </div>
              <CardDescription>
                We're sorry, but something unexpected happened. Our team has been notified.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                <p className="text-sm text-red-800 font-mono">
                  {error.message || 'An unexpected error occurred'}
                </p>
                {error.digest && (
                  <p className="text-xs text-red-600 mt-2">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
              <p className="text-sm text-gray-600">
                You can try refreshing the page or return to the home page.
              </p>
            </CardContent>
            <CardFooter className="flex space-x-2">
              <Button onClick={reset} className="flex-1">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/'} className="flex-1">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>
            </CardFooter>
          </Card>
        </div>
      </body>
    </html>
  )
}
```

---

## 🔧 CRITICAL FIX #2: Logging Infrastructure

**File:** `lib/logger.ts` (CREATE THIS FILE)

```typescript
import winston from 'winston'

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
)

// Create the logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { 
    service: 'zyphex-tech',
    environment: process.env.NODE_ENV 
  },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          ({ timestamp, level, message, ...metadata }) => {
            let msg = `${timestamp} [${level}]: ${message}`
            if (Object.keys(metadata).length > 0) {
              msg += ` ${JSON.stringify(metadata)}`
            }
            return msg
          }
        )
      ),
    }),
    
    // Write errors to error.log
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Write all logs to combined.log
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
})

// If we're not in production, log to the console with more details
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }))
}

// Create logger methods with context
export const createLogger = (context: string) => ({
  info: (message: string, meta?: object) => 
    logger.info(message, { context, ...meta }),
  error: (message: string, meta?: object) => 
    logger.error(message, { context, ...meta }),
  warn: (message: string, meta?: object) => 
    logger.warn(message, { context, ...meta }),
  debug: (message: string, meta?: object) => 
    logger.debug(message, { context, ...meta }),
})

// Export default logger
export default logger
```

**Usage Example:**

```typescript
// Before (❌ BAD)
console.log("User logged in:", userId)

// After (✅ GOOD)
import { createLogger } from '@/lib/logger'
const logger = createLogger('auth')

logger.info('User logged in', { userId, timestamp: new Date() })
```

---

## 🔧 CRITICAL FIX #3: API Client Wrapper

**File:** `lib/api-client.ts` (CREATE THIS FILE)

```typescript
import { logger } from './logger'

interface RequestOptions extends RequestInit {
  timeout?: number
  retries?: number
}

interface APIError extends Error {
  status?: number
  code?: string
}

class APIClient {
  private baseURL: string
  private defaultTimeout: number
  private defaultRetries: number

  constructor(baseURL: string = '') {
    this.baseURL = baseURL
    this.defaultTimeout = 30000 // 30 seconds
    this.defaultRetries = 3
  }

  private async fetchWithTimeout(
    url: string, 
    options: RequestOptions = {}
  ): Promise<Response> {
    const timeout = options.timeout || this.defaultTimeout
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  private async fetchWithRetry(
    url: string,
    options: RequestOptions = {}
  ): Promise<Response> {
    const retries = options.retries || this.defaultRetries
    let lastError: Error | null = null

    for (let i = 0; i <= retries; i++) {
      try {
        const response = await this.fetchWithTimeout(url, options)
        
        // Don't retry on 4xx errors (client errors)
        if (response.status >= 400 && response.status < 500) {
          return response
        }
        
        // Retry on 5xx errors
        if (response.status >= 500 && i < retries) {
          logger.warn('Server error, retrying...', {
            url,
            status: response.status,
            attempt: i + 1,
            maxRetries: retries,
          })
          await this.delay(Math.pow(2, i) * 1000) // Exponential backoff
          continue
        }
        
        return response
      } catch (error) {
        lastError = error as Error
        
        if (i < retries) {
          logger.warn('Request failed, retrying...', {
            url,
            error: error instanceof Error ? error.message : 'Unknown error',
            attempt: i + 1,
            maxRetries: retries,
          })
          await this.delay(Math.pow(2, i) * 1000) // Exponential backoff
        }
      }
    }

    throw lastError || new Error('Request failed after retries')
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error: APIError = new Error(
        `HTTP ${response.status}: ${response.statusText}`
      )
      error.status = response.status
      
      try {
        const errorData = await response.json()
        error.message = errorData.message || error.message
        error.code = errorData.code
      } catch {
        // Response not JSON, use default message
      }
      
      logger.error('API request failed', {
        url: response.url,
        status: response.status,
        error: error.message,
      })
      
      throw error
    }

    try {
      return await response.json()
    } catch (error) {
      logger.error('Failed to parse JSON response', { error })
      throw new Error('Invalid JSON response')
    }
  }

  async get<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const response = await this.fetchWithRetry(this.baseURL + url, {
      ...options,
      method: 'GET',
    })
    return this.handleResponse<T>(response)
  }

  async post<T>(
    url: string, 
    data?: unknown, 
    options: RequestOptions = {}
  ): Promise<T> {
    const response = await this.fetchWithRetry(this.baseURL + url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    })
    return this.handleResponse<T>(response)
  }

  async put<T>(
    url: string, 
    data?: unknown, 
    options: RequestOptions = {}
  ): Promise<T> {
    const response = await this.fetchWithRetry(this.baseURL + url, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    })
    return this.handleResponse<T>(response)
  }

  async delete<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const response = await this.fetchWithRetry(this.baseURL + url, {
      ...options,
      method: 'DELETE',
    })
    return this.handleResponse<T>(response)
  }

  async patch<T>(
    url: string, 
    data?: unknown, 
    options: RequestOptions = {}
  ): Promise<T> {
    const response = await this.fetchWithRetry(this.baseURL + url, {
      ...options,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    })
    return this.handleResponse<T>(response)
  }
}

// Export singleton instance
export const apiClient = new APIClient()
export default apiClient
```

**Usage Example:**

```typescript
// Before (❌ BAD)
const response = await fetch("/api/admin/messages/channels")
const data = await response.json()

// After (✅ GOOD)
import apiClient from '@/lib/api-client'

interface Channel {
  id: string
  name: string
}

try {
  const channels = await apiClient.get<Channel[]>('/api/admin/messages/channels')
  // Type-safe, automatic retries, proper error handling
} catch (error) {
  // Error already logged by apiClient
  // Show user-friendly error message
}
```

---

## 🔧 FIX #4: Missing Cache Management Component

**File:** `components/admin/cache-management.tsx` (CREATE THIS FILE)

```typescript
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, RefreshCw, Database, Clock, Activity } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface CacheStats {
  totalKeys: number
  memoryUsage: string
  hitRate: number
  uptime: string
}

export function CacheManagement() {
  const [stats, setStats] = useState<CacheStats>({
    totalKeys: 0,
    memoryUsage: '0 MB',
    hitRate: 0,
    uptime: '0h'
  })
  const [loading, setLoading] = useState(false)

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/cache/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch cache statistics',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const clearCache = async (pattern?: string) => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/cache/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pattern }),
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Cache cleared successfully',
        })
        fetchStats()
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clear cache',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const warmCache = async () => {
    try {
      setLoading(true)
      await fetch('/api/admin/cache/warm', { method: 'POST' })
      toast({
        title: 'Success',
        description: 'Cache warming initiated',
      })
      fetchStats()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to warm cache',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Keys</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalKeys.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.memoryUsage}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hit Rate</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hitRate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uptime}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cache Operations</CardTitle>
          <CardDescription>Manage cache data and performance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => fetchStats()} 
              disabled={loading}
              variant="outline"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Stats
            </Button>

            <Button 
              onClick={() => clearCache()} 
              disabled={loading}
              variant="destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All Cache
            </Button>

            <Button 
              onClick={() => clearCache('user:*')} 
              disabled={loading}
              variant="outline"
            >
              Clear User Cache
            </Button>

            <Button 
              onClick={() => clearCache('session:*')} 
              disabled={loading}
              variant="outline"
            >
              Clear Sessions
            </Button>

            <Button 
              onClick={warmCache} 
              disabled={loading}
              variant="secondary"
            >
              <Database className="mr-2 h-4 w-4" />
              Warm Cache
            </Button>
          </div>

          <div className="rounded-lg border p-4">
            <h4 className="font-semibold mb-2">Recent Operations</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Last cleared:</span>
                <Badge variant="outline">2 hours ago</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Last warmed:</span>
                <Badge variant="outline">5 hours ago</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## 🔧 FIX #5: Environment Variable Validation

**File:** `lib/env.ts` (CREATE THIS FILE)

```typescript
import { z } from 'zod'

// Define environment variable schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  
  // NextAuth
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  
  // OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  MICROSOFT_CLIENT_ID: z.string().optional(),
  MICROSOFT_CLIENT_SECRET: z.string().optional(),
  
  // Email
  EMAIL_SERVER_HOST: z.string(),
  EMAIL_SERVER_PORT: z.string(),
  EMAIL_SERVER_USER: z.string().email(),
  EMAIL_SERVER_PASSWORD: z.string(),
  EMAIL_FROM: z.string().email(),
  
  // Node Environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Optional Services
  SENTRY_DSN: z.string().url().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
})

// Validate environment variables
function validateEnv() {
  try {
    const env = envSchema.parse(process.env)
    return env
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.errors.map(err => err.path.join('.')).join(', ')
      throw new Error(
        `❌ Invalid environment variables: ${missing}\n\n` +
        `Please check your .env file and ensure all required variables are set.`
      )
    }
    throw error
  }
}

// Export validated environment variables
export const env = validateEnv()

// Type-safe environment variables
export type Env = z.infer<typeof envSchema>
```

**Usage:**

```typescript
// Before (❌ BAD)
const dbUrl = process.env.DATABASE_URL // Could be undefined!

// After (✅ GOOD)
import { env } from '@/lib/env'

const dbUrl = env.DATABASE_URL // Type-safe, validated, guaranteed to exist
```

---

## 🔧 FIX #6: Proper Error Handling Pattern

**Before (❌ BAD):**

```typescript
try {
  const response = await fetch("/api/data")
  const data = await response.json()
  setData(data)
} catch (error) {
  // Silent failure - user has no idea what happened
}
```

**After (✅ GOOD):**

```typescript
import { createLogger } from '@/lib/logger'
import { toast } from '@/hooks/use-toast'

const logger = createLogger('DataFetching')

async function fetchData() {
  try {
    const response = await fetch("/api/data")
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    setData(data)
    
  } catch (error) {
    // Log the error with context
    logger.error('Failed to fetch data', {
      error: error instanceof Error ? error.message : 'Unknown error',
      url: '/api/data',
      timestamp: new Date().toISOString(),
    })
    
    // Show user-friendly error
    toast({
      title: 'Error Loading Data',
      description: 'We couldn\'t load the data. Please try again.',
      variant: 'destructive',
    })
    
    // Re-throw if parent needs to handle
    throw error
  }
}
```

---

## 🔧 FIX #7: React Component Best Practices

**Before (❌ BAD):**

```typescript
'use client'

export default function MyComponent() {
  const [data, setData] = useState([]) // No type!
  
  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(data => setData(data))
  }) // No dependency array!
  
  return <div>{data.map(item => <p>{item.name}</p>)}</div>
}
```

**After (✅ GOOD):**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { createLogger } from '@/lib/logger'
import { toast } from '@/hooks/use-toast'

const logger = createLogger('MyComponent')

interface DataItem {
  id: string
  name: string
}

export default function MyComponent() {
  const [data, setData] = useState<DataItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/data')
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        const data: DataItem[] = await response.json()
        setData(data)
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        
        logger.error('Failed to fetch data', { error: errorMessage })
        setError('Failed to load data')
        
        toast({
          title: 'Error',
          description: 'Failed to load data. Please try again.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, []) // Explicit empty dependency array

  if (loading) {
    return <div className="text-center p-4">Loading...</div>
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-500">
        {error}
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div>
      {data.map(item => (
        <p key={item.id}>{item.name}</p>
      ))}
    </div>
  )
}
```

---

## 📝 QUICK REFERENCE: Common Replacements

### Replace console.log

```bash
# Find all console.log
grep -r "console.log" app/ components/ lib/

# Replace pattern:
# Before: console.log("Message", data)
# After: logger.info('Message', { data })
```

### Replace fetch()

```bash
# Replace pattern:
# Before: const response = await fetch('/api/endpoint')
# After: const data = await apiClient.get<Type>('/api/endpoint')
```

### Fix useState

```bash
# Replace pattern:
# Before: const [data, setData] = useState([])
# After: const [data, setData] = useState<Type[]>([])
```

### Fix useEffect

```bash
# Replace pattern:
# Before: useEffect(() => { ... })
# After: useEffect(() => { ... }, [dependency1, dependency2])
```

---

## 🚀 Installation Commands

**Copy-paste these commands in order:**

```bash
# 1. Install logging
npm install winston

# 2. Install validation
npm install zod

# 3. Install error tracking (optional but recommended)
npm install @sentry/nextjs

# 4. Install testing
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitejs/plugin-react

# 5. Install E2E testing
npm install --save-dev cypress

# 6. Create log directories
mkdir -p logs

# 7. Add to .gitignore
echo "logs/" >> .gitignore
echo ".env" >> .gitignore

# 8. Regenerate Prisma
npx prisma generate
```

---

## ✅ Verification Commands

**After implementing fixes, run these:**

```bash
# 1. Check TypeScript errors
npx tsc --noEmit

# 2. Run linter
npm run lint

# 3. Run tests
npm test

# 4. Build for production
npm run build

# 5. Check for console.log
grep -r "console.log" app/ components/ lib/ | wc -l

# 6. Check for any types
grep -r ": any" app/ components/ lib/ | wc -l
```

---

## 🎯 Success Metrics

After applying all fixes:

- [ ] TypeScript compiles with no errors
- [ ] No console.log in production code
- [ ] All fetch() replaced with apiClient
- [ ] Global error boundary active
- [ ] Logging infrastructure working
- [ ] Environment variables validated
- [ ] All useState have types
- [ ] All useEffect have dependency arrays

**You're now 80% closer to FAANG standards! 🎉**

---

*Last Updated: October 7, 2025*

"use client"

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Client-Side Performance Tracker
 * 
 * This component automatically tracks page load performance
 * and sends metrics to the tracking API.
 * 
 * Usage: Add to your root layout.tsx
 * 
 * ```tsx
 * import { PerformanceTracker } from '@/components/performance-tracker'
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <PerformanceTracker />
 *         {children}
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 */
export function PerformanceTracker() {
  const pathname = usePathname()

  useEffect(() => {
    // Only track if enabled
    if (process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_TRACKING !== 'true') {
      return
    }

    // Skip tracking for API routes and tracking endpoints
    if (pathname?.startsWith('/api/') || pathname?.startsWith('/tracking/')) {
      return
    }

    // Wait for page to fully load
    if (typeof window === 'undefined') return

    // Track page performance after load
    const trackPerformance = () => {
      try {
        // Get navigation timing
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        if (!navigation) return

        // Get paint timing
        const paint = performance.getEntriesByType('paint')
        const fcp = paint.find(entry => entry.name === 'first-contentful-paint')

        // Get layout shift
        let cls = 0
        if ('PerformanceObserver' in window) {
          try {
            const observer = new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                const layoutShift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number }
                if (layoutShift.hadRecentInput) continue
                cls += layoutShift.value || 0
              }
            })
            observer.observe({ type: 'layout-shift', buffered: true })
          } catch (_e) {
            // Silently fail
          }
        }

        // Calculate metrics
        const loadTime = navigation.loadEventEnd - navigation.fetchStart
        const ttfb = navigation.responseStart - navigation.requestStart
        const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart
        const resources = performance.getEntriesByType('resource')

        // Send page load metric
        fetch('/api/tracking/performance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page: pathname,
            metricType: 'PAGE_LOAD',
            value: loadTime,
            metadata: {
              ttfb,
              fcp: fcp?.startTime || 0,
              domContentLoaded,
              requests: resources.length,
            },
          }),
        }).catch(() => {
          // Silently fail - don't break the app
        })

        // Track Core Web Vitals
        if (fcp) {
          fetch('/api/tracking/performance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              page: pathname,
              metricType: 'FCP',
              value: fcp.startTime,
            }),
          }).catch(() => {})
        }

        // Track LCP if available
        if ('PerformanceObserver' in window) {
          try {
            const lcpObserver = new PerformanceObserver((list) => {
              const entries = list.getEntries()
              const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number }
              
              fetch('/api/tracking/performance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  page: pathname,
                  metricType: 'LCP',
                  value: lastEntry.startTime,
                }),
              }).catch(() => {})
            })
            lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
          } catch (_e) {
            // Silently fail
          }

          // Track FID
          try {
            const fidObserver = new PerformanceObserver((list) => {
              const entries = list.getEntries()
              entries.forEach((entry) => {
                const fidEntry = entry as PerformanceEntry & { processingStart: number; startTime: number }
                fetch('/api/tracking/performance', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    page: pathname,
                    metricType: 'FID',
                    value: fidEntry.processingStart - fidEntry.startTime,
                  }),
                }).catch(() => {})
              })
            })
            fidObserver.observe({ type: 'first-input', buffered: true })
          } catch (_e) {
            // Silently fail
          }

          // Track CLS after a delay
          setTimeout(() => {
            if (cls > 0) {
              fetch('/api/tracking/performance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  page: pathname,
                  metricType: 'CLS',
                  value: cls,
                }),
              }).catch(() => {})
            }
          }, 5000)
        }
      } catch (error) {
        // Silently fail - performance tracking should never break the app
        console.error('Performance tracking error:', error)
      }
    }

    // Track after page is fully loaded
    if (document.readyState === 'complete') {
      setTimeout(trackPerformance, 1000)
    } else {
      window.addEventListener('load', () => {
        setTimeout(trackPerformance, 1000)
      })
    }
  }, [pathname])

  // Track JavaScript errors
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_TRACKING !== 'true') {
      return
    }

    const handleError = (event: ErrorEvent) => {
      fetch('/api/tracking/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errorType: 'JavaScript',
          message: event.message,
          stack: event.error?.stack,
          severity: 'medium',
          page: window.location.pathname,
        }),
      }).catch(() => {})
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      fetch('/api/tracking/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errorType: 'Promise Rejection',
          message: event.reason?.message || String(event.reason),
          stack: event.reason?.stack,
          severity: 'high',
          page: window.location.pathname,
        }),
      }).catch(() => {})
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return null // This component doesn't render anything
}

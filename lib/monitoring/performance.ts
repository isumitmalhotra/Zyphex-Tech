import * as Sentry from '@sentry/nextjs';

/**
 * Performance monitoring utility for tracking application performance
 * Integrates with Sentry for comprehensive performance insights
 */
export class PerformanceMonitor {
  /**
   * Track custom transaction (for SDK v7 compatibility)
   * @param name - Transaction name
   * @param operation - Operation type (e.g., 'http.request', 'db.query')
   * @returns Transaction object or undefined
   */
  static startTransaction(name: string, operation: string) {
    // In SDK v8+, use startSpan instead
    return Sentry.startSpan({
      name,
      op: operation,
    }, (span) => span);
  }

  /**
   * Track API call performance
   * Wraps an async function with performance tracking
   * @param name - Name of the API call
   * @param fn - Async function to track
   * @returns Result of the function
   */
  static async trackAPICall<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> {
    return await Sentry.startSpan(
      {
        name,
        op: 'http.request',
      },
      async (span) => {
        const startTime = Date.now();

        try {
          const result = await fn();
          const duration = Date.now() - startTime;
          
          span?.setStatus({ code: 1 }); // ok status
          span?.setAttribute('duration_ms', duration);
          
          // Log slow requests
          if (duration > 3000) {
            console.warn(`[Performance] Slow API call: ${name} took ${duration}ms`);
          }
          
          return result;
        } catch (error) {
          span?.setStatus({ code: 2 }); // error status
          throw error;
        }
      }
    );
  }

  /**
   * Track database query performance
   * @param queryName - Name/description of the query
   * @param fn - Async function executing the query
   * @returns Query result
   */
  static async trackDatabaseQuery<T>(
    queryName: string,
    fn: () => Promise<T>
  ): Promise<T> {
    return await Sentry.startSpan(
      {
        op: 'db.query',
        name: queryName,
      },
      async (span) => {
        const startTime = Date.now();

        try {
          const result = await fn();
          const duration = Date.now() - startTime;
          
          span?.setStatus({ code: 1 }); // ok status
          span?.setAttribute('duration_ms', duration);
          
          // Log slow queries
          if (duration > 1000) {
            console.warn(`[Performance] Slow database query: ${queryName} took ${duration}ms`);
          }
          
          return result;
        } catch (error) {
          span?.setStatus({ code: 2 }); // error status
          throw error;
        }
      }
    );
  }

  /**
   * Track page load performance (client-side only)
   * @param pageName - Name of the page
   */
  static trackPageLoad(pageName: string) {
    if (typeof window === 'undefined') return;
    
    if (window.performance) {
      const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        const metrics = {
          domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart),
          loadComplete: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
          domInteractive: Math.round(navigation.domInteractive - navigation.fetchStart),
          firstPaint: 0,
          firstContentfulPaint: 0,
        };

        // Get paint timings
        const paintEntries = window.performance.getEntriesByType('paint');
        paintEntries.forEach(entry => {
          if (entry.name === 'first-paint') {
            metrics.firstPaint = Math.round(entry.startTime);
          } else if (entry.name === 'first-contentful-paint') {
            metrics.firstContentfulPaint = Math.round(entry.startTime);
          }
        });

        Sentry.captureMessage(`Page Load: ${pageName}`, {
          level: 'info',
          tags: {
            type: 'performance',
            page: pageName,
          },
          extra: metrics,
        });

        // Log slow page loads
        if (metrics.loadComplete > 5000) {
          console.warn(`[Performance] Slow page load: ${pageName} took ${metrics.loadComplete}ms`);
        }
      }
    }
  }

  /**
   * Track component render performance (React)
   * @param componentName - Name of the component
   * @param renderTime - Render time in milliseconds
   */
  static trackComponentRender(componentName: string, renderTime: number) {
    if (renderTime > 100) { // Only track slow renders
      Sentry.captureMessage(`Slow Component Render: ${componentName}`, {
        level: 'warning',
        tags: {
          type: 'performance',
          component: componentName,
        },
        extra: {
          renderTime,
        },
      });
    }
  }

  /**
   * Track custom metric
   * @param metricName - Name of the metric
   * @param value - Metric value
   * @param unit - Unit of measurement (ms, bytes, etc.)
   */
  static trackMetric(metricName: string, value: number, unit: string = 'ms') {
    Sentry.captureMessage(`Metric: ${metricName}`, {
      level: 'info',
      tags: {
        type: 'metric',
        metric_name: metricName,
      },
      extra: {
        value,
        unit,
      },
    });
  }

  /**
   * Measure function execution time
   * @param name - Name of the operation
   * @param fn - Function to measure
   * @returns Function result and duration
   */
  static async measureExecutionTime<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const startTime = Date.now();
    const result = await fn();
    const duration = Date.now() - startTime;

    if (duration > 1000) {
      console.warn(`[Performance] ${name} took ${duration}ms`);
    }

    return { result, duration };
  }

  /**
   * Track resource loading performance
   * @param resourceType - Type of resource (script, stylesheet, image, etc.)
   */
  static trackResourceLoading(resourceType: string = 'all') {
    if (typeof window === 'undefined' || !window.performance) return;

    const resources = window.performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    const filteredResources = resourceType === 'all' 
      ? resources 
      : resources.filter(r => r.initiatorType === resourceType);

    const totalSize = filteredResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
    const avgDuration = filteredResources.reduce((sum, r) => sum + r.duration, 0) / filteredResources.length;

    Sentry.captureMessage(`Resource Loading: ${resourceType}`, {
      level: 'info',
      tags: {
        type: 'performance',
        resource_type: resourceType,
      },
      extra: {
        count: filteredResources.length,
        totalSize: Math.round(totalSize / 1024), // KB
        avgDuration: Math.round(avgDuration),
      },
    });
  }

  /**
   * Track memory usage (if available)
   */
  static trackMemoryUsage() {
    if (typeof window === 'undefined') return;

    interface PerformanceMemory {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    }

    const memory = (performance as { memory?: PerformanceMemory }).memory;
    if (memory) {
      const usedMemoryMB = Math.round(memory.usedJSHeapSize / 1048576);
      const totalMemoryMB = Math.round(memory.totalJSHeapSize / 1048576);
      const limitMemoryMB = Math.round(memory.jsHeapSizeLimit / 1048576);

      // Alert if memory usage is high
      if (usedMemoryMB > limitMemoryMB * 0.9) {
        console.warn(`[Performance] High memory usage: ${usedMemoryMB}MB / ${limitMemoryMB}MB`);
        
        Sentry.captureMessage('High Memory Usage', {
          level: 'warning',
          tags: {
            type: 'performance',
            issue: 'high_memory',
          },
          extra: {
            usedMemoryMB,
            totalMemoryMB,
            limitMemoryMB,
          },
        });
      }
    }
  }
}

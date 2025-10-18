/**
 * Prisma Query Monitoring Middleware
 * 
 * Integrates with Prisma to automatically track all query executions.
 * Records timing, parameters, and performance metrics for analysis.
 */

import { Prisma } from '@prisma/client'
import { queryMonitor, QueryExecution } from './query-monitor'
import { v4 as uuidv4 } from 'uuid'

/**
 * Create Prisma middleware for query monitoring
 */
export function createQueryMonitoringMiddleware() {
  return async (params: Prisma.MiddlewareParams, next: (params: Prisma.MiddlewareParams) => Promise<unknown>) => {
    const startTime = Date.now()
    const queryId = uuidv4()
    
    let result
    let error: Error | undefined

    try {
      result = await next(params)
    } catch (e) {
      error = e as Error
      throw e
    } finally {
      const duration = Date.now() - startTime
      
      // Record query execution
      const execution: QueryExecution = {
        id: queryId,
        model: params.model || 'unknown',
        action: params.action,
        params: JSON.stringify(params.args || {}),
        duration,
        timestamp: new Date(),
        cached: false, // Will be updated by cache layer
        error: error?.message,
      }

      queryMonitor.recordQuery(execution)
    }

    return result
  }
}

/**
 * Prisma extension for query monitoring
 * 
 * Usage:
 * ```typescript
 * import { prisma } from '@/lib/prisma'
 * import { queryMonitoringExtension } from '@/lib/monitoring/query-middleware'
 * 
 * const prismaWithMonitoring = prisma.$extends(queryMonitoringExtension)
 * ```
 */
export const queryMonitoringExtension = Prisma.defineExtension({
  name: 'queryMonitoring',
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const startTime = Date.now()
        const queryId = uuidv4()
        
        let result
        let error: Error | undefined

        try {
          result = await query(args)
        } catch (e) {
          error = e as Error
          throw e
        } finally {
          const duration = Date.now() - startTime
          
          // Record query execution
          const execution: QueryExecution = {
            id: queryId,
            model: model,
            action: operation,
            params: JSON.stringify(args || {}),
            duration,
            timestamp: new Date(),
            cached: false,
            error: error?.message,
          }

          queryMonitor.recordQuery(execution)
        }

        return result
      },
    },
  },
})

/**
 * Create monitoring wrapper for any Prisma operation
 */
export function withQueryMonitoring<T>(
  model: string,
  action: string,
  operation: () => Promise<T>
): Promise<T> {
  return (async () => {
    const startTime = Date.now()
    const queryId = uuidv4()
    
    let result: T
    let error: Error | undefined

    try {
      result = await operation()
    } catch (e) {
      error = e as Error
      throw e
    } finally {
      const duration = Date.now() - startTime
      
      const execution: QueryExecution = {
        id: queryId,
        model,
        action,
        params: '{}',
        duration,
        timestamp: new Date(),
        cached: false,
        error: error?.message,
      }

      queryMonitor.recordQuery(execution)
    }

    return result
  })()
}

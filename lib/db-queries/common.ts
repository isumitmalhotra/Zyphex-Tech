/**
 * Common Query Utilities
 * 
 * Shared utilities for pagination, filtering, and performance monitoring
 */

import { prisma } from '@/lib/prisma';
import {
  PaginationInput,
  PaginatedResponse,
  CursorPaginationInput,
  CursorPaginatedResponse,
  SoftDeleteFilter,
  QueryMetrics,
  QueryPerformanceOptions,
} from './types';
import { Prisma } from '@prisma/client';

// ============================================================================
// Soft Delete Utilities
// ============================================================================

/**
 * Build where clause for soft-deleted records
 */
export function buildSoftDeleteWhere<T extends SoftDeleteFilter>(
  filter?: T
): { deletedAt: null } | { deletedAt: { not: null } } | Record<string, never> {
  if (!filter) {
    return { deletedAt: null };
  }

  if (filter.deletedOnly) {
    return { deletedAt: { not: null } };
  }

  if (filter.includeDeleted) {
    return {};
  }

  return { deletedAt: null };
}

// ============================================================================
// Pagination Utilities
// ============================================================================

/**
 * Calculate pagination parameters
 */
export function calculatePagination(input?: PaginationInput) {
  const page = Math.max(1, input?.page || 1);
  const limit = Math.min(100, Math.max(1, input?.limit || 20));
  const skip = (page - 1) * limit;

  return { page, limit, skip, take: limit };
}

/**
 * Build paginated response
 */
export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  input?: PaginationInput
): PaginatedResponse<T> {
  const { page, limit } = calculatePagination(input);
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}

/**
 * Calculate cursor pagination parameters
 */
export function calculateCursorPagination(input?: CursorPaginationInput) {
  const take = Math.min(100, Math.max(1, input?.take || 20));
  const cursor = input?.cursor;

  return {
    take: take + 1, // Fetch one extra to determine if there are more results
    ...(cursor && {
      skip: 1, // Skip the cursor itself
      cursor: { id: cursor },
    }),
  };
}

/**
 * Build cursor-based paginated response
 */
export function buildCursorPaginatedResponse<T extends { id: string }>(
  results: T[],
  input?: CursorPaginationInput
): CursorPaginatedResponse<T> {
  const take = Math.min(100, Math.max(1, input?.take || 20));
  const hasMore = results.length > take;
  
  // Remove the extra item we fetched
  const data = hasMore ? results.slice(0, -1) : results;
  const nextCursor = hasMore && data.length > 0 ? data[data.length - 1].id : null;

  return {
    data,
    cursor: {
      next: nextCursor,
      hasMore,
    },
  };
}

// ============================================================================
// Search Utilities
// ============================================================================

/**
 * Build case-insensitive search conditions
 */
export function buildSearchConditions<T extends string>(
  search: string | undefined,
  fields: T[]
): Array<Record<T, { contains: string; mode: 'insensitive' }>> | undefined {
  if (!search || !fields.length) {
    return undefined;
  }

  return fields.map((field) => ({
    [field]: {
      contains: search,
      mode: 'insensitive' as const,
    },
  })) as Array<Record<T, { contains: string; mode: 'insensitive' }>>;
}

// ============================================================================
// Date Range Utilities
// ============================================================================

/**
 * Build date range filter
 */
export function buildDateRangeFilter(range?: { from?: Date; to?: Date }) {
  if (!range) return undefined;

  const filter: { gte?: Date; lte?: Date } = {};
  
  if (range.from) {
    filter.gte = range.from;
  }
  
  if (range.to) {
    filter.lte = range.to;
  }

  return Object.keys(filter).length > 0 ? filter : undefined;
}

// ============================================================================
// Performance Monitoring
// ============================================================================

const queryMetrics: QueryMetrics[] = [];
const MAX_METRICS = 1000; // Keep last 1000 queries

/**
 * Wrap a query with performance monitoring
 */
export async function withQueryMetrics<T>(
  queryName: string,
  queryFn: () => Promise<T>,
  options: QueryPerformanceOptions = {}
): Promise<T> {
  const {
    enableMetrics = process.env.NODE_ENV === 'development',
    logSlowQueries = true,
    slowQueryThreshold = 1000,
  } = options;

  if (!enableMetrics) {
    return queryFn();
  }

  const startTime = Date.now();
  
  try {
    const result = queryFn();
    const duration = Date.now() - startTime;

    const metrics: QueryMetrics = {
      query: queryName,
      duration,
      timestamp: new Date(),
    };

    // Store metrics
    queryMetrics.push(metrics);
    if (queryMetrics.length > MAX_METRICS) {
      queryMetrics.shift();
    }

    // Log slow queries
    if (logSlowQueries && duration > slowQueryThreshold) {
      console.warn(`🐌 Slow query detected: ${queryName} took ${duration}ms`);
    }

    return await result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Query failed: ${queryName} (${duration}ms)`, error);
    throw error;
  }
}

/**
 * Get query metrics
 */
export function getQueryMetrics(): QueryMetrics[] {
  return [...queryMetrics];
}

/**
 * Clear query metrics
 */
export function clearQueryMetrics(): void {
  queryMetrics.length = 0;
}

/**
 * Get slow queries
 */
export function getSlowQueries(thresholdMs: number = 1000): QueryMetrics[] {
  return queryMetrics.filter((m) => m.duration > thresholdMs);
}

/**
 * Get average query duration
 */
export function getAverageQueryDuration(): number {
  if (queryMetrics.length === 0) return 0;
  const total = queryMetrics.reduce((sum, m) => sum + m.duration, 0);
  return total / queryMetrics.length;
}

// ============================================================================
// Batch Loading Utilities
// ============================================================================

/**
 * Batch load records by IDs
 * Prevents N+1 queries when loading multiple records
 */
export async function batchLoadByIds<T extends { id: string }>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: any,
  ids: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  select?: any
): Promise<Map<string, T>> {
  if (ids.length === 0) {
    return new Map();
  }

  const records = await model.findMany({
    where: {
      id: { in: ids },
      deletedAt: null,
    },
    ...(select && { select }),
  });

  const recordMap = new Map<string, T>();
  records.forEach((record: T) => {
    recordMap.set(record.id, record);
  });

  return recordMap;
}

/**
 * Batch load records by foreign key
 */
export async function batchLoadByForeignKey<T extends Record<string, unknown>>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: any,
  foreignKey: string,
  foreignIds: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  select?: any
): Promise<Map<string, T[]>> {
  if (foreignIds.length === 0) {
    return new Map();
  }

  const records = await model.findMany({
    where: {
      [foreignKey]: { in: foreignIds },
      deletedAt: null,
    },
    ...(select && { select }),
  });

  const recordMap = new Map<string, T[]>();
  
  // Initialize empty arrays for all IDs
  foreignIds.forEach((id) => {
    recordMap.set(id, []);
  });

  // Group records by foreign key
  records.forEach((record: T) => {
    const fkValue = record[foreignKey] as string;
    const existing = recordMap.get(fkValue) || [];
    existing.push(record);
    recordMap.set(fkValue, existing);
  });

  return recordMap;
}

// ============================================================================
// Transaction Utilities
// ============================================================================

/**
 * Execute operations in a transaction with retry logic
 */
export async function withTransaction<T>(
  operations: (tx: Prisma.TransactionClient) => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(operations, {
        maxWait: 5000, // 5 seconds
        timeout: 10000, // 10 seconds
      });
    } catch (error) {
      lastError = error as Error;
      
      // Check if error is retryable
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isRetryable = 
        errorMessage.includes('deadlock') ||
        errorMessage.includes('could not serialize') ||
        errorMessage.includes('timeout');

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      await new Promise((resolve) => setTimeout(resolve, delay));
      
      console.warn(`🔄 Transaction attempt ${attempt} failed, retrying...`);
    }
  }

  throw lastError || new Error('Transaction failed after all retries');
}

// ============================================================================
// Query Builder Utilities
// ============================================================================

/**
 * Build order by clause from sort parameters
 */
export function buildOrderBy<T extends string>(
  sortBy?: T,
  sortOrder: 'asc' | 'desc' = 'desc'
): Record<T, 'asc' | 'desc'> | Record<T, 'asc' | 'desc'>[] | undefined {
  if (!sortBy) return undefined;
  return { [sortBy]: sortOrder } as Record<T, 'asc' | 'desc'>;
}

/**
 * Build status filter (single or array)
 */
export function buildStatusFilter<T extends string>(
  status?: T | T[]
): { in: T[] } | T | undefined {
  if (!status) return undefined;
  return Array.isArray(status) ? { in: status } : status;
}

/**
 * Combine where conditions with AND logic
 */
export function combineWhereConditions<T extends Record<string, unknown>>(
  ...conditions: (T | undefined)[]
): T | undefined {
  const filtered = conditions.filter((c): c is T => c !== undefined);
  if (filtered.length === 0) return undefined;
  if (filtered.length === 1) return filtered[0];
  
  return {
    AND: filtered,
  } as T;
}

/**
 * Build numeric range filter
 */
export function buildNumericRangeFilter(range?: { min?: number; max?: number }) {
  if (!range) return undefined;

  const filter: { gte?: number; lte?: number } = {};
  
  if (range.min !== undefined) {
    filter.gte = range.min;
  }
  
  if (range.max !== undefined) {
    filter.lte = range.max;
  }

  return Object.keys(filter).length > 0 ? filter : undefined;
}

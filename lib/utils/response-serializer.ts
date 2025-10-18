/**
 * Response Serialization Utilities
 * 
 * Utilities for optimizing API responses through selective field serialization,
 * nested data flattening, and efficient pagination helpers.
 * 
 * Features:
 * - Selective field picking/omitting
 * - Deep field selection
 * - Pagination metadata generation
 * - Response size estimation
 * - Circular reference handling
 * 
 * Usage:
 * import { pickFields, paginateResponse, flattenNested } from '@/lib/utils/response-serializer'
 */

/**
 * Pick specified fields from an object
 */
export function pickFields<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  fields: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>
  
  for (const field of fields) {
    if (field in obj) {
      result[field] = obj[field]
    }
  }
  
  return result
}

/**
 * Omit specified fields from an object
 */
export function omitFields<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  fields: K[]
): Omit<T, K> {
  const result = { ...obj }
  
  for (const field of fields) {
    delete result[field]
  }
  
  return result
}

/**
 * Pick fields from an array of objects
 */
export function pickFieldsFromArray<T extends Record<string, unknown>, K extends keyof T>(
  arr: T[],
  fields: K[]
): Pick<T, K>[] {
  return arr.map(obj => pickFields(obj, fields))
}

/**
 * Omit fields from an array of objects
 */
export function omitFieldsFromArray<T extends Record<string, unknown>, K extends keyof T>(
  arr: T[],
  fields: K[]
): Omit<T, K>[] {
  return arr.map(obj => omitFields(obj, fields))
}

/**
 * Deep pick fields using dot notation
 * Example: deepPick(user, ['id', 'profile.name', 'profile.avatar'])
 */
export function deepPick<T extends Record<string, unknown>>(
  obj: T,
  paths: string[]
): Partial<T> {
  const result: Record<string, unknown> = {}
  
  for (const path of paths) {
    const parts = path.split('.')
    let current: unknown = obj
    let target = result
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      
      if (current === null || current === undefined) break
      
      if (i === parts.length - 1) {
        // Last part - assign the value
        target[part] = (current as Record<string, unknown>)[part]
      } else {
        // Intermediate part - create nested object if needed
        if (!target[part]) {
          target[part] = {}
        }
        target = target[part] as Record<string, unknown>
        current = (current as Record<string, unknown>)[part]
      }
    }
  }
  
  return result as Partial<T>
}

/**
 * Flatten nested objects to dot notation
 * Example: { user: { name: 'John' } } => { 'user.name': 'John' }
 */
export function flattenObject(
  obj: Record<string, unknown>,
  prefix = '',
  maxDepth = 3
): Record<string, unknown> {
  if (maxDepth === 0) {
    return { [prefix]: obj }
  }
  
  const result: Record<string, unknown> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key
    
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      Object.assign(result, flattenObject(value as Record<string, unknown>, newKey, maxDepth - 1))
    } else {
      result[newKey] = value
    }
  }
  
  return result
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
  hasPrevious: boolean
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

/**
 * Generate pagination metadata
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit)
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasMore: page < totalPages,
    hasPrevious: page > 1
  }
}

/**
 * Create a paginated response
 */
export function paginateResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
  return {
    data,
    meta: createPaginationMeta(page, limit, total)
  }
}

/**
 * Extract pagination params from request
 */
export function getPaginationParams(
  searchParams: URLSearchParams,
  defaults = { page: 1, limit: 20 }
): { page: number; limit: number; offset: number } {
  const page = Math.max(1, parseInt(searchParams.get('page') || String(defaults.page)))
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get('limit') || String(defaults.limit)))
  )
  const offset = (page - 1) * limit
  
  return { page, limit, offset }
}

/**
 * Estimate response size in bytes
 */
export function estimateResponseSize(data: unknown): number {
  const json = JSON.stringify(data)
  return Buffer.from(json, 'utf-8').length
}

/**
 * Truncate large text fields
 */
export function truncateFields<T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[],
  maxLength = 100
): T {
  const result = { ...obj }
  
  for (const field of fields) {
    const value = result[field]
    if (typeof value === 'string' && value.length > maxLength) {
      result[field] = (value.substring(0, maxLength) + '...') as T[keyof T]
    }
  }
  
  return result
}

/**
 * Remove null and undefined fields
 */
export function removeNullish<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Partial<T> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined) {
      result[key as keyof T] = value as T[keyof T]
    }
  }
  
  return result
}

/**
 * Safely serialize circular references
 */
export function safeStringify(
  obj: unknown,
  space?: number
): string {
  const seen = new WeakSet()
  
  return JSON.stringify(obj, (_key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]'
      }
      seen.add(value)
    }
    return value
  }, space)
}

/**
 * Response optimization options
 */
export interface SerializationOptions {
  /**
   * Fields to include (whitelist)
   */
  include?: string[]
  
  /**
   * Fields to exclude (blacklist)
   */
  exclude?: string[]
  
  /**
   * Maximum depth for nested objects
   */
  maxDepth?: number
  
  /**
   * Truncate text fields longer than this
   */
  truncateLength?: number
  
  /**
   * Fields to truncate
   */
  truncateFields?: string[]
  
  /**
   * Remove null/undefined fields
   */
  removeNullish?: boolean
}

/**
 * Optimize a response object based on options
 */
export function optimizeResponse<T extends Record<string, unknown>>(
  data: T,
  options: SerializationOptions = {}
): Partial<T> {
  let result: Record<string, unknown> = { ...data }
  
  // Apply field inclusion
  if (options.include && options.include.length > 0) {
    result = deepPick(result as T, options.include)
  }
  
  // Apply field exclusion
  if (options.exclude && options.exclude.length > 0) {
    result = omitFields(result as T, options.exclude as (keyof T)[])
  }
  
  // Truncate fields
  if (options.truncateFields && options.truncateFields.length > 0) {
    result = truncateFields(
      result as T,
      options.truncateFields as (keyof T)[],
      options.truncateLength
    )
  }
  
  // Remove nullish values
  if (options.removeNullish) {
    result = removeNullish(result as T)
  }
  
  return result as Partial<T>
}

/**
 * Optimize an array of responses
 */
export function optimizeResponseArray<T extends Record<string, unknown>>(
  data: T[],
  options: SerializationOptions = {}
): Partial<T>[] {
  return data.map(item => optimizeResponse(item, options))
}

/**
 * Create a minimal project response (for lists)
 */
export function minimizeProject(project: Record<string, unknown>) {
  return pickFields(project, [
    'id',
    'name',
    'status',
    'startDate',
    'endDate',
    'budget',
    'progress'
  ] as string[])
}

/**
 * Create a minimal task response (for lists)
 */
export function minimizeTask(task: Record<string, unknown>) {
  return pickFields(task, [
    'id',
    'title',
    'status',
    'priority',
    'dueDate',
    'assigneeId',
    'projectId'
  ] as string[])
}

/**
 * Create a minimal user response (for references)
 */
export function minimizeUser(user: Record<string, unknown>) {
  return pickFields(user, [
    'id',
    'name',
    'email',
    'role'
  ] as string[])
}

const ResponseSerializer = {
  pickFields,
  omitFields,
  deepPick,
  flattenObject,
  paginateResponse,
  getPaginationParams,
  optimizeResponse,
  optimizeResponseArray,
  minimizeProject,
  minimizeTask,
  minimizeUser
}

export default ResponseSerializer

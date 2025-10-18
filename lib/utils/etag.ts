/**
 * ETag Support for API Responses
 * 
 * Implements ETags and conditional requests (If-None-Match) to reduce
 * redundant data transfers for unchanged resources.
 * 
 * Features:
 * - Automatic ETag generation from response content
 * - If-None-Match header support (304 Not Modified responses)
 * - Strong and weak ETag validation
 * - Cache control integration
 * 
 * Usage:
 * import { withETag, generateETag } from '@/lib/utils/etag'
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'

/**
 * ETag configuration
 */
const ETAG_CONFIG = {
  /**
   * Hash algorithm for ETag generation
   */
  algorithm: 'sha256' as const,
  
  /**
   * Use weak ETags (W/"...") for dynamic content
   */
  useWeakETag: false,
  
  /**
   * Default cache control header for ETag responses
   */
  defaultCacheControl: 'private, must-revalidate'
}

/**
 * Generate an ETag from response content
 */
export function generateETag(content: string | Buffer, weak = ETAG_CONFIG.useWeakETag): string {
  const hash = createHash(ETAG_CONFIG.algorithm)
    .update(content)
    .digest('hex')
    .substring(0, 16)
  
  return weak ? `W/"${hash}"` : `"${hash}"`
}

/**
 * Parse ETags from If-None-Match header
 */
function parseIfNoneMatch(header: string | null): string[] {
  if (!header) return []
  
  // Handle wildcard
  if (header === '*') return ['*']
  
  // Parse comma-separated ETags
  return header.split(',').map(etag => etag.trim())
}

/**
 * Check if ETags match
 */
function etagMatches(etag: string, ifNoneMatch: string[]): boolean {
  // Wildcard matches everything
  if (ifNoneMatch.includes('*')) return true
  
  // Exact match (with or without W/ prefix)
  const normalizedETag = etag.replace(/^W\//, '')
  return ifNoneMatch.some(inm => {
    const normalizedInm = inm.replace(/^W\//, '')
    return normalizedETag === normalizedInm
  })
}

/**
 * Add ETag to a response
 */
export function addETag(
  response: NextResponse,
  content: string | Buffer,
  cacheControl?: string
): NextResponse {
  const etag = generateETag(content)
  
  response.headers.set('ETag', etag)
  
  if (cacheControl) {
    response.headers.set('Cache-Control', cacheControl)
  } else if (!response.headers.has('Cache-Control')) {
    response.headers.set('Cache-Control', ETAG_CONFIG.defaultCacheControl)
  }
  
  return response
}

/**
 * Check if request should return 304 Not Modified
 */
export function shouldReturn304(
  request: NextRequest,
  etag: string
): boolean {
  const ifNoneMatch = request.headers.get('if-none-match')
  if (!ifNoneMatch) return false
  
  const etags = parseIfNoneMatch(ifNoneMatch)
  return etagMatches(etag, etags)
}

/**
 * Create a 304 Not Modified response
 */
export function createNotModifiedResponse(etag: string): NextResponse {
  const response = new NextResponse(null, { status: 304 })
  response.headers.set('ETag', etag)
  return response
}

/**
 * Wrap a route handler with automatic ETag support
 */
export function withETag(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: {
    weak?: boolean
    cacheControl?: string
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Get the response from the handler
    const response = await handler(request)
    
    // Only apply ETags to successful GET requests
    if (request.method !== 'GET' || response.status !== 200) {
      return response
    }
    
    // Get response body
    const body = await response.text()
    
    // Generate ETag
    const etag = generateETag(body, options.weak)
    
    // Check if client has cached version
    if (shouldReturn304(request, etag)) {
      return createNotModifiedResponse(etag)
    }
    
    // Create new response with ETag
    const newResponse = new NextResponse(body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    })
    
    return addETag(newResponse, body, options.cacheControl)
  }
}

/**
 * ETag helper for JSON responses
 */
export function jsonResponseWithETag(
  data: unknown,
  request: NextRequest,
  options: {
    status?: number
    weak?: boolean
    cacheControl?: string
  } = {}
): NextResponse {
  const json = JSON.stringify(data)
  const etag = generateETag(json, options.weak)
  
  // Check if client has cached version
  if (shouldReturn304(request, etag)) {
    return createNotModifiedResponse(etag)
  }
  
  const response = NextResponse.json(data, {
    status: options.status || 200
  })
  
  return addETag(response, json, options.cacheControl)
}

/**
 * Generate ETag from object (useful for database records)
 */
export function generateObjectETag(
  obj: Record<string, unknown>,
  fields: string[] = []
): string {
  let content: string
  
  if (fields.length > 0) {
    // Only include specified fields
    const filtered: Record<string, unknown> = {}
    for (const field of fields) {
      if (field in obj) {
        filtered[field] = obj[field]
      }
    }
    content = JSON.stringify(filtered)
  } else {
    content = JSON.stringify(obj)
  }
  
  return generateETag(content)
}

/**
 * Generate ETag from array of objects
 */
export function generateArrayETag(
  arr: Record<string, unknown>[],
  fields: string[] = []
): string {
  const content = arr.map(obj => 
    fields.length > 0 ? generateObjectETag(obj, fields) : JSON.stringify(obj)
  ).join(',')
  
  return generateETag(content)
}

/**
 * Last-Modified support (alternative to ETags)
 */
export interface LastModifiedOptions {
  lastModified: Date
  ifModifiedSince?: string | null
}

/**
 * Check if resource was modified since given date
 */
export function wasModifiedSince(
  lastModified: Date,
  ifModifiedSince?: string | null
): boolean {
  if (!ifModifiedSince) return true
  
  try {
    const sinceDate = new Date(ifModifiedSince)
    return lastModified > sinceDate
  } catch {
    return true
  }
}

/**
 * Add Last-Modified header to response
 */
export function addLastModified(
  response: NextResponse,
  date: Date
): NextResponse {
  response.headers.set('Last-Modified', date.toUTCString())
  return response
}

/**
 * Combined ETag and Last-Modified support
 */
export function withCaching(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: {
    weak?: boolean
    cacheControl?: string
    useLastModified?: boolean
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const response = await handler(request)
    
    if (request.method !== 'GET' || response.status !== 200) {
      return response
    }
    
    const body = await response.text()
    const etag = generateETag(body, options.weak)
    
    // Check ETag
    if (shouldReturn304(request, etag)) {
      return createNotModifiedResponse(etag)
    }
    
    // Check Last-Modified if enabled
    if (options.useLastModified) {
      const lastModified = response.headers.get('last-modified')
      const ifModifiedSince = request.headers.get('if-modified-since')
      
      if (lastModified && !wasModifiedSince(new Date(lastModified), ifModifiedSince)) {
        const notModified = new NextResponse(null, { status: 304 })
        notModified.headers.set('Last-Modified', lastModified)
        notModified.headers.set('ETag', etag)
        return notModified
      }
    }
    
    const newResponse = new NextResponse(body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    })
    
    return addETag(newResponse, body, options.cacheControl)
  }
}

const ETagUtils = {
  generateETag,
  addETag,
  withETag,
  jsonResponseWithETag,
  generateObjectETag,
  generateArrayETag,
  withCaching
}

export default ETagUtils

/**
 * Cache Headers Utility
 * Provides standardized cache headers for API routes
 */

export const cacheHeaders = {
  // No cache - always fresh (auth, mutations)
  noCache: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  },
  
  // Short cache - 5 minutes (frequently changing data)
  short: {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
  },
  
  // Medium cache - 1 hour (semi-static data)
  medium: {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200'
  },
  
  // Long cache - 1 day (mostly static data)
  long: {
    'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800'
  },
  
  // Immutable - never changes (static assets)
  immutable: {
    'Cache-Control': 'public, max-age=31536000, immutable'
  }
}

/**
 * Add cache headers to Response
 */
export function withCache(
  data: any,
  cacheType: keyof typeof cacheHeaders = 'short',
  additionalHeaders: Record<string, string> = {}
) {
  return Response.json(data, {
    headers: {
      ...cacheHeaders[cacheType],
      ...additionalHeaders,
    }
  })
}

/**
 * Add cache hit/miss header
 */
export function withCacheStatus(
  data: any,
  hit: boolean,
  cacheType: keyof typeof cacheHeaders = 'short'
) {
  return Response.json(data, {
    headers: {
      ...cacheHeaders[cacheType],
      'X-Cache': hit ? 'HIT' : 'MISS',
    }
  })
}

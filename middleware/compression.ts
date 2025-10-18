/**
 * Response Compression Middleware
 * 
 * Provides gzip/brotli compression for API responses to reduce payload sizes
 * and improve network transfer times.
 * 
 * Features:
 * - Automatic compression based on Accept-Encoding header
 * - Configurable compression thresholds
 * - Content-type filtering
 * - Compression ratio tracking
 * 
 * Usage:
 * import { compressResponse } from '@/middleware/compression'
 * const compressed = await compressResponse(response, request)
 */

import { NextRequest, NextResponse } from 'next/server'
import { gzipSync, brotliCompressSync } from 'zlib'

/**
 * Compression configuration
 */
const COMPRESSION_CONFIG = {
  // Minimum response size to trigger compression (1KB)
  threshold: 1024,
  
  // Compression level (1-9, higher = better compression but slower)
  gzipLevel: 6,
  brotliQuality: 6,
  
  // Content types to compress
  compressibleTypes: [
    'application/json',
    'application/javascript',
    'text/html',
    'text/css',
    'text/plain',
    'text/xml',
    'application/xml',
    'image/svg+xml'
  ],
  
  // Headers to preserve
  preserveHeaders: [
    'content-type',
    'cache-control',
    'etag',
    'last-modified'
  ]
}

/**
 * Check if the response should be compressed
 */
function shouldCompress(
  response: NextResponse,
  contentType: string | null,
  contentLength: number
): boolean {
  // Don't compress if already compressed
  if (response.headers.get('content-encoding')) {
    return false
  }
  
  // Check size threshold
  if (contentLength < COMPRESSION_CONFIG.threshold) {
    return false
  }
  
  // Check content type
  if (!contentType) {
    return false
  }
  
  return COMPRESSION_CONFIG.compressibleTypes.some(type =>
    contentType.toLowerCase().includes(type)
  )
}

/**
 * Get preferred encoding from Accept-Encoding header
 */
function getPreferredEncoding(acceptEncoding: string | null): 'br' | 'gzip' | null {
  if (!acceptEncoding) {
    return null
  }
  
  const encodings = acceptEncoding.toLowerCase()
  
  // Brotli is preferred if supported (better compression)
  if (encodings.includes('br')) {
    return 'br'
  }
  
  // Fallback to gzip
  if (encodings.includes('gzip')) {
    return 'gzip'
  }
  
  return null
}

/**
 * Compress data using the specified encoding
 */
function compressData(data: Buffer, encoding: 'br' | 'gzip'): Buffer {
  if (encoding === 'br') {
    return brotliCompressSync(data, {
      params: {
        [10]: COMPRESSION_CONFIG.brotliQuality // BROTLI_PARAM_QUALITY = 10
      }
    })
  } else {
    return gzipSync(data, { level: COMPRESSION_CONFIG.gzipLevel })
  }
}

/**
 * Compress a NextResponse if applicable
 */
export async function compressResponse(
  response: NextResponse,
  request: NextRequest
): Promise<NextResponse> {
  try {
    // Get response body
    const body = await response.text()
    const bodyBuffer = Buffer.from(body, 'utf-8')
    const originalSize = bodyBuffer.length
    
    // Get content type
    const contentType = response.headers.get('content-type')
    
    // Check if compression should be applied
    if (!shouldCompress(response, contentType, originalSize)) {
      return response
    }
    
    // Get preferred encoding
    const acceptEncoding = request.headers.get('accept-encoding')
    const encoding = getPreferredEncoding(acceptEncoding)
    
    if (!encoding) {
      return response
    }
    
    // Compress the data
    const compressed = compressData(bodyBuffer, encoding)
    const compressedSize = compressed.length
    
    // Calculate compression ratio
    const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1)
    
    // Create new response with compressed body
    const compressedResponse = new NextResponse(compressed as unknown as BodyInit, {
      status: response.status,
      statusText: response.statusText
    })
    
    // Copy important headers
    COMPRESSION_CONFIG.preserveHeaders.forEach(header => {
      const value = response.headers.get(header)
      if (value) {
        compressedResponse.headers.set(header, value)
      }
    })
    
    // Set compression headers
    compressedResponse.headers.set('content-encoding', encoding)
    compressedResponse.headers.set('content-length', compressedSize.toString())
    compressedResponse.headers.set('vary', 'Accept-Encoding')
    
    // Add compression stats header (for debugging/monitoring)
    compressedResponse.headers.set(
      'x-compression-ratio',
      `${ratio}% (${originalSize} -> ${compressedSize} bytes)`
    )
    
    return compressedResponse
    
  } catch (error) {
    console.error('Compression error:', error)
    // Return original response on error
    return response
  }
}

/**
 * Wrap a route handler with automatic compression
 */
export function withCompression(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const response = await handler(request)
    return compressResponse(response, request)
  }
}

/**
 * Compression statistics
 */
export interface CompressionStats {
  originalSize: number
  compressedSize: number
  ratio: number
  encoding: 'br' | 'gzip' | 'none'
  duration: number
}

/**
 * Get compression statistics for a response
 */
export async function getCompressionStats(
  response: NextResponse,
  request: NextRequest
): Promise<CompressionStats> {
  const startTime = Date.now()
  
  const body = await response.text()
  const originalSize = Buffer.from(body, 'utf-8').length
  
  const acceptEncoding = request.headers.get('accept-encoding')
  const encoding = getPreferredEncoding(acceptEncoding)
  
  if (!encoding) {
    return {
      originalSize,
      compressedSize: originalSize,
      ratio: 0,
      encoding: 'none',
      duration: Date.now() - startTime
    }
  }
  
  const compressed = compressData(Buffer.from(body, 'utf-8'), encoding)
  const compressedSize = compressed.length
  const ratio = ((1 - compressedSize / originalSize) * 100)
  
  return {
    originalSize,
    compressedSize,
    ratio,
    encoding,
    duration: Date.now() - startTime
  }
}

export default compressResponse

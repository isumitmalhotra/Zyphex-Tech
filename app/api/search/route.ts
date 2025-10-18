/**
 * Unified Search API Endpoint
 * 
 * GET /api/search?q={query}&type={model}&page={n}&limit={m}&status={status}
 * 
 * Features:
 * - Multi-model search (projects, tasks)
 * - Full-text search with relevance ranking
 * - Role-based access control
 * - Result caching
 * - Pagination support
 * 
 * @route GET /api/search
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { SearchService } from '@/lib/search/search-service'
import { getCachedSearchResults, getCachedSuggestions } from '@/lib/cache/search-cache'
import type { SearchOptions } from '@/lib/search/search-service'
import logger from '@/lib/logger'

// Mark as dynamic route
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/search
 * Perform full-text search across projects and tasks
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const typeParam = searchParams.get('type') || 'all'
    const statusParam = searchParams.get('status')
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')
    const suggestionParam = searchParams.get('suggestions')

    // Handle suggestions endpoint
    if (suggestionParam === 'true') {
      const limit = limitParam ? parseInt(limitParam) : 5
      const suggestions = await getCachedSuggestions(
        query,
        limit,
        () => SearchService.getSuggestions(query, limit)
      )

      return NextResponse.json({
        suggestions,
        query,
        success: true
      })
    }

    // Validate query
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      )
    }

    if (query.length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters long' },
        { status: 400 }
      )
    }

    // Parse search types
    let types: ('project' | 'task')[] = ['project', 'task']
    if (typeParam !== 'all') {
      const requestedTypes = typeParam.split(',').filter(t => 
        t === 'project' || t === 'task'
      ) as ('project' | 'task')[]
      
      if (requestedTypes.length > 0) {
        types = requestedTypes
      }
    }

    // Parse status filter
    const status = statusParam ? statusParam.split(',') : undefined

    // Parse pagination
    const page = pageParam ? Math.max(1, parseInt(pageParam)) : 1
    const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam))) : 20

    // Build search options
    const searchOptions: SearchOptions = {
      query: query.trim(),
      types,
      userId: user.id,
      userRole: user.role,
      status,
      page,
      limit
    }

    // Execute search with caching
    const results = await getCachedSearchResults(
      searchOptions,
      () => SearchService.search(searchOptions)
    )

    // Log search query
    logger.info('Search executed', {
      userId: user.id,
      query: searchOptions.query,
      types,
      resultCount: results.results.length,
      executionTime: results.executionTime
    })

    return NextResponse.json({
      ...results,
      success: true
    })

  } catch (error) {
    logger.error('Search API error:', {
      error,
      url: request.url,
      method: request.method
    })

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    )
  }
}

// Import prisma here to avoid circular dependencies
import { prisma } from '@/lib/prisma'

/**
 * CMS Search Suggestions API
 * Provides autocomplete suggestions for search queries
 * 
 * @route GET /api/cms/search/suggestions
 * @access Protected - Requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateSearchSuggestions, getPopularSearchTerms } from '@/lib/cms/search-engine';
import { z } from 'zod';

const suggestionsQuerySchema = z.object({
  q: z.string().optional(), // Query for suggestions
  limit: z.string().optional(),
  popular: z.string().optional(), // Get popular terms instead
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const validated = suggestionsQuerySchema.parse(searchParams);

    const limit = validated.limit ? parseInt(validated.limit) : 10;

    let suggestions: string[];

    // Get popular terms or query-based suggestions
    if (validated.popular === 'true' || !validated.q) {
      suggestions = await getPopularSearchTerms(limit);
    } else {
      suggestions = await generateSearchSuggestions(validated.q);
    }

    return NextResponse.json({
      success: true,
      data: {
        suggestions: suggestions.slice(0, limit),
        query: validated.q || null,
      },
      meta: {
        count: suggestions.length,
        limit,
      },
    });

  } catch (error) {
    console.error('CMS Search Suggestions Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation Error',
          message: 'Invalid request parameters',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to generate suggestions',
      },
      { status: 500 }
    );
  }
}

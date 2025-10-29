/**
 * CMS Templates API Route
 * List and create templates
 * 
 * @route /api/cms/templates
 * @access Protected - Requires CMS permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { buildTemplateFilters, parseFilterParams } from '@/lib/cms/filter-builder';
import { cmsCache, cacheKeys, cacheTTL } from '@/lib/cache/redis';
import { invalidateTemplateCache } from '@/lib/cache/invalidation';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(500).nullable().optional(),
  category: z.enum(['landing', 'blog', 'marketing', 'ecommerce', 'portfolio', 'corporate', 'other']),
  thumbnailUrl: z.string().url().nullable().optional(),
  templateStructure: z.any(), // JSON structure of the template (required)
  defaultContent: z.any().nullable().optional(), // Optional default content
});

// ============================================================================
// GET - List templates
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    // Parse filter parameters from query string
    const filterOptions = parseFilterParams(request.nextUrl.searchParams);
    
    // Build Prisma query with filters
    const { where, orderBy, take, skip } = buildTemplateFilters(filterOptions);

    // Create cache key based on filters
    const cacheKey = cacheKeys.cmsTemplateList(JSON.stringify({ 
      where, 
      skip, 
      take, 
      orderBy
    }));

    // Try to get from cache, or fetch from database
    const cachedResult = await cmsCache(
      cacheKey,
      cacheTTL.contentTypes, // 30 minutes
      async () => {
        // Execute queries in parallel
        const [templates, totalCount] = await Promise.all([
          prisma.cmsTemplate.findMany({
            where,
            skip,
            take,
            orderBy,
            include: {
              _count: {
                select: {
                  pages: true,
                },
              },
            },
          }),
          prisma.cmsTemplate.count({ where }),
        ]);

        // Calculate pagination metadata
        const page = filterOptions.page || 1;
        const limit = filterOptions.limit || 20;
        const totalPages = Math.ceil(totalCount / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return {
          templates,
          pagination: {
            page,
            limit,
            totalCount,
            totalPages,
            hasNextPage,
            hasPrevPage,
          },
        };
      }
    );

    return NextResponse.json({
      success: true,
      data: cachedResult?.templates || [],
      pagination: cachedResult?.pagination || {
        page: 1,
        limit: 20,
        totalCount: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
      filters: filterOptions,
    });

  } catch (error) {
    console.error('CMS Templates GET Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to fetch templates',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create template
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createTemplateSchema.parse(body);

    // Create template
    const template = await prisma.cmsTemplate.create({
      data: {
        ...validatedData,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        templateStructure: validatedData.templateStructure as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        defaultContent: validatedData.defaultContent as any,
      },
      include: {
        _count: {
          select: {
            pages: true,
          },
        },
      },
    });

    // Log activity
    await prisma.cmsActivityLog.create({
      data: {
        userId: session.user.id,
        action: 'create_template',
        entityType: 'template',
        entityId: template.id,
        changes: {
          name: validatedData.name,
          category: validatedData.category,
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    });

    // Invalidate template cache
    await invalidateTemplateCache(template.id);

    return NextResponse.json(
      {
        success: true,
        message: 'Template created successfully',
        data: template,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('CMS Templates POST Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation Error',
          message: 'Invalid template data',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to create template',
      },
      { status: 500 }
    );
  }
}

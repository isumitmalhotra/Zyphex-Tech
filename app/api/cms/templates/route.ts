/**
 * CMS Templates API Route
 * List and create templates
 * 
 * @route /api/cms/templates
 * @access Protected - Super Admin only
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import templateService from '@/lib/cms/template-service';
import auditService from '@/lib/cms/audit-service';
import { createAuditContext } from '@/lib/cms/audit-context';
import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.enum(['landing', 'blog', 'portfolio', 'service', 'about', 'contact', 'general', 'custom']),
  templateStructure: z.object({
    sections: z.array(z.object({
      sectionKey: z.string(),
      sectionType: z.string(),
      title: z.string(),
      description: z.string().optional(),
      isRequired: z.boolean(),
      isEditable: z.boolean(),
      defaultContent: z.record(z.unknown()).optional(),
      order: z.number().int().min(0),
      customStyles: z.record(z.unknown()).optional(),
    })),
    layout: z.object({
      type: z.enum(['single-column', 'two-column', 'three-column', 'custom']),
      gridColumns: z.number().int().min(1).max(12).optional(),
      gap: z.string().optional(),
    }).optional(),
    metadata: z.object({
      requiredSections: z.array(z.string()),
      optionalSections: z.array(z.string()),
      maxSections: z.number().int().min(1).optional(),
      allowCustomSections: z.boolean(),
    }).optional(),
  }),
  defaultContent: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    ogImage: z.string().url().optional(),
    sections: z.record(z.record(z.unknown())).optional(),
  }).optional(),
  thumbnailUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
  isSystem: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

const queryTemplatesSchema = z.object({
  category: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  includeSystem: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
  orderBy: z.enum(['name', 'category', 'order', 'createdAt', 'updatedAt']).optional(),
  orderDirection: z.enum(['asc', 'desc']).optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
});

// ============================================================================
// GET - List templates
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only Super Admin can access templates
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);
    const validatedQuery = queryTemplatesSchema.parse(queryParams);

    // Build query options
    const options = {
      category: validatedQuery.category as 'landing' | 'blog' | 'portfolio' | 'service' | 'about' | 'contact' | 'general' | 'custom' | undefined,
      isActive: validatedQuery.isActive === 'true' ? true : validatedQuery.isActive === 'false' ? false : undefined,
      includeSystem: validatedQuery.includeSystem === 'true' ? true : validatedQuery.includeSystem === 'false' ? false : true,
      search: validatedQuery.search,
      orderBy: validatedQuery.orderBy as 'name' | 'category' | 'order' | 'createdAt' | 'updatedAt' | undefined,
      orderDirection: validatedQuery.orderDirection as 'asc' | 'desc' | undefined,
      limit: validatedQuery.limit ? parseInt(validatedQuery.limit) : undefined,
      offset: validatedQuery.offset ? parseInt(validatedQuery.offset) : undefined,
    };

    // Get templates
    const result = await templateService.listTemplates(options);

    return NextResponse.json({
      success: true,
      data: result.templates,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.hasMore,
      },
    });

  } catch (error) {
    console.error('CMS Templates GET Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation Error',
          message: 'Invalid query parameters',
          details: error.errors 
        },
        { status: 400 }
      );
    }

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
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only Super Admin can create templates
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createTemplateSchema.parse(body);

    // Create template
    const template = await templateService.createTemplate(validatedData);

    // Log activity
    const auditContext = await createAuditContext(request);
    await auditService.logAudit({
      action: 'create_template',
      entityType: 'template',
      entityId: template.id,
      metadata: {
        templateName: template.name,
        category: template.category,
        sectionCount: validatedData.templateStructure.sections.length,
      },
      context: {
        userId: session.user.id,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
      },
    });

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


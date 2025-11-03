/**
 * CMS Single Template API Route
 * Get, update, or delete a specific template
 * 
 * @route /api/cms/templates/[id]
 * @access Protected - Requires CMS permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import templateService from '@/lib/cms/template-service';
import auditService from '@/lib/cms/audit-service';
import { createAuditContext } from '@/lib/cms/audit-context';
import { z } from 'zod';

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  category: z.enum(['landing', 'blog', 'portfolio', 'service', 'about', 'contact', 'general', 'custom']).optional(),
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
  }).optional(),
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
  order: z.number().int().min(0).optional(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

// ============================================================================
// GET - Get single template
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
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

    const { id } = params;

    const template = await templateService.getTemplateById(id);

    if (!template) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: template,
    });

  } catch (error) {
    console.error('CMS Template GET Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to fetch template',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update template
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only Super Admin can update templates
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Get existing template for audit
    const existing = await templateService.getTemplateById(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Template not found' },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateTemplateSchema.parse(body);

    // Update template
    const template = await templateService.updateTemplate(id, validatedData);

    // Detect changes
    const changes = auditService.detectChanges(
      { name: existing.name, category: existing.category, isActive: existing.isActive },
      { name: template.name || existing.name, category: validatedData.category, isActive: validatedData.isActive }
    );

    // Log activity
    const auditContext = await createAuditContext(request);
    await auditService.logAudit({
      action: 'update_template',
      entityType: 'template',
      entityId: id,
      changes,
      metadata: {
        templateName: template.name,
        updatedFields: Object.keys(validatedData),
      },
      context: {
        userId: session.user.id,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Template updated successfully',
      data: template,
    });

  } catch (error) {
    console.error('CMS Template PATCH Error:', error);
    
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

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Not Found', message: error.message },
        { status: 404 }
      );
    }

    if (error instanceof Error && error.message.includes('system template')) {
      return NextResponse.json(
        { error: 'Forbidden', message: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to update template',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete template
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only Super Admin can delete templates
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Get template before deletion for audit
    const template = await templateService.getTemplateById(id);
    if (!template) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Template not found' },
        { status: 404 }
      );
    }

    // Delete template
    await templateService.deleteTemplate(id);

    // Log activity
    const auditContext = await createAuditContext(request);
    await auditService.logAudit({
      action: 'delete_template',
      entityType: 'template',
      entityId: id,
      metadata: {
        templateName: template.name,
        category: template.category,
        wasSystem: template.isSystem,
      },
      context: {
        userId: session.user.id,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
    });

  } catch (error) {
    console.error('CMS Template DELETE Error:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Not Found', message: error.message },
        { status: 404 }
      );
    }

    if (error instanceof Error && (error.message.includes('system template') || error.message.includes('page(s) are using'))) {
      return NextResponse.json(
        { error: 'Forbidden', message: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to delete template',
      },
      { status: 500 }
    );
  }
}

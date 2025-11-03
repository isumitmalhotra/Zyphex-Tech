/**
 * CMS Template Duplicate API
 * 
 * @route POST /api/cms/templates/[id]/duplicate
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import templateService from '@/lib/cms/template-service';
import auditService from '@/lib/cms/audit-service';
import { createAuditContext } from '@/lib/cms/audit-context';
import { z } from 'zod';

// ============================================================================
// Validation Schema
// ============================================================================

const duplicateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
}).optional();

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(
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

    // Only Super Admin can duplicate templates
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Parse and validate request body (optional)
    let validatedData: { name?: string } | undefined;
    try {
      const body = await request.json();
      validatedData = duplicateTemplateSchema.parse(body);
    } catch {
      // Body is optional, use undefined
      validatedData = undefined;
    }

    // Duplicate template
    const newTemplate = await templateService.duplicateTemplate(
      id,
      validatedData?.name
    );

    // Log activity
    const auditContext = await createAuditContext(request);
    await auditService.logAudit({
      action: 'create_template',
      entityType: 'template',
      entityId: newTemplate.id,
      metadata: {
        sourceTemplateId: id,
        newTemplateName: newTemplate.name,
        isDuplicate: true,
      },
      context: {
        userId: session.user.id,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Template duplicated successfully',
      data: newTemplate,
    }, { status: 201 });

  } catch (error) {
    console.error('CMS Template Duplicate Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation Error',
          message: 'Invalid duplicate data',
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

    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { error: 'Conflict', message: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to duplicate template',
      },
      { status: 500 }
    );
  }
}

/**
 * CMS Template Duplicate API Route
 * Duplicate a template with all sections
 * 
 * @route POST /api/cms/templates/[id]/duplicate
 * @access Protected - Requires CMS permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    // Get original template
    const originalTemplate = await prisma.cmsTemplate.findFirst({
      where: {
        id: params.id,
      },
    });

    if (!originalTemplate) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Template not found' },
        { status: 404 }
      );
    }

    // Generate unique name
    let duplicateCount = 1;
    let newName = `${originalTemplate.name} (Copy)`;

    while (true) {
      const existing = await prisma.cmsTemplate.findFirst({
        where: {
          name: newName,
        },
      });

      if (!existing) break;

      duplicateCount++;
      newName = `${originalTemplate.name} (Copy ${duplicateCount})`;
    }

    // Create duplicated template
    const duplicatedTemplate = await prisma.cmsTemplate.create({
      data: {
        name: newName,
        description: originalTemplate.description,
        category: originalTemplate.category,
        thumbnailUrl: originalTemplate.thumbnailUrl,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        templateStructure: originalTemplate.templateStructure as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        defaultContent: originalTemplate.defaultContent as any,
        isActive: originalTemplate.isActive,
        isSystem: false, // Duplicated templates are never system templates
        order: 0,
      },
    });

    // Fetch complete template
    const completeTemplate = await prisma.cmsTemplate.findUnique({
      where: { id: duplicatedTemplate.id },
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
        action: 'duplicate_template',
        entityType: 'template',
        entityId: duplicatedTemplate.id,
        changes: {
          originalTemplateId: originalTemplate.id,
          originalTemplateName: originalTemplate.name,
          newTemplateName: newName,
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Template duplicated successfully',
      data: completeTemplate,
    });

  } catch (error) {
    console.error('CMS Template Duplicate Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to duplicate template',
      },
      { status: 500 }
    );
  }
}

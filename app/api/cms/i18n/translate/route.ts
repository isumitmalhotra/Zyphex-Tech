/**
 * CMS Translation API
 * 
 * @route POST /api/cms/i18n/translate
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import i18nService from '@/lib/cms/i18n-service';
import auditService from '@/lib/cms/audit-service';
import { createAuditContext } from '@/lib/cms/audit-context';
import { z } from 'zod';

// ============================================================================
// Validation Schema
// ============================================================================

const translatePageSchema = z.object({
  sourcePageId: z.string(),
  targetLanguage: z.string().length(2),
  translations: z.object({
    pageTitle: z.string().optional(),
    slug: z.string().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    metaKeywords: z.string().optional(),
    ogTitle: z.string().optional(),
    ogDescription: z.string().optional(),
    sections: z.array(z.object({
      sectionKey: z.string(),
      title: z.string().optional(),
      subtitle: z.string().optional(),
      content: z.record(z.unknown()).optional(),
    })).optional(),
  }),
});

// ============================================================================
// POST - Create translation
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

    // Only Super Admin can create translations
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = translatePageSchema.parse(body);

    // Validate language code
    if (!i18nService.isValidLanguage(validatedData.targetLanguage)) {
      return NextResponse.json(
        { error: 'Bad Request', message: `Invalid language code: ${validatedData.targetLanguage}` },
        { status: 400 }
      );
    }

    // Create translation
    const translatedPageId = await i18nService.translatePage(
      validatedData,
      session.user.id
    );

    // Log activity
    const auditContext = await createAuditContext(request);
    await auditService.logAudit({
      action: 'create_page',
      entityType: 'page',
      entityId: translatedPageId,
      metadata: {
        action: 'translate',
        sourcePageId: validatedData.sourcePageId,
        targetLanguage: validatedData.targetLanguage,
      },
      context: {
        userId: session.user.id,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Translation created successfully',
      data: {
        translatedPageId,
      },
    });

  } catch (error) {
    console.error('CMS Translation Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation Error',
          message: 'Invalid request data',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { error: 'Conflict', message: error.message },
        { status: 409 }
      );
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Not Found', message: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to create translation',
      },
      { status: 500 }
    );
  }
}

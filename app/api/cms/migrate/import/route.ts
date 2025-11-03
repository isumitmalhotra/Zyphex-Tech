/**
 * CMS Content Import API
 * 
 * @route POST /api/cms/migrate/import
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import migrationService, { ExportedContent } from '@/lib/cms/migration-service';
import auditService from '@/lib/cms/audit-service';
import { createAuditContext } from '@/lib/cms/audit-context';
import { z } from 'zod';

// ============================================================================
// Validation Schema
// ============================================================================

const importOptionsSchema = z.object({
  overwriteExisting: z.boolean().optional(),
  skipErrors: z.boolean().optional(),
  validateOnly: z.boolean().optional(),
  preserveIds: z.boolean().optional(),
});

// ============================================================================
// POST - Import CMS content
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

    // Only Super Admin can import content
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    // Validate import options
    const options = importOptionsSchema.parse(body.options || {});
    const content = body.content as ExportedContent;

    if (!content) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Missing content in request body' },
        { status: 400 }
      );
    }

    // Validate content first
    const validation = migrationService.validateImport(content);
    
    if (!validation.valid && !options.skipErrors) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid import content',
          validation,
        },
        { status: 400 }
      );
    }

    // If validate only, return validation results
    if (options.validateOnly) {
      return NextResponse.json({
        success: validation.valid,
        message: validation.valid ? 'Content is valid' : 'Content has errors',
        validation,
      });
    }

    // Perform import
    const result = await migrationService.importContent(
      content,
      options,
      session.user.id
    );

    // Log migration
    await migrationService.logMigration('import', result, session.user.id);

    // Log audit
    const auditContext = await createAuditContext(request);
    await auditService.logAudit({
      action: 'create_page',
      entityType: 'page',
      entityId: 'bulk-import',
      metadata: {
        action: 'import',
        pagesImported: result.imported.pages,
        templatesImported: result.imported.templates,
        errorCount: result.errors.length,
      },
      context: {
        userId: session.user.id,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
      },
    });

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? 'Content imported successfully'
        : 'Import completed with errors',
      result,
    });

  } catch (error) {
    console.error('CMS Import Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation Error',
          message: 'Invalid import options',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to import content',
      },
      { status: 500 }
    );
  }
}

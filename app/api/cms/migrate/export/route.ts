/**
 * CMS Content Export API
 * 
 * @route GET /api/cms/migrate/export
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import migrationService from '@/lib/cms/migration-service';
import { z } from 'zod';

// ============================================================================
// Validation Schema
// ============================================================================

const exportQuerySchema = z.object({
  format: z.enum(['json', 'csv']).optional(),
  includePages: z.coerce.boolean().optional(),
  includeTemplates: z.coerce.boolean().optional(),
  includeVersions: z.coerce.boolean().optional(),
  pageIds: z.string().optional(), // Comma-separated IDs
});

// ============================================================================
// GET - Export CMS content
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

    // Only Super Admin can export content
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse and validate query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const validatedQuery = exportQuerySchema.parse(searchParams);

    const format = validatedQuery.format || 'json';
    const options = {
      includePages: validatedQuery.includePages ?? true,
      includeTemplates: validatedQuery.includeTemplates ?? true,
      includeVersions: validatedQuery.includeVersions ?? false,
      pageIds: validatedQuery.pageIds?.split(',').filter(Boolean),
    };

    // Handle CSV export
    if (format === 'csv') {
      const csv = await migrationService.exportPagesToCSV(options);
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="cms-export-${Date.now()}.csv"`,
        },
      });
    }

    // Handle JSON export
    const exported = await migrationService.exportAllContent(
      options,
      session.user.id
    );

    // Log migration
    await migrationService.logMigration(
      'export',
      {
        itemCount: exported.metadata.totalPages + exported.metadata.totalTemplates,
      },
      session.user.id
    );

    return new NextResponse(JSON.stringify(exported, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="cms-export-${Date.now()}.json"`,
      },
    });

  } catch (error) {
    console.error('CMS Export Error:', error);
    
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
        message: 'Failed to export content',
      },
      { status: 500 }
    );
  }
}

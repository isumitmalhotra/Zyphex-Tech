/**
 * CMS Bulk Sections API Route
 * Perform bulk operations on multiple page sections
 * 
 * @route POST /api/cms/sections/bulk
 * @access Protected - Requires CMS permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { processBulkOperation, logBulkOperation } from '@/lib/cms/bulk-processor';
import { z } from 'zod';

const bulkRequestSchema = z.object({
  operation: z.enum([
    'delete',
    'duplicate',
    'move',
    'update'
  ]),
  sectionIds: z.array(z.string()).min(1).max(1000),
  data: z.record(z.unknown()).optional(),
  options: z.object({
    continueOnError: z.boolean().optional(),
    batchSize: z.number().min(1).max(100).optional(),
    parallel: z.boolean().optional()
  }).optional()
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    // Check CMS permissions
    const userRole = session.user.role;
    const canManageContent = ['admin', 'super_admin', 'content_editor'].includes(userRole);

    if (!canManageContent) {
      return NextResponse.json(
        { 
          error: 'Forbidden',
          message: 'You do not have permission to perform bulk section operations'
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = bulkRequestSchema.parse(body);

    // Additional validation for delete operations
    if (validatedData.operation === 'delete' && userRole !== 'admin' && userRole !== 'super_admin') {
      return NextResponse.json(
        { 
          error: 'Forbidden',
          message: 'Only admins can perform bulk delete operations'
        },
        { status: 403 }
      );
    }

    // Validate required data for move operation
    if (validatedData.operation === 'move') {
      if (!validatedData.data?.pageId) {
        return NextResponse.json(
          { 
            error: 'Validation Error',
            message: 'Target page ID is required for move operations'
          },
          { status: 400 }
        );
      }
    }

    // Process bulk operation
    const result = await processBulkOperation({
      operation: validatedData.operation,
      entityType: 'section',
      entityIds: validatedData.sectionIds,
      data: validatedData.data,
      options: validatedData.options
    }, session.user.id);

    // Log the bulk operation
    await logBulkOperation(
      session.user.id,
      result,
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      request.headers.get('user-agent')
    );

    // Return response with detailed results
    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? `Bulk operation completed: ${result.successCount} succeeded, ${result.failureCount} failed`
        : `Bulk operation completed with errors: ${result.successCount} succeeded, ${result.failureCount} failed`,
      data: result
    }, { status: result.success ? 200 : 207 }); // 207 Multi-Status for partial success

  } catch (error) {
    console.error('CMS Bulk Sections Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation Error',
          message: 'Invalid bulk operation request',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Internal Server Error',
          message: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to process bulk operation'
      },
      { status: 500 }
    );
  }
}

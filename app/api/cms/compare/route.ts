/**
 * Compare Versions API
 * 
 * POST /api/cms/compare - Compare two page versions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import {
  compareVersions,
  compareDraftWithPublished,
  compareTwoVersions,
} from '@/lib/cms/comparison-service';

// ============================================================================
// Validation Schema
// ============================================================================

const compareSchema = z.object({
  pageId: z.string().min(1, 'Page ID is required'),
  leftVersionId: z.string().optional(),
  rightVersionId: z.string().optional(),
  comparisonType: z.enum(['draft-published', 'version-version', 'custom']).optional(),
});

// ============================================================================
// POST - Compare Versions
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only Super Admin can compare versions
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = compareSchema.parse(body);

    let comparison;

    // Handle different comparison types
    if (
      validatedData.comparisonType === 'draft-published' ||
      (!validatedData.leftVersionId && !validatedData.rightVersionId)
    ) {
      // Compare draft with published
      comparison = await compareDraftWithPublished(validatedData.pageId);
    } else if (
      validatedData.comparisonType === 'version-version' &&
      validatedData.leftVersionId &&
      validatedData.rightVersionId
    ) {
      // Compare two specific versions
      comparison = await compareTwoVersions(
        validatedData.pageId,
        validatedData.leftVersionId,
        validatedData.rightVersionId
      );
    } else {
      // Custom comparison
      comparison = await compareVersions({
        pageId: validatedData.pageId,
        leftVersionId: validatedData.leftVersionId,
        rightVersionId: validatedData.rightVersionId,
      });
    }

    return NextResponse.json({
      success: true,
      data: comparison,
    });
  } catch (error) {
    console.error('Error comparing versions:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to compare versions',
      },
      { status: 500 }
    );
  }
}

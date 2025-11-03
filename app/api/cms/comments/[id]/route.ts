/**
 * Comment Management API
 * 
 * GET /api/cms/comments/[id] - Get comment
 * PATCH /api/cms/comments/[id] - Update comment
 * DELETE /api/cms/comments/[id] - Delete comment
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import {
  getComment,
  updateComment,
  deleteComment,
  resolveComment,
  reopenComment,
} from '@/lib/cms/comment-service';

// ============================================================================
// Validation Schema
// ============================================================================

const updateCommentSchema = z.object({
  content: z.string().min(1).optional(),
  isResolved: z.boolean().optional(),
});

// ============================================================================
// GET - Get Comment
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only Super Admin can view comments
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }

    const comment = await getComment(params.id);

    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'Comment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: comment,
    });
  } catch (error) {
    console.error('Error getting comment:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get comment',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update Comment
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only Super Admin can update comments
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateCommentSchema.parse(body);

    // If resolving/reopening, use dedicated functions
    if (validatedData.isResolved !== undefined && !validatedData.content) {
      const comment = validatedData.isResolved
        ? await resolveComment(params.id, session.user.id)
        : await reopenComment(params.id);

      return NextResponse.json({
        success: true,
        message: validatedData.isResolved
          ? 'Comment resolved successfully'
          : 'Comment reopened successfully',
        data: comment,
      });
    }

    const comment = await updateComment(params.id, validatedData);

    return NextResponse.json({
      success: true,
      message: 'Comment updated successfully',
      data: comment,
    });
  } catch (error) {
    console.error('Error updating comment:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update comment',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete Comment
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only Super Admin can delete comments
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }

    await deleteComment(params.id);

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting comment:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete comment',
      },
      { status: 500 }
    );
  }
}

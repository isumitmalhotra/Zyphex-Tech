/**
 * Comments API
 * 
 * GET /api/cms/comments - Get comments for a page
 * POST /api/cms/comments - Create a comment
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import {
  createComment,
  getPageComments,
  getCommentThreads,
  getUserMentions,
} from '@/lib/cms/comment-service';

// ============================================================================
// Validation Schemas
// ============================================================================

const createCommentSchema = z.object({
  pageId: z.string().min(1, 'Page ID is required'),
  sectionId: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  parentId: z.string().optional(),
});

// ============================================================================
// GET - Get Comments
// ============================================================================

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');
    const sectionId = searchParams.get('sectionId');
    const isResolved = searchParams.get('isResolved');
    const includeReplies = searchParams.get('includeReplies');
    const threads = searchParams.get('threads');
    const mentions = searchParams.get('mentions');

    // Get user mentions
    if (mentions === 'true') {
      const userMentions = await getUserMentions(session.user.id, {
        isResolved: isResolved ? isResolved === 'true' : undefined,
      });

      return NextResponse.json({
        success: true,
        data: userMentions,
      });
    }

    // Get threads
    if (threads === 'true' && pageId) {
      const commentThreads = await getCommentThreads(pageId, {
        sectionId: sectionId || undefined,
        isResolved: isResolved ? isResolved === 'true' : undefined,
      });

      return NextResponse.json({
        success: true,
        data: commentThreads,
      });
    }

    // Get comments for page
    if (!pageId) {
      return NextResponse.json(
        { success: false, error: 'Page ID is required' },
        { status: 400 }
      );
    }

    const comments = await getPageComments(pageId, {
      sectionId: sectionId || undefined,
      isResolved: isResolved ? isResolved === 'true' : undefined,
      includeReplies: includeReplies === 'true',
    });

    return NextResponse.json({
      success: true,
      data: comments,
    });
  } catch (error) {
    console.error('Error getting comments:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get comments',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create Comment
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

    // Only Super Admin can create comments
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createCommentSchema.parse(body);

    const comment = await createComment({
      ...validatedData,
      authorId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Comment created successfully',
      data: comment,
    });
  } catch (error) {
    console.error('Error creating comment:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create comment',
      },
      { status: 500 }
    );
  }
}

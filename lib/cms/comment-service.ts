/**
 * CMS Comment System Service
 * 
 * Internal collaboration system for team members:
 * - Thread-based comments
 * - User mentions (@username)
 * - Replies and nested threads
 * - Comment resolution
 * - Notifications
 * - Comment history
 */

import { prisma } from '@/lib/prisma';

// ============================================================================
// Types
// ============================================================================

export interface Comment {
  id: string;
  pageId: string;
  sectionId?: string;
  content: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  parentId?: string;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  mentions: string[]; // User IDs mentioned in comment
  createdAt: Date;
  updatedAt: Date;
  replies?: Comment[];
}

export interface CreateCommentInput {
  pageId: string;
  sectionId?: string;
  content: string;
  authorId: string;
  parentId?: string;
}

export interface UpdateCommentInput {
  content?: string;
  isResolved?: boolean;
  resolvedBy?: string;
}

export interface CommentThread {
  id: string;
  rootComment: Comment;
  replies: Comment[];
  totalReplies: number;
  isResolved: boolean;
  participants: string[]; // User IDs
  lastActivityAt: Date;
}

export interface CommentStats {
  totalComments: number;
  openThreads: number;
  resolvedThreads: number;
  totalMentions: number;
  commentsByUser: Array<{
    userId: string;
    userName: string;
    count: number;
  }>;
}

// ============================================================================
// Comment CRUD Operations
// ============================================================================

/**
 * Create a new comment
 */
export async function createComment(input: CreateCommentInput): Promise<Comment> {
  // Extract mentions from content (@username)
  const mentions = extractMentions(input.content);

  // Get author details
  const author = await prisma.user.findUnique({
    where: { id: input.authorId },
    select: { id: true, name: true, email: true },
  });

  if (!author) {
    throw new Error('Author not found');
  }

  const comment = await prisma.cmsComment.create({
    data: {
      pageId: input.pageId,
      sectionId: input.sectionId,
      content: input.content,
      authorId: input.authorId,
      authorName: author.name || 'Unknown',
      authorEmail: author.email || '',
      parentId: input.parentId,
      mentions: mentions as never,
      isResolved: false,
    },
  });

  return {
    id: comment.id,
    pageId: comment.pageId,
    sectionId: comment.sectionId || undefined,
    content: comment.content,
    authorId: comment.authorId,
    authorName: comment.authorName,
    authorEmail: comment.authorEmail,
    parentId: comment.parentId || undefined,
    isResolved: comment.isResolved,
    resolvedBy: comment.resolvedBy || undefined,
    resolvedAt: comment.resolvedAt || undefined,
    mentions: comment.mentions as string[],
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  };
}

/**
 * Get comment by ID
 */
export async function getComment(id: string): Promise<Comment | null> {
  const comment = await prisma.cmsComment.findUnique({
    where: { id },
  });

  if (!comment) {
    return null;
  }

  // Get replies
  const replies = await getCommentReplies(id);

  return {
    id: comment.id,
    pageId: comment.pageId,
    sectionId: comment.sectionId || undefined,
    content: comment.content,
    authorId: comment.authorId,
    authorName: comment.authorName,
    authorEmail: comment.authorEmail,
    parentId: comment.parentId || undefined,
    isResolved: comment.isResolved,
    resolvedBy: comment.resolvedBy || undefined,
    resolvedAt: comment.resolvedAt || undefined,
    mentions: comment.mentions as string[],
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    replies,
  };
}

/**
 * Get all comments for a page
 */
export async function getPageComments(
  pageId: string,
  filters: {
    sectionId?: string;
    isResolved?: boolean;
    includeReplies?: boolean;
  } = {}
): Promise<Comment[]> {
  const where: Record<string, unknown> = {
    pageId,
    parentId: null, // Only root comments
  };

  if (filters.sectionId) {
    where.sectionId = filters.sectionId;
  }

  if (filters.isResolved !== undefined) {
    where.isResolved = filters.isResolved;
  }

  const comments = await prisma.cmsComment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  const result: Comment[] = [];

  for (const comment of comments) {
    const replies = filters.includeReplies ? await getCommentReplies(comment.id) : [];

    result.push({
      id: comment.id,
      pageId: comment.pageId,
      sectionId: comment.sectionId || undefined,
      content: comment.content,
      authorId: comment.authorId,
      authorName: comment.authorName,
      authorEmail: comment.authorEmail,
      parentId: comment.parentId || undefined,
      isResolved: comment.isResolved,
      resolvedBy: comment.resolvedBy || undefined,
      resolvedAt: comment.resolvedAt || undefined,
      mentions: comment.mentions as string[],
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      replies,
    });
  }

  return result;
}

/**
 * Get replies for a comment
 */
export async function getCommentReplies(commentId: string): Promise<Comment[]> {
  const replies = await prisma.cmsComment.findMany({
    where: { parentId: commentId },
    orderBy: { createdAt: 'asc' },
  });

  return replies.map((reply) => ({
    id: reply.id,
    pageId: reply.pageId,
    sectionId: reply.sectionId || undefined,
    content: reply.content,
    authorId: reply.authorId,
    authorName: reply.authorName,
    authorEmail: reply.authorEmail,
    parentId: reply.parentId || undefined,
    isResolved: reply.isResolved,
    resolvedBy: reply.resolvedBy || undefined,
    resolvedAt: reply.resolvedAt || undefined,
    mentions: reply.mentions as string[],
    createdAt: reply.createdAt,
    updatedAt: reply.updatedAt,
  }));
}

/**
 * Update comment
 */
export async function updateComment(
  id: string,
  input: UpdateCommentInput
): Promise<Comment> {
  const data: Record<string, unknown> = {};

  if (input.content !== undefined) {
    data.content = input.content;
    data.mentions = extractMentions(input.content) as never;
  }

  if (input.isResolved !== undefined) {
    data.isResolved = input.isResolved;

    if (input.isResolved && input.resolvedBy) {
      data.resolvedBy = input.resolvedBy;
      data.resolvedAt = new Date();
    } else if (!input.isResolved) {
      data.resolvedBy = null;
      data.resolvedAt = null;
    }
  }

  const comment = await prisma.cmsComment.update({
    where: { id },
    data,
  });

  return {
    id: comment.id,
    pageId: comment.pageId,
    sectionId: comment.sectionId || undefined,
    content: comment.content,
    authorId: comment.authorId,
    authorName: comment.authorName,
    authorEmail: comment.authorEmail,
    parentId: comment.parentId || undefined,
    isResolved: comment.isResolved,
    resolvedBy: comment.resolvedBy || undefined,
    resolvedAt: comment.resolvedAt || undefined,
    mentions: comment.mentions as string[],
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  };
}

/**
 * Delete comment
 */
export async function deleteComment(id: string): Promise<void> {
  // Delete all replies first
  await prisma.cmsComment.deleteMany({
    where: { parentId: id },
  });

  // Delete the comment
  await prisma.cmsComment.delete({
    where: { id },
  });
}

/**
 * Resolve comment thread
 */
export async function resolveComment(
  id: string,
  resolvedBy: string
): Promise<Comment> {
  return updateComment(id, {
    isResolved: true,
    resolvedBy,
  });
}

/**
 * Reopen comment thread
 */
export async function reopenComment(id: string): Promise<Comment> {
  return updateComment(id, {
    isResolved: false,
  });
}

// ============================================================================
// Comment Threads
// ============================================================================

/**
 * Get comment threads for a page
 */
export async function getCommentThreads(
  pageId: string,
  filters: {
    sectionId?: string;
    isResolved?: boolean;
  } = {}
): Promise<CommentThread[]> {
  const rootComments = await getPageComments(pageId, {
    ...filters,
    includeReplies: true,
  });

  const threads: CommentThread[] = [];

  for (const rootComment of rootComments) {
    const replies = rootComment.replies || [];
    const allComments = [rootComment, ...replies];

    // Get unique participants
    const participants = Array.from(
      new Set(allComments.map((c) => c.authorId))
    );

    // Get last activity
    const lastActivityAt = allComments.reduce((latest, comment) => {
      return comment.createdAt > latest ? comment.createdAt : latest;
    }, rootComment.createdAt);

    threads.push({
      id: rootComment.id,
      rootComment,
      replies,
      totalReplies: replies.length,
      isResolved: rootComment.isResolved,
      participants,
      lastActivityAt,
    });
  }

  return threads;
}

/**
 * Get comment thread by ID
 */
export async function getCommentThread(id: string): Promise<CommentThread | null> {
  const rootComment = await getComment(id);

  if (!rootComment) {
    return null;
  }

  const replies = rootComment.replies || [];
  const allComments = [rootComment, ...replies];

  const participants = Array.from(
    new Set(allComments.map((c) => c.authorId))
  );

  const lastActivityAt = allComments.reduce((latest, comment) => {
    return comment.createdAt > latest ? comment.createdAt : latest;
  }, rootComment.createdAt);

  return {
    id: rootComment.id,
    rootComment,
    replies,
    totalReplies: replies.length,
    isResolved: rootComment.isResolved,
    participants,
    lastActivityAt,
  };
}

// ============================================================================
// Mentions
// ============================================================================

/**
 * Extract user mentions from content (@username)
 */
function extractMentions(content: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const matches = content.matchAll(mentionRegex);
  const usernames = Array.from(matches, (m) => m[1]);

  // In production, convert usernames to user IDs
  // For now, return usernames as-is
  return usernames;
}

/**
 * Get mentions for a user
 */
export async function getUserMentions(
  userId: string,
  filters: {
    isResolved?: boolean;
    limit?: number;
  } = {}
): Promise<Comment[]> {
  const where: Record<string, unknown> = {};

  if (filters.isResolved !== undefined) {
    where.isResolved = filters.isResolved;
  }

  const comments = await prisma.cmsComment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: filters.limit || 100,
  });

  // Filter comments that mention the user
  return comments
    .filter((comment: { mentions: unknown }) => {
      const commentMentions = comment.mentions as string[];
      return commentMentions.includes(userId);
    })
    .map((comment: {
      id: string;
      pageId: string;
      sectionId: string | null;
      content: string;
      authorId: string;
      authorName: string;
      authorEmail: string;
      parentId: string | null;
      isResolved: boolean;
      resolvedBy: string | null;
      resolvedAt: Date | null;
      mentions: unknown;
      createdAt: Date;
      updatedAt: Date;
    }) => ({
      id: comment.id,
      pageId: comment.pageId,
      sectionId: comment.sectionId || undefined,
      content: comment.content,
      authorId: comment.authorId,
      authorName: comment.authorName,
      authorEmail: comment.authorEmail,
      parentId: comment.parentId || undefined,
      isResolved: comment.isResolved,
      resolvedBy: comment.resolvedBy || undefined,
      resolvedAt: comment.resolvedAt || undefined,
      mentions: comment.mentions as string[],
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    }));
}

// ============================================================================
// Comment Statistics
// ============================================================================

/**
 * Get comment statistics
 */
export async function getCommentStats(pageId?: string): Promise<CommentStats> {
  const where: Record<string, unknown> = pageId ? { pageId } : {};

  const [totalComments, openThreads, resolvedThreads] = await Promise.all([
    prisma.cmsComment.count({ where }),
    prisma.cmsComment.count({ where: { ...where, parentId: null, isResolved: false } }),
    prisma.cmsComment.count({ where: { ...where, parentId: null, isResolved: true } }),
  ]);

  // Get comments by user
  const comments = await prisma.cmsComment.findMany({
    where,
    select: {
      authorId: true,
      authorName: true,
    },
  });

  const userCounts = comments.reduce((acc, comment) => {
    const existing = acc.find((u) => u.userId === comment.authorId);
    if (existing) {
      existing.count++;
    } else {
      acc.push({
        userId: comment.authorId,
        userName: comment.authorName,
        count: 1,
      });
    }
    return acc;
  }, [] as CommentStats['commentsByUser']);

  // Count total mentions
  const allComments = await prisma.cmsComment.findMany({
    where,
    select: { mentions: true },
  });

  const totalMentions = allComments.reduce((sum, comment) => {
    return sum + (comment.mentions as string[]).length;
  }, 0);

  return {
    totalComments,
    openThreads,
    resolvedThreads,
    totalMentions,
    commentsByUser: userCounts.sort((a, b) => b.count - a.count),
  };
}

/**
 * Get user comment activity
 */
export async function getUserCommentActivity(userId: string) {
  const [authored, mentioned, resolved] = await Promise.all([
    prisma.cmsComment.count({ where: { authorId: userId } }),
    prisma.cmsComment.count({
      where: {
        mentions: {
          array_contains: [userId],
        } as never,
      },
    }),
    prisma.cmsComment.count({ where: { resolvedBy: userId } }),
  ]);

  return {
    authored,
    mentioned,
    resolved,
  };
}

// ============================================================================
// Notification Helpers
// ============================================================================

/**
 * Get users to notify for a comment
 */
export async function getNotificationRecipients(comment: Comment): Promise<string[]> {
  const recipients = new Set<string>();

  // Add mentioned users
  comment.mentions.forEach((userId) => recipients.add(userId));

  // If it's a reply, notify the parent comment author
  if (comment.parentId) {
    const parentComment = await prisma.cmsComment.findUnique({
      where: { id: comment.parentId },
      select: { authorId: true },
    });

    if (parentComment && parentComment.authorId !== comment.authorId) {
      recipients.add(parentComment.authorId);
    }
  }

  // Don't notify the comment author
  recipients.delete(comment.authorId);

  return Array.from(recipients);
}

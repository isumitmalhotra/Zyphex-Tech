/**
 * CMS Workflow Management Service
 * 
 * Manages page workflow states and transitions:
 * - Draft → Review → Approved → Published → Archived
 * - Validation rules for state transitions
 * - Workflow history tracking
 * - Role-based transition permissions
 * 
 * @module lib/cms/workflow-service
 */

import { prisma } from '@/lib/prisma';

// ============================================================================
// Types & Enums
// ============================================================================

export type WorkflowStatus = 'draft' | 'review' | 'approved' | 'published' | 'archived';

export type WorkflowAction = 
  | 'submit_for_review'
  | 'approve'
  | 'reject'
  | 'publish'
  | 'unpublish'
  | 'archive'
  | 'restore'
  | 'return_to_draft';

export interface WorkflowTransition {
  from: WorkflowStatus;
  to: WorkflowStatus;
  action: WorkflowAction;
  allowedRoles: string[];
  requiresComment?: boolean;
}

export interface WorkflowHistoryEntry {
  id: string;
  pageId: string;
  fromStatus: WorkflowStatus;
  toStatus: WorkflowStatus;
  action: WorkflowAction;
  userId: string;
  userName: string;
  comment?: string | null;
  createdAt: Date;
}

export interface TransitionOptions {
  userId: string;
  userRole: string;
  comment?: string;
  metadata?: Record<string, unknown>;
}

export interface WorkflowStats {
  draft: number;
  review: number;
  approved: number;
  published: number;
  archived: number;
  total: number;
}

// ============================================================================
// Workflow Configuration
// ============================================================================

/**
 * Allowed workflow transitions with role-based permissions
 */
export const WORKFLOW_TRANSITIONS: WorkflowTransition[] = [
  // From Draft
  {
    from: 'draft',
    to: 'review',
    action: 'submit_for_review',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'],
  },
  {
    from: 'draft',
    to: 'published',
    action: 'publish',
    allowedRoles: ['SUPER_ADMIN'], // Only Super Admin can bypass review
  },
  {
    from: 'draft',
    to: 'archived',
    action: 'archive',
    allowedRoles: ['SUPER_ADMIN'],
  },

  // From Review
  {
    from: 'review',
    to: 'approved',
    action: 'approve',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    from: 'review',
    to: 'draft',
    action: 'reject',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN'],
    requiresComment: true,
  },
  {
    from: 'review',
    to: 'archived',
    action: 'archive',
    allowedRoles: ['SUPER_ADMIN'],
  },

  // From Approved
  {
    from: 'approved',
    to: 'published',
    action: 'publish',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    from: 'approved',
    to: 'draft',
    action: 'return_to_draft',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN'],
    requiresComment: true,
  },
  {
    from: 'approved',
    to: 'archived',
    action: 'archive',
    allowedRoles: ['SUPER_ADMIN'],
  },

  // From Published
  {
    from: 'published',
    to: 'draft',
    action: 'unpublish',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN'],
    requiresComment: true,
  },
  {
    from: 'published',
    to: 'archived',
    action: 'archive',
    allowedRoles: ['SUPER_ADMIN'],
  },

  // From Archived
  {
    from: 'archived',
    to: 'draft',
    action: 'restore',
    allowedRoles: ['SUPER_ADMIN'],
  },
];

// ============================================================================
// Workflow State Validation
// ============================================================================

/**
 * Check if a workflow transition is allowed
 */
export function isTransitionAllowed(
  from: WorkflowStatus,
  to: WorkflowStatus,
  userRole: string
): boolean {
  const transition = WORKFLOW_TRANSITIONS.find(
    (t) => t.from === from && t.to === to
  );

  if (!transition) {
    return false;
  }

  return transition.allowedRoles.includes(userRole);
}

/**
 * Get allowed transitions for current status and user role
 */
export function getAllowedTransitions(
  currentStatus: WorkflowStatus,
  userRole: string
): WorkflowTransition[] {
  return WORKFLOW_TRANSITIONS.filter(
    (t) => t.from === currentStatus && t.allowedRoles.includes(userRole)
  );
}

/**
 * Get workflow transition by action
 */
export function getTransitionByAction(
  action: WorkflowAction
): WorkflowTransition | undefined {
  return WORKFLOW_TRANSITIONS.find((t) => t.action === action);
}

/**
 * Validate transition and return the transition config
 */
export function validateTransition(
  from: WorkflowStatus,
  to: WorkflowStatus,
  userRole: string,
  comment?: string
): WorkflowTransition {
  const transition = WORKFLOW_TRANSITIONS.find(
    (t) => t.from === from && t.to === to
  );

  if (!transition) {
    throw new Error(`Invalid transition from ${from} to ${to}`);
  }

  if (!transition.allowedRoles.includes(userRole)) {
    throw new Error(
      `User role ${userRole} not allowed to transition from ${from} to ${to}`
    );
  }

  if (transition.requiresComment && !comment) {
    throw new Error(`Comment required for transition from ${from} to ${to}`);
  }

  return transition;
}

// ============================================================================
// Page Workflow Operations
// ============================================================================

/**
 * Transition a page to a new workflow status
 */
export async function transitionPageStatus(
  pageId: string,
  toStatus: WorkflowStatus,
  options: TransitionOptions
): Promise<void> {
  const page = await prisma.cmsPage.findUnique({
    where: { id: pageId },
    select: { status: true },
  });

  if (!page) {
    throw new Error('Page not found');
  }

  const fromStatus = page.status as WorkflowStatus;

  // Validate transition
  const transition = validateTransition(
    fromStatus,
    toStatus,
    options.userRole,
    options.comment
  );

  // Update page status
  await prisma.cmsPage.update({
    where: { id: pageId },
    data: {
      status: toStatus,
      publishedAt: toStatus === 'published' ? new Date() : undefined,
    },
  });

  // Get existing workflow or create new one
  const existingWorkflow = await prisma.cmsWorkflow.findFirst({
    where: { pageId },
    orderBy: { submittedAt: 'desc' },
  });

  // Get history array
  const history = existingWorkflow?.history 
    ? (Array.isArray(existingWorkflow.history) ? existingWorkflow.history : [])
    : [];

  // Add new history entry
  const historyEntry = {
    fromStatus,
    toStatus,
    action: transition.action,
    userId: options.userId,
    comment: options.comment,
    timestamp: new Date().toISOString(),
    ...(options.metadata || {}),
  };

  if (existingWorkflow) {
    // Update existing workflow
    await prisma.cmsWorkflow.update({
      where: { id: existingWorkflow.id },
      data: {
        status: toStatus,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        history: [...history, historyEntry] as any,
        reviewedBy: options.userId,
        reviewedAt: new Date(),
        completedAt: toStatus === 'published' || toStatus === 'archived' ? new Date() : null,
      },
    });
  } else {
    // Create new workflow
    await prisma.cmsWorkflow.create({
      data: {
        pageId,
        status: toStatus,
        submittedBy: options.userId,
        reviewers: [options.userId],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        history: [historyEntry] as any,
        completedAt: toStatus === 'published' || toStatus === 'archived' ? new Date() : null,
      },
    });
  }
}

/**
 * Get workflow history for a page
 */
export async function getPageWorkflowHistory(
  pageId: string
): Promise<WorkflowHistoryEntry[]> {
  const workflows = await prisma.cmsWorkflow.findMany({
    where: { pageId },
    orderBy: { submittedAt: 'desc' },
  });

  const allEntries: WorkflowHistoryEntry[] = [];

  for (const workflow of workflows) {
    const history = Array.isArray(workflow.history) ? workflow.history : [];
    
    for (const entry of history) {
      const histEntry = entry as {
        fromStatus: string;
        toStatus: string;
        action: string;
        userId: string;
        comment?: string;
        timestamp: string;
      };

      // Get user name
      const user = await prisma.user.findUnique({
        where: { id: histEntry.userId },
        select: { name: true },
      });

      allEntries.push({
        id: workflow.id,
        pageId: workflow.pageId,
        fromStatus: histEntry.fromStatus as WorkflowStatus,
        toStatus: histEntry.toStatus as WorkflowStatus,
        action: histEntry.action as WorkflowAction,
        userId: histEntry.userId,
        userName: user?.name || 'Unknown User',
        comment: histEntry.comment,
        createdAt: new Date(histEntry.timestamp),
      });
    }
  }

  return allEntries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Get latest workflow entry for a page
 */
export async function getLatestWorkflowEntry(
  pageId: string
): Promise<WorkflowHistoryEntry | null> {
  const workflow = await prisma.cmsWorkflow.findFirst({
    where: { pageId },
    orderBy: { submittedAt: 'desc' },
  });

  if (!workflow) {
    return null;
  }

  const history = Array.isArray(workflow.history) ? workflow.history : [];
  if (history.length === 0) {
    return null;
  }

  const latestEntry = history[history.length - 1] as {
    fromStatus: string;
    toStatus: string;
    action: string;
    userId: string;
    comment?: string;
    timestamp: string;
  };

  // Get user name
  const user = await prisma.user.findUnique({
    where: { id: latestEntry.userId },
    select: { name: true },
  });

  return {
    id: workflow.id,
    pageId: workflow.pageId,
    fromStatus: latestEntry.fromStatus as WorkflowStatus,
    toStatus: latestEntry.toStatus as WorkflowStatus,
    action: latestEntry.action as WorkflowAction,
    userId: latestEntry.userId,
    userName: user?.name || 'Unknown User',
    comment: latestEntry.comment,
    createdAt: new Date(latestEntry.timestamp),
  };
}

// ============================================================================
// Workflow Statistics
// ============================================================================

/**
 * Get workflow statistics across all pages
 */
export async function getWorkflowStats(): Promise<WorkflowStats> {
  const statusCounts = await prisma.cmsPage.groupBy({
    by: ['status'],
    _count: true,
  });

  const stats: WorkflowStats = {
    draft: 0,
    review: 0,
    approved: 0,
    published: 0,
    archived: 0,
    total: 0,
  };

  statusCounts.forEach((item) => {
    const status = item.status as WorkflowStatus;
    if (status in stats) {
      stats[status] = item._count;
      stats.total += item._count;
    }
  });

  return stats;
}

/**
 * Get pages by workflow status with pagination
 */
export async function getPagesByStatus(
  status: WorkflowStatus,
  options: {
    page?: number;
    limit?: number;
    orderBy?: 'createdAt' | 'updatedAt' | 'title';
    orderDirection?: 'asc' | 'desc';
  } = {}
) {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const skip = (page - 1) * limit;

  const [pages, total] = await Promise.all([
    prisma.cmsPage.findMany({
      where: { status },
      skip,
      take: limit,
      orderBy: {
        [options.orderBy || 'updatedAt']: options.orderDirection || 'desc',
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            sections: true,
            versions: true,
          },
        },
      },
    }),
    prisma.cmsPage.count({
      where: { status },
    }),
  ]);

  return {
    pages,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get pages pending review (in 'review' status)
 */
export async function getPendingReviewPages(options: {
  page?: number;
  limit?: number;
} = {}) {
  return getPagesByStatus('review', options);
}

/**
 * Get approved pages ready to publish
 */
export async function getApprovedPages(options: {
  page?: number;
  limit?: number;
} = {}) {
  return getPagesByStatus('approved', options);
}

/**
 * Get published pages
 */
export async function getPublishedPages(options: {
  page?: number;
  limit?: number;
} = {}) {
  return getPagesByStatus('published', options);
}

// ============================================================================
// Bulk Workflow Operations
// ============================================================================

/**
 * Bulk transition multiple pages
 */
export async function bulkTransitionPages(
  pageIds: string[],
  toStatus: WorkflowStatus,
  options: TransitionOptions
): Promise<{ success: string[]; failed: Array<{ id: string; error: string }> }> {
  const results = {
    success: [] as string[],
    failed: [] as Array<{ id: string; error: string }>,
  };

  for (const pageId of pageIds) {
    try {
      await transitionPageStatus(pageId, toStatus, options);
      results.success.push(pageId);
    } catch (error) {
      results.failed.push({
        id: pageId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

// ============================================================================
// Workflow Validation Helpers
// ============================================================================

/**
 * Check if page can be published
 */
export async function canPublishPage(pageId: string): Promise<{
  canPublish: boolean;
  reason?: string;
}> {
  const page = await prisma.cmsPage.findUnique({
    where: { id: pageId },
    include: {
      sections: true,
    },
  });

  if (!page) {
    return { canPublish: false, reason: 'Page not found' };
  }

  // Check if page has required content
  if (!page.slug || page.slug.trim() === '') {
    return { canPublish: false, reason: 'Page slug is required' };
  }

  if (!page.metaTitle || page.metaTitle.trim() === '') {
    return { canPublish: false, reason: 'Meta title is required for SEO' };
  }

  if (page.sections.length === 0) {
    return { canPublish: false, reason: 'Page must have at least one section' };
  }

  // Check workflow status
  const status = page.status as WorkflowStatus;
  if (status !== 'approved' && status !== 'published' && status !== 'draft') {
    return {
      canPublish: false,
      reason: `Page must be approved before publishing (current: ${status})`,
    };
  }

  return { canPublish: true };
}

/**
 * Get workflow validation errors for a page
 */
export async function getWorkflowValidationErrors(
  pageId: string
): Promise<string[]> {
  const errors: string[] = [];

  const page = await prisma.cmsPage.findUnique({
    where: { id: pageId },
    include: {
      sections: true,
      template: true,
    },
  });

  if (!page) {
    return ['Page not found'];
  }

  if (!page.slug || page.slug.trim() === '') {
    errors.push('Slug is required');
  }

  if (!page.metaTitle || page.metaTitle.trim() === '') {
    errors.push('Meta title is required');
  }

  if (!page.metaDescription || page.metaDescription.trim() === '') {
    errors.push('Meta description is recommended for SEO');
  }

  if (page.sections.length === 0) {
    errors.push('At least one section is required');
  }

  return errors;
}

// ============================================================================
// Export Service
// ============================================================================

const workflowService = {
  // Validation
  isTransitionAllowed,
  getAllowedTransitions,
  getTransitionByAction,
  validateTransition,

  // Page Operations
  transitionPageStatus,
  getPageWorkflowHistory,
  getLatestWorkflowEntry,

  // Statistics
  getWorkflowStats,
  getPagesByStatus,
  getPendingReviewPages,
  getApprovedPages,
  getPublishedPages,

  // Bulk Operations
  bulkTransitionPages,

  // Validation Helpers
  canPublishPage,
  getWorkflowValidationErrors,

  // Constants
  WORKFLOW_TRANSITIONS,
};

export default workflowService;

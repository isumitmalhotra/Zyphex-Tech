/**
 * CMS Approval Service
 * 
 * Multi-step content approval system with approval chains, delegation,
 * and comprehensive approval history tracking.
 * 
 * Features:
 * - Multi-step approval workflows
 * - Approval chains with sequential/parallel processing
 * - Approval delegation
 * - Approval history and audit trail
 * - Auto-approval rules
 * - Approval notifications
 */

import { prisma } from '@/lib/prisma';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface ApprovalRequest {
  id: string;
  pageId: string;
  requestedBy: string;
  requestedByName: string;
  requestedByEmail: string;
  status: ApprovalStatus;
  currentStep: number;
  totalSteps: number;
  steps: ApprovalStep[];
  comments?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface ApprovalStep {
  stepNumber: number;
  stepName: string;
  approverIds: string[]; // User IDs who can approve this step
  approverType: 'any' | 'all'; // Any one approver or all approvers required
  status: StepStatus;
  approvedBy?: string[];
  rejectedBy?: string;
  delegatedTo?: string;
  comments?: string;
  completedAt?: Date;
}

export type ApprovalStatus = 'pending' | 'in_progress' | 'approved' | 'rejected' | 'cancelled';
export type StepStatus = 'pending' | 'in_progress' | 'approved' | 'rejected' | 'delegated';

export interface CreateApprovalInput {
  pageId: string;
  requestedBy: string;
  requestedByName: string;
  requestedByEmail: string;
  steps: Omit<ApprovalStep, 'status' | 'completedAt'>[];
  comments?: string;
  metadata?: Record<string, unknown>;
}

export interface ApproveStepInput {
  approverId: string;
  approverName: string;
  approverEmail: string;
  comments?: string;
}

export interface RejectApprovalInput {
  rejectedBy: string;
  rejectedByName: string;
  rejectedByEmail: string;
  reason: string;
  stepNumber?: number; // Which step is being rejected
}

export interface DelegateApprovalInput {
  delegatedBy: string;
  delegatedTo: string;
  delegatedToName: string;
  delegatedToEmail: string;
  reason?: string;
  stepNumber: number;
}

export interface ApprovalHistory {
  id: string;
  approvalId: string;
  action: 'created' | 'approved' | 'rejected' | 'delegated' | 'cancelled';
  stepNumber?: number;
  performedBy: string;
  performedByName: string;
  performedByEmail: string;
  comments?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export interface ApprovalStats {
  total: number;
  pending: number;
  inProgress: number;
  approved: number;
  rejected: number;
  cancelled: number;
  averageApprovalTime: number; // in hours
  approvalsByUser: {
    userId: string;
    userName: string;
    approved: number;
    rejected: number;
    delegated: number;
  }[];
}

// ============================================================================
// Approval Request Management
// ============================================================================

/**
 * Create a new approval request
 */
export async function createApprovalRequest(
  input: CreateApprovalInput
): Promise<ApprovalRequest> {
  const steps: ApprovalStep[] = input.steps.map((step, index) => ({
    ...step,
    stepNumber: index + 1,
    status: index === 0 ? 'pending' : 'pending',
  }));

  const approval = await prisma.cmsApproval.create({
    data: {
      pageId: input.pageId,
      requestedBy: input.requestedBy,
      requestedByName: input.requestedByName,
      requestedByEmail: input.requestedByEmail,
      status: 'pending',
      currentStep: 1,
      totalSteps: steps.length,
      steps: steps,
      comments: input.comments,
      metadata: input.metadata || {},
    },
  });

  // Create approval history entry
  await createApprovalHistory({
    approvalId: approval.id,
    action: 'created',
    performedBy: input.requestedBy,
    performedByName: input.requestedByName,
    performedByEmail: input.requestedByEmail,
    comments: input.comments,
    timestamp: new Date(),
  });

  return mapToApprovalRequest(approval);
}

/**
 * Get approval request by ID
 */
export async function getApprovalRequest(id: string): Promise<ApprovalRequest | null> {
  const approval = await prisma.cmsApproval.findUnique({
    where: { id },
  });

  if (!approval) {
    return null;
  }

  return mapToApprovalRequest(approval);
}

/**
 * Get approval requests for a page
 */
export async function getPageApprovals(
  pageId: string,
  options?: {
    status?: ApprovalStatus;
    includeHistory?: boolean;
  }
): Promise<ApprovalRequest[]> {
  const where: Record<string, unknown> = { pageId };
  
  if (options?.status) {
    where.status = options.status;
  }

  const approvals = await prisma.cmsApproval.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return approvals.map(mapToApprovalRequest);
}

/**
 * Get pending approvals for a user
 */
export async function getUserPendingApprovals(userId: string): Promise<ApprovalRequest[]> {
  const approvals = await prisma.cmsApproval.findMany({
    where: {
      status: { in: ['pending', 'in_progress'] },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Filter approvals where user is an approver for the current step
  const userApprovals = approvals.filter((approval) => {
    const steps = approval.steps as unknown as ApprovalStep[];
    const currentStepData = steps.find(s => s.stepNumber === approval.currentStep);
    return currentStepData?.approverIds.includes(userId);
  });

  return userApprovals.map(mapToApprovalRequest);
}

// ============================================================================
// Approval Actions
// ============================================================================

/**
 * Approve a step in the approval process
 */
export async function approveStep(
  approvalId: string,
  stepNumber: number,
  input: ApproveStepInput
): Promise<ApprovalRequest> {
  const approval = await prisma.cmsApproval.findUnique({
    where: { id: approvalId },
  });

  if (!approval) {
    throw new Error('Approval request not found');
  }

  if (approval.status === 'approved' || approval.status === 'rejected') {
    throw new Error('Approval request already completed');
  }

  const steps = approval.steps as unknown as ApprovalStep[];
  const currentStep = steps.find(s => s.stepNumber === stepNumber);

  if (!currentStep) {
    throw new Error('Step not found');
  }

  if (!currentStep.approverIds.includes(input.approverId)) {
    throw new Error('User is not authorized to approve this step');
  }

  // Update step based on approver type
  if (currentStep.approverType === 'any') {
    // Any approver can approve - mark step as approved
    currentStep.status = 'approved';
    currentStep.approvedBy = [input.approverId];
    currentStep.completedAt = new Date();
  } else {
    // All approvers required - add to approved list
    if (!currentStep.approvedBy) {
      currentStep.approvedBy = [];
    }
    if (!currentStep.approvedBy.includes(input.approverId)) {
      currentStep.approvedBy.push(input.approverId);
    }

    // Check if all approvers have approved
    const allApproved = currentStep.approverIds.every(id => 
      currentStep.approvedBy?.includes(id)
    );

    if (allApproved) {
      currentStep.status = 'approved';
      currentStep.completedAt = new Date();
    } else {
      currentStep.status = 'in_progress';
    }
  }

  if (input.comments) {
    currentStep.comments = input.comments;
  }

  // Check if this was the last step
  const isLastStep = stepNumber === approval.totalSteps;
  const allStepsApproved = steps.every(s => s.status === 'approved');

  let newStatus: ApprovalStatus = approval.status as ApprovalStatus;
  let newCurrentStep = approval.currentStep;
  let completedAt: Date | null = null;

  if (currentStep.status === 'approved') {
    if (isLastStep && allStepsApproved) {
      newStatus = 'approved';
      completedAt = new Date();
    } else if (!isLastStep) {
      newCurrentStep = stepNumber + 1;
      newStatus = 'in_progress';
      // Mark next step as pending
      const nextStep = steps.find(s => s.stepNumber === newCurrentStep);
      if (nextStep) {
        nextStep.status = 'pending';
      }
    }
  }

  // Update approval
  const updatedApproval = await prisma.cmsApproval.update({
    where: { id: approvalId },
    data: {
      steps: steps,
      status: newStatus,
      currentStep: newCurrentStep,
      completedAt,
      updatedAt: new Date(),
    },
  });

  // Create history entry
  await createApprovalHistory({
    approvalId,
    action: 'approved',
    stepNumber,
    performedBy: input.approverId,
    performedByName: input.approverName,
    performedByEmail: input.approverEmail,
    comments: input.comments,
    timestamp: new Date(),
  });

  return mapToApprovalRequest(updatedApproval);
}

/**
 * Reject an approval request
 */
export async function rejectApproval(
  approvalId: string,
  input: RejectApprovalInput
): Promise<ApprovalRequest> {
  const approval = await prisma.cmsApproval.findUnique({
    where: { id: approvalId },
  });

  if (!approval) {
    throw new Error('Approval request not found');
  }

  if (approval.status === 'approved' || approval.status === 'rejected') {
    throw new Error('Approval request already completed');
  }

  const steps = approval.steps as unknown as ApprovalStep[];
  const stepNumber = input.stepNumber || approval.currentStep;
  const currentStep = steps.find(s => s.stepNumber === stepNumber);

  if (!currentStep) {
    throw new Error('Step not found');
  }

  // Verify user is authorized
  if (!currentStep.approverIds.includes(input.rejectedBy)) {
    throw new Error('User is not authorized to reject this approval');
  }

  // Mark step and approval as rejected
  currentStep.status = 'rejected';
  currentStep.rejectedBy = input.rejectedBy;
  currentStep.comments = input.reason;
  currentStep.completedAt = new Date();

  const updatedApproval = await prisma.cmsApproval.update({
    where: { id: approvalId },
    data: {
      steps: steps,
      status: 'rejected',
      completedAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Create history entry
  await createApprovalHistory({
    approvalId,
    action: 'rejected',
    stepNumber,
    performedBy: input.rejectedBy,
    performedByName: input.rejectedByName,
    performedByEmail: input.rejectedByEmail,
    comments: input.reason,
    timestamp: new Date(),
  });

  return mapToApprovalRequest(updatedApproval);
}

/**
 * Delegate approval to another user
 */
export async function delegateApproval(
  approvalId: string,
  input: DelegateApprovalInput
): Promise<ApprovalRequest> {
  const approval = await prisma.cmsApproval.findUnique({
    where: { id: approvalId },
  });

  if (!approval) {
    throw new Error('Approval request not found');
  }

  if (approval.status === 'approved' || approval.status === 'rejected') {
    throw new Error('Approval request already completed');
  }

  const steps = approval.steps as unknown as ApprovalStep[];
  const currentStep = steps.find(s => s.stepNumber === input.stepNumber);

  if (!currentStep) {
    throw new Error('Step not found');
  }

  // Verify delegator is authorized
  if (!currentStep.approverIds.includes(input.delegatedBy)) {
    throw new Error('User is not authorized to delegate this approval');
  }

  // Update step to delegate
  currentStep.status = 'delegated';
  currentStep.delegatedTo = input.delegatedTo;
  
  // Replace delegator with delegatee in approver list
  currentStep.approverIds = currentStep.approverIds.map(id => 
    id === input.delegatedBy ? input.delegatedTo : id
  );

  // Reset to pending for the new approver
  currentStep.status = 'pending';

  const updatedApproval = await prisma.cmsApproval.update({
    where: { id: approvalId },
    data: {
      steps: steps,
      updatedAt: new Date(),
    },
  });

  // Create history entry
  await createApprovalHistory({
    approvalId,
    action: 'delegated',
    stepNumber: input.stepNumber,
    performedBy: input.delegatedBy,
    performedByName: input.delegatedToName,
    performedByEmail: input.delegatedToEmail,
    comments: input.reason,
    metadata: {
      delegatedTo: input.delegatedTo,
      delegatedToName: input.delegatedToName,
    },
    timestamp: new Date(),
  });

  return mapToApprovalRequest(updatedApproval);
}

/**
 * Cancel an approval request
 */
export async function cancelApproval(
  approvalId: string,
  cancelledBy: string,
  reason?: string
): Promise<ApprovalRequest> {
  const approval = await prisma.cmsApproval.findUnique({
    where: { id: approvalId },
  });

  if (!approval) {
    throw new Error('Approval request not found');
  }

  if (approval.status === 'approved' || approval.status === 'rejected') {
    throw new Error('Cannot cancel completed approval');
  }

  const updatedApproval = await prisma.cmsApproval.update({
    where: { id: approvalId },
    data: {
      status: 'cancelled',
      completedAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Create history entry
  await createApprovalHistory({
    approvalId,
    action: 'cancelled',
    performedBy: cancelledBy,
    performedByName: 'System',
    performedByEmail: '',
    comments: reason,
    timestamp: new Date(),
  });

  return mapToApprovalRequest(updatedApproval);
}

// ============================================================================
// Approval History
// ============================================================================

/**
 * Create approval history entry
 */
async function createApprovalHistory(
  input: Omit<ApprovalHistory, 'id'>
): Promise<ApprovalHistory> {
  const history = await prisma.cmsApprovalHistory.create({
    data: {
      approvalId: input.approvalId,
      action: input.action,
      stepNumber: input.stepNumber,
      performedBy: input.performedBy,
      performedByName: input.performedByName,
      performedByEmail: input.performedByEmail,
      comments: input.comments,
      metadata: input.metadata || {},
      timestamp: input.timestamp,
    },
  });

  return {
    id: history.id,
    approvalId: history.approvalId,
    action: history.action as ApprovalHistory['action'],
    stepNumber: history.stepNumber || undefined,
    performedBy: history.performedBy,
    performedByName: history.performedByName,
    performedByEmail: history.performedByEmail,
    comments: history.comments || undefined,
    metadata: history.metadata as Record<string, unknown> | undefined,
    timestamp: history.timestamp,
  };
}

/**
 * Get approval history
 */
export async function getApprovalHistory(approvalId: string): Promise<ApprovalHistory[]> {
  const history = await prisma.cmsApprovalHistory.findMany({
    where: { approvalId },
    orderBy: { timestamp: 'asc' },
  });

  return history.map(h => ({
    id: h.id,
    approvalId: h.approvalId,
    action: h.action as ApprovalHistory['action'],
    stepNumber: h.stepNumber || undefined,
    performedBy: h.performedBy,
    performedByName: h.performedByName,
    performedByEmail: h.performedByEmail,
    comments: h.comments || undefined,
    metadata: h.metadata as Record<string, unknown> | undefined,
    timestamp: h.timestamp,
  }));
}

// ============================================================================
// Statistics
// ============================================================================

/**
 * Get approval statistics
 */
export async function getApprovalStats(
  filters?: {
    pageId?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<ApprovalStats> {
  const where: Record<string, unknown> = {};

  if (filters?.pageId) {
    where.pageId = filters.pageId;
  }

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {} as Record<string, unknown>;
    if (filters.startDate) {
      (where.createdAt as Record<string, unknown>).gte = filters.startDate;
    }
    if (filters.endDate) {
      (where.createdAt as Record<string, unknown>).lte = filters.endDate;
    }
  }

  const [total, pending, inProgress, approved, rejected, cancelled, allApprovals] = await Promise.all([
    prisma.cmsApproval.count({ where }),
    prisma.cmsApproval.count({ where: { ...where, status: 'pending' } }),
    prisma.cmsApproval.count({ where: { ...where, status: 'in_progress' } }),
    prisma.cmsApproval.count({ where: { ...where, status: 'approved' } }),
    prisma.cmsApproval.count({ where: { ...where, status: 'rejected' } }),
    prisma.cmsApproval.count({ where: { ...where, status: 'cancelled' } }),
    prisma.cmsApproval.findMany({
      where: {
        ...where,
        status: 'approved',
        completedAt: { not: null },
      },
      select: {
        createdAt: true,
        completedAt: true,
      },
    }),
  ]);

  // Calculate average approval time
  let averageApprovalTime = 0;
  if (allApprovals.length > 0) {
    const totalTime = allApprovals.reduce((sum, approval) => {
      if (approval.completedAt) {
        const hours = (approval.completedAt.getTime() - approval.createdAt.getTime()) / (1000 * 60 * 60);
        return sum + hours;
      }
      return sum;
    }, 0);
    averageApprovalTime = totalTime / allApprovals.length;
  }

  // Get approval history for user stats
  const history = await prisma.cmsApprovalHistory.findMany({
    where: filters?.userId ? { performedBy: filters.userId } : {},
    select: {
      action: true,
      performedBy: true,
      performedByName: true,
    },
  });

  // Calculate approvals by user
  const userStatsMap = new Map<string, { userId: string; userName: string; approved: number; rejected: number; delegated: number }>();
  
  history.forEach(h => {
    if (!userStatsMap.has(h.performedBy)) {
      userStatsMap.set(h.performedBy, {
        userId: h.performedBy,
        userName: h.performedByName,
        approved: 0,
        rejected: 0,
        delegated: 0,
      });
    }
    
    const stats = userStatsMap.get(h.performedBy)!;
    if (h.action === 'approved') stats.approved++;
    if (h.action === 'rejected') stats.rejected++;
    if (h.action === 'delegated') stats.delegated++;
  });

  const approvalsByUser = Array.from(userStatsMap.values()).sort((a, b) => 
    (b.approved + b.rejected + b.delegated) - (a.approved + a.rejected + a.delegated)
  );

  return {
    total,
    pending,
    inProgress,
    approved,
    rejected,
    cancelled,
    averageApprovalTime,
    approvalsByUser,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function mapToApprovalRequest(approval: Record<string, unknown>): ApprovalRequest {
  return {
    id: approval.id as unknown as string,
    pageId: approval.pageId as unknown as string,
    requestedBy: approval.requestedBy as unknown as string,
    requestedByName: approval.requestedByName as unknown as string,
    requestedByEmail: approval.requestedByEmail as unknown as string,
    status: approval.status as ApprovalStatus,
    currentStep: approval.currentStep as unknown as number,
    totalSteps: approval.totalSteps as unknown as number,
    steps: approval.steps as unknown as ApprovalStep[],
    comments: (approval.comments as unknown as string | null) || undefined,
    metadata: approval.metadata as Record<string, unknown> | undefined,
    createdAt: approval.createdAt as unknown as Date,
    updatedAt: approval.updatedAt as unknown as Date,
    completedAt: (approval.completedAt as unknown as Date | null) || undefined,
  };
}

/**
 * Database Query Library - Type Definitions
 * 
 * Production-grade type-safe query utilities for optimal database performance
 */

import { Prisma } from '@prisma/client';

// ============================================================================
// Common Query Types
// ============================================================================

export type SortOrder = 'asc' | 'desc';

export interface PaginationInput {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface CursorPaginationInput {
  cursor?: string;
  take?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  cursor: {
    next: string | null;
    hasMore: boolean;
  };
}

// ============================================================================
// Filter Types
// ============================================================================

export interface DateRangeFilter {
  from?: Date;
  to?: Date;
}

export interface StatusFilter<T extends string = string> {
  status?: T | T[];
}

export interface SoftDeleteFilter {
  includeDeleted?: boolean;
  deletedOnly?: boolean;
}

// ============================================================================
// Performance Monitoring
// ============================================================================

export interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  rowCount?: number;
}

export interface QueryPerformanceOptions {
  enableMetrics?: boolean;
  logSlowQueries?: boolean;
  slowQueryThreshold?: number; // in milliseconds
}

// ============================================================================
// User Query Types
// ============================================================================

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'PROJECT_MANAGER' | 'TEAM_MEMBER' | 'CLIENT';

export interface UserFilter extends SoftDeleteFilter {
  role?: UserRole | UserRole[];
  emailVerified?: boolean;
  search?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

// Minimal user select (for listings, references)
export const userSelectMinimal = {
  id: true,
  name: true,
  email: true,
  role: true,
} as const;

// Safe user select (no sensitive data)
export const userSelectSafe = {
  id: true,
  name: true,
  email: true,
  role: true,
  image: true,
  createdAt: true,
  emailVerified: true,
} as const;

// Full user select (for profile, admin views)
export const userSelectFull = {
  id: true,
  name: true,
  email: true,
  role: true,
  image: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const;

export type UserMinimal = Prisma.UserGetPayload<{ select: typeof userSelectMinimal }>;
export type UserSafe = Prisma.UserGetPayload<{ select: typeof userSelectSafe }>;
export type UserFull = Prisma.UserGetPayload<{ select: typeof userSelectFull }>;

// ============================================================================
// Project Query Types
// ============================================================================

export type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';
export type ProjectPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface ProjectFilter extends SoftDeleteFilter {
  status?: ProjectStatus | ProjectStatus[];
  priority?: ProjectPriority | ProjectPriority[];
  clientId?: string;
  managerId?: string;
  userId?: string; // For projects user has access to
  search?: string;
  dateRange?: DateRangeFilter;
}

export const projectSelectMinimal = {
  id: true,
  name: true,
  status: true,
  priority: true,
} as const;

export const projectSelectWithClient = {
  id: true,
  name: true,
  description: true,
  status: true,
  priority: true,
  startDate: true,
  endDate: true,
  budget: true,
  client: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} as const;

export const projectSelectFull = {
  id: true,
  name: true,
  description: true,
  status: true,
  priority: true,
  startDate: true,
  endDate: true,
  budget: true,
  clientId: true,
  managerId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const;

export type ProjectMinimal = Prisma.ProjectGetPayload<{ select: typeof projectSelectMinimal }>;
export type ProjectWithClient = Prisma.ProjectGetPayload<{ select: typeof projectSelectWithClient }>;
export type ProjectFull = Prisma.ProjectGetPayload<{ select: typeof projectSelectFull }>;

// ============================================================================
// Task Query Types
// ============================================================================

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface TaskFilter extends SoftDeleteFilter {
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  projectId?: string;
  assigneeId?: string;
  createdBy?: string;
  dueDate?: DateRangeFilter;
  search?: string;
  overdue?: boolean;
}

export const taskSelectMinimal = {
  id: true,
  title: true,
  status: true,
  priority: true,
  dueDate: true,
} as const;

export const taskSelectWithAssignee = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  dueDate: true,
  estimatedHours: true,
  assignee: {
    select: userSelectMinimal,
  },
  project: {
    select: projectSelectMinimal,
  },
} as const;

export const taskSelectFull = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  dueDate: true,
  estimatedHours: true,
  projectId: true,
  assigneeId: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const;

export type TaskMinimal = Prisma.TaskGetPayload<{ select: typeof taskSelectMinimal }>;
export type TaskWithAssignee = Prisma.TaskGetPayload<{ select: typeof taskSelectWithAssignee }>;
export type TaskFull = Prisma.TaskGetPayload<{ select: typeof taskSelectFull }>;

// ============================================================================
// Invoice Query Types
// ============================================================================

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface InvoiceFilter extends SoftDeleteFilter {
  status?: InvoiceStatus | InvoiceStatus[];
  clientId?: string;
  projectId?: string;
  dueDate?: DateRangeFilter;
  issueDate?: DateRangeFilter;
  amountRange?: { min?: number; max?: number };
  search?: string;
}

export const invoiceSelectMinimal = {
  id: true,
  invoiceNumber: true,
  status: true,
  amount: true,
  dueDate: true,
} as const;

export const invoiceSelectWithClient = {
  id: true,
  invoiceNumber: true,
  status: true,
  amount: true,
  tax: true,
  total: true,
  issueDate: true,
  dueDate: true,
  client: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  project: {
    select: projectSelectMinimal,
  },
} as const;

export const invoiceSelectFull = {
  id: true,
  invoiceNumber: true,
  status: true,
  amount: true,
  tax: true,
  total: true,
  issueDate: true,
  dueDate: true,
  paidAt: true,
  notes: true,
  clientId: true,
  projectId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const;

export type InvoiceMinimal = Prisma.InvoiceGetPayload<{ select: typeof invoiceSelectMinimal }>;
export type InvoiceWithClient = Prisma.InvoiceGetPayload<{ select: typeof invoiceSelectWithClient }>;
export type InvoiceFull = Prisma.InvoiceGetPayload<{ select: typeof invoiceSelectFull }>;

// ============================================================================
// Message Query Types
// ============================================================================

export interface MessageFilter extends SoftDeleteFilter {
  senderId?: string;
  receiverId?: string;
  projectId?: string;
  channelId?: string;
  unreadOnly?: boolean;
  dateRange?: DateRangeFilter;
}

export const messageSelectMinimal = {
  id: true,
  content: true,
  readAt: true,
  createdAt: true,
} as const;

export const messageSelectWithUsers = {
  id: true,
  content: true,
  readAt: true,
  createdAt: true,
  sender: {
    select: userSelectMinimal,
  },
  receiver: {
    select: userSelectMinimal,
  },
} as const;

export const messageSelectFull = {
  id: true,
  content: true,
  readAt: true,
  senderId: true,
  receiverId: true,
  projectId: true,
  channelId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const;

export type MessageMinimal = Prisma.MessageGetPayload<{ select: typeof messageSelectMinimal }>;
export type MessageWithUsers = Prisma.MessageGetPayload<{ select: typeof messageSelectWithUsers }>;
export type MessageFull = Prisma.MessageGetPayload<{ select: typeof messageSelectFull }>;

// ============================================================================
// TimeEntry Query Types
// ============================================================================

export interface TimeEntryFilter extends SoftDeleteFilter {
  userId?: string;
  projectId?: string;
  taskId?: string;
  dateRange?: DateRangeFilter;
  billable?: boolean;
}

export const timeEntrySelectMinimal = {
  id: true,
  hours: true,
  date: true,
  billable: true,
} as const;

export const timeEntrySelectWithTask = {
  id: true,
  hours: true,
  date: true,
  description: true,
  billable: true,
  task: {
    select: {
      id: true,
      title: true,
      project: {
        select: projectSelectMinimal,
      },
    },
  },
} as const;

export const timeEntrySelectFull = {
  id: true,
  hours: true,
  date: true,
  description: true,
  billable: true,
  userId: true,
  projectId: true,
  taskId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const;

export type TimeEntryMinimal = Prisma.TimeEntryGetPayload<{ select: typeof timeEntrySelectMinimal }>;
export type TimeEntryWithTask = Prisma.TimeEntryGetPayload<{ select: typeof timeEntrySelectWithTask }>;
export type TimeEntryFull = Prisma.TimeEntryGetPayload<{ select: typeof timeEntrySelectFull }>;

// ============================================================================
// Batch Operation Types
// ============================================================================

export interface BatchUpdateResult {
  count: number;
  updated: string[];
  failed: string[];
  errors: Array<{ id: string; error: string }>;
}

export interface BatchDeleteResult {
  count: number;
  deleted: string[];
  failed: string[];
  errors: Array<{ id: string; error: string }>;
}

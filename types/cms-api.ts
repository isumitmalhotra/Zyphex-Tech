/**
 * CMS API Type Definitions
 * Centralized TypeScript types for API requests and responses
 */

import { Prisma } from '@prisma/client';

/**
 * ============================================================================
 * Common Types
 * ============================================================================
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: unknown;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
  filters?: Record<string, unknown>;
}

export type SortOrder = 'asc' | 'desc';

/**
 * ============================================================================
 * Page Types
 * ============================================================================
 */

export type PageStatus = 'draft' | 'review' | 'scheduled' | 'published' | 'archived';
export type PageType = 'standard' | 'landing' | 'blog' | 'custom';

// Complete page with all relations
export type PageWithRelations = Prisma.CmsPageGetPayload<{
  include: {
    template: true;
    sections: {
      orderBy: { order: 'asc' };
    };
    versions: {
      orderBy: { versionNumber: 'desc' };
      take: 5;
    };
    author: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    lastEditor: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    _count: {
      select: {
        sections: true;
        versions: true;
        workflows: true;
        schedules: true;
      };
    };
  };
}>;

// Page summary (for list views)
export type PageSummary = Prisma.CmsPageGetPayload<{
  include: {
    template: {
      select: {
        id: true;
        name: true;
        category: true;
      };
    };
    _count: {
      select: {
        sections: true;
        versions: true;
      };
    };
  };
}>;

// Create page request body
export interface CreatePageRequest {
  pageKey: string;
  pageTitle: string;
  slug: string;
  pageType?: PageType;
  templateId?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  structuredData?: Record<string, unknown>;
  isPublic?: boolean;
  requiresAuth?: boolean;
  allowComments?: boolean;
  layout?: string;
}

// Update page request body
export interface UpdatePageRequest {
  pageKey?: string;
  pageTitle?: string;
  slug?: string;
  pageType?: PageType;
  templateId?: string | null;
  status?: PageStatus;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  ogImage?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  structuredData?: Record<string, unknown> | null;
  scheduledPublishAt?: Date | null;
  scheduledUnpublishAt?: Date | null;
  isPublic?: boolean;
  requiresAuth?: boolean;
  allowComments?: boolean;
  layout?: string | null;
  seoScore?: number | null;
  changeDescription?: string;
}

// List pages query parameters
export interface ListPagesParams extends PaginationParams {
  status?: PageStatus | 'all';
  search?: string;
  templateId?: string;
  authorId?: string;
  pageType?: PageType;
  sortBy?: 'createdAt' | 'updatedAt' | 'pageTitle' | 'publishedAt';
  sortOrder?: SortOrder;
}

/**
 * ============================================================================
 * Section Types
 * ============================================================================
 */

export type SectionType = 'hero' | 'features' | 'testimonials' | 'cta' | 'content' | 'gallery' | 'faq' | 'custom';

// Complete section
export type Section = Prisma.CmsPageSectionGetPayload<Record<string, never>>;

// Section with page context
export type SectionWithPage = Prisma.CmsPageSectionGetPayload<{
  include: {
    page: {
      select: {
        id: true;
        pageKey: true;
        pageTitle: true;
        status: true;
      };
    };
  };
}>;

// Create section request body
export interface CreateSectionRequest {
  sectionKey: string;
  sectionType: SectionType;
  title?: string | null;
  subtitle?: string | null;
  content: Record<string, unknown>;
  order?: number;
  isVisible?: boolean;
  cssClasses?: string | null;
  customStyles?: Record<string, unknown> | null;
  showOnMobile?: boolean;
  showOnTablet?: boolean;
  showOnDesktop?: boolean;
}

// Update section request body
export interface UpdateSectionRequest {
  sectionKey?: string;
  sectionType?: SectionType;
  title?: string | null;
  subtitle?: string | null;
  content?: Record<string, unknown>;
  order?: number;
  isVisible?: boolean;
  cssClasses?: string | null;
  customStyles?: Record<string, unknown> | null;
  showOnMobile?: boolean;
  showOnTablet?: boolean;
  showOnDesktop?: boolean;
}

// Reorder sections request body
export interface ReorderSectionsRequest {
  sections: Array<{
    id: string;
    order: number;
  }>;
}

/**
 * ============================================================================
 * Template Types
 * ============================================================================
 */

export type TemplateCategory = 'landing' | 'blog' | 'ecommerce' | 'portfolio' | 'corporate' | 'custom';

// Complete template
export type Template = Prisma.CmsTemplateGetPayload<Record<string, never>>;

// Template with page count
export type TemplateWithPages = Prisma.CmsTemplateGetPayload<{
  include: {
    _count: {
      select: {
        pages: true;
      };
    };
  };
}>;

// Create template request body
export interface CreateTemplateRequest {
  name: string;
  description?: string | null;
  category: TemplateCategory;
  structure: Record<string, unknown>;
  thumbnailUrl?: string | null;
  previewUrl?: string | null;
  defaultSections?: Record<string, unknown> | null;
  requiredSections?: string[] | null;
  isActive?: boolean;
}

// Update template request body
export interface UpdateTemplateRequest {
  name?: string;
  description?: string | null;
  category?: TemplateCategory;
  structure?: Record<string, unknown>;
  thumbnailUrl?: string | null;
  previewUrl?: string | null;
  defaultSections?: Record<string, unknown> | null;
  requiredSections?: string[] | null;
  isActive?: boolean;
}

/**
 * ============================================================================
 * Media Types
 * ============================================================================
 */

export type MediaType = 'image' | 'video' | 'document' | 'other';

// Complete media asset
export type MediaAsset = Prisma.CmsMediaAssetGetPayload<Record<string, never>>;

// Media asset with folder
export type MediaAssetWithFolder = Prisma.CmsMediaAssetGetPayload<{
  include: {
    folder: {
      select: {
        id: true;
        name: true;
        path: true;
      };
    };
    uploadedBy: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
  };
}>;

// Create media asset request body
export interface CreateMediaAssetRequest {
  fileName: string;
  fileType: MediaType;
  mimeType: string;
  fileSize: number;
  filePath: string;
  url: string;
  thumbnailUrl?: string | null;
  folderId?: string | null;
  altText?: string | null;
  caption?: string | null;
  metadata?: Record<string, unknown> | null;
}

// Update media asset request body
export interface UpdateMediaAssetRequest {
  fileName?: string;
  altText?: string | null;
  caption?: string | null;
  folderId?: string | null;
  metadata?: Record<string, unknown> | null;
}

// List media query parameters
export interface ListMediaParams extends PaginationParams {
  fileType?: MediaType;
  folderId?: string;
  search?: string;
  sortBy?: 'createdAt' | 'fileName' | 'fileSize';
  sortOrder?: SortOrder;
}

/**
 * ============================================================================
 * Media Folder Types
 * ============================================================================
 */

// Complete folder
export type MediaFolder = Prisma.CmsMediaFolderGetPayload<Record<string, never>>;

// Folder with asset count
export type MediaFolderWithAssets = Prisma.CmsMediaFolderGetPayload<{
  include: {
    _count: {
      select: {
        assets: true;
        children: true;
      };
    };
  };
}>;

// Create folder request body
export interface CreateMediaFolderRequest {
  name: string;
  path: string;
  parentId?: string | null;
  description?: string | null;
}

/**
 * ============================================================================
 * Version Types
 * ============================================================================
 */

// Complete version
export type Version = Prisma.CmsPageVersionGetPayload<Record<string, never>>;

// Version with user info (createdBy is userId string, not relation - adjust if needed)
export type VersionWithUser = Prisma.CmsPageVersionGetPayload<Record<string, never>>;

// Rollback request body
export interface RollbackVersionRequest {
  versionId: string;
  changeDescription?: string;
}

/**
 * ============================================================================
 * Workflow Types
 * ============================================================================
 */

export type WorkflowStatus = 'pending' | 'approved' | 'rejected' | 'published';

// Complete workflow
export type Workflow = Prisma.CmsWorkflowGetPayload<Record<string, never>>;

// Workflow with relations
export type WorkflowWithRelations = Prisma.CmsWorkflowGetPayload<{
  include: {
    page: {
      select: {
        id: true;
        pageKey: true;
        pageTitle: true;
      };
    };
    submittedBy: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    reviewedBy: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
  };
}>;

// Submit for review request body
export interface SubmitWorkflowRequest {
  pageId: string;
  comments?: string | null;
  requestedPublishAt?: Date | null;
}

// Review workflow request body
export interface ReviewWorkflowRequest {
  status: 'approved' | 'rejected';
  reviewerComments?: string | null;
}

/**
 * ============================================================================
 * Schedule Types
 * ============================================================================
 */

export type ScheduleType = 'publish' | 'unpublish' | 'archive';
export type ScheduleStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

// Complete schedule
export type Schedule = Prisma.CmsScheduleGetPayload<Record<string, never>>;

// Schedule with relations
export type ScheduleWithRelations = Prisma.CmsScheduleGetPayload<{
  include: {
    page: {
      select: {
        id: true;
        pageKey: true;
        pageTitle: true;
        status: true;
      };
    };
    createdBy: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
  };
}>;

// Create schedule request body
export interface CreateScheduleRequest {
  pageId: string;
  scheduleType: ScheduleType;
  scheduledFor: Date;
  metadata?: Record<string, unknown> | null;
}

// Update schedule request body
export interface UpdateScheduleRequest {
  scheduledFor?: Date;
  status?: ScheduleStatus;
}

/**
 * ============================================================================
 * Activity Log Types
 * ============================================================================
 */

export type ActivityAction = 
  | 'page_created'
  | 'page_updated'
  | 'page_deleted'
  | 'page_published'
  | 'page_unpublished'
  | 'section_created'
  | 'section_updated'
  | 'section_deleted'
  | 'section_reordered'
  | 'version_created'
  | 'version_rolled_back'
  | 'workflow_submitted'
  | 'workflow_approved'
  | 'workflow_rejected'
  | 'schedule_created'
  | 'schedule_executed';

// Complete activity log
export type ActivityLog = Prisma.CmsActivityLogGetPayload<Record<string, never>>;

// Activity log with user (userId is string, not relation - adjust if needed)
export type ActivityLogWithUser = Prisma.CmsActivityLogGetPayload<Record<string, never>>;

// List activity query parameters
export interface ListActivityParams extends PaginationParams {
  entityType?: string;
  entityId?: string;
  userId?: string;
  action?: ActivityAction;
  startDate?: Date;
  endDate?: Date;
}

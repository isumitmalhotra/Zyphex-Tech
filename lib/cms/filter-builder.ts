/**
 * CMS Filter Builder
 * Dynamic query builder for advanced filtering across CMS entities
 */

import { Prisma } from '@prisma/client';

export interface FilterOptions {
  // Text filters
  search?: string;
  
  // Status filters
  status?: string | string[];
  
  // Type filters
  pageType?: string | string[];
  assetType?: string | string[];
  sectionType?: string | string[];
  
  // Category filters
  category?: string | string[];
  
  // Author/User filters
  authorId?: string;
  createdBy?: string;
  uploadedBy?: string;
  
  // Date range filters
  createdAfter?: string | Date;
  createdBefore?: string | Date;
  updatedAfter?: string | Date;
  updatedBefore?: string | Date;
  publishedAfter?: string | Date;
  publishedBefore?: string | Date;
  
  // Boolean filters
  isPublic?: boolean;
  isActive?: boolean;
  isVisible?: boolean;
  requiresAuth?: boolean;
  isSystem?: boolean;
  
  // Template filters
  templateId?: string;
  
  // Folder filters
  folderId?: string;
  
  // Tag filters
  tags?: string | string[];
  
  // Advanced filters
  minSeoScore?: number;
  maxSeoScore?: number;
  minFileSize?: number;
  maxFileSize?: number;
  
  // Sorting
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  
  // Pagination
  page?: number;
  limit?: number;
}

export interface BuilderResult<T> {
  where: T;
  orderBy: Record<string, 'asc' | 'desc'>[];
  take: number;
  skip: number;
}

/**
 * Build filter query for CMS Pages
 */
export function buildPageFilters(filters: FilterOptions): BuilderResult<Prisma.CmsPageWhereInput> {
  const where: Prisma.CmsPageWhereInput = {
    deletedAt: null, // Only show non-deleted pages
  };

  // Text search
  if (filters.search) {
    const searchTerms = filters.search.toLowerCase().split(/\s+/).filter(Boolean);
    where.OR = searchTerms.flatMap(term => [
      { pageTitle: { contains: term, mode: 'insensitive' } },
      { slug: { contains: term, mode: 'insensitive' } },
      { metaDescription: { contains: term, mode: 'insensitive' } },
      { metaKeywords: { contains: term, mode: 'insensitive' } },
      { pageKey: { contains: term, mode: 'insensitive' } },
    ]);
  }

  // Status filter
  if (filters.status) {
    where.status = Array.isArray(filters.status)
      ? { in: filters.status }
      : filters.status;
  }

  // Page type filter
  if (filters.pageType) {
    where.pageType = Array.isArray(filters.pageType)
      ? { in: filters.pageType }
      : filters.pageType;
  }

  // Author filter
  if (filters.authorId) {
    where.authorId = filters.authorId;
  }

  // Template filter
  if (filters.templateId) {
    where.templateId = filters.templateId;
  }

  // Boolean filters
  if (filters.isPublic !== undefined) {
    where.isPublic = filters.isPublic;
  }

  if (filters.requiresAuth !== undefined) {
    where.requiresAuth = filters.requiresAuth;
  }

  // Date range filters
  if (filters.createdAfter || filters.createdBefore) {
    where.createdAt = {};
    if (filters.createdAfter) {
      where.createdAt.gte = new Date(filters.createdAfter);
    }
    if (filters.createdBefore) {
      where.createdAt.lte = new Date(filters.createdBefore);
    }
  }

  if (filters.updatedAfter || filters.updatedBefore) {
    where.updatedAt = {};
    if (filters.updatedAfter) {
      where.updatedAt.gte = new Date(filters.updatedAfter);
    }
    if (filters.updatedBefore) {
      where.updatedAt.lte = new Date(filters.updatedBefore);
    }
  }

  if (filters.publishedAfter || filters.publishedBefore) {
    where.publishedAt = {};
    if (filters.publishedAfter) {
      where.publishedAt.gte = new Date(filters.publishedAfter);
    }
    if (filters.publishedBefore) {
      where.publishedAt.lte = new Date(filters.publishedBefore);
    }
  }

  // SEO score filter
  if (filters.minSeoScore !== undefined || filters.maxSeoScore !== undefined) {
    where.seoScore = {};
    if (filters.minSeoScore !== undefined) {
      where.seoScore.gte = filters.minSeoScore;
    }
    if (filters.maxSeoScore !== undefined) {
      where.seoScore.lte = filters.maxSeoScore;
    }
  }

  // Build ordering
  const orderBy = buildOrderBy(filters.sortBy, filters.sortOrder, 'page');

  // Pagination
  const { take, skip } = buildPagination(filters.page, filters.limit);

  return { where, orderBy, take, skip };
}

/**
 * Build filter query for CMS Templates
 */
export function buildTemplateFilters(filters: FilterOptions): BuilderResult<Prisma.CmsTemplateWhereInput> {
  const where: Prisma.CmsTemplateWhereInput = {};

  // Text search
  if (filters.search) {
    const searchTerms = filters.search.toLowerCase().split(/\s+/).filter(Boolean);
    where.OR = searchTerms.flatMap(term => [
      { name: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
    ]);
  }

  // Category filter
  if (filters.category) {
    where.category = Array.isArray(filters.category)
      ? { in: filters.category }
      : filters.category;
  }

  // Boolean filters
  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (filters.isSystem !== undefined) {
    where.isSystem = filters.isSystem;
  }

  // Date range filters
  if (filters.createdAfter || filters.createdBefore) {
    where.createdAt = {};
    if (filters.createdAfter) {
      where.createdAt.gte = new Date(filters.createdAfter);
    }
    if (filters.createdBefore) {
      where.createdAt.lte = new Date(filters.createdBefore);
    }
  }

  // Build ordering
  const orderBy = buildOrderBy(filters.sortBy, filters.sortOrder, 'template');

  // Pagination
  const { take, skip } = buildPagination(filters.page, filters.limit);

  return { where, orderBy, take, skip };
}

/**
 * Build filter query for CMS Media Assets
 */
export function buildMediaFilters(filters: FilterOptions): BuilderResult<Prisma.CmsMediaAssetWhereInput> {
  const where: Prisma.CmsMediaAssetWhereInput = {
    deletedAt: null, // Only show non-deleted assets
  };

  // Text search
  if (filters.search) {
    const searchTerms = filters.search.toLowerCase().split(/\s+/).filter(Boolean);
    where.OR = searchTerms.flatMap(term => [
      { filename: { contains: term, mode: 'insensitive' } },
      { originalName: { contains: term, mode: 'insensitive' } },
      { altText: { contains: term, mode: 'insensitive' } },
      { caption: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
    ]);
  }

  // Asset type filter
  if (filters.assetType) {
    where.assetType = Array.isArray(filters.assetType)
      ? { in: filters.assetType }
      : filters.assetType;
  }

  // Folder filter
  if (filters.folderId) {
    where.folderId = filters.folderId;
  }

  // Uploaded by filter
  if (filters.uploadedBy) {
    where.uploadedBy = filters.uploadedBy;
  }

  // Tag filter
  if (filters.tags) {
    const tagArray = Array.isArray(filters.tags) ? filters.tags : [filters.tags];
    where.tags = { hasSome: tagArray };
  }

  // File size filter
  if (filters.minFileSize !== undefined || filters.maxFileSize !== undefined) {
    where.fileSize = {};
    if (filters.minFileSize !== undefined) {
      where.fileSize.gte = filters.minFileSize;
    }
    if (filters.maxFileSize !== undefined) {
      where.fileSize.lte = filters.maxFileSize;
    }
  }

  // Date range filters
  if (filters.createdAfter || filters.createdBefore) {
    where.createdAt = {};
    if (filters.createdAfter) {
      where.createdAt.gte = new Date(filters.createdAfter);
    }
    if (filters.createdBefore) {
      where.createdAt.lte = new Date(filters.createdBefore);
    }
  }

  // Build ordering
  const orderBy = buildOrderBy(filters.sortBy, filters.sortOrder, 'media');

  // Pagination
  const { take, skip } = buildPagination(filters.page, filters.limit);

  return { where, orderBy, take, skip };
}

/**
 * Build filter query for CMS Page Sections
 */
export function buildSectionFilters(filters: FilterOptions): BuilderResult<Prisma.CmsPageSectionWhereInput> {
  const where: Prisma.CmsPageSectionWhereInput = {};

  // Text search
  if (filters.search) {
    const searchTerms = filters.search.toLowerCase().split(/\s+/).filter(Boolean);
    where.OR = searchTerms.flatMap(term => [
      { title: { contains: term, mode: 'insensitive' } },
      { subtitle: { contains: term, mode: 'insensitive' } },
      { sectionKey: { contains: term, mode: 'insensitive' } },
    ]);
  }

  // Section type filter
  if (filters.sectionType) {
    where.sectionType = Array.isArray(filters.sectionType)
      ? { in: filters.sectionType }
      : filters.sectionType;
  }

  // Visibility filter
  if (filters.isVisible !== undefined) {
    where.isVisible = filters.isVisible;
  }

  // Date range filters
  if (filters.createdAfter || filters.createdBefore) {
    where.createdAt = {};
    if (filters.createdAfter) {
      where.createdAt.gte = new Date(filters.createdAfter);
    }
    if (filters.createdBefore) {
      where.createdAt.lte = new Date(filters.createdBefore);
    }
  }

  // Build ordering
  const orderBy = buildOrderBy(filters.sortBy, filters.sortOrder, 'section');

  // Pagination
  const { take, skip } = buildPagination(filters.page, filters.limit);

  return { where, orderBy, take, skip };
}

/**
 * Build order by clause
 */
function buildOrderBy(
  sortBy?: string,
  sortOrder: 'asc' | 'desc' = 'desc',
  entityType: 'page' | 'template' | 'media' | 'section' = 'page'
): Record<string, 'asc' | 'desc'>[] {
  const defaultSort: Record<string, Record<string, 'asc' | 'desc'>[]> = {
    page: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    template: [{ order: 'asc' }, { updatedAt: 'desc' }],
    media: [{ createdAt: 'desc' }],
    section: [{ order: 'asc' }],
  };

  if (!sortBy) {
    return defaultSort[entityType];
  }

  // Map sort fields
  const sortFieldMap: Record<string, string> = {
    title: entityType === 'page' ? 'pageTitle' : entityType === 'template' ? 'name' : entityType === 'media' ? 'originalName' : 'title',
    name: entityType === 'template' ? 'name' : 'pageTitle',
    created: 'createdAt',
    updated: 'updatedAt',
    published: 'publishedAt',
    size: 'fileSize',
    usage: 'usageCount',
    order: 'order',
    status: 'status',
    type: entityType === 'page' ? 'pageType' : entityType === 'media' ? 'assetType' : 'sectionType',
  };

  const field = sortFieldMap[sortBy] || sortBy;

  return [{ [field]: sortOrder }];
}

/**
 * Build pagination params
 */
function buildPagination(page?: number, limit?: number): { take: number; skip: number } {
  const defaultLimit = 20;
  const take = limit && limit > 0 ? Math.min(limit, 100) : defaultLimit;
  const skip = page && page > 1 ? (page - 1) * take : 0;

  return { take, skip };
}

/**
 * Parse filter options from query string
 */
export function parseFilterParams(searchParams: URLSearchParams): FilterOptions {
  const filters: FilterOptions = {};

  // Text search
  if (searchParams.get('search')) {
    filters.search = searchParams.get('search') || undefined;
  }

  // Status
  const status = searchParams.get('status');
  if (status) {
    filters.status = status.includes(',') ? status.split(',') : status;
  }

  // Types
  const pageType = searchParams.get('pageType');
  if (pageType) {
    filters.pageType = pageType.includes(',') ? pageType.split(',') : pageType;
  }

  const assetType = searchParams.get('assetType');
  if (assetType) {
    filters.assetType = assetType.includes(',') ? assetType.split(',') : assetType;
  }

  const sectionType = searchParams.get('sectionType');
  if (sectionType) {
    filters.sectionType = sectionType.includes(',') ? sectionType.split(',') : sectionType;
  }

  // Category
  const category = searchParams.get('category');
  if (category) {
    filters.category = category.includes(',') ? category.split(',') : category;
  }

  // User filters
  if (searchParams.get('authorId')) {
    filters.authorId = searchParams.get('authorId') || undefined;
  }

  if (searchParams.get('createdBy')) {
    filters.createdBy = searchParams.get('createdBy') || undefined;
  }

  if (searchParams.get('uploadedBy')) {
    filters.uploadedBy = searchParams.get('uploadedBy') || undefined;
  }

  // Date filters
  if (searchParams.get('createdAfter')) {
    filters.createdAfter = searchParams.get('createdAfter') || undefined;
  }

  if (searchParams.get('createdBefore')) {
    filters.createdBefore = searchParams.get('createdBefore') || undefined;
  }

  if (searchParams.get('updatedAfter')) {
    filters.updatedAfter = searchParams.get('updatedAfter') || undefined;
  }

  if (searchParams.get('updatedBefore')) {
    filters.updatedBefore = searchParams.get('updatedBefore') || undefined;
  }

  if (searchParams.get('publishedAfter')) {
    filters.publishedAfter = searchParams.get('publishedAfter') || undefined;
  }

  if (searchParams.get('publishedBefore')) {
    filters.publishedBefore = searchParams.get('publishedBefore') || undefined;
  }

  // Boolean filters
  if (searchParams.get('isPublic') !== null) {
    filters.isPublic = searchParams.get('isPublic') === 'true';
  }

  if (searchParams.get('isActive') !== null) {
    filters.isActive = searchParams.get('isActive') === 'true';
  }

  if (searchParams.get('isVisible') !== null) {
    filters.isVisible = searchParams.get('isVisible') === 'true';
  }

  if (searchParams.get('requiresAuth') !== null) {
    filters.requiresAuth = searchParams.get('requiresAuth') === 'true';
  }

  if (searchParams.get('isSystem') !== null) {
    filters.isSystem = searchParams.get('isSystem') === 'true';
  }

  // ID filters
  if (searchParams.get('templateId')) {
    filters.templateId = searchParams.get('templateId') || undefined;
  }

  if (searchParams.get('folderId')) {
    filters.folderId = searchParams.get('folderId') || undefined;
  }

  // Tags
  const tags = searchParams.get('tags');
  if (tags) {
    filters.tags = tags.includes(',') ? tags.split(',') : tags;
  }

  // Number filters
  if (searchParams.get('minSeoScore')) {
    filters.minSeoScore = parseInt(searchParams.get('minSeoScore') || '0');
  }

  if (searchParams.get('maxSeoScore')) {
    filters.maxSeoScore = parseInt(searchParams.get('maxSeoScore') || '100');
  }

  if (searchParams.get('minFileSize')) {
    filters.minFileSize = parseInt(searchParams.get('minFileSize') || '0');
  }

  if (searchParams.get('maxFileSize')) {
    filters.maxFileSize = parseInt(searchParams.get('maxFileSize') || '0');
  }

  // Sorting
  if (searchParams.get('sortBy')) {
    filters.sortBy = searchParams.get('sortBy') || undefined;
  }

  if (searchParams.get('sortOrder')) {
    filters.sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';
  }

  // Pagination
  if (searchParams.get('page')) {
    filters.page = parseInt(searchParams.get('page') || '1');
  }

  if (searchParams.get('limit')) {
    filters.limit = parseInt(searchParams.get('limit') || '20');
  }

  return filters;
}

/**
 * Build filter summary text for UI display
 */
export function buildFilterSummary(filters: FilterOptions): string[] {
  const summary: string[] = [];

  if (filters.search) {
    summary.push(`Search: "${filters.search}"`);
  }

  if (filters.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
    summary.push(`Status: ${statuses.join(', ')}`);
  }

  if (filters.pageType) {
    const types = Array.isArray(filters.pageType) ? filters.pageType : [filters.pageType];
    summary.push(`Type: ${types.join(', ')}`);
  }

  if (filters.category) {
    const categories = Array.isArray(filters.category) ? filters.category : [filters.category];
    summary.push(`Category: ${categories.join(', ')}`);
  }

  if (filters.createdAfter || filters.createdBefore) {
    if (filters.createdAfter && filters.createdBefore) {
      summary.push(`Created: ${new Date(filters.createdAfter).toLocaleDateString()} - ${new Date(filters.createdBefore).toLocaleDateString()}`);
    } else if (filters.createdAfter) {
      summary.push(`Created after: ${new Date(filters.createdAfter).toLocaleDateString()}`);
    } else if (filters.createdBefore) {
      summary.push(`Created before: ${new Date(filters.createdBefore).toLocaleDateString()}`);
    }
  }

  if (filters.tags) {
    const tagArray = Array.isArray(filters.tags) ? filters.tags : [filters.tags];
    summary.push(`Tags: ${tagArray.join(', ')}`);
  }

  return summary;
}

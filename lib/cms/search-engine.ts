/**
 * CMS Full-Text Search Engine
 * Provides advanced search capabilities across all CMS entities
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface SearchQuery {
  query: string;
  entityTypes?: ('page' | 'template' | 'media' | 'section')[];
  filters?: SearchFilters;
  limit?: number;
  offset?: number;
}

export interface SearchFilters {
  // Page filters
  status?: string[];
  pageType?: string[];
  authorId?: string;
  templateId?: string;
  publishedAfter?: Date;
  publishedBefore?: Date;
  
  // Media filters
  assetType?: string[];
  folderId?: string;
  tags?: string[];
  
  // Template filters
  category?: string[];
  isActive?: boolean;
  
  // Common filters
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface SearchResult {
  id: string;
  type: 'page' | 'template' | 'media' | 'section';
  title: string;
  description?: string;
  url?: string;
  thumbnailUrl?: string;
  metadata?: Record<string, unknown>;
  relevanceScore: number;
  highlights?: string[];
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  facets: SearchFacets;
  suggestions?: string[];
}

export interface SearchFacets {
  types: { type: string; count: number }[];
  statuses?: { status: string; count: number }[];
  categories?: { category: string; count: number }[];
  assetTypes?: { assetType: string; count: number }[];
}

/**
 * Main search function - searches across all CMS entities
 */
export async function searchCMS(searchQuery: SearchQuery): Promise<SearchResponse> {
  const {
    query,
    entityTypes = ['page', 'template', 'media', 'section'],
    filters = {},
    limit = 20,
    offset = 0,
  } = searchQuery;

  const results: SearchResult[] = [];
  const facets: SearchFacets = {
    types: [],
    statuses: [],
    categories: [],
    assetTypes: [],
  };

  // Search pages
  if (entityTypes.includes('page')) {
    const pageResults = await searchPages(query, filters, limit, offset);
    results.push(...pageResults.map(p => ({
      id: p.id,
      type: 'page' as const,
      title: p.pageTitle,
      description: p.metaDescription || undefined,
      url: p.slug,
      thumbnailUrl: p.ogImage || undefined,
      metadata: {
        status: p.status,
        pageType: p.pageType,
        publishedAt: p.publishedAt,
        authorId: p.authorId,
      },
      relevanceScore: calculateRelevance(query, p.pageTitle, p.metaDescription),
      highlights: generateHighlights(query, [p.pageTitle, p.metaDescription, p.slug]),
    })));
  }

  // Search templates
  if (entityTypes.includes('template')) {
    const templateResults = await searchTemplates(query, filters, limit, offset);
    results.push(...templateResults.map(t => ({
      id: t.id,
      type: 'template' as const,
      title: t.name,
      description: t.description || undefined,
      thumbnailUrl: t.thumbnailUrl || undefined,
      metadata: {
        category: t.category,
        isActive: t.isActive,
        isSystem: t.isSystem,
      },
      relevanceScore: calculateRelevance(query, t.name, t.description),
      highlights: generateHighlights(query, [t.name, t.description]),
    })));
  }

  // Search media
  if (entityTypes.includes('media')) {
    const mediaResults = await searchMedia(query, filters, limit, offset);
    results.push(...mediaResults.map(m => ({
      id: m.id,
      type: 'media' as const,
      title: m.originalName,
      description: m.description || m.altText || undefined,
      url: m.fileUrl,
      thumbnailUrl: m.thumbnailUrl || m.fileUrl,
      metadata: {
        assetType: m.assetType,
        fileSize: m.fileSize,
        mimeType: m.mimeType,
        tags: m.tags,
      },
      relevanceScore: calculateRelevance(query, m.originalName, m.altText, m.caption),
      highlights: generateHighlights(query, [m.originalName, m.altText, m.caption]),
    })));
  }

  // Search sections (if needed)
  if (entityTypes.includes('section')) {
    const sectionResults = await searchSections(query, filters, limit, offset);
    results.push(...sectionResults.map(s => ({
      id: s.id,
      type: 'section' as const,
      title: s.title || s.sectionKey,
      description: s.subtitle || undefined,
      metadata: {
        sectionType: s.sectionType,
        pageId: s.pageId,
        order: s.order,
      },
      relevanceScore: calculateRelevance(query, s.title, s.subtitle),
      highlights: generateHighlights(query, [s.title, s.subtitle]),
    })));
  }

  // Sort by relevance score
  results.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Calculate facets
  facets.types = calculateTypeFacets(results);
  facets.statuses = calculateStatusFacets(results);
  facets.categories = calculateCategoryFacets(results);
  facets.assetTypes = calculateAssetTypeFacets(results);

  // Generate search suggestions (if query is short or no results)
  let suggestions: string[] | undefined;
  if (query.length < 3 || results.length === 0) {
    suggestions = await generateSearchSuggestions(query);
  }

  return {
    results: results.slice(offset, offset + limit),
    total: results.length,
    facets,
    suggestions,
  };
}

/**
 * Search CMS pages with full-text search
 */
export async function searchPages(
  query: string,
  filters: SearchFilters,
  limit: number = 20,
  offset: number = 0
) {
  const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
  
  const where: Prisma.CmsPageWhereInput = {
    deletedAt: null,
    OR: searchTerms.flatMap(term => [
      { pageTitle: { contains: term, mode: 'insensitive' } },
      { slug: { contains: term, mode: 'insensitive' } },
      { metaDescription: { contains: term, mode: 'insensitive' } },
      { metaKeywords: { contains: term, mode: 'insensitive' } },
      { pageKey: { contains: term, mode: 'insensitive' } },
    ]),
  };

  // Apply filters
  if (filters.status && filters.status.length > 0) {
    where.status = { in: filters.status };
  }

  if (filters.pageType && filters.pageType.length > 0) {
    where.pageType = { in: filters.pageType };
  }

  if (filters.authorId) {
    where.authorId = filters.authorId;
  }

  if (filters.templateId) {
    where.templateId = filters.templateId;
  }

  if (filters.publishedAfter || filters.publishedBefore) {
    where.publishedAt = {};
    if (filters.publishedAfter) {
      where.publishedAt.gte = filters.publishedAfter;
    }
    if (filters.publishedBefore) {
      where.publishedAt.lte = filters.publishedBefore;
    }
  }

  if (filters.createdAfter || filters.createdBefore) {
    where.createdAt = {};
    if (filters.createdAfter) {
      where.createdAt.gte = filters.createdAfter;
    }
    if (filters.createdBefore) {
      where.createdAt.lte = filters.createdBefore;
    }
  }

  return await prisma.cmsPage.findMany({
    where,
    take: limit,
    skip: offset,
    orderBy: [
      { publishedAt: 'desc' },
      { updatedAt: 'desc' },
    ],
    select: {
      id: true,
      pageKey: true,
      pageTitle: true,
      slug: true,
      pageType: true,
      metaDescription: true,
      ogImage: true,
      status: true,
      publishedAt: true,
      authorId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/**
 * Search CMS templates
 */
export async function searchTemplates(
  query: string,
  filters: SearchFilters,
  limit: number = 20,
  offset: number = 0
) {
  const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
  
  const where: Prisma.CmsTemplateWhereInput = {
    OR: searchTerms.flatMap(term => [
      { name: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
    ]),
  };

  // Apply filters
  if (filters.category && filters.category.length > 0) {
    where.category = { in: filters.category };
  }

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  return await prisma.cmsTemplate.findMany({
    where,
    take: limit,
    skip: offset,
    orderBy: [
      { order: 'asc' },
      { updatedAt: 'desc' },
    ],
  });
}

/**
 * Search CMS media assets
 */
export async function searchMedia(
  query: string,
  filters: SearchFilters,
  limit: number = 20,
  offset: number = 0
) {
  const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
  
  const where: Prisma.CmsMediaAssetWhereInput = {
    deletedAt: null,
    OR: searchTerms.flatMap(term => [
      { filename: { contains: term, mode: 'insensitive' } },
      { originalName: { contains: term, mode: 'insensitive' } },
      { altText: { contains: term, mode: 'insensitive' } },
      { caption: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
    ]),
  };

  // Apply filters
  if (filters.assetType && filters.assetType.length > 0) {
    where.assetType = { in: filters.assetType };
  }

  if (filters.folderId) {
    where.folderId = filters.folderId;
  }

  if (filters.tags && filters.tags.length > 0) {
    where.tags = { hasSome: filters.tags };
  }

  if (filters.createdAfter || filters.createdBefore) {
    where.createdAt = {};
    if (filters.createdAfter) {
      where.createdAt.gte = filters.createdAfter;
    }
    if (filters.createdBefore) {
      where.createdAt.lte = filters.createdBefore;
    }
  }

  return await prisma.cmsMediaAsset.findMany({
    where,
    take: limit,
    skip: offset,
    orderBy: [
      { lastUsedAt: 'desc' },
      { createdAt: 'desc' },
    ],
  });
}

/**
 * Search CMS page sections
 */
export async function searchSections(
  query: string,
  filters: SearchFilters,
  limit: number = 20,
  offset: number = 0
) {
  const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
  
  const where: Prisma.CmsPageSectionWhereInput = {
    OR: searchTerms.flatMap(term => [
      { title: { contains: term, mode: 'insensitive' } },
      { subtitle: { contains: term, mode: 'insensitive' } },
      { sectionKey: { contains: term, mode: 'insensitive' } },
    ]),
    isVisible: true,
  };

  return await prisma.cmsPageSection.findMany({
    where,
    take: limit,
    skip: offset,
    orderBy: [
      { updatedAt: 'desc' },
    ],
  });
}

/**
 * Calculate relevance score for search results
 */
function calculateRelevance(query: string, ...fields: (string | null | undefined)[]): number {
  const queryLower = query.toLowerCase();
  const searchTerms = queryLower.split(/\s+/).filter(Boolean);
  
  let score = 0;
  
  fields.forEach((field, fieldIndex) => {
    if (!field) return;
    
    const fieldLower = field.toLowerCase();
    
    // Exact match bonus (highest weight)
    if (fieldLower === queryLower) {
      score += 100 * (fields.length - fieldIndex);
    }
    
    // Starts with query bonus
    if (fieldLower.startsWith(queryLower)) {
      score += 50 * (fields.length - fieldIndex);
    }
    
    // Contains all terms bonus
    const containsAll = searchTerms.every(term => fieldLower.includes(term));
    if (containsAll) {
      score += 25 * (fields.length - fieldIndex);
    }
    
    // Individual term matches
    searchTerms.forEach(term => {
      if (fieldLower.includes(term)) {
        score += 5 * (fields.length - fieldIndex);
      }
    });
  });
  
  return score;
}

/**
 * Generate search highlights
 */
function generateHighlights(query: string, fields: (string | null | undefined)[]): string[] {
  const highlights: string[] = [];
  const queryLower = query.toLowerCase();
  const searchTerms = queryLower.split(/\s+/).filter(Boolean);
  
  fields.forEach(field => {
    if (!field) return;
    
    searchTerms.forEach(term => {
      const fieldLower = field.toLowerCase();
      const index = fieldLower.indexOf(term);
      
      if (index !== -1) {
        const start = Math.max(0, index - 30);
        const end = Math.min(field.length, index + term.length + 30);
        const snippet = field.substring(start, end);
        
        if (!highlights.includes(snippet)) {
          highlights.push((start > 0 ? '...' : '') + snippet + (end < field.length ? '...' : ''));
        }
      }
    });
  });
  
  return highlights.slice(0, 3); // Return top 3 highlights
}

/**
 * Calculate type facets
 */
function calculateTypeFacets(results: SearchResult[]): { type: string; count: number }[] {
  const typeCounts = new Map<string, number>();
  
  results.forEach(result => {
    typeCounts.set(result.type, (typeCounts.get(result.type) || 0) + 1);
  });
  
  return Array.from(typeCounts.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Calculate status facets
 */
function calculateStatusFacets(results: SearchResult[]): { status: string; count: number }[] {
  const statusCounts = new Map<string, number>();
  
  results.forEach(result => {
    const status = result.metadata?.status;
    if (status && typeof status === 'string') {
      statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
    }
  });
  
  return Array.from(statusCounts.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Calculate category facets
 */
function calculateCategoryFacets(results: SearchResult[]): { category: string; count: number }[] {
  const categoryCounts = new Map<string, number>();
  
  results.forEach(result => {
    const category = result.metadata?.category;
    if (category && typeof category === 'string') {
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    }
  });
  
  return Array.from(categoryCounts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Calculate asset type facets
 */
function calculateAssetTypeFacets(results: SearchResult[]): { assetType: string; count: number }[] {
  const assetTypeCounts = new Map<string, number>();
  
  results.forEach(result => {
    const assetType = result.metadata?.assetType;
    if (assetType && typeof assetType === 'string') {
      assetTypeCounts.set(assetType, (assetTypeCounts.get(assetType) || 0) + 1);
    }
  });
  
  return Array.from(assetTypeCounts.entries())
    .map(([assetType, count]) => ({ assetType, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Generate search suggestions based on existing content
 */
export async function generateSearchSuggestions(query: string): Promise<string[]> {
  if (query.length < 2) return [];
  
  const suggestions = new Set<string>();
  
  // Get page title suggestions
  const pages = await prisma.cmsPage.findMany({
    where: {
      deletedAt: null,
      pageTitle: { contains: query, mode: 'insensitive' },
    },
    select: { pageTitle: true },
    take: 5,
  });
  
  pages.forEach(p => suggestions.add(p.pageTitle));
  
  // Get template name suggestions
  const templates = await prisma.cmsTemplate.findMany({
    where: {
      name: { contains: query, mode: 'insensitive' },
    },
    select: { name: true },
    take: 5,
  });
  
  templates.forEach(t => suggestions.add(t.name));
  
  // Get media filename suggestions
  const media = await prisma.cmsMediaAsset.findMany({
    where: {
      deletedAt: null,
      originalName: { contains: query, mode: 'insensitive' },
    },
    select: { originalName: true },
    take: 5,
  });
  
  media.forEach(m => suggestions.add(m.originalName));
  
  return Array.from(suggestions).slice(0, 10);
}

/**
 * Get popular search terms (for autocomplete)
 */
export async function getPopularSearchTerms(limit: number = 10): Promise<string[]> {
  // Get most common page titles
  const pages = await prisma.cmsPage.findMany({
    where: {
      deletedAt: null,
      status: 'published',
    },
    select: { pageTitle: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  
  return pages.map(p => p.pageTitle);
}

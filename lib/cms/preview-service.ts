/**
 * CMS Preview Service
 * 
 * Handles secure content preview functionality:
 * - Generate preview tokens
 * - Validate preview access
 * - Preview draft content
 * - Preview specific versions
 * - Device simulation metadata
 * - Preview analytics
 */

import { prisma } from '@/lib/prisma';
import cache from '@/lib/cms/cache-service';
import crypto from 'crypto';

// ============================================================================
// Types
// ============================================================================

export interface PreviewToken {
  token: string;
  pageId: string;
  versionId?: string;
  expiresAt: Date;
  createdBy: string;
  device?: DeviceType;
  metadata?: Record<string, unknown>;
}

export interface PreviewSession {
  id: string;
  token: string;
  pageId: string;
  versionId?: string;
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
  createdBy: string;
  lastAccessedAt?: Date;
  accessCount: number;
  device?: DeviceType;
  userAgent?: string;
  ipAddress?: string;
}

export interface PreviewContent {
  page: {
    id: string;
    pageKey: string;
    pageTitle: string;
    slug: string;
    pageType: string;
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    ogImage?: string;
    ogTitle?: string;
    ogDescription?: string;
    structuredData?: unknown;
    status: string;
    publishedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
  };
  sections: Array<{
    id: string;
    sectionKey: string;
    sectionType: string;
    title?: string;
    subtitle?: string;
    content: Record<string, unknown>;
    order: number;
    isVisible: boolean;
    cssClasses?: string;
    customStyles?: Record<string, unknown>;
  }>;
  version?: {
    id: string;
    versionNumber: number;
    changeDescription?: string;
    createdAt: Date;
    createdBy: string;
  };
  preview: {
    mode: 'draft' | 'version' | 'published';
    device?: DeviceType;
    timestamp: Date;
  };
}

export type DeviceType = 'desktop' | 'tablet' | 'mobile' | 'all';

export interface CreatePreviewTokenInput {
  pageId: string;
  versionId?: string;
  userId: string;
  expiresInMinutes?: number;
  device?: DeviceType;
  metadata?: Record<string, unknown>;
}

export interface ValidatePreviewTokenInput {
  token: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface PreviewAnalytics {
  totalPreviews: number;
  activeSessions: number;
  previewsByPage: Array<{
    pageId: string;
    pageTitle: string;
    count: number;
  }>;
  previewsByDevice: {
    desktop: number;
    tablet: number;
    mobile: number;
    all: number;
  };
  recentPreviews: Array<{
    pageId: string;
    pageTitle: string;
    previewedAt: Date;
    previewedBy: string;
    device?: DeviceType;
  }>;
}

// ============================================================================
// Preview Token Management
// ============================================================================

/**
 * Generate a secure preview token
 */
function generatePreviewToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a preview token for a page or version
 */
export async function createPreviewToken(
  input: CreatePreviewTokenInput
): Promise<PreviewToken> {
  const {
    pageId,
    versionId,
    userId,
    expiresInMinutes = 60,
    device = 'all',
    metadata = {},
  } = input;

  // Verify page exists
  const page = await prisma.cmsPage.findUnique({
    where: { id: pageId },
    select: { id: true, pageTitle: true },
  });

  if (!page) {
    throw new Error('Page not found');
  }

  // If version specified, verify it exists
  if (versionId) {
    const version = await prisma.cmsPageVersion.findUnique({
      where: { id: versionId },
    });

    if (!version || version.pageId !== pageId) {
      throw new Error('Version not found or does not belong to page');
    }
  }

  // Generate token
  const token = generatePreviewToken();
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  // Store in cache (faster access)
  const cacheKey = `preview:token:${token}`;
  await cache.set(
    cacheKey,
    {
      token,
      pageId,
      versionId,
      expiresAt: expiresAt.toISOString(),
      createdBy: userId,
      device,
      metadata,
      isActive: true,
      accessCount: 0,
    },
    { ttl: expiresInMinutes * 60 }
  );

  return {
    token,
    pageId,
    versionId,
    expiresAt,
    createdBy: userId,
    device,
    metadata,
  };
}

/**
 * Validate a preview token
 */
export async function validatePreviewToken(
  input: ValidatePreviewTokenInput
): Promise<PreviewSession | null> {
  const { token, userAgent, ipAddress } = input;

  // Check cache first
  const cacheKey = `preview:token:${token}`;
  const session = await cache.get<PreviewSession>(cacheKey);

  if (!session) {
    return null;
  }

  // Check if expired
  const expiresAt = new Date(session.expiresAt);
  if (expiresAt < new Date()) {
    await cache.delete(cacheKey);
    return null;
  }

  // Update access tracking
  const updatedSession = {
    ...session,
    lastAccessedAt: new Date(),
    accessCount: (session.accessCount || 0) + 1,
    userAgent,
    ipAddress,
  };

  // Update cache
  const ttl = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
  await cache.set(cacheKey, updatedSession, { ttl });

  return updatedSession;
}

/**
 * Revoke a preview token
 */
export async function revokePreviewToken(token: string): Promise<boolean> {
  const cacheKey = `preview:token:${token}`;
  await cache.delete(cacheKey);
  return true;
}

/**
 * Revoke all preview tokens for a page
 */
export async function revokePagePreviewTokens(_pageId: string): Promise<number> {
  // This is a simplified version - in production with Redis,
  // you'd use SCAN with pattern matching
  const revokedCount = 0;
  
  // Note: This would need Redis SCAN in production
  // For now, we'll track tokens separately
  
  return revokedCount;
}

// ============================================================================
// Preview Content Retrieval
// ============================================================================

/**
 * Get preview content for a page
 */
export async function getPreviewContent(
  token: string,
  options: {
    userAgent?: string;
    ipAddress?: string;
  } = {}
): Promise<PreviewContent | null> {
  // Validate token
  const session = await validatePreviewToken({
    token,
    userAgent: options.userAgent,
    ipAddress: options.ipAddress,
  });

  if (!session) {
    return null;
  }

  const { pageId, versionId, device } = session;

  // If previewing a specific version
  if (versionId) {
    return await getVersionPreview(pageId, versionId, device);
  }

  // Otherwise, preview current draft state
  return await getDraftPreview(pageId, device);
}

/**
 * Get draft preview (current page state)
 */
async function getDraftPreview(
  pageId: string,
  device?: DeviceType
): Promise<PreviewContent> {
  const page = await prisma.cmsPage.findUnique({
    where: { id: pageId },
    include: {
      sections: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!page) {
    throw new Error('Page not found');
  }

  return {
    page: {
      id: page.id,
      pageKey: page.pageKey,
      pageTitle: page.pageTitle,
      slug: page.slug,
      pageType: page.pageType,
      metaTitle: page.metaTitle || undefined,
      metaDescription: page.metaDescription || undefined,
      metaKeywords: page.metaKeywords || undefined,
      ogImage: page.ogImage || undefined,
      ogTitle: page.ogTitle || undefined,
      ogDescription: page.ogDescription || undefined,
      structuredData: page.structuredData || undefined,
      status: page.status,
      publishedAt: page.publishedAt || undefined,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    },
    sections: page.sections.map((section) => ({
      id: section.id,
      sectionKey: section.sectionKey,
      sectionType: section.sectionType,
      title: section.title || undefined,
      subtitle: section.subtitle || undefined,
      content: section.content as Record<string, unknown>,
      order: section.order,
      isVisible: section.isVisible,
      cssClasses: section.cssClasses || undefined,
      customStyles: section.customStyles as Record<string, unknown> | undefined,
    })),
    preview: {
      mode: 'draft',
      device,
      timestamp: new Date(),
    },
  };
}

/**
 * Get version preview (historical version)
 */
async function getVersionPreview(
  pageId: string,
  versionId: string,
  device?: DeviceType
): Promise<PreviewContent> {
  const version = await prisma.cmsPageVersion.findUnique({
    where: { id: versionId },
    include: {
      page: true,
    },
  });

  if (!version || version.pageId !== pageId) {
    throw new Error('Version not found');
  }

  // Parse snapshot data
  const pageSnapshot = version.pageSnapshot as Record<string, unknown>;
  const sectionsSnapshot = version.sectionsSnapshot as Array<Record<string, unknown>>;

  return {
    page: {
      id: version.page.id,
      pageKey: version.page.pageKey,
      pageTitle: (pageSnapshot.pageTitle as string) || version.page.pageTitle,
      slug: (pageSnapshot.slug as string) || version.page.slug,
      pageType: (pageSnapshot.pageType as string) || version.page.pageType,
      metaTitle: pageSnapshot.metaTitle as string | undefined,
      metaDescription: pageSnapshot.metaDescription as string | undefined,
      metaKeywords: pageSnapshot.metaKeywords as string | undefined,
      ogImage: pageSnapshot.ogImage as string | undefined,
      ogTitle: pageSnapshot.ogTitle as string | undefined,
      ogDescription: pageSnapshot.ogDescription as string | undefined,
      structuredData: pageSnapshot.structuredData,
      status: (pageSnapshot.status as string) || version.page.status,
      publishedAt: pageSnapshot.publishedAt ? new Date(pageSnapshot.publishedAt as string) : undefined,
      createdAt: version.page.createdAt,
      updatedAt: version.createdAt,
    },
    sections: sectionsSnapshot?.map((section: Record<string, unknown>, index: number) => ({
      id: (section.id as string) || `preview-${index}`,
      sectionKey: section.sectionKey as string,
      sectionType: section.sectionType as string,
      title: section.title as string | undefined,
      subtitle: section.subtitle as string | undefined,
      content: section.content as Record<string, unknown>,
      order: (section.order as number) ?? index,
      isVisible: (section.isVisible as boolean) ?? true,
      cssClasses: section.cssClasses as string | undefined,
      customStyles: section.customStyles as Record<string, unknown> | undefined,
    })) || [],
    version: {
      id: version.id,
      versionNumber: version.versionNumber,
      changeDescription: version.changeDescription || undefined,
      createdAt: version.createdAt,
      createdBy: version.createdBy,
    },
    preview: {
      mode: 'version',
      device,
      timestamp: new Date(),
    },
  };
}

/**
 * Get published preview (current published state)
 */
export async function getPublishedPreview(
  pageId: string,
  device?: DeviceType
): Promise<PreviewContent> {
  const page = await prisma.cmsPage.findUnique({
    where: { 
      id: pageId,
      status: 'published',
    },
    include: {
      sections: {
        where: { isVisible: true },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!page) {
    throw new Error('Published page not found');
  }

  return {
    page: {
      id: page.id,
      pageKey: page.pageKey,
      pageTitle: page.pageTitle,
      slug: page.slug,
      pageType: page.pageType,
      metaTitle: page.metaTitle || undefined,
      metaDescription: page.metaDescription || undefined,
      metaKeywords: page.metaKeywords || undefined,
      ogImage: page.ogImage || undefined,
      ogTitle: page.ogTitle || undefined,
      ogDescription: page.ogDescription || undefined,
      structuredData: page.structuredData || undefined,
      status: page.status,
      publishedAt: page.publishedAt || undefined,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    },
    sections: page.sections.map((section) => ({
      id: section.id,
      sectionKey: section.sectionKey,
      sectionType: section.sectionType,
      title: section.title || undefined,
      subtitle: section.subtitle || undefined,
      content: section.content as Record<string, unknown>,
      order: section.order,
      isVisible: section.isVisible,
      cssClasses: section.cssClasses || undefined,
      customStyles: section.customStyles as Record<string, unknown> | undefined,
    })),
    preview: {
      mode: 'published',
      device,
      timestamp: new Date(),
    },
  };
}

// ============================================================================
// Preview Analytics
// ============================================================================

/**
 * Get preview analytics
 */
export async function getPreviewAnalytics(): Promise<PreviewAnalytics> {
  // In a production system, you'd track this in the database
  // For now, we'll return mock analytics structure

  return {
    totalPreviews: 0,
    activeSessions: 0,
    previewsByPage: [],
    previewsByDevice: {
      desktop: 0,
      tablet: 0,
      mobile: 0,
      all: 0,
    },
    recentPreviews: [],
  };
}

/**
 * Log preview access (for analytics)
 */
export async function logPreviewAccess(
  pageId: string,
  userId: string,
  device?: DeviceType
): Promise<void> {
  // In production, you'd store this in a dedicated analytics table
  // or send to an analytics service
  
  const logKey = `preview:log:${Date.now()}:${pageId}`;
  await cache.set(
    logKey,
    {
      pageId,
      userId,
      device,
      timestamp: new Date().toISOString(),
    },
    { ttl: 86400 } // Keep for 24 hours
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate preview URL
 */
export function generatePreviewUrl(
  token: string,
  options: {
    baseUrl?: string;
    device?: DeviceType;
  } = {}
): string {
  const { baseUrl = '', device } = options;
  
  const params = new URLSearchParams({
    preview: token,
  });

  if (device && device !== 'all') {
    params.set('device', device);
  }

  return `${baseUrl}/api/cms/preview?${params.toString()}`;
}

/**
 * Check if a page has active preview sessions
 */
export async function hasActivePreviewSessions(_pageId: string): Promise<boolean> {
  // This would need Redis SCAN in production
  // For now, we'll return false
  return false;
}

/**
 * Get active preview sessions for a page
 */
export async function getActivePreviewSessions(_pageId: string): Promise<PreviewSession[]> {
  // This would need Redis SCAN in production
  // For now, we'll return empty array
  return [];
}

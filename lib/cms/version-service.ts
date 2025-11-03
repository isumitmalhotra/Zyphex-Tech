/**
 * CMS Version Control Service
 * Provides Git-like versioning for CMS content
 * 
 * Features:
 * - Auto-create versions on every save
 * - Store complete page + sections snapshots
 * - Version comparison (diff)
 * - One-click rollback
 * - Track who changed what and when
 */

import { PrismaClient, CmsPage, CmsPageSection, CmsPageVersion, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface PageSnapshot {
  page: CmsPage;
  sections: CmsPageSection[];
}

export interface VersionMetadata {
  changeDescription?: string;
  changedBy: string;
  tags?: string[];
}

export interface PageDifference {
  old: unknown;
  new: unknown;
}

export interface SectionChange {
  type: 'added' | 'removed' | 'modified';
  sectionKey: string;
  section?: unknown;
  changes?: Record<string, PageDifference>;
}

export interface VersionComparison {
  versionId1: string;
  versionId2: string;
  pageChanges: Record<string, PageDifference>;
  sectionChanges: SectionChange[];
  summary: {
    fieldsChanged: string[];
    sectionsAdded: number;
    sectionsRemoved: number;
    sectionsModified: number;
  };
}

/**
 * Create a new version of a page
 * Automatically called when page is saved
 */
export async function createVersion(
  pageId: string,
  metadata: VersionMetadata
): Promise<CmsPageVersion> {
  try {
    // 1. Fetch current page data with all sections
    const currentPage = await prisma.cmsPage.findUnique({
      where: { id: pageId },
      include: {
        sections: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!currentPage) {
      throw new Error(`Page with ID ${pageId} not found`);
    }

    // 2. Get the next version number
    const lastVersion = await prisma.cmsPageVersion.findFirst({
      where: { pageId },
      orderBy: { versionNumber: 'desc' }
    });

    const nextVersionNumber = (lastVersion?.versionNumber || 0) + 1;

    // 3. Create snapshot
    const { sections, ...pageData } = currentPage;
    
    const pageSnapshot = {
      ...pageData,
      templateId: pageData.templateId || null,
      metaTitle: pageData.metaTitle || null,
      metaDescription: pageData.metaDescription || null,
      metaKeywords: pageData.metaKeywords || null,
      ogImage: pageData.ogImage || null,
      ogTitle: pageData.ogTitle || null,
      ogDescription: pageData.ogDescription || null,
      structuredData: pageData.structuredData || null,
      publishedAt: pageData.publishedAt?.toISOString() || null,
      scheduledPublishAt: pageData.scheduledPublishAt?.toISOString() || null,
      scheduledUnpublishAt: pageData.scheduledUnpublishAt?.toISOString() || null,
      authorId: pageData.authorId || null,
      lastEditedBy: pageData.lastEditedBy || null,
      layout: pageData.layout || null,
      seoScore: pageData.seoScore || null,
      createdAt: pageData.createdAt.toISOString(),
      updatedAt: pageData.updatedAt.toISOString(),
      deletedAt: pageData.deletedAt?.toISOString() || null
    };

    const sectionsSnapshot = sections.map(section => ({
      ...section,
      title: section.title || null,
      subtitle: section.subtitle || null,
      cssClasses: section.cssClasses || null,
      customStyles: section.customStyles || null,
      createdAt: section.createdAt.toISOString(),
      updatedAt: section.updatedAt.toISOString()
    }));

    // 4. Create version record
    const version = await prisma.cmsPageVersion.create({
      data: {
        pageId,
        versionNumber: nextVersionNumber,
        pageSnapshot,
        sectionsSnapshot,
        changeDescription: metadata.changeDescription,
        createdBy: metadata.changedBy,
        tags: metadata.tags || [],
        isPublished: currentPage.status === 'published'
      }
    });

    // 5. Log the version creation in activity log
    await prisma.cmsActivityLog.create({
      data: {
        userId: metadata.changedBy,
        action: 'CREATE_VERSION',
        entityType: 'CmsPage',
        entityId: pageId,
        changes: {
          versionNumber: nextVersionNumber,
          description: metadata.changeDescription
        },
        metadata: {
          versionId: version.id,
          totalSections: sections.length
        }
      }
    });

    console.log(`✅ Version ${nextVersionNumber} created for page ${pageId}`);
    return version;

  } catch (error) {
    console.error('❌ Error creating version:', error);
    throw error;
  }
}

/**
 * Get all versions for a page
 */
export async function getPageVersions(
  pageId: string,
  limit?: number
): Promise<Partial<CmsPageVersion>[]> {
  try {
    const versions = await prisma.cmsPageVersion.findMany({
      where: { pageId },
      orderBy: { versionNumber: 'desc' },
      take: limit,
      select: {
        id: true,
        versionNumber: true,
        changeDescription: true,
        createdBy: true,
        createdAt: true,
        isPublished: true,
        publishedAt: true,
        tags: true
      }
    });

    return versions;
  } catch (error) {
    console.error('❌ Error fetching versions:', error);
    throw error;
  }
}

/**
 * Get a specific version by ID
 */
export async function getVersion(versionId: string): Promise<CmsPageVersion> {
  try {
    const version = await prisma.cmsPageVersion.findUnique({
      where: { id: versionId }
    });

    if (!version) {
      throw new Error(`Version with ID ${versionId} not found`);
    }

    return version;
  } catch (error) {
    console.error('❌ Error fetching version:', error);
    throw error;
  }
}

/**
 * Compare two versions
 * Returns detailed diff of changes between versions
 */
export async function compareVersions(
  versionId1: string,
  versionId2: string
): Promise<VersionComparison> {
  try {
    const [version1, version2] = await Promise.all([
      getVersion(versionId1),
      getVersion(versionId2)
    ]);

    // Compare page-level changes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pageChanges = findDifferences(
      version1.pageSnapshot as Record<string, unknown>,
      version2.pageSnapshot as Record<string, unknown>
    );

    // Compare sections
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sections1 = version1.sectionsSnapshot as Record<string, unknown>[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sections2 = version2.sectionsSnapshot as Record<string, unknown>[];

    const sectionChanges = compareSections(sections1, sections2);

    // Calculate summary
    const fieldsChanged = Object.keys(pageChanges);
    const sectionsAdded = sectionChanges.filter(c => c.type === 'added').length;
    const sectionsRemoved = sectionChanges.filter(c => c.type === 'removed').length;
    const sectionsModified = sectionChanges.filter(c => c.type === 'modified').length;

    return {
      versionId1,
      versionId2,
      pageChanges,
      sectionChanges,
      summary: {
        fieldsChanged,
        sectionsAdded,
        sectionsRemoved,
        sectionsModified
      }
    };
  } catch (error) {
    console.error('❌ Error comparing versions:', error);
    throw error;
  }
}

/**
 * Restore a page to a specific version
 * Creates a new version (doesn't overwrite history)
 */
export async function restoreVersion(
  versionId: string,
  restoredBy: string
): Promise<CmsPageVersion> {
  try {
    // 1. Get the version to restore
    const version = await getVersion(versionId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pageSnapshot = version.pageSnapshot as Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sectionsSnapshot = version.sectionsSnapshot as Record<string, any>[];

    // 2. Update the current page with snapshot data
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, deletedAt: _deletedAt, ...pageData } = pageSnapshot;

    // Convert ISO strings back to Date objects
    const updateData = {
      ...pageData,
      publishedAt: pageData.publishedAt ? new Date(pageData.publishedAt) : null,
      scheduledPublishAt: pageData.scheduledPublishAt ? new Date(pageData.scheduledPublishAt) : null,
      scheduledUnpublishAt: pageData.scheduledUnpublishAt ? new Date(pageData.scheduledUnpublishAt) : null,
      lastEditedBy: restoredBy,
      updatedAt: new Date()
    } as Prisma.CmsPageUpdateInput;

    const _updatedPage = await prisma.cmsPage.update({
      where: { id: version.pageId },
      data: updateData
    });

    // 3. Delete existing sections and recreate from snapshot
    await prisma.cmsPageSection.deleteMany({
      where: { pageId: version.pageId }
    });

    for (const section of sectionsSnapshot) {
      const { id: _sectionId, pageId: _pageId, createdAt: _sCreatedAt, updatedAt: _sUpdatedAt, ...sectionData } = section;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await prisma.cmsPageSection.create({
        data: {
          ...sectionData,
          pageId: version.pageId,
          createdAt: new Date(),
          updatedAt: new Date()
        } as unknown as Prisma.CmsPageSectionCreateInput
      });
    }

    // 4. Create a new version for the restore
    const newVersion = await createVersion(version.pageId, {
      changeDescription: `Restored to version ${version.versionNumber}`,
      changedBy: restoredBy,
      tags: ['restore', `from-v${version.versionNumber}`]
    });

    // 5. Log the restore action
    await prisma.cmsActivityLog.create({
      data: {
        userId: restoredBy,
        action: 'RESTORE_VERSION',
        entityType: 'CmsPage',
        entityId: version.pageId,
        changes: {
          restoredFromVersion: version.versionNumber,
          restoredVersionId: versionId
        },
        metadata: {
          totalSections: sectionsSnapshot.length
        }
      }
    });

    console.log(`✅ Page restored to version ${version.versionNumber}`);
    return newVersion;

  } catch (error) {
    console.error('❌ Error restoring version:', error);
    throw error;
  }
}

/**
 * Delete old versions (cleanup)
 * Keeps the last N versions
 */
export async function cleanupOldVersions(
  pageId: string,
  keepLastN: number = 50
): Promise<number> {
  try {
    // Get versions to delete (keep published versions)
    const allVersions = await prisma.cmsPageVersion.findMany({
      where: { pageId },
      orderBy: { versionNumber: 'desc' }
    });

    // Keep last N versions + all published versions
    const versionsToKeep = new Set([
      ...allVersions.slice(0, keepLastN).map(v => v.id),
      ...allVersions.filter(v => v.isPublished).map(v => v.id)
    ]);

    const versionsToDelete = allVersions
      .filter(v => !versionsToKeep.has(v.id))
      .map(v => v.id);

    if (versionsToDelete.length === 0) {
      return 0;
    }

    const result = await prisma.cmsPageVersion.deleteMany({
      where: {
        id: { in: versionsToDelete }
      }
    });

    console.log(`✅ Cleaned up ${result.count} old versions for page ${pageId}`);
    return result.count;

  } catch (error) {
    console.error('❌ Error cleaning up versions:', error);
    throw error;
  }
}

/**
 * Helper: Find differences between two objects
 */
function findDifferences(
  obj1: Record<string, unknown>,
  obj2: Record<string, unknown>
): Record<string, { old: unknown; new: unknown }> {
  const differences: Record<string, { old: unknown; new: unknown }> = {};

  // Check all keys in obj2 (newer version)
  for (const key in obj2) {
    if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
      differences[key] = {
        old: obj1[key],
        new: obj2[key]
      };
    }
  }

  return differences;
}

/**
 * Helper: Compare section arrays
 */
function compareSections(
  sections1: Record<string, unknown>[],
  sections2: Record<string, unknown>[]
): SectionChange[] {
  const changes: SectionChange[] = [];

  // Create maps for easier comparison
  const map1 = new Map(sections1.map(s => [s.sectionKey, s]));
  const map2 = new Map(sections2.map(s => [s.sectionKey, s]));

  // Find added sections
  for (const [key, section] of map2) {
    if (!map1.has(key)) {
      changes.push({
        type: 'added',
        sectionKey: key as string,
        section
      });
    }
  }

  // Find removed sections
  for (const [key, section] of map1) {
    if (!map2.has(key)) {
      changes.push({
        type: 'removed',
        sectionKey: key as string,
        section
      });
    }
  }

  // Find modified sections
  for (const [key, section2] of map2) {
    const section1 = map1.get(key);
    if (section1) {
      const diffs = findDifferences(section1 as Record<string, unknown>, section2 as Record<string, unknown>);
      if (Object.keys(diffs).length > 0) {
        changes.push({
          type: 'modified',
          sectionKey: key as string,
          changes: diffs
        });
      }
    }
  }

  return changes;
}

/**
 * Get version statistics for a page
 */
export async function getVersionStats(pageId: string): Promise<{
  totalVersions: number;
  latestVersionNumber: number;
  publishedVersions: number;
  latestVersion: {
    versionNumber: number;
    createdAt: Date;
    createdBy: string;
  } | null;
}> {
  try {
    const stats = await prisma.cmsPageVersion.aggregate({
      where: { pageId },
      _count: true,
      _max: { versionNumber: true }
    });

    const publishedCount = await prisma.cmsPageVersion.count({
      where: { pageId, isPublished: true }
    });

    const latestVersion = await prisma.cmsPageVersion.findFirst({
      where: { pageId },
      orderBy: { versionNumber: 'desc' },
      select: {
        versionNumber: true,
        createdAt: true,
        createdBy: true
      }
    });

    return {
      totalVersions: stats._count,
      latestVersionNumber: stats._max.versionNumber || 0,
      publishedVersions: publishedCount,
      latestVersion
    };
  } catch (error) {
    console.error('❌ Error fetching version stats:', error);
    throw error;
  }
}

const versionService = {
  createVersion,
  getPageVersions,
  getVersion,
  compareVersions,
  restoreVersion,
  cleanupOldVersions,
  getVersionStats
};

export default versionService;

/**
 * CMS Revision Comparison Service
 * 
 * Handles comparing different versions of pages:
 * - Version-to-version comparison
 * - Draft-to-published comparison
 * - Diff generation
 * - Change highlighting
 * - Metadata comparison
 */

import { prisma } from '@/lib/prisma';

// ============================================================================
// Types
// ============================================================================

export interface ComparisonResult {
  left: VersionData;
  right: VersionData;
  diff: DiffResult;
  summary: DiffSummary;
  comparedAt: Date;
}

export interface VersionData {
  id: string;
  type: 'draft' | 'version' | 'published';
  versionNumber?: number;
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
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
    changeDescription?: string;
  };
}

export interface DiffResult {
  page: PageDiff;
  sections: SectionsDiff;
  metadata: MetadataDiff;
}

export interface PageDiff {
  changed: boolean;
  fields: {
    pageTitle?: FieldChange;
    slug?: FieldChange;
    pageType?: FieldChange;
    metaTitle?: FieldChange;
    metaDescription?: FieldChange;
    metaKeywords?: FieldChange;
    ogImage?: FieldChange;
    ogTitle?: FieldChange;
    ogDescription?: FieldChange;
    structuredData?: FieldChange;
    status?: FieldChange;
  };
}

export interface SectionsDiff {
  changed: boolean;
  added: string[]; // Section IDs
  removed: string[]; // Section IDs
  modified: string[]; // Section IDs
  reordered: boolean;
  details: {
    [sectionId: string]: SectionChange;
  };
}

export interface SectionChange {
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  fields?: {
    title?: FieldChange;
    subtitle?: FieldChange;
    content?: FieldChange;
    order?: FieldChange;
    isVisible?: FieldChange;
    cssClasses?: FieldChange;
    customStyles?: FieldChange;
  };
}

export interface MetadataDiff {
  changed: boolean;
  fields: {
    status?: FieldChange;
    publishedAt?: FieldChange;
    createdBy?: FieldChange;
    changeDescription?: FieldChange;
  };
}

export interface FieldChange {
  changed: boolean;
  oldValue: unknown;
  newValue: unknown;
  changeType: 'added' | 'removed' | 'modified' | 'unchanged';
}

export interface DiffSummary {
  totalChanges: number;
  pageChanges: number;
  sectionsAdded: number;
  sectionsRemoved: number;
  sectionsModified: number;
  sectionsReordered: boolean;
  metadataChanges: number;
  hasContentChanges: boolean;
  hasStructuralChanges: boolean;
}

export interface CompareVersionsInput {
  pageId: string;
  leftVersionId?: string; // undefined = current draft
  rightVersionId?: string; // undefined = published version
}

// ============================================================================
// Main Comparison Functions
// ============================================================================

/**
 * Compare two versions of a page
 */
export async function compareVersions(
  input: CompareVersionsInput
): Promise<ComparisonResult> {
  const { pageId, leftVersionId, rightVersionId } = input;

  // Get version data
  const left = leftVersionId
    ? await getVersionData(pageId, leftVersionId)
    : await getCurrentDraftData(pageId);

  const right = rightVersionId
    ? await getVersionData(pageId, rightVersionId)
    : await getPublishedData(pageId);

  // Generate diff
  const diff = generateDiff(left, right);

  // Generate summary
  const summary = generateSummary(diff);

  return {
    left,
    right,
    diff,
    summary,
    comparedAt: new Date(),
  };
}

/**
 * Compare draft with published version
 */
export async function compareDraftWithPublished(
  pageId: string
): Promise<ComparisonResult> {
  return compareVersions({
    pageId,
    leftVersionId: undefined, // draft
    rightVersionId: undefined, // published
  });
}

/**
 * Compare two specific versions
 */
export async function compareTwoVersions(
  pageId: string,
  version1Id: string,
  version2Id: string
): Promise<ComparisonResult> {
  return compareVersions({
    pageId,
    leftVersionId: version1Id,
    rightVersionId: version2Id,
  });
}

// ============================================================================
// Version Data Retrieval
// ============================================================================

/**
 * Get current draft data
 */
async function getCurrentDraftData(pageId: string): Promise<VersionData> {
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
    id: page.id,
    type: 'draft',
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
    metadata: {
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    },
  };
}

/**
 * Get published version data
 */
async function getPublishedData(pageId: string): Promise<VersionData> {
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
    id: page.id,
    type: 'published',
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
    metadata: {
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    },
  };
}

/**
 * Get specific version data
 */
async function getVersionData(
  pageId: string,
  versionId: string
): Promise<VersionData> {
  const version = await prisma.cmsPageVersion.findUnique({
    where: { id: versionId },
    include: {
      page: true,
    },
  });

  if (!version || version.pageId !== pageId) {
    throw new Error('Version not found');
  }

  const pageSnapshot = version.pageSnapshot as Record<string, unknown>;
  const sectionsSnapshot = version.sectionsSnapshot as Array<Record<string, unknown>>;

  return {
    id: version.id,
    type: 'version',
    versionNumber: version.versionNumber,
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
      publishedAt: pageSnapshot.publishedAt
        ? new Date(pageSnapshot.publishedAt as string)
        : undefined,
    },
    sections: sectionsSnapshot?.map((section: Record<string, unknown>, index: number) => ({
      id: (section.id as string) || `version-${index}`,
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
    metadata: {
      createdAt: version.createdAt,
      updatedAt: version.createdAt,
      createdBy: version.createdBy,
      changeDescription: version.changeDescription || undefined,
    },
  };
}

// ============================================================================
// Diff Generation
// ============================================================================

/**
 * Generate diff between two versions
 */
function generateDiff(left: VersionData, right: VersionData): DiffResult {
  return {
    page: comparePageData(left.page, right.page),
    sections: compareSections(left.sections, right.sections),
    metadata: compareMetadata(left.metadata, right.metadata),
  };
}

/**
 * Compare page-level data
 */
function comparePageData(
  left: VersionData['page'],
  right: VersionData['page']
): PageDiff {
  const fields: PageDiff['fields'] = {};
  let changed = false;

  // Compare each field
  const fieldNames: (keyof VersionData['page'])[] = [
    'pageTitle',
    'slug',
    'pageType',
    'metaTitle',
    'metaDescription',
    'metaKeywords',
    'ogImage',
    'ogTitle',
    'ogDescription',
    'structuredData',
    'status',
  ];

  for (const field of fieldNames) {
    const leftValue = left[field];
    const rightValue = right[field];

    if (JSON.stringify(leftValue) !== JSON.stringify(rightValue)) {
      fields[field as keyof PageDiff['fields']] = {
        changed: true,
        oldValue: rightValue,
        newValue: leftValue,
        changeType: !rightValue ? 'added' : !leftValue ? 'removed' : 'modified',
      };
      changed = true;
    }
  }

  return { changed, fields };
}

/**
 * Compare sections
 */
function compareSections(
  left: VersionData['sections'],
  right: VersionData['sections']
): SectionsDiff {
  const leftKeys = new Set(left.map((s) => s.sectionKey));
  const rightKeys = new Set(right.map((s) => s.sectionKey));

  // Find additions and removals
  const added = left
    .filter((s) => !rightKeys.has(s.sectionKey))
    .map((s) => s.id);
  const removed = right
    .filter((s) => !leftKeys.has(s.sectionKey))
    .map((s) => s.id);

  // Find common sections
  const commonKeys = left
    .filter((s) => rightKeys.has(s.sectionKey))
    .map((s) => s.sectionKey);

  const modified: string[] = [];
  const details: SectionsDiff['details'] = {};

  // Compare common sections
  for (const key of commonKeys) {
    const leftSection = left.find((s) => s.sectionKey === key)!;
    const rightSection = right.find((s) => s.sectionKey === key)!;

    const sectionDiff = compareSectionData(leftSection, rightSection);
    details[leftSection.id] = sectionDiff;

    if (sectionDiff.type === 'modified') {
      modified.push(leftSection.id);
    }
  }

  // Add entries for added/removed sections
  for (const id of added) {
    details[id] = { type: 'added' };
  }

  for (const id of removed) {
    details[id] = { type: 'removed' };
  }

  // Check if reordered
  const reordered = checkReordering(left, right, commonKeys);

  return {
    changed: added.length > 0 || removed.length > 0 || modified.length > 0 || reordered,
    added,
    removed,
    modified,
    reordered,
    details,
  };
}

/**
 * Compare individual section
 */
function compareSectionData(
  left: VersionData['sections'][0],
  right: VersionData['sections'][0]
): SectionChange {
  const fields: Record<string, FieldChange> = {};
  let hasChanges = false;

  // Compare fields
  const fieldNames: (keyof VersionData['sections'][0])[] = [
    'title',
    'subtitle',
    'content',
    'order',
    'isVisible',
    'cssClasses',
    'customStyles',
  ];

  for (const field of fieldNames) {
    const leftValue = left[field];
    const rightValue = right[field];

    if (JSON.stringify(leftValue) !== JSON.stringify(rightValue)) {
      fields[field] = {
        changed: true,
        oldValue: rightValue,
        newValue: leftValue,
        changeType: !rightValue ? 'added' : !leftValue ? 'removed' : 'modified',
      };
      hasChanges = true;
    }
  }

  return {
    type: hasChanges ? 'modified' : 'unchanged',
    fields: hasChanges ? (fields as SectionChange['fields']) : undefined,
  };
}

/**
 * Check if sections were reordered
 */
function checkReordering(
  left: VersionData['sections'],
  right: VersionData['sections'],
  commonKeys: string[]
): boolean {
  const leftOrder = left
    .filter((s) => commonKeys.includes(s.sectionKey))
    .map((s) => s.sectionKey);
  const rightOrder = right
    .filter((s) => commonKeys.includes(s.sectionKey))
    .map((s) => s.sectionKey);

  return JSON.stringify(leftOrder) !== JSON.stringify(rightOrder);
}

/**
 * Compare metadata
 */
function compareMetadata(
  left: VersionData['metadata'],
  right: VersionData['metadata']
): MetadataDiff {
  const fields: MetadataDiff['fields'] = {};
  let changed = false;

  if (left.createdBy !== right.createdBy) {
    fields.createdBy = {
      changed: true,
      oldValue: right.createdBy,
      newValue: left.createdBy,
      changeType: 'modified',
    };
    changed = true;
  }

  if (left.changeDescription !== right.changeDescription) {
    fields.changeDescription = {
      changed: true,
      oldValue: right.changeDescription,
      newValue: left.changeDescription,
      changeType: 'modified',
    };
    changed = true;
  }

  return { changed, fields };
}

// ============================================================================
// Summary Generation
// ============================================================================

/**
 * Generate comparison summary
 */
function generateSummary(diff: DiffResult): DiffSummary {
  const pageChanges = Object.keys(diff.page.fields).length;
  const sectionsAdded = diff.sections.added.length;
  const sectionsRemoved = diff.sections.removed.length;
  const sectionsModified = diff.sections.modified.length;
  const sectionsReordered = diff.sections.reordered;
  const metadataChanges = Object.keys(diff.metadata.fields).length;

  const totalChanges =
    pageChanges +
    sectionsAdded +
    sectionsRemoved +
    sectionsModified +
    metadataChanges +
    (sectionsReordered ? 1 : 0);

  const hasContentChanges =
    pageChanges > 0 ||
    sectionsAdded > 0 ||
    sectionsRemoved > 0 ||
    sectionsModified > 0;

  const hasStructuralChanges =
    sectionsAdded > 0 || sectionsRemoved > 0 || sectionsReordered;

  return {
    totalChanges,
    pageChanges,
    sectionsAdded,
    sectionsRemoved,
    sectionsModified,
    sectionsReordered,
    metadataChanges,
    hasContentChanges,
    hasStructuralChanges,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get all versions for comparison options
 */
export async function getVersionsForComparison(pageId: string) {
  const versions = await prisma.cmsPageVersion.findMany({
    where: { pageId },
    select: {
      id: true,
      versionNumber: true,
      changeDescription: true,
      createdAt: true,
      createdBy: true,
    },
    orderBy: { versionNumber: 'desc' },
  });

  return versions;
}

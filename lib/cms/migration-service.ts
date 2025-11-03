/**
 * CMS Content Migration Service
 * 
 * Provides tools for importing and exporting CMS content:
 * - Full database export/import
 * - Individual page export/import
 * - Bulk operations
 * - Data validation
 * - Migration history tracking
 * - Format conversion (JSON, CSV)
 */

import { prisma } from '@/lib/prisma';

// ============================================================================
// Type Definitions
// ============================================================================

export interface ExportOptions {
  includePages?: boolean;
  includeSections?: boolean;
  includeTemplates?: boolean;
  includeMedia?: boolean;
  includeVersions?: boolean;
  includeSchedules?: boolean;
  pageIds?: string[];
  format?: 'json' | 'csv';
}

export interface ImportOptions {
  overwriteExisting?: boolean;
  skipErrors?: boolean;
  validateOnly?: boolean;
  createMissing?: boolean;
  preserveIds?: boolean;
}

export interface ExportedContent {
  version: string;
  exportedAt: string;
  exportedBy?: string;
  metadata: {
    totalPages: number;
    totalSections: number;
    totalTemplates: number;
  };
  pages?: ExportedPage[];
  templates?: ExportedTemplate[];
}

export interface ExportedPage {
  id: string;
  pageKey: string;
  pageTitle: string;
  slug: string;
  pageType: string;
  templateId?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  structuredData?: Record<string, unknown>;
  status: string;
  publishedAt?: string;
  sections: ExportedSection[];
  versions?: ExportedVersion[];
}

export interface ExportedSection {
  sectionKey: string;
  sectionType: string;
  title?: string;
  subtitle?: string;
  content: Record<string, unknown>;
  order: number;
  isVisible: boolean;
  cssClasses?: string;
  customStyles?: Record<string, unknown>;
}

export interface ExportedTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  templateStructure: Record<string, unknown>;
  defaultContent?: Record<string, unknown>;
  isActive: boolean;
  isSystem: boolean;
  order: number;
}

export interface ExportedVersion {
  versionNumber: number;
  pageSnapshot: Record<string, unknown>;
  sectionsSnapshot: Record<string, unknown>;
  changeDescription?: string;
  createdAt: string;
  createdBy: string;
  isPublished: boolean;
}

export interface ImportResult {
  success: boolean;
  imported: {
    pages: number;
    sections: number;
    templates: number;
  };
  errors: ImportError[];
  warnings: string[];
}

export interface ImportError {
  type: 'page' | 'section' | 'template';
  id?: string;
  message: string;
  data?: unknown;
}

export interface ValidationResult {
  valid: boolean;
  errors: ImportError[];
  warnings: string[];
}

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Export all CMS content
 */
export async function exportAllContent(
  options: ExportOptions = {},
  userId?: string
): Promise<ExportedContent> {
  const {
    includePages = true,
    includeTemplates = true,
  } = options;

  const exported: ExportedContent = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    exportedBy: userId,
    metadata: {
      totalPages: 0,
      totalSections: 0,
      totalTemplates: 0,
    },
  };

  // Export pages
  if (includePages) {
    const pages = await exportPages(options);
    exported.pages = pages;
    exported.metadata.totalPages = pages.length;
    exported.metadata.totalSections = pages.reduce(
      (sum, p) => sum + p.sections.length,
      0
    );
  }

  // Export templates
  if (includeTemplates) {
    const templates = await exportTemplates();
    exported.templates = templates;
    exported.metadata.totalTemplates = templates.length;
  }

  return exported;
}

/**
 * Export pages with sections
 */
export async function exportPages(
  options: ExportOptions = {}
): Promise<ExportedPage[]> {
  const { pageIds, includeVersions = false, includeSections = true } = options;

  const whereClause = pageIds ? { id: { in: pageIds } } : {};

  const pages = await prisma.cmsPage.findMany({
    where: whereClause,
    include: {
      sections: includeSections,
      versions: includeVersions ? {
        orderBy: { versionNumber: 'desc' },
        take: 10, // Limit versions to last 10
      } : false,
    },
    orderBy: { createdAt: 'asc' },
  });

  return pages.map((page): ExportedPage => ({
    id: page.id,
    pageKey: page.pageKey,
    pageTitle: page.pageTitle,
    slug: page.slug,
    pageType: page.pageType,
    templateId: page.templateId || undefined,
    metaTitle: page.metaTitle || undefined,
    metaDescription: page.metaDescription || undefined,
    metaKeywords: page.metaKeywords || undefined,
    ogImage: page.ogImage || undefined,
    ogTitle: page.ogTitle || undefined,
    ogDescription: page.ogDescription || undefined,
    structuredData: page.structuredData as Record<string, unknown> | undefined,
    status: page.status,
    publishedAt: page.publishedAt?.toISOString(),
    sections: page.sections?.map((section): ExportedSection => ({
      sectionKey: section.sectionKey,
      sectionType: section.sectionType,
      title: section.title || undefined,
      subtitle: section.subtitle || undefined,
      content: section.content as Record<string, unknown>,
      order: section.order,
      isVisible: section.isVisible,
      cssClasses: section.cssClasses || undefined,
      customStyles: section.customStyles as Record<string, unknown> | undefined,
    })) || [],
    versions: page.versions?.map((version): ExportedVersion => ({
      versionNumber: version.versionNumber,
      pageSnapshot: version.pageSnapshot as Record<string, unknown>,
      sectionsSnapshot: version.sectionsSnapshot as Record<string, unknown>,
      changeDescription: version.changeDescription || undefined,
      createdAt: version.createdAt.toISOString(),
      createdBy: version.createdBy,
      isPublished: version.isPublished,
    })),
  }));
}

/**
 * Export single page
 */
export async function exportPage(pageId: string): Promise<ExportedPage> {
  const pages = await exportPages({ pageIds: [pageId], includeVersions: true });
  
  if (pages.length === 0) {
    throw new Error('Page not found');
  }

  return pages[0];
}

/**
 * Export templates
 */
export async function exportTemplates(): Promise<ExportedTemplate[]> {
  const templates = await prisma.cmsTemplate.findMany({
    orderBy: { name: 'asc' },
  });

  return templates.map((template): ExportedTemplate => ({
    id: template.id,
    name: template.name,
    description: template.description || undefined,
    category: template.category,
    templateStructure: template.templateStructure as Record<string, unknown>,
    defaultContent: template.defaultContent as Record<string, unknown> | undefined,
    isActive: template.isActive,
    isSystem: template.isSystem,
    order: template.order,
  }));
}

/**
 * Export to CSV format (pages only)
 */
export async function exportPagesToCSV(options: ExportOptions = {}): Promise<string> {
  const pages = await exportPages(options);

  const headers = [
    'ID',
    'Page Key',
    'Title',
    'Slug',
    'Type',
    'Status',
    'Meta Title',
    'Meta Description',
    'Published At',
    'Sections Count',
  ];

  const rows = pages.map(page => [
    page.id,
    page.pageKey,
    page.pageTitle,
    page.slug,
    page.pageType,
    page.status,
    page.metaTitle || '',
    page.metaDescription || '',
    page.publishedAt || '',
    page.sections.length.toString(),
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  return csv;
}

// ============================================================================
// Import Functions
// ============================================================================

/**
 * Validate imported content
 */
export function validateImport(content: ExportedContent): ValidationResult {
  const errors: ImportError[] = [];
  const warnings: string[] = [];

  // Check version compatibility
  if (content.version !== '1.0') {
    warnings.push(`Import version ${content.version} may not be fully compatible`);
  }

  // Validate pages
  if (content.pages) {
    for (const page of content.pages) {
      // Check required fields
      if (!page.pageKey) {
        errors.push({
          type: 'page',
          id: page.id,
          message: 'Missing required field: pageKey',
          data: page,
        });
      }

      if (!page.pageTitle) {
        errors.push({
          type: 'page',
          id: page.id,
          message: 'Missing required field: pageTitle',
          data: page,
        });
      }

      if (!page.slug) {
        errors.push({
          type: 'page',
          id: page.id,
          message: 'Missing required field: slug',
          data: page,
        });
      }

      // Check for duplicate slugs in import
      const duplicateSlugs = content.pages.filter(p => p.slug === page.slug);
      if (duplicateSlugs.length > 1) {
        warnings.push(`Duplicate slug found: ${page.slug}`);
      }

      // Validate sections
      if (page.sections) {
        for (const section of page.sections) {
          if (!section.sectionKey) {
            errors.push({
              type: 'section',
              message: `Section missing sectionKey in page ${page.pageKey}`,
              data: section,
            });
          }

          if (!section.content) {
            errors.push({
              type: 'section',
              message: `Section missing content in page ${page.pageKey}`,
              data: section,
            });
          }
        }
      }
    }
  }

  // Validate templates
  if (content.templates) {
    for (const template of content.templates) {
      if (!template.name) {
        errors.push({
          type: 'template',
          id: template.id,
          message: 'Missing required field: name',
          data: template,
        });
      }

      if (!template.templateStructure) {
        errors.push({
          type: 'template',
          id: template.id,
          message: 'Missing required field: templateStructure',
          data: template,
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Import content from export
 */
export async function importContent(
  content: ExportedContent,
  options: ImportOptions = {},
  userId?: string
): Promise<ImportResult> {
  const {
    overwriteExisting = false,
    skipErrors = false,
    validateOnly = false,
    preserveIds = false,
  } = options;

  // Validate first
  const validation = validateImport(content);
  if (!validation.valid && !skipErrors) {
    return {
      success: false,
      imported: { pages: 0, sections: 0, templates: 0 },
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  if (validateOnly) {
    return {
      success: validation.valid,
      imported: { pages: 0, sections: 0, templates: 0 },
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  const result: ImportResult = {
    success: true,
    imported: { pages: 0, sections: 0, templates: 0 },
    errors: [],
    warnings: validation.warnings,
  };

  // Import templates first (if included)
  if (content.templates) {
    for (const template of content.templates) {
      try {
        await importTemplate(template, { overwriteExisting, preserveIds });
        result.imported.templates++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push({
          type: 'template',
          id: template.id,
          message: errorMsg,
          data: template,
        });

        if (!skipErrors) {
          result.success = false;
          return result;
        }
      }
    }
  }

  // Import pages
  if (content.pages) {
    for (const page of content.pages) {
      try {
        await importPage(page, { overwriteExisting, preserveIds }, userId);
        result.imported.pages++;
        result.imported.sections += page.sections.length;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push({
          type: 'page',
          id: page.id,
          message: errorMsg,
          data: page,
        });

        if (!skipErrors) {
          result.success = false;
          return result;
        }
      }
    }
  }

  return result;
}

/**
 * Import single page
 */
export async function importPage(
  page: ExportedPage,
  options: ImportOptions = {},
  userId?: string
): Promise<void> {
  const { overwriteExisting = false, preserveIds = false } = options;

  // Check if page exists by pageKey or slug
  const existing = await prisma.cmsPage.findFirst({
    where: {
      OR: [
        { pageKey: page.pageKey },
        { slug: page.slug },
      ],
    },
  });

  if (existing && !overwriteExisting) {
    throw new Error(`Page with key '${page.pageKey}' or slug '${page.slug}' already exists`);
  }

  const pageData = {
    ...(preserveIds && { id: page.id }),
    pageKey: page.pageKey,
    pageTitle: page.pageTitle,
    slug: page.slug,
    pageType: page.pageType,
    templateId: page.templateId,
    metaTitle: page.metaTitle,
    metaDescription: page.metaDescription,
    metaKeywords: page.metaKeywords,
    ogImage: page.ogImage,
    ogTitle: page.ogTitle,
    ogDescription: page.ogDescription,
    structuredData: page.structuredData as Record<string, unknown> | undefined,
    status: page.status,
    publishedAt: page.publishedAt ? new Date(page.publishedAt) : null,
    authorId: userId,
    lastEditedBy: userId,
  };

  if (existing) {
    // Update existing page
    await prisma.cmsPage.update({
      where: { id: existing.id },
      data: {
        ...pageData,
        sections: {
          deleteMany: {}, // Clear existing sections
          create: page.sections.map(section => ({
            sectionKey: section.sectionKey,
            sectionType: section.sectionType,
            title: section.title,
            subtitle: section.subtitle,
            content: section.content as Record<string, unknown>,
            order: section.order,
            isVisible: section.isVisible,
            cssClasses: section.cssClasses,
            customStyles: section.customStyles as Record<string, unknown> | undefined,
          })),
        },
      },
    });
  } else {
    // Create new page
    await prisma.cmsPage.create({
      data: {
        ...pageData,
        sections: {
          create: page.sections.map(section => ({
            sectionKey: section.sectionKey,
            sectionType: section.sectionType,
            title: section.title,
            subtitle: section.subtitle,
            content: section.content as Record<string, unknown>,
            order: section.order,
            isVisible: section.isVisible,
            cssClasses: section.cssClasses,
            customStyles: section.customStyles as Record<string, unknown> | undefined,
          })),
        },
      },
    });
  }
}

/**
 * Import single template
 */
export async function importTemplate(
  template: ExportedTemplate,
  options: ImportOptions = {}
): Promise<void> {
  const { overwriteExisting = false, preserveIds = false } = options;

  // Check by name since there's no unique templateKey
  const existing = await prisma.cmsTemplate.findFirst({
    where: { name: template.name },
  });

  if (existing && !overwriteExisting) {
    throw new Error(`Template with name '${template.name}' already exists`);
  }

  const templateData = {
    ...(preserveIds && { id: template.id }),
    name: template.name,
    description: template.description,
    category: template.category,
    templateStructure: template.templateStructure as Record<string, unknown>,
    defaultContent: template.defaultContent as Record<string, unknown> | undefined,
    isActive: template.isActive,
    isSystem: template.isSystem,
    order: template.order,
  };

  if (existing) {
    await prisma.cmsTemplate.update({
      where: { id: existing.id },
      data: templateData,
    });
  } else {
    await prisma.cmsTemplate.create({
      data: templateData,
    });
  }
}

// ============================================================================
// Migration History
// ============================================================================

export interface MigrationHistory {
  id: string;
  type: 'export' | 'import';
  userId?: string;
  itemCount: number;
  status: 'success' | 'partial' | 'failed';
  errorCount: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

/**
 * Log migration operation
 */
export async function logMigration(
  type: 'export' | 'import',
  result: ImportResult | { itemCount: number },
  userId?: string
): Promise<void> {
  const isImportResult = 'imported' in result;
  
  const itemCount = isImportResult
    ? result.imported.pages + result.imported.templates
    : result.itemCount;

  const errorCount = isImportResult ? result.errors.length : 0;
  
  const status = isImportResult
    ? result.success
      ? errorCount > 0
        ? 'partial'
        : 'success'
      : 'failed'
    : 'success';

  // Log to audit system
  console.log(`[Migration] ${type} completed:`, {
    itemCount,
    status,
    errorCount,
    userId,
  });
}

// Default export
const migrationService = {
  // Export
  exportAllContent,
  exportPages,
  exportPage,
  exportTemplates,
  exportPagesToCSV,

  // Import
  validateImport,
  importContent,
  importPage,
  importTemplate,

  // History
  logMigration,
};

export default migrationService;

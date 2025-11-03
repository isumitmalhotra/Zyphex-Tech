/**
 * CMS Template Service
 * 
 * Manages page templates for quick page creation with predefined layouts.
 * Provides template CRUD operations, template application, and structure validation.
 * 
 * Features:
 * - Template CRUD operations
 * - Template structure validation
 * - Apply templates to new/existing pages
 * - System template protection
 * - Template categorization
 * - Default content management
 * 
 * @module lib/cms/template-service
 */

import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Template categories for organization
 */
export type TemplateCategory = 
  | 'landing'     // Landing pages
  | 'blog'        // Blog posts
  | 'portfolio'   // Portfolio items
  | 'service'     // Service pages
  | 'about'       // About/Company pages
  | 'contact'     // Contact pages
  | 'general'     // General purpose
  | 'custom';     // Custom templates

/**
 * Section type definition for template structure
 */
export interface TemplateSectionDef {
  sectionKey: string;
  sectionType: string;
  title: string;
  description?: string;
  isRequired: boolean;
  isEditable: boolean;
  defaultContent?: Record<string, unknown>;
  order: number;
  customStyles?: Record<string, unknown>;
}

/**
 * Template structure definition
 */
export interface TemplateStructure {
  sections: TemplateSectionDef[];
  layout?: {
    type: 'single-column' | 'two-column' | 'three-column' | 'custom';
    gridColumns?: number;
    gap?: string;
  };
  metadata?: {
    requiredSections: string[];
    optionalSections: string[];
    maxSections?: number;
    allowCustomSections: boolean;
  };
}

/**
 * Template default content
 */
export interface TemplateDefaultContent {
  title?: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  sections?: Record<string, Record<string, unknown>>;
}

/**
 * Template creation input
 */
export interface CreateTemplateInput {
  name: string;
  description?: string;
  category: TemplateCategory;
  templateStructure: TemplateStructure;
  defaultContent?: TemplateDefaultContent;
  thumbnailUrl?: string;
  isActive?: boolean;
  isSystem?: boolean;
  order?: number;
}

/**
 * Template update input
 */
export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  category?: TemplateCategory;
  templateStructure?: TemplateStructure;
  defaultContent?: TemplateDefaultContent;
  thumbnailUrl?: string;
  isActive?: boolean;
  order?: number;
}

/**
 * Template query options
 */
export interface TemplateQueryOptions {
  category?: TemplateCategory | TemplateCategory[];
  isActive?: boolean;
  includeSystem?: boolean;
  search?: string;
  orderBy?: 'name' | 'category' | 'order' | 'createdAt' | 'updatedAt';
  orderDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Apply template options
 */
export interface ApplyTemplateOptions {
  templateId: string;
  overrideContent?: Partial<TemplateDefaultContent>;
  includeSections?: boolean;
  skipRequiredValidation?: boolean;
}

// ============================================================================
// Validation Schemas
// ============================================================================

const templateSectionDefSchema = z.object({
  sectionKey: z.string().min(1),
  sectionType: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  isRequired: z.boolean(),
  isEditable: z.boolean(),
  defaultContent: z.record(z.unknown()).optional(),
  order: z.number().int().min(0),
  customStyles: z.record(z.unknown()).optional(),
});

const templateStructureSchema = z.object({
  sections: z.array(templateSectionDefSchema),
  layout: z.object({
    type: z.enum(['single-column', 'two-column', 'three-column', 'custom']),
    gridColumns: z.number().int().min(1).max(12).optional(),
    gap: z.string().optional(),
  }).optional(),
  metadata: z.object({
    requiredSections: z.array(z.string()),
    optionalSections: z.array(z.string()),
    maxSections: z.number().int().min(1).optional(),
    allowCustomSections: z.boolean(),
  }).optional(),
});

const templateDefaultContentSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  ogImage: z.string().url().optional(),
  sections: z.record(z.record(z.unknown())).optional(),
});

// ============================================================================
// Template CRUD Operations
// ============================================================================

/**
 * Create a new template
 */
export async function createTemplate(
  input: CreateTemplateInput
): Promise<{ id: string; name: string; category: string }> {
  // Validate structure
  const validatedStructure = templateStructureSchema.parse(input.templateStructure);
  const validatedContent = input.defaultContent 
    ? templateDefaultContentSchema.parse(input.defaultContent)
    : null;

  // Create template
  const template = await prisma.cmsTemplate.create({
    data: {
      name: input.name,
      description: input.description,
      category: input.category,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      templateStructure: validatedStructure as unknown as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      defaultContent: validatedContent as unknown as any,
      thumbnailUrl: input.thumbnailUrl,
      isActive: input.isActive ?? true,
      isSystem: input.isSystem ?? false,
      order: input.order ?? 0,
    },
    select: {
      id: true,
      name: true,
      category: true,
    },
  });

  return template;
}

/**
 * Get template by ID
 */
export async function getTemplateById(id: string) {
  const template = await prisma.cmsTemplate.findUnique({
    where: { id },
    include: {
      _count: {
        select: { pages: true },
      },
    },
  });

  return template;
}

/**
 * List templates with filtering and pagination
 */
export async function listTemplates(options: TemplateQueryOptions = {}) {
  const {
    category,
    isActive,
    includeSystem = true,
    search,
    orderBy = 'order',
    orderDirection = 'asc',
    limit = 50,
    offset = 0,
  } = options;

  // Build where clause
  interface TemplateWhere {
    category?: string | { in: TemplateCategory[] };
    isActive?: boolean;
    isSystem?: boolean;
    OR?: Array<{
      name?: { contains: string; mode: 'insensitive' };
      description?: { contains: string; mode: 'insensitive' };
    }>;
  }

  const where: TemplateWhere = {};

  if (category) {
    if (Array.isArray(category)) {
      where.category = { in: category };
    } else {
      where.category = category;
    }
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  if (!includeSystem) {
    where.isSystem = false;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Execute query
  const [templates, total] = await Promise.all([
    prisma.cmsTemplate.findMany({
      where,
      orderBy: { [orderBy]: orderDirection },
      take: limit,
      skip: offset,
      include: {
        _count: {
          select: { pages: true },
        },
      },
    }),
    prisma.cmsTemplate.count({ where }),
  ]);

  return {
    templates,
    total,
    limit,
    offset,
    hasMore: offset + templates.length < total,
  };
}

/**
 * Update an existing template
 */
export async function updateTemplate(
  id: string,
  input: UpdateTemplateInput
): Promise<{ id: string; name: string }> {
  // Check if template exists and is not system-protected
  const existing = await prisma.cmsTemplate.findUnique({
    where: { id },
    select: { isSystem: true },
  });

  if (!existing) {
    throw new Error('Template not found');
  }

  if (existing.isSystem && input.isActive === false) {
    throw new Error('Cannot deactivate system templates');
  }

  // Validate structure if provided
  const validatedStructure = input.templateStructure
    ? templateStructureSchema.parse(input.templateStructure)
    : undefined;

  const validatedContent = input.defaultContent
    ? templateDefaultContentSchema.parse(input.defaultContent)
    : undefined;

  // Update template
  const template = await prisma.cmsTemplate.update({
    where: { id },
    data: {
      ...(input.name && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.category && { category: input.category }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(validatedStructure && { templateStructure: validatedStructure as unknown as any }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(validatedContent !== undefined && { defaultContent: validatedContent as unknown as any }),
      ...(input.thumbnailUrl !== undefined && { thumbnailUrl: input.thumbnailUrl }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...(input.order !== undefined && { order: input.order }),
    },
    select: {
      id: true,
      name: true,
    },
  });

  return template;
}

/**
 * Delete a template
 */
export async function deleteTemplate(id: string): Promise<void> {
  // Check if template is system-protected
  const template = await prisma.cmsTemplate.findUnique({
    where: { id },
    select: { isSystem: true, _count: { select: { pages: true } } },
  });

  if (!template) {
    throw new Error('Template not found');
  }

  if (template.isSystem) {
    throw new Error('Cannot delete system templates');
  }

  if (template._count.pages > 0) {
    throw new Error(`Cannot delete template: ${template._count.pages} page(s) are using it`);
  }

  await prisma.cmsTemplate.delete({
    where: { id },
  });
}

/**
 * Duplicate a template
 */
export async function duplicateTemplate(
  id: string,
  newName?: string
): Promise<{ id: string; name: string }> {
  const source = await prisma.cmsTemplate.findUnique({
    where: { id },
  });

  if (!source) {
    throw new Error('Source template not found');
  }

  const template = await prisma.cmsTemplate.create({
    data: {
      name: newName || `${source.name} (Copy)`,
      description: source.description,
      category: source.category,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      templateStructure: source.templateStructure as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      defaultContent: source.defaultContent as any,
      thumbnailUrl: source.thumbnailUrl,
      isActive: source.isActive,
      isSystem: false, // Duplicates are never system templates
      order: source.order,
    },
    select: {
      id: true,
      name: true,
    },
  });

  return template;
}

// ============================================================================
// Template Application
// ============================================================================

/**
 * Get template structure for application
 */
export async function getTemplateStructure(id: string): Promise<TemplateStructure> {
  const template = await prisma.cmsTemplate.findUnique({
    where: { id },
    select: { templateStructure: true },
  });

  if (!template) {
    throw new Error('Template not found');
  }

  return template.templateStructure as unknown as TemplateStructure;
}

/**
 * Get template default content
 */
export async function getTemplateDefaultContent(
  id: string
): Promise<TemplateDefaultContent | null> {
  const template = await prisma.cmsTemplate.findUnique({
    where: { id },
    select: { defaultContent: true },
  });

  if (!template) {
    throw new Error('Template not found');
  }

  return template.defaultContent as TemplateDefaultContent | null;
}

/**
 * Validate if a page structure matches template requirements
 */
export function validatePageAgainstTemplate(
  pageStructure: { sections?: Array<{ sectionKey: string; [key: string]: unknown }> },
  templateStructure: TemplateStructure
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required sections
  const requiredSections = templateStructure.metadata?.requiredSections || [];
  const pageSectionKeys = new Set(
    (pageStructure.sections || []).map(s => s.sectionKey)
  );

  for (const requiredKey of requiredSections) {
    if (!pageSectionKeys.has(requiredKey)) {
      errors.push(`Missing required section: ${requiredKey}`);
    }
  }

  // Check max sections
  if (templateStructure.metadata?.maxSections) {
    const sectionCount = (pageStructure.sections || []).length;
    if (sectionCount > templateStructure.metadata.maxSections) {
      errors.push(
        `Too many sections: ${sectionCount} (max: ${templateStructure.metadata.maxSections})`
      );
    }
  }

  // Check for custom sections if not allowed
  if (!templateStructure.metadata?.allowCustomSections) {
    const templateSectionKeys = new Set(
      templateStructure.sections.map(s => s.sectionKey)
    );
    const customSections = (pageStructure.sections || []).filter(
      s => !templateSectionKeys.has(s.sectionKey)
    );

    if (customSections.length > 0) {
      errors.push(
        `Custom sections not allowed. Found: ${customSections.map(s => s.sectionKey).join(', ')}`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Prepare page data from template
 */
export async function preparePageFromTemplate(
  templateId: string,
  overrideContent?: Partial<TemplateDefaultContent>
): Promise<{
  templateData: TemplateDefaultContent;
  sections: TemplateSectionDef[];
  structure: TemplateStructure;
}> {
  const template = await prisma.cmsTemplate.findUnique({
    where: { id: templateId, isActive: true },
  });

  if (!template) {
    throw new Error('Template not found or inactive');
  }

  const structure = template.templateStructure as unknown as TemplateStructure;
  const defaultContent = (template.defaultContent as unknown as TemplateDefaultContent) || {};

  // Merge default content with overrides
  const templateData: TemplateDefaultContent = {
    ...defaultContent,
    ...overrideContent,
  };

  return {
    templateData,
    sections: structure.sections,
    structure,
  };
}

// ============================================================================
// Template Statistics
// ============================================================================

/**
 * Get template usage statistics
 */
export async function getTemplateStats(id: string) {
  const template = await prisma.cmsTemplate.findUnique({
    where: { id },
    include: {
      pages: {
        select: {
          id: true,
          slug: true,
          status: true,
          publishedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!template) {
    throw new Error('Template not found');
  }

  const stats = {
    totalPages: template.pages.length,
    publishedPages: template.pages.filter(p => p.status === 'published').length,
    draftPages: template.pages.filter(p => p.status === 'draft').length,
    scheduledPages: template.pages.filter(p => p.status === 'scheduled').length,
    recentPages: template.pages.slice(0, 5),
  };

  return {
    template: {
      id: template.id,
      name: template.name,
      category: template.category,
    },
    stats,
  };
}

/**
 * Get overview of all templates
 */
export async function getTemplatesOverview() {
  const templates = await prisma.cmsTemplate.findMany({
    include: {
      _count: {
        select: { pages: true },
      },
    },
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
  });

  const overview = {
    total: templates.length,
    active: templates.filter(t => t.isActive).length,
    inactive: templates.filter(t => !t.isActive).length,
    system: templates.filter(t => t.isSystem).length,
    byCategory: templates.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    totalPages: templates.reduce((sum, t) => sum + t._count.pages, 0),
    templates: templates.map(t => ({
      id: t.id,
      name: t.name,
      category: t.category,
      isActive: t.isActive,
      isSystem: t.isSystem,
      pagesCount: t._count.pages,
    })),
  };

  return overview;
}

// ============================================================================
// Export
// ============================================================================

const templateService = {
  // CRUD
  createTemplate,
  getTemplateById,
  listTemplates,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
  
  // Application
  getTemplateStructure,
  getTemplateDefaultContent,
  validatePageAgainstTemplate,
  preparePageFromTemplate,
  
  // Statistics
  getTemplateStats,
  getTemplatesOverview,
};

export default templateService;

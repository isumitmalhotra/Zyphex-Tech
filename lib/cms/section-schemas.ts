/**
 * CMS Section Type Schemas
 * Defines content structure and validation for each section type
 */

import { z } from 'zod';
import {
  imageFieldValueSchema,
  linkFieldValueSchema,
  buttonFieldValueSchema,
  galleryFieldValueSchema,
  videoFieldValueSchema,
  iconFieldValueSchema,
  type FieldConfig,
  commonFieldPresets,
} from './content-fields';

/**
 * ============================================================================
 * HERO SECTION
 * ============================================================================
 */

export const heroSectionContentSchema = z.object({
  heading: z.string().min(1).max(100),
  subheading: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  primaryButton: buttonFieldValueSchema.optional(),
  secondaryButton: buttonFieldValueSchema.optional(),
  backgroundImage: imageFieldValueSchema.optional(),
  backgroundVideo: videoFieldValueSchema.optional(),
  alignment: z.enum(['left', 'center', 'right']).default('center'),
  overlay: z.boolean().default(false),
  overlayOpacity: z.number().min(0).max(100).default(50),
  height: z.enum(['small', 'medium', 'large', 'full']).default('large'),
});

export type HeroSectionContent = z.infer<typeof heroSectionContentSchema>;

export const heroSectionFields: FieldConfig[] = [
  commonFieldPresets.heading(),
  commonFieldPresets.subheading(),
  commonFieldPresets.description(),
  {
    ...commonFieldPresets.ctaButton(),
    name: 'primaryButton',
    label: 'Primary Button',
  },
  {
    ...commonFieldPresets.ctaButton(),
    name: 'secondaryButton',
    label: 'Secondary Button',
    required: false,
  },
  {
    ...commonFieldPresets.backgroundImage(),
    name: 'backgroundImage',
  },
  {
    type: 'select',
    name: 'alignment',
    label: 'Text Alignment',
    options: [
      { label: 'Left', value: 'left' },
      { label: 'Center', value: 'center' },
      { label: 'Right', value: 'right' },
    ],
    defaultValue: 'center',
  },
  {
    type: 'select',
    name: 'height',
    label: 'Section Height',
    options: [
      { label: 'Small', value: 'small' },
      { label: 'Medium', value: 'medium' },
      { label: 'Large', value: 'large' },
      { label: 'Full Screen', value: 'full' },
    ],
    defaultValue: 'large',
  },
];

/**
 * ============================================================================
 * FEATURES SECTION
 * ============================================================================
 */

export const featureItemSchema = z.object({
  icon: iconFieldValueSchema.optional(),
  title: z.string().min(1).max(100),
  description: z.string().max(300),
  link: linkFieldValueSchema.optional(),
  image: imageFieldValueSchema.optional(),
});

export const featuresSectionContentSchema = z.object({
  heading: z.string().min(1).max(100).optional(),
  subheading: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  layout: z.enum(['grid', 'list', 'cards']).default('grid'),
  columns: z.enum(['2', '3', '4']).default('3'),
  features: z.array(featureItemSchema).min(1).max(12),
});

export type FeaturesSectionContent = z.infer<typeof featuresSectionContentSchema>;

export const featuresSectionFields: FieldConfig[] = [
  commonFieldPresets.heading(),
  commonFieldPresets.subheading(),
  commonFieldPresets.description(),
  {
    type: 'select',
    name: 'layout',
    label: 'Layout Style',
    options: [
      { label: 'Grid', value: 'grid' },
      { label: 'List', value: 'list' },
      { label: 'Cards', value: 'cards' },
    ],
    defaultValue: 'grid',
  },
  {
    type: 'select',
    name: 'columns',
    label: 'Columns',
    options: [
      { label: '2 Columns', value: '2' },
      { label: '3 Columns', value: '3' },
      { label: '4 Columns', value: '4' },
    ],
    defaultValue: '3',
  },
  {
    type: 'repeater',
    name: 'features',
    label: 'Features',
    minItems: 1,
    maxItems: 12,
    fields: [
      {
        type: 'icon',
        name: 'icon',
        label: 'Icon',
        iconSet: 'heroicons',
      },
      {
        type: 'text',
        name: 'title',
        label: 'Title',
        maxLength: 100,
        required: true,
      },
      {
        type: 'textarea',
        name: 'description',
        label: 'Description',
        maxLength: 300,
        required: true,
      },
      {
        type: 'link',
        name: 'link',
        label: 'Link (Optional)',
        allowInternal: true,
        allowExternal: true,
      },
    ],
  },
];

/**
 * ============================================================================
 * TESTIMONIALS SECTION
 * ============================================================================
 */

export const testimonialItemSchema = z.object({
  quote: z.string().min(1).max(500),
  author: z.string().min(1).max(100),
  role: z.string().max(100).optional(),
  company: z.string().max(100).optional(),
  avatar: imageFieldValueSchema.optional(),
  rating: z.number().min(1).max(5).optional(),
});

export const testimonialsSectionContentSchema = z.object({
  heading: z.string().min(1).max(100).optional(),
  subheading: z.string().max(200).optional(),
  layout: z.enum(['slider', 'grid', 'masonry']).default('slider'),
  showRatings: z.boolean().default(true),
  testimonials: z.array(testimonialItemSchema).min(1).max(20),
});

export type TestimonialsSectionContent = z.infer<typeof testimonialsSectionContentSchema>;

export const testimonialsSectionFields: FieldConfig[] = [
  commonFieldPresets.heading(),
  commonFieldPresets.subheading(),
  {
    type: 'select',
    name: 'layout',
    label: 'Layout Style',
    options: [
      { label: 'Slider', value: 'slider' },
      { label: 'Grid', value: 'grid' },
      { label: 'Masonry', value: 'masonry' },
    ],
    defaultValue: 'slider',
  },
  {
    type: 'boolean',
    name: 'showRatings',
    label: 'Show Star Ratings',
    defaultValue: true,
  },
  {
    type: 'repeater',
    name: 'testimonials',
    label: 'Testimonials',
    minItems: 1,
    maxItems: 20,
    fields: [
      {
        type: 'textarea',
        name: 'quote',
        label: 'Quote',
        maxLength: 500,
        required: true,
      },
      {
        type: 'text',
        name: 'author',
        label: 'Author Name',
        maxLength: 100,
        required: true,
      },
      {
        type: 'text',
        name: 'role',
        label: 'Role/Title',
        maxLength: 100,
      },
      {
        type: 'text',
        name: 'company',
        label: 'Company',
        maxLength: 100,
      },
      {
        type: 'image',
        name: 'avatar',
        label: 'Avatar',
        cropRatio: '1:1',
      },
      {
        type: 'number',
        name: 'rating',
        label: 'Rating',
        min: 1,
        max: 5,
      },
    ],
  },
];

/**
 * ============================================================================
 * CTA (CALL TO ACTION) SECTION
 * ============================================================================
 */

export const ctaSectionContentSchema = z.object({
  heading: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  primaryButton: buttonFieldValueSchema,
  secondaryButton: buttonFieldValueSchema.optional(),
  backgroundImage: imageFieldValueSchema.optional(),
  backgroundColor: z.string().optional(),
  alignment: z.enum(['left', 'center', 'right']).default('center'),
  style: z.enum(['default', 'bordered', 'gradient', 'image']).default('default'),
});

export type CtaSectionContent = z.infer<typeof ctaSectionContentSchema>;

export const ctaSectionFields: FieldConfig[] = [
  commonFieldPresets.heading(),
  commonFieldPresets.description(),
  {
    ...commonFieldPresets.ctaButton(),
    name: 'primaryButton',
    required: true,
  },
  {
    ...commonFieldPresets.ctaButton(),
    name: 'secondaryButton',
    label: 'Secondary Button (Optional)',
  },
  {
    type: 'select',
    name: 'style',
    label: 'Style',
    options: [
      { label: 'Default', value: 'default' },
      { label: 'Bordered', value: 'bordered' },
      { label: 'Gradient', value: 'gradient' },
      { label: 'With Background Image', value: 'image' },
    ],
    defaultValue: 'default',
  },
  {
    type: 'color',
    name: 'backgroundColor',
    label: 'Background Color',
    format: 'hex',
    allowOpacity: true,
  },
  {
    ...commonFieldPresets.backgroundImage(),
  },
  {
    type: 'select',
    name: 'alignment',
    label: 'Text Alignment',
    options: [
      { label: 'Left', value: 'left' },
      { label: 'Center', value: 'center' },
      { label: 'Right', value: 'right' },
    ],
    defaultValue: 'center',
  },
];

/**
 * ============================================================================
 * CONTENT SECTION
 * ============================================================================
 */

export const contentSectionContentSchema = z.object({
  heading: z.string().max(100).optional(),
  content: z.string().min(1),
  image: imageFieldValueSchema.optional(),
  imagePosition: z.enum(['left', 'right', 'top', 'bottom', 'none']).default('none'),
  layout: z.enum(['single', 'two-column', 'sidebar']).default('single'),
  backgroundColor: z.string().optional(),
});

export type ContentSectionContent = z.infer<typeof contentSectionContentSchema>;

export const contentSectionFields: FieldConfig[] = [
  commonFieldPresets.heading(),
  {
    ...commonFieldPresets.bodyContent(),
    required: true,
  },
  {
    ...commonFieldPresets.featuredImage(),
    required: false,
  },
  {
    type: 'select',
    name: 'imagePosition',
    label: 'Image Position',
    options: [
      { label: 'None', value: 'none' },
      { label: 'Left', value: 'left' },
      { label: 'Right', value: 'right' },
      { label: 'Top', value: 'top' },
      { label: 'Bottom', value: 'bottom' },
    ],
    defaultValue: 'none',
  },
  {
    type: 'select',
    name: 'layout',
    label: 'Layout',
    options: [
      { label: 'Single Column', value: 'single' },
      { label: 'Two Columns', value: 'two-column' },
      { label: 'With Sidebar', value: 'sidebar' },
    ],
    defaultValue: 'single',
  },
];

/**
 * ============================================================================
 * GALLERY SECTION
 * ============================================================================
 */

export const gallerySectionContentSchema = z.object({
  heading: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  images: galleryFieldValueSchema,
  layout: z.enum(['grid', 'masonry', 'carousel', 'justified']).default('grid'),
  columns: z.enum(['2', '3', '4', '5']).default('3'),
  aspectRatio: z.enum(['square', '16:9', '4:3', '3:2', 'auto']).default('auto'),
  enableLightbox: z.boolean().default(true),
  showCaptions: z.boolean().default(true),
});

export type GallerySectionContent = z.infer<typeof gallerySectionContentSchema>;

export const gallerySectionFields: FieldConfig[] = [
  commonFieldPresets.heading(),
  commonFieldPresets.description(),
  {
    type: 'gallery',
    name: 'images',
    label: 'Gallery Images',
    minImages: 1,
    maxImages: 50,
    required: true,
  },
  {
    type: 'select',
    name: 'layout',
    label: 'Gallery Layout',
    options: [
      { label: 'Grid', value: 'grid' },
      { label: 'Masonry', value: 'masonry' },
      { label: 'Carousel', value: 'carousel' },
      { label: 'Justified', value: 'justified' },
    ],
    defaultValue: 'grid',
  },
  {
    type: 'select',
    name: 'columns',
    label: 'Columns',
    options: [
      { label: '2 Columns', value: '2' },
      { label: '3 Columns', value: '3' },
      { label: '4 Columns', value: '4' },
      { label: '5 Columns', value: '5' },
    ],
    defaultValue: '3',
  },
  {
    type: 'select',
    name: 'aspectRatio',
    label: 'Image Aspect Ratio',
    options: [
      { label: 'Square (1:1)', value: 'square' },
      { label: 'Widescreen (16:9)', value: '16:9' },
      { label: 'Standard (4:3)', value: '4:3' },
      { label: 'Classic (3:2)', value: '3:2' },
      { label: 'Auto', value: 'auto' },
    ],
    defaultValue: 'auto',
  },
  {
    type: 'boolean',
    name: 'enableLightbox',
    label: 'Enable Lightbox',
    defaultValue: true,
  },
  {
    type: 'boolean',
    name: 'showCaptions',
    label: 'Show Image Captions',
    defaultValue: true,
  },
];

/**
 * ============================================================================
 * FAQ SECTION
 * ============================================================================
 */

export const faqItemSchema = z.object({
  question: z.string().min(1).max(200),
  answer: z.string().min(1).max(1000),
});

export const faqSectionContentSchema = z.object({
  heading: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  layout: z.enum(['accordion', 'grid', 'list']).default('accordion'),
  allowMultipleOpen: z.boolean().default(false),
  faqs: z.array(faqItemSchema).min(1).max(50),
});

export type FaqSectionContent = z.infer<typeof faqSectionContentSchema>;

export const faqSectionFields: FieldConfig[] = [
  commonFieldPresets.heading(),
  commonFieldPresets.description(),
  {
    type: 'select',
    name: 'layout',
    label: 'Layout Style',
    options: [
      { label: 'Accordion', value: 'accordion' },
      { label: 'Grid', value: 'grid' },
      { label: 'List', value: 'list' },
    ],
    defaultValue: 'accordion',
  },
  {
    type: 'boolean',
    name: 'allowMultipleOpen',
    label: 'Allow Multiple Items Open',
    defaultValue: false,
  },
  {
    type: 'repeater',
    name: 'faqs',
    label: 'FAQ Items',
    minItems: 1,
    maxItems: 50,
    fields: [
      {
        type: 'text',
        name: 'question',
        label: 'Question',
        maxLength: 200,
        required: true,
      },
      {
        type: 'textarea',
        name: 'answer',
        label: 'Answer',
        maxLength: 1000,
        rows: 4,
        required: true,
      },
    ],
  },
];

/**
 * ============================================================================
 * CUSTOM SECTION
 * ============================================================================
 */

export const customSectionContentSchema = z.record(z.unknown());

export type CustomSectionContent = z.infer<typeof customSectionContentSchema>;

export const customSectionFields: FieldConfig[] = [
  {
    type: 'code',
    name: 'customContent',
    label: 'Custom JSON Content',
    language: 'json',
    description: 'Define your custom content structure in JSON format',
  },
];

/**
 * ============================================================================
 * Section Schema Registry
 * ============================================================================
 */

export const sectionSchemaRegistry = {
  hero: {
    schema: heroSectionContentSchema,
    fields: heroSectionFields,
    name: 'Hero Section',
    description: 'Large header section with headline, description, and call-to-action buttons',
    icon: 'RocketLaunchIcon',
    previewImage: '/cms/previews/hero.png',
  },
  features: {
    schema: featuresSectionContentSchema,
    fields: featuresSectionFields,
    name: 'Features Section',
    description: 'Showcase product or service features with icons and descriptions',
    icon: 'SparklesIcon',
    previewImage: '/cms/previews/features.png',
  },
  testimonials: {
    schema: testimonialsSectionContentSchema,
    fields: testimonialsSectionFields,
    name: 'Testimonials Section',
    description: 'Display customer testimonials and reviews',
    icon: 'ChatBubbleLeftRightIcon',
    previewImage: '/cms/previews/testimonials.png',
  },
  cta: {
    schema: ctaSectionContentSchema,
    fields: ctaSectionFields,
    name: 'Call to Action',
    description: 'Prominent call-to-action section to drive conversions',
    icon: 'MegaphoneIcon',
    previewImage: '/cms/previews/cta.png',
  },
  content: {
    schema: contentSectionContentSchema,
    fields: contentSectionFields,
    name: 'Content Section',
    description: 'Rich text content with optional image placement',
    icon: 'DocumentTextIcon',
    previewImage: '/cms/previews/content.png',
  },
  gallery: {
    schema: gallerySectionContentSchema,
    fields: gallerySectionFields,
    name: 'Gallery Section',
    description: 'Image gallery with multiple layout options',
    icon: 'PhotoIcon',
    previewImage: '/cms/previews/gallery.png',
  },
  faq: {
    schema: faqSectionContentSchema,
    fields: faqSectionFields,
    name: 'FAQ Section',
    description: 'Frequently asked questions in accordion or list format',
    icon: 'QuestionMarkCircleIcon',
    previewImage: '/cms/previews/faq.png',
  },
  custom: {
    schema: customSectionContentSchema,
    fields: customSectionFields,
    name: 'Custom Section',
    description: 'Define your own custom section structure',
    icon: 'CodeBracketIcon',
    previewImage: '/cms/previews/custom.png',
  },
} as const;

export type SectionType = keyof typeof sectionSchemaRegistry;

/**
 * Get schema for a section type
 */
export function getSectionSchema(sectionType: SectionType) {
  return sectionSchemaRegistry[sectionType]?.schema;
}

/**
 * Get fields configuration for a section type
 */
export function getSectionFields(sectionType: SectionType): FieldConfig[] {
  return sectionSchemaRegistry[sectionType]?.fields || [];
}

/**
 * Validate section content
 */
export function validateSectionContent(
  sectionType: SectionType,
  content: unknown
): { valid: boolean; error?: string; data?: unknown } {
  const schema = getSectionSchema(sectionType);
  if (!schema) {
    return { valid: false, error: 'Invalid section type' };
  }

  try {
    const validatedData = schema.parse(content);
    return { valid: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        error: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
    }
    return { valid: false, error: 'Validation failed' };
  }
}

/**
 * Get default content for a section type
 */
export function getDefaultSectionContent(sectionType: SectionType): Record<string, unknown> {
  const fields = getSectionFields(sectionType);
  const defaultContent: Record<string, unknown> = {};

  fields.forEach((field) => {
    if (field.defaultValue !== undefined) {
      defaultContent[field.name] = field.defaultValue;
    }
  });

  return defaultContent;
}

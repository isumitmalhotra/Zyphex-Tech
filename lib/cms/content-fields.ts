/**
 * CMS Content Field Definitions
 * Defines all available field types and their configurations
 */

import { z } from 'zod';

/**
 * ============================================================================
 * Base Field Types
 * ============================================================================
 */

export type FieldType =
  | 'text'
  | 'textarea'
  | 'richtext'
  | 'number'
  | 'boolean'
  | 'select'
  | 'multiselect'
  | 'image'
  | 'gallery'
  | 'video'
  | 'link'
  | 'button'
  | 'icon'
  | 'color'
  | 'date'
  | 'datetime'
  | 'repeater'
  | 'code'
  | 'custom';

/**
 * ============================================================================
 * Field Configuration Interfaces
 * ============================================================================
 */

export interface BaseFieldConfig {
  type: FieldType;
  label: string;
  name: string;
  description?: string;
  placeholder?: string;
  defaultValue?: unknown;
  required?: boolean;
  validation?: Record<string, unknown>;
}

export interface TextFieldConfig extends BaseFieldConfig {
  type: 'text';
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  defaultValue?: string;
}

export interface TextareaFieldConfig extends BaseFieldConfig {
  type: 'textarea';
  minLength?: number;
  maxLength?: number;
  rows?: number;
  defaultValue?: string;
}

export interface RichTextFieldConfig extends BaseFieldConfig {
  type: 'richtext';
  toolbar?: string[];
  allowedFormats?: string[];
  maxLength?: number;
  defaultValue?: string;
}

export interface NumberFieldConfig extends BaseFieldConfig {
  type: 'number';
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
}

export interface BooleanFieldConfig extends BaseFieldConfig {
  type: 'boolean';
  defaultValue?: boolean;
}

export interface SelectFieldConfig extends BaseFieldConfig {
  type: 'select';
  options: Array<{ label: string; value: string }>;
  defaultValue?: string;
}

export interface MultiSelectFieldConfig extends BaseFieldConfig {
  type: 'multiselect';
  options: Array<{ label: string; value: string }>;
  maxSelections?: number;
  defaultValue?: string[];
}

export interface ImageFieldConfig extends BaseFieldConfig {
  type: 'image';
  allowedFormats?: string[];
  maxSize?: number; // in MB
  requireAlt?: boolean;
  cropRatio?: string;
  defaultValue?: {
    url: string;
    alt?: string;
    width?: number;
    height?: number;
  };
}

export interface GalleryFieldConfig extends BaseFieldConfig {
  type: 'gallery';
  minImages?: number;
  maxImages?: number;
  allowedFormats?: string[];
  defaultValue?: Array<{
    url: string;
    alt?: string;
    caption?: string;
  }>;
}

export interface VideoFieldConfig extends BaseFieldConfig {
  type: 'video';
  allowUpload?: boolean;
  allowEmbed?: boolean;
  platforms?: Array<'youtube' | 'vimeo' | 'custom'>;
  defaultValue?: {
    type: 'upload' | 'embed';
    url: string;
    thumbnail?: string;
  };
}

export interface LinkFieldConfig extends BaseFieldConfig {
  type: 'link';
  allowInternal?: boolean;
  allowExternal?: boolean;
  allowAnchor?: boolean;
  defaultValue?: {
    url: string;
    text: string;
    target?: '_self' | '_blank';
    rel?: string;
  };
}

export interface ButtonFieldConfig extends BaseFieldConfig {
  type: 'button';
  allowStyleCustomization?: boolean;
  defaultValue?: {
    text: string;
    url: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    icon?: string;
  };
}

export interface IconFieldConfig extends BaseFieldConfig {
  type: 'icon';
  iconSet?: 'heroicons' | 'fontawesome' | 'custom';
  allowSize?: boolean;
  allowColor?: boolean;
  defaultValue?: {
    name: string;
    size?: number;
    color?: string;
  };
}

export interface ColorFieldConfig extends BaseFieldConfig {
  type: 'color';
  format?: 'hex' | 'rgb' | 'hsl';
  allowOpacity?: boolean;
  presets?: string[];
  defaultValue?: string;
}

export interface DateFieldConfig extends BaseFieldConfig {
  type: 'date';
  minDate?: string;
  maxDate?: string;
  defaultValue?: string;
}

export interface DateTimeFieldConfig extends BaseFieldConfig {
  type: 'datetime';
  minDate?: string;
  maxDate?: string;
  defaultValue?: string;
}

export interface RepeaterFieldConfig extends BaseFieldConfig {
  type: 'repeater';
  minItems?: number;
  maxItems?: number;
  fields: FieldConfig[];
  defaultValue?: Array<Record<string, unknown>>;
}

export interface CodeFieldConfig extends BaseFieldConfig {
  type: 'code';
  language?: string;
  theme?: 'light' | 'dark';
  lineNumbers?: boolean;
  defaultValue?: string;
}

export interface CustomFieldConfig extends BaseFieldConfig {
  type: 'custom';
  componentName: string;
  componentProps?: Record<string, unknown>;
  defaultValue?: unknown;
}

export type FieldConfig =
  | TextFieldConfig
  | TextareaFieldConfig
  | RichTextFieldConfig
  | NumberFieldConfig
  | BooleanFieldConfig
  | SelectFieldConfig
  | MultiSelectFieldConfig
  | ImageFieldConfig
  | GalleryFieldConfig
  | VideoFieldConfig
  | LinkFieldConfig
  | ButtonFieldConfig
  | IconFieldConfig
  | ColorFieldConfig
  | DateFieldConfig
  | DateTimeFieldConfig
  | RepeaterFieldConfig
  | CodeFieldConfig
  | CustomFieldConfig;

/**
 * ============================================================================
 * Zod Validation Schemas for Field Values
 * ============================================================================
 */

export const textFieldValueSchema = z.string();
export const textareaFieldValueSchema = z.string();
export const richTextFieldValueSchema = z.string();
export const numberFieldValueSchema = z.number();
export const booleanFieldValueSchema = z.boolean();
export const selectFieldValueSchema = z.string();
export const multiSelectFieldValueSchema = z.array(z.string());

export const imageFieldValueSchema = z.object({
  url: z.string().url(),
  alt: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  caption: z.string().optional(),
});

export const galleryFieldValueSchema = z.array(
  z.object({
    url: z.string().url(),
    alt: z.string().optional(),
    caption: z.string().optional(),
    order: z.number().optional(),
  })
);

export const videoFieldValueSchema = z.object({
  type: z.enum(['upload', 'embed']),
  url: z.string().url(),
  thumbnail: z.string().url().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
});

export const linkFieldValueSchema = z.object({
  url: z.string(),
  text: z.string(),
  target: z.enum(['_self', '_blank', '_parent', '_top']).optional(),
  rel: z.string().optional(),
  isInternal: z.boolean().optional(),
});

export const buttonFieldValueSchema = z.object({
  text: z.string(),
  url: z.string(),
  variant: z.enum(['primary', 'secondary', 'outline', 'ghost', 'link']).optional(),
  size: z.enum(['xs', 'sm', 'md', 'lg', 'xl']).optional(),
  icon: z.string().optional(),
  iconPosition: z.enum(['left', 'right']).optional(),
  fullWidth: z.boolean().optional(),
});

export const iconFieldValueSchema = z.object({
  name: z.string(),
  set: z.string().optional(),
  size: z.number().optional(),
  color: z.string().optional(),
});

export const colorFieldValueSchema = z.string();
export const dateFieldValueSchema = z.string().datetime();
export const dateTimeFieldValueSchema = z.string().datetime();
export const codeFieldValueSchema = z.string();

/**
 * ============================================================================
 * Field Validation Helpers
 * ============================================================================
 */

export function validateFieldValue(
  fieldConfig: FieldConfig,
  value: unknown
): { valid: boolean; error?: string } {
  try {
    switch (fieldConfig.type) {
      case 'text':
      case 'textarea':
        textFieldValueSchema.parse(value);
        break;
      case 'richtext':
        richTextFieldValueSchema.parse(value);
        break;
      case 'number':
        numberFieldValueSchema.parse(value);
        break;
      case 'boolean':
        booleanFieldValueSchema.parse(value);
        break;
      case 'select':
        selectFieldValueSchema.parse(value);
        break;
      case 'multiselect':
        multiSelectFieldValueSchema.parse(value);
        break;
      case 'image':
        imageFieldValueSchema.parse(value);
        break;
      case 'gallery':
        galleryFieldValueSchema.parse(value);
        break;
      case 'video':
        videoFieldValueSchema.parse(value);
        break;
      case 'link':
        linkFieldValueSchema.parse(value);
        break;
      case 'button':
        buttonFieldValueSchema.parse(value);
        break;
      case 'icon':
        iconFieldValueSchema.parse(value);
        break;
      case 'color':
        colorFieldValueSchema.parse(value);
        break;
      case 'date':
        dateFieldValueSchema.parse(value);
        break;
      case 'datetime':
        dateTimeFieldValueSchema.parse(value);
        break;
      case 'code':
        codeFieldValueSchema.parse(value);
        break;
      default:
        // Custom fields - no validation
        break;
    }
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0]?.message };
    }
    return { valid: false, error: 'Validation failed' };
  }
}

/**
 * ============================================================================
 * Common Field Presets
 * ============================================================================
 */

export const commonFieldPresets = {
  heading: (): TextFieldConfig => ({
    type: 'text',
    name: 'heading',
    label: 'Heading',
    placeholder: 'Enter heading',
    maxLength: 100,
    required: true,
  }),

  subheading: (): TextFieldConfig => ({
    type: 'text',
    name: 'subheading',
    label: 'Subheading',
    placeholder: 'Enter subheading',
    maxLength: 200,
  }),

  description: (): TextareaFieldConfig => ({
    type: 'textarea',
    name: 'description',
    label: 'Description',
    placeholder: 'Enter description',
    rows: 4,
    maxLength: 500,
  }),

  bodyContent: (): RichTextFieldConfig => ({
    type: 'richtext',
    name: 'content',
    label: 'Content',
    toolbar: ['bold', 'italic', 'link', 'bulletList', 'orderedList'],
  }),

  featuredImage: (): ImageFieldConfig => ({
    type: 'image',
    name: 'image',
    label: 'Featured Image',
    requireAlt: true,
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
    maxSize: 5,
  }),

  ctaButton: (): ButtonFieldConfig => ({
    type: 'button',
    name: 'button',
    label: 'CTA Button',
    allowStyleCustomization: true,
    defaultValue: {
      text: 'Get Started',
      url: '#',
      variant: 'primary',
      size: 'md',
    },
  }),

  backgroundImage: (): ImageFieldConfig => ({
    type: 'image',
    name: 'backgroundImage',
    label: 'Background Image',
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
    maxSize: 10,
  }),

  videoEmbed: (): VideoFieldConfig => ({
    type: 'video',
    name: 'video',
    label: 'Video',
    allowEmbed: true,
    platforms: ['youtube', 'vimeo'],
  }),
};

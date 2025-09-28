// Base interfaces for flexible content system

// Union type for all possible field values
export type FieldValue = string | number | boolean | string[] | Record<string, unknown> | Date | null

// Enhanced field type definitions
export type ContentFieldType = 
  | 'text'           // Single line text input
  | 'textarea'       // Multi-line text input
  | 'richtext'       // Rich text editor (HTML)
  | 'email'          // Email input with validation
  | 'url'            // URL input with validation
  | 'tel'            // Telephone input
  | 'number'         // Number input
  | 'integer'        // Integer input
  | 'float'          // Float/decimal input
  | 'boolean'        // Checkbox/toggle
  | 'select'         // Dropdown selection
  | 'multiselect'    // Multiple selection
  | 'radio'          // Radio button group
  | 'checkbox'       // Checkbox group
  | 'date'           // Date picker
  | 'datetime'       // Date and time picker
  | 'time'           // Time picker
  | 'image'          // Single image upload
  | 'images'         // Multiple image upload
  | 'file'           // Single file upload
  | 'files'          // Multiple file upload
  | 'color'          // Color picker
  | 'json'           // JSON editor
  | 'slug'           // URL-friendly slug generator
  | 'tags'           // Tag input field
  | 'relation'       // Relation to other content
  | 'group'          // Group of fields
  | 'repeater'       // Repeatable field group

// Validation rules for content fields
export interface ContentFieldValidation {
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: string
  customMessage?: string
  unique?: boolean
  options?: string[]
}

// Options for select, radio, and checkbox fields
export interface ContentFieldOption {
  label: string
  value: string | number | boolean
  disabled?: boolean
  color?: string
  icon?: string
}

// Configuration for different field types
export interface ContentFieldConfig {
  // Text fields
  placeholder?: string
  maxLength?: number
  rows?: number // For textarea
  
  // Number fields
  step?: number
  
  // Select/Choice fields
  options?: ContentFieldOption[]
  multiple?: boolean
  searchable?: boolean
  allowCustom?: boolean
  
  // File/Image fields
  maxSize?: number // in bytes
  allowedTypes?: string[] // MIME types
  maxFiles?: number
  dimensions?: {
    width?: number
    height?: number
    aspectRatio?: string
  }
  
  // Rich text
  toolbar?: string[]
  allowHtml?: boolean
  
  // Relation fields
  relationTo?: string // Content type name
  relationDisplay?: string // Field to display
  
  // Group/Repeater fields
  fields?: ContentField[] // For groups and repeaters
  minItems?: number
  maxItems?: number
  
  // Layout
  width?: 'full' | 'half' | 'third' | 'quarter'
  className?: string
  
  // Conditional display
  showIf?: {
    field: string
    value: FieldValue
    operator?: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
  }
}

export interface ContentField {
  id: string
  name: string
  label: string
  type: ContentFieldType
  description?: string
  placeholder?: string
  required?: boolean
  defaultValue?: FieldValue
  validation?: ContentFieldValidation
  config?: ContentFieldConfig
  group?: string
  order: number
  admin?: {
    hidden?: boolean
    readOnly?: boolean
    position?: 'sidebar' | 'main'
  }
}

// Enhanced content type settings
export interface ContentTypeSettings {
  // Display settings
  displayField?: string           // Field to use as title/name
  sortBy?: string                 // Default sort field
  sortOrder?: 'asc' | 'desc'      // Default sort order
  
  // Layout settings
  layout?: 'table' | 'cards' | 'list'
  columns?: string[]              // Columns to show in table view
  
  // Features
  hasSlug?: boolean
  hasStatus?: boolean
  hasPublishing?: boolean
  hasOrdering?: boolean
  hasFeatured?: boolean
  hasCategories?: boolean
  hasTags?: boolean
  hasAuthor?: boolean
  allowComments?: boolean
  hasMetadata?: boolean
  
  // Permissions
  permissions?: {
    create?: string[]             // Roles that can create
    read?: string[]               // Roles that can read
    update?: string[]             // Roles that can update
    delete?: string[]             // Roles that can delete
  }
  
  // SEO settings
  enableSEO?: boolean
  seoFields?: string[]            // Fields to use for SEO
  
  // Publishing
  enableDrafts?: boolean
  enableScheduling?: boolean
  enableVersioning?: boolean
  
  // API settings
  enableAPI?: boolean
  apiEndpoints?: string[]
  
  // Hooks
  hooks?: {
    beforeCreate?: string
    afterCreate?: string
    beforeUpdate?: string
    afterUpdate?: string
    beforeDelete?: string
    afterDelete?: string
  }
}

export interface ContentType {
  id: string
  name: string
  label: string
  description?: string
  icon?: string
  fields: ContentField[]
  settings?: ContentTypeSettings
  category?: string
  template?: string
  isSystem: boolean
  isActive: boolean
  allowMultiple?: boolean
  maxInstances?: number
  createdAt: Date
  updatedAt: Date
}

export interface ContentItem {
  id: string
  contentTypeId: string
  slug?: string
  title: string
  data: Record<string, FieldValue> // Dynamic field data
  status: 'draft' | 'published' | 'archived'
  featured?: boolean
  publishedAt?: Date
  order?: number
  categories?: string[]
  tags?: string[]
  author?: string
  metadata?: {
    seoTitle?: string
    seoDescription?: string
    seoKeywords?: string[]
    ogImage?: string
    canonicalUrl?: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface ContentSection {
  id: string
  contentTypeId: string
  sectionKey: string // Unique identifier for the section (e.g., 'hero', 'features', 'testimonials')
  title?: string
  subtitle?: string
  description?: string
  items: ContentItem[]
  isActive: boolean
  order: number
  layoutSettings: {
    layout: 'grid' | 'list' | 'carousel' | 'masonry' | 'custom'
    columns?: number
    spacing?: 'tight' | 'normal' | 'loose'
    showTitle?: boolean
    showDescription?: boolean
    showPagination?: boolean
    itemsPerPage?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }
  createdAt: Date
  updatedAt: Date
}

// Pre-defined content types for common use cases
export const DEFAULT_CONTENT_TYPES: Partial<ContentType>[] = [
  {
    name: 'hero',
    label: 'Hero Section',
    description: 'Main hero sections for pages',
    icon: '🎯',
    fields: [
      {
        id: 'title',
        name: 'title',
        label: 'Title',
        type: 'text',
        required: true,
        order: 1
      },
      {
        id: 'subtitle',
        name: 'subtitle',
        label: 'Subtitle',
        type: 'text',
        order: 2
      },
      {
        id: 'description',
        name: 'description',
        label: 'Description',
        type: 'textarea',
        order: 3
      },
      {
        id: 'backgroundImage',
        name: 'backgroundImage',
        label: 'Background Image',
        type: 'image',
        order: 4
      },
      {
        id: 'ctaText',
        name: 'ctaText',
        label: 'CTA Button Text',
        type: 'text',
        order: 5
      },
      {
        id: 'ctaUrl',
        name: 'ctaUrl',
        label: 'CTA Button URL',
        type: 'url',
        order: 6
      }
    ],
    settings: {
      hasSlug: false,
      hasStatus: true,
      hasOrdering: true,
      hasPublishing: true
    }
  },
  {
    name: 'feature',
    label: 'Feature',
    description: 'Individual features or benefits',
    icon: '⭐',
    fields: [
      {
        id: 'icon',
        name: 'icon',
        label: 'Icon',
        type: 'text',
        placeholder: 'Lucide icon name or emoji',
        order: 1
      },
      {
        id: 'title',
        name: 'title',
        label: 'Title',
        type: 'text',
        required: true,
        order: 2
      },
      {
        id: 'description',
        name: 'description',
        label: 'Description',
        type: 'textarea',
        required: true,
        order: 3
      },
      {
        id: 'image',
        name: 'image',
        label: 'Feature Image',
        type: 'image',
        order: 4
      },
      {
        id: 'link',
        name: 'link',
        label: 'Learn More Link',
        type: 'url',
        order: 5
      }
    ],
    settings: {
      hasSlug: false,
      hasStatus: true,
      hasOrdering: true,
      hasFeatured: true
    }
  },
  {
    name: 'testimonial',
    label: 'Testimonial',
    description: 'Customer testimonials and reviews',
    icon: '💬',
    fields: [
      {
        id: 'content',
        name: 'content',
        label: 'Testimonial Content',
        type: 'textarea',
        required: true,
        order: 1
      },
      {
        id: 'clientName',
        name: 'clientName',
        label: 'Client Name',
        type: 'text',
        required: true,
        order: 2
      },
      {
        id: 'clientPosition',
        name: 'clientPosition',
        label: 'Client Position',
        type: 'text',
        order: 3
      },
      {
        id: 'clientCompany',
        name: 'clientCompany',
        label: 'Client Company',
        type: 'text',
        order: 4
      },
      {
        id: 'clientImage',
        name: 'clientImage',
        label: 'Client Photo',
        type: 'image',
        order: 5
      },
      {
        id: 'rating',
        name: 'rating',
        label: 'Rating (1-5)',
        type: 'number',
        validation: { min: 1, max: 5 },
        order: 6
      }
    ],
    settings: {
      hasSlug: false,
      hasStatus: true,
      hasOrdering: true,
      hasFeatured: true
    }
  },
  {
    name: 'team_member',
    label: 'Team Member',
    description: 'Team member profiles',
    icon: '👥',
    fields: [
      {
        id: 'name',
        name: 'name',
        label: 'Full Name',
        type: 'text',
        required: true,
        order: 1
      },
      {
        id: 'position',
        name: 'position',
        label: 'Position/Title',
        type: 'text',
        required: true,
        order: 2
      },
      {
        id: 'bio',
        name: 'bio',
        label: 'Biography',
        type: 'textarea',
        order: 3
      },
      {
        id: 'photo',
        name: 'photo',
        label: 'Profile Photo',
        type: 'image',
        order: 4
      },
      {
        id: 'email',
        name: 'email',
        label: 'Email',
        type: 'text',
        order: 5
      },
      {
        id: 'linkedin',
        name: 'linkedin',
        label: 'LinkedIn URL',
        type: 'url',
        order: 6
      },
      {
        id: 'twitter',
        name: 'twitter',
        label: 'Twitter URL',
        type: 'url',
        order: 7
      },
      {
        id: 'github',
        name: 'github',
        label: 'GitHub URL',
        type: 'url',
        order: 8
      }
    ],
    settings: {
      hasSlug: true,
      hasStatus: true,
      hasOrdering: true,
      hasFeatured: true
    }
  },
  {
    name: 'faq',
    label: 'FAQ',
    description: 'Frequently asked questions',
    icon: '❓',
    fields: [
      {
        id: 'question',
        name: 'question',
        label: 'Question',
        type: 'text',
        required: true,
        order: 1
      },
      {
        id: 'answer',
        name: 'answer',
        label: 'Answer',
        type: 'richtext',
        required: true,
        order: 2
      },
      {
        id: 'category',
        name: 'category',
        label: 'Category',
        type: 'select',
        validation: {
          options: ['General', 'Technical', 'Billing', 'Support']
        },
        order: 3
      }
    ],
    settings: {
      hasSlug: false,
      hasStatus: true,
      hasOrdering: true,
      hasCategories: true
    }
  },
  {
    name: 'announcement',
    label: 'Announcement',
    description: 'Site-wide announcements and notices',
    icon: '📢',
    fields: [
      {
        id: 'title',
        name: 'title',
        label: 'Title',
        type: 'text',
        required: true,
        order: 1
      },
      {
        id: 'message',
        name: 'message',
        label: 'Message',
        type: 'richtext',
        required: true,
        order: 2
      },
      {
        id: 'type',
        name: 'type',
        label: 'Type',
        type: 'select',
        validation: {
          options: ['info', 'warning', 'success', 'error']
        },
        defaultValue: 'info',
        order: 3
      },
      {
        id: 'actionText',
        name: 'actionText',
        label: 'Action Button Text',
        type: 'text',
        order: 4
      },
      {
        id: 'actionUrl',
        name: 'actionUrl',
        label: 'Action Button URL',
        type: 'url',
        order: 5
      },
      {
        id: 'expiresAt',
        name: 'expiresAt',
        label: 'Expires At',
        type: 'date',
        order: 6
      }
    ],
    settings: {
      hasSlug: false,
      hasStatus: true,
      hasOrdering: true,
      hasPublishing: true
    }
  }
]

// Field validation functions
export const validateField = (field: ContentField, value: FieldValue): string | null => {
  if (field.required && (!value || value === '')) {
    return `${field.label} is required`
  }

  if (field.validation) {
    const { min, max, pattern, options } = field.validation

    if (field.type === 'number' && typeof value === 'number') {
      if (min !== undefined && value < min) {
        return `${field.label} must be at least ${min}`
      }
      if (max !== undefined && value > max) {
        return `${field.label} must be at most ${max}`
      }
    }

    if (field.type === 'text' && typeof value === 'string') {
      if (min !== undefined && value.length < min) {
        return `${field.label} must be at least ${min} characters`
      }
      if (max !== undefined && value.length > max) {
        return `${field.label} must be at most ${max} characters`
      }
      if (pattern && !new RegExp(pattern).test(value)) {
        return `${field.label} format is invalid`
      }
    }

    if ((field.type === 'select' || field.type === 'multiselect') && options) {
      if (field.type === 'select' && typeof value === 'string' && !options.includes(value)) {
        return `${field.label} must be one of: ${options.join(', ')}`
      }
      if (field.type === 'multiselect' && Array.isArray(value)) {
        const invalidValues = value.filter(v => typeof v === 'string' && !options.includes(v))
        if (invalidValues.length > 0) {
          return `${field.label} contains invalid values: ${invalidValues.join(', ')}`
        }
      }
    }
  }

  return null
}

// Helper function to generate slug from title
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Helper function to extract default field value
export const getDefaultFieldValue = (field: ContentField): FieldValue => {
  if (field.defaultValue !== undefined) {
    return field.defaultValue
  }

  switch (field.type) {
    case 'text':
    case 'textarea':
    case 'richtext':
    case 'image':
    case 'url':
      return ''
    case 'number':
      return 0
    case 'boolean':
      return false
    case 'select':
      return field.validation?.options?.[0] || ''
    case 'multiselect':
      return []
    case 'json':
      return {}
    case 'date':
      return null
    default:
      return null
  }
}
import { ContentField, ContentTypeSettings } from '@/types/content'

export interface ContentTypeTemplate {
  name: string
  label: string
  description: string
  icon: string
  fields: ContentField[]
  settings?: ContentTypeSettings
  category: 'layout' | 'content' | 'marketing' | 'media' | 'ecommerce' | 'forms'
  template?: string
  allowMultiple?: boolean
  maxInstances?: number
}

export const contentTypeTemplates: ContentTypeTemplate[] = [
  {
    name: 'hero_section',
    label: 'Hero Section',
    description: 'Main banner section with headline, subtitle, and call-to-action',
    icon: '🎯',
    category: 'layout',
    fields: [
      {
        id: 'headline',
        name: 'headline',
        label: 'Headline',
        type: 'text',
        validation: {
          required: true,
          maxLength: 120
        },
        config: {
          placeholder: 'Enter main headline',
          maxLength: 120
        },
        order: 0
      },
      {
        id: 'subtitle',
        name: 'subtitle',
        label: 'Subtitle',
        type: 'textarea',
        validation: {
          maxLength: 300
        },
        config: {
          placeholder: 'Enter supporting text',
          rows: 3,
          maxLength: 300
        },
        order: 1
      },
      {
        id: 'backgroundImage',
        name: 'backgroundImage',
        label: 'Background Image',
        type: 'image',
        validation: {
          required: false
        },
        config: {
          maxSize: 5242880, // 5MB
          allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
          dimensions: {
            aspectRatio: '16:9'
          }
        },
        order: 2
      },
      {
        id: 'ctaText',
        name: 'ctaText',
        label: 'Call-to-Action Text',
        type: 'text',
        validation: {
          maxLength: 50
        },
        config: {
          placeholder: 'Get Started',
          maxLength: 50
        },
        order: 3
      },
      {
        id: 'ctaUrl',
        name: 'ctaUrl',
        label: 'Call-to-Action URL',
        type: 'url',
        validation: {
          required: false
        },
        config: {
          placeholder: '/contact'
        },
        order: 4
      }
    ],
    settings: {
      hasSlug: false,
      hasStatus: true,
      hasPublishing: true,
      hasOrdering: true,
      hasFeatured: false,
      hasCategories: false,
      hasTags: false,
      hasAuthor: false,
      hasMetadata: true
    }
  },
  {
    name: 'feature_block',
    label: 'Feature Block',
    description: 'Feature showcase with icon, title, and description',
    icon: '⭐',
    category: 'content',
    fields: [
      {
        id: 'icon',
        name: 'icon',
        label: 'Icon',
        type: 'text',
        required: false,
        placeholder: '🚀 or icon name',
        order: 0
      },
      {
        id: 'title',
        name: 'title',
        label: 'Feature Title',
        type: 'text',
        required: true,
        placeholder: 'Feature name',
        order: 1
      },
      {
        id: 'description',
        name: 'description',
        label: 'Description',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the feature',
        order: 2
      },
      {
        id: 'image',
        name: 'image',
        label: 'Feature Image',
        type: 'image',
        required: false,
        order: 3
      },
      {
        id: 'learnMoreUrl',
        name: 'learnMoreUrl',
        label: 'Learn More URL',
        type: 'url',
        required: false,
        placeholder: '/features/detail',
        order: 4
      }
    ],
    settings: {
      hasSlug: true,
      hasStatus: true,
      hasPublishing: true,
      hasOrdering: true,
      hasFeatured: true,
      hasCategories: true,
      hasTags: true,
      hasAuthor: false,
      hasMetadata: true
    }
  },
  {
    name: 'testimonial',
    label: 'Testimonial',
    description: 'Customer testimonial with quote, author, and company',
    icon: '💬',
    category: 'marketing',
    fields: [
      {
        id: 'quote',
        name: 'quote',
        label: 'Testimonial Quote',
        type: 'textarea',
        required: true,
        placeholder: 'Enter the testimonial text',
        order: 0
      },
      {
        id: 'authorName',
        name: 'authorName',
        label: 'Author Name',
        type: 'text',
        required: true,
        placeholder: 'John Doe',
        order: 1
      },
      {
        id: 'authorTitle',
        name: 'authorTitle',
        label: 'Author Title',
        type: 'text',
        required: false,
        placeholder: 'CEO',
        order: 2
      },
      {
        id: 'company',
        name: 'company',
        label: 'Company',
        type: 'text',
        required: false,
        placeholder: 'Acme Corp',
        order: 3
      },
      {
        id: 'authorImage',
        name: 'authorImage',
        label: 'Author Photo',
        type: 'image',
        required: false,
        order: 4
      },
      {
        id: 'rating',
        name: 'rating',
        label: 'Rating (1-5)',
        type: 'number',
        required: false,
        validation: { min: 1, max: 5 },
        order: 5
      }
    ],
    settings: {
      hasSlug: false,
      hasStatus: true,
      hasPublishing: true,
      hasOrdering: true,
      hasFeatured: true,
      hasCategories: true,
      hasTags: false,
      hasAuthor: false,
      hasMetadata: false
    }
  },
  {
    name: 'team_member',
    label: 'Team Member',
    description: 'Team member profile with photo, bio, and social links',
    icon: '👥',
    category: 'content',
    fields: [
      {
        id: 'name',
        name: 'name',
        label: 'Full Name',
        type: 'text',
        required: true,
        placeholder: 'John Smith',
        order: 0
      },
      {
        id: 'position',
        name: 'position',
        label: 'Job Title',
        type: 'text',
        required: true,
        placeholder: 'Senior Developer',
        order: 1
      },
      {
        id: 'bio',
        name: 'bio',
        label: 'Biography',
        type: 'richtext',
        required: false,
        placeholder: 'Brief bio...',
        order: 2
      },
      {
        id: 'photo',
        name: 'photo',
        label: 'Profile Photo',
        type: 'image',
        required: false,
        order: 3
      },
      {
        id: 'email',
        name: 'email',
        label: 'Email',
        type: 'text',
        required: false,
        placeholder: 'john@company.com',
        order: 4
      },
      {
        id: 'socialLinks',
        name: 'socialLinks',
        label: 'Social Links',
        type: 'json',
        required: false,
        placeholder: '{"linkedin": "url", "twitter": "url"}',
        order: 5
      }
    ],
    settings: {
      hasSlug: true,
      hasStatus: true,
      hasPublishing: true,
      hasOrdering: true,
      hasFeatured: false,
      hasCategories: true,
      hasTags: true,
      hasAuthor: false,
      hasMetadata: true
    }
  },
  {
    name: 'faq_item',
    label: 'FAQ Item',
    description: 'Frequently asked question with answer',
    icon: '❓',
    category: 'content',
    fields: [
      {
        id: 'question',
        name: 'question',
        label: 'Question',
        type: 'text',
        required: true,
        placeholder: 'What is...?',
        order: 0
      },
      {
        id: 'answer',
        name: 'answer',
        label: 'Answer',
        type: 'richtext',
        required: true,
        placeholder: 'Detailed answer...',
        order: 1
      },
      {
        id: 'category',
        name: 'category',
        label: 'FAQ Category',
        type: 'select',
        required: false,
        validation: {
          options: ['General', 'Billing', 'Technical', 'Support']
        },
        order: 2
      }
    ],
    settings: {
      hasSlug: false,
      hasStatus: true,
      hasPublishing: true,
      hasOrdering: true,
      hasFeatured: false,
      hasCategories: true,
      hasTags: true,
      hasAuthor: false,
      hasMetadata: false
    }
  },
  {
    name: 'gallery_item',
    label: 'Gallery Item',
    description: 'Image gallery item with metadata',
    icon: '🖼️',
    category: 'media',
    fields: [
      {
        id: 'image',
        name: 'image',
        label: 'Image',
        type: 'image',
        required: true,
        order: 0
      },
      {
        id: 'title',
        name: 'title',
        label: 'Image Title',
        type: 'text',
        required: false,
        placeholder: 'Image title',
        order: 1
      },
      {
        id: 'caption',
        name: 'caption',
        label: 'Caption',
        type: 'textarea',
        required: false,
        placeholder: 'Image description',
        order: 2
      },
      {
        id: 'altText',
        name: 'altText',
        label: 'Alt Text',
        type: 'text',
        required: true,
        placeholder: 'Descriptive alt text',
        order: 3
      },
      {
        id: 'photographer',
        name: 'photographer',
        label: 'Photographer',
        type: 'text',
        required: false,
        placeholder: 'Photo credit',
        order: 4
      }
    ],
    settings: {
      hasSlug: false,
      hasStatus: true,
      hasPublishing: true,
      hasOrdering: true,
      hasFeatured: true,
      hasCategories: true,
      hasTags: true,
      hasAuthor: false,
      hasMetadata: true
    }
  },
  {
    name: 'pricing_plan',
    label: 'Pricing Plan',
    description: 'Pricing plan with features and call-to-action',
    icon: '💰',
    category: 'marketing',
    fields: [
      {
        id: 'name',
        name: 'name',
        label: 'Plan Name',
        type: 'text',
        required: true,
        placeholder: 'Basic Plan',
        order: 0
      },
      {
        id: 'price',
        name: 'price',
        label: 'Price',
        type: 'number',
        required: true,
        placeholder: '29.99',
        order: 1
      },
      {
        id: 'currency',
        name: 'currency',
        label: 'Currency',
        type: 'text',
        required: false,
        defaultValue: 'USD',
        placeholder: 'USD',
        order: 2
      },
      {
        id: 'billingPeriod',
        name: 'billingPeriod',
        label: 'Billing Period',
        type: 'select',
        required: true,
        validation: {
          options: ['monthly', 'yearly', 'one-time']
        },
        order: 3
      },
      {
        id: 'features',
        name: 'features',
        label: 'Features',
        type: 'json',
        required: true,
        placeholder: '["Feature 1", "Feature 2", "Feature 3"]',
        order: 4
      },
      {
        id: 'highlighted',
        name: 'highlighted',
        label: 'Popular Plan',
        type: 'boolean',
        required: false,
        defaultValue: false,
        order: 5
      },
      {
        id: 'ctaText',
        name: 'ctaText',
        label: 'Button Text',
        type: 'text',
        required: false,
        defaultValue: 'Get Started',
        order: 6
      },
      {
        id: 'ctaUrl',
        name: 'ctaUrl',
        label: 'Button URL',
        type: 'url',
        required: false,
        placeholder: '/signup',
        order: 7
      }
    ],
    settings: {
      hasSlug: true,
      hasStatus: true,
      hasPublishing: true,
      hasOrdering: true,
      hasFeatured: true,
      hasCategories: false,
      hasTags: false,
      hasAuthor: false,
      hasMetadata: true
    }
  },
  
  // Advanced Content Type showcasing new field types
  {
    name: 'advanced_form',
    label: 'Advanced Form Content',
    description: 'Comprehensive form showcasing all available field types',
    icon: '🔧',
    category: 'forms',
    fields: [
      {
        id: 'title',
        name: 'title',
        label: 'Form Title',
        type: 'text',
        validation: {
          required: true,
          maxLength: 100
        },
        config: {
          placeholder: 'Enter form title'
        },
        order: 0
      },
      {
        id: 'description',
        name: 'description',
        label: 'Description',
        type: 'richtext',
        validation: {
          maxLength: 500
        },
        config: {
          toolbar: ['bold', 'italic', 'link', 'bulletList']
        },
        order: 1
      },
      {
        id: 'email',
        name: 'email',
        label: 'Contact Email',
        type: 'email',
        validation: {
          required: true
        },
        config: {
          placeholder: 'contact@example.com'
        },
        order: 2
      },
      {
        id: 'phone',
        name: 'phone',
        label: 'Phone Number',
        type: 'tel',
        config: {
          placeholder: '+1 (555) 123-4567'
        },
        order: 3
      },
      {
        id: 'price',
        name: 'price',
        label: 'Price',
        type: 'float',
        validation: {
          min: 0
        },
        config: {
          step: 0.01,
          placeholder: '0.00'
        },
        order: 4
      },
      {
        id: 'priority',
        name: 'priority',
        label: 'Priority Level',
        type: 'select',
        validation: {
          required: true
        },
        config: {
          options: [
            { label: 'Low', value: 'low' },
            { label: 'Medium', value: 'medium' },
            { label: 'High', value: 'high' },
            { label: 'Urgent', value: 'urgent', color: '#ef4444' }
          ]
        },
        order: 5
      },
      {
        id: 'categories',
        name: 'categories',
        label: 'Categories',
        type: 'multiselect',
        config: {
          options: [
            { label: 'Technology', value: 'tech' },
            { label: 'Design', value: 'design' },
            { label: 'Marketing', value: 'marketing' },
            { label: 'Business', value: 'business' }
          ],
          searchable: true
        },
        order: 6
      },
      {
        id: 'isActive',
        name: 'isActive',
        label: 'Active Status',
        type: 'boolean',
        defaultValue: true,
        order: 7
      },
      {
        id: 'publishDate',
        name: 'publishDate',
        label: 'Publish Date',
        type: 'datetime',
        validation: {
          required: true
        },
        order: 8
      },
      {
        id: 'featuredImage',
        name: 'featuredImage',
        label: 'Featured Image',
        type: 'image',
        config: {
          maxSize: 2097152, // 2MB
          allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
          dimensions: {
            width: 1200,
            height: 630
          }
        },
        order: 9
      },
      {
        id: 'gallery',
        name: 'gallery',
        label: 'Image Gallery',
        type: 'images',
        config: {
          maxFiles: 10,
          maxSize: 1048576, // 1MB per image
          allowedTypes: ['image/jpeg', 'image/png']
        },
        order: 10
      },
      {
        id: 'brandColor',
        name: 'brandColor',
        label: 'Brand Color',
        type: 'color',
        defaultValue: '#3b82f6',
        order: 11
      },
      {
        id: 'tags',
        name: 'tags',
        label: 'Tags',
        type: 'tags',
        config: {
          placeholder: 'Add tags...'
        },
        order: 12
      },
      {
        id: 'slug',
        name: 'slug',
        label: 'URL Slug',
        type: 'slug',
        validation: {
          required: true,
          unique: true
        },
        config: {
          showIf: {
            field: 'isActive',
            value: true,
            operator: 'equals'
          }
        },
        order: 13
      },
      {
        id: 'metadata',
        name: 'metadata',
        label: 'Custom Metadata',
        type: 'json',
        description: 'Additional metadata in JSON format',
        order: 14
      }
    ],
    settings: {
      displayField: 'title',
      sortBy: 'publishDate',
      sortOrder: 'desc',
      layout: 'table',
      columns: ['title', 'priority', 'isActive', 'publishDate'],
      hasSlug: true,
      hasStatus: true,
      hasPublishing: true,
      hasOrdering: true,
      hasFeatured: true,
      hasCategories: true,
      hasTags: true,  
      hasAuthor: true,
      hasMetadata: true,
      enableSEO: true,
      enableDrafts: true,
      enableAPI: true
    },
    allowMultiple: true
  }
]

export const getTemplatesByCategory = (category: string) => {
  return contentTypeTemplates.filter(template => template.category === category)
}

export const getTemplateByName = (name: string) => {
  return contentTypeTemplates.find(template => template.name === name)
}

export const getAllCategories = () => {
  const categories = contentTypeTemplates.map(template => template.category)
  return [...new Set(categories)].sort()
}
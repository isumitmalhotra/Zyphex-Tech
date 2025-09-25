// Production-ready CMS Types and Interfaces

export type ContentStatus = 'draft' | 'published' | 'archived' | 'scheduled'
export type UserRole = 'admin' | 'editor' | 'author' | 'viewer'

// Field types for dynamic content creation
export type FieldType = 
  | 'text' 
  | 'textarea' 
  | 'richtext' 
  | 'image' 
  | 'gallery'
  | 'url' 
  | 'email'
  | 'number' 
  | 'boolean' 
  | 'select' 
  | 'multiselect'
  | 'date'
  | 'datetime'
  | 'color'
  | 'json'
  | 'code'

export interface ContentField {
  id: string
  name: string
  label: string
  type: FieldType
  required?: boolean
  placeholder?: string
  defaultValue?: unknown
  validation?: {
    min?: number
    max?: number
    pattern?: string
    options?: Array<{ label: string; value: string }>
    accept?: string // for file uploads
  }
  description?: string
  helpText?: string
  order: number
  group?: string // for organizing fields in tabs/sections
  conditional?: {
    field: string
    value: unknown
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
  }
}

export interface ContentTypeSettings {
  hasSlug?: boolean
  hasStatus?: boolean
  hasPublishing?: boolean
  hasScheduling?: boolean
  hasOrdering?: boolean
  hasFeatured?: boolean
  hasCategories?: boolean
  hasTags?: boolean
  hasAuthor?: boolean
  hasComments?: boolean
  hasVersioning?: boolean
  hasMetadata?: boolean
  hasPermissions?: boolean
  singleInstance?: boolean // for pages like "About Us"
  maxInstances?: number
  defaultStatus?: ContentStatus
  publishWorkflow?: boolean
  requireApproval?: boolean
}

export interface ContentType {
  id: string
  name: string
  slug: string
  label: string
  description?: string
  icon?: string
  color?: string
  fields: ContentField[]
  settings: ContentTypeSettings
  isSystem: boolean
  isActive: boolean
  category: 'page' | 'collection' | 'component' | 'template'
  permissions?: {
    create?: UserRole[]
    read?: UserRole[]
    update?: UserRole[]
    delete?: UserRole[]
  }
  createdAt: Date
  updatedAt: Date
  createdBy?: string
  updatedBy?: string
}

export interface ContentItem {
  id: string
  contentTypeId: string
  slug?: string
  title: string
  data: Record<string, unknown> // Dynamic field data
  status: ContentStatus
  featured?: boolean
  publishedAt?: Date
  scheduledAt?: Date
  expiresAt?: Date
  order?: number
  categories?: string[]
  tags?: string[]
  author?: string
  authorId?: string
  metadata?: {
    seoTitle?: string
    seoDescription?: string
    socialTitle?: string
    socialDescription?: string
    socialImage?: string
    customFields?: Record<string, unknown>
  }
  permissions?: {
    read?: UserRole[]
    update?: UserRole[]
    delete?: UserRole[]
  }
  version?: number
  parentId?: string // for revisions
  locale?: string
  translations?: string[] // IDs of translated versions
  createdAt: Date
  updatedAt: Date
  createdBy?: string
  updatedBy?: string
  approvedBy?: string
  approvedAt?: Date
}

export interface ContentSection {
  id: string
  contentTypeId: string
  sectionKey: string // unique identifier like 'homepage-hero'
  pageKey: string // page identifier like 'homepage'
  title?: string
  subtitle?: string
  description?: string
  data?: Record<string, unknown>
  layoutSettings?: {
    template?: string
    variant?: string
    background?: string
    spacing?: string
    alignment?: string
    columns?: number
    maxWidth?: string
    customCss?: string
  }
  isActive: boolean
  order: number
  permissions?: {
    read?: UserRole[]
    update?: UserRole[]
  }
  createdAt: Date
  updatedAt: Date
  createdBy?: string
  updatedBy?: string
}

export interface MediaAsset {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  thumbnailUrl?: string
  alt?: string
  caption?: string
  category?: string
  tags?: string[]
  metadata?: {
    width?: number
    height?: number
    duration?: number
    exif?: Record<string, unknown>
  }
  uploadedBy?: string
  createdAt: Date
  updatedAt: Date
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface APIResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}

// Audit and Activity Log
export interface ActivityLog {
  id: string
  action: 'create' | 'update' | 'delete' | 'publish' | 'unpublish' | 'approve' | 'reject'
  entityType: 'content' | 'contentType' | 'media' | 'user' | 'settings'
  entityId: string
  entityTitle?: string
  userId?: string
  userName?: string
  changes?: Array<{
    field: string
    oldValue?: unknown
    newValue?: unknown
  }>
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  createdAt: Date
}

// Content Validation
export interface ValidationRule {
  field: string
  rule: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom'
  value?: unknown
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: Array<{
    field: string
    message: string
    rule: string
  }>
}

// Search and Filter interfaces
export interface SearchFilters {
  query?: string
  contentType?: string
  status?: ContentStatus[]
  author?: string
  category?: string[]
  tags?: string[]
  featured?: boolean
  dateFrom?: Date
  dateTo?: Date
  sortBy?: 'createdAt' | 'updatedAt' | 'publishedAt' | 'title' | 'order'
  sortOrder?: 'asc' | 'desc'
}

// Bulk Operations
export interface BulkOperation {
  action: 'delete' | 'publish' | 'unpublish' | 'updateStatus' | 'updateCategory' | 'updateTags'
  itemIds: string[]
  data?: Record<string, unknown>
}

export interface BulkOperationResult {
  success: number
  failed: number
  errors: Array<{
    itemId: string
    error: string
  }>
}

// Import/Export
export interface ExportOptions {
  contentTypes?: string[]
  includeMedia?: boolean
  includeMetadata?: boolean
  format: 'json' | 'csv' | 'xml'
  dateRange?: {
    from: Date
    to: Date
  }
}

export interface ImportResult {
  imported: number
  skipped: number
  errors: Array<{
    row?: number
    item?: string
    message: string
  }>
}

// Component Props for CMS UI
export interface CMSTabProps {
  contentType: ContentType
  onRefresh: () => void
  permissions: UserRole[]
}

export interface ContentFormProps {
  contentType: ContentType
  initialData?: Partial<ContentItem>
  mode: 'create' | 'edit'
  onSave: (data: Partial<ContentItem>) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export interface ContentListProps {
  contentType: ContentType
  items: ContentItem[]
  total: number
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
  onEdit: (item: ContentItem) => void
  onDelete: (id: string) => void
  onBulkAction: (action: BulkOperation) => void
  isLoading?: boolean
}

// Configuration
export interface CMSConfig {
  apiBaseUrl: string
  uploadUrl: string
  mediaUrl: string
  maxFileSize: number
  allowedFileTypes: string[]
  enableVersioning: boolean
  enableWorkflow: boolean
  defaultLocale: string
  supportedLocales: string[]
  theme: {
    primaryColor: string
    secondaryColor: string
    fonts: {
      heading: string
      body: string
    }
  }
}

// Performance and Caching
export interface CacheConfig {
  contentTTL: number // seconds
  mediaTTL: number
  enableBrowserCache: boolean
  enableCDN: boolean
  cdnUrl?: string
}

// Analytics and Metrics
export interface ContentMetrics {
  totalItems: number
  publishedItems: number
  draftItems: number
  viewCount?: number
  lastUpdated: Date
  popularTags: Array<{
    tag: string
    count: number
  }>
  authorActivity: Array<{
    authorId: string
    authorName: string
    itemCount: number
  }>
}
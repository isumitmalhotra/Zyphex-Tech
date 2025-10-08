# Content Service Usage Guide

The content service provides functions to fetch dynamic content from the CMS for use in your Next.js pages and components.

## Installation

The content service is automatically available as `lib/content.ts` and includes all necessary functions for fetching CMS content.

## Basic Usage

### Fetching Page Content

```typescript
import { getPageContent } from '@/lib/content'

// In a page component
export default async function HomePage() {
  const pageContent = await getPageContent('home')
  
  return (
    <div>
      <h1>Welcome to {pageContent.pageSlug}</h1>
      
      {/* Render sections */}
      {pageContent.sections.map((section) => (
        <section key={section.id} className="mb-8">
          {section.title && <h2>{section.title}</h2>}
          {section.subtitle && <p className="text-lg">{section.subtitle}</p>}
          {section.description && <p>{section.description}</p>}
          {section.imageUrl && (
            <img src={section.imageUrl} alt={section.title || 'Section image'} />
          )}
        </section>
      ))}
      
      {/* Render items */}
      {pageContent.items.map((item) => (
        <article key={item.id} className="mb-6">
          <h3>{item.title}</h3>
          <div className="content">
            {/* Render dynamic data */}
            {Object.entries(item.data).map(([key, value]) => (
              <div key={key}>
                <strong>{key}:</strong> {String(value)}
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  )
}
```

### Fetching Specific Sections

```typescript
import { getPageSections, getSection } from '@/lib/content'

// Get all sections for a page
const homeSections = await getPageSections('home')

// Get a specific section
const heroSection = await getSection('home-hero')

if (heroSection) {
  console.log(heroSection.title)           // Section title
  console.log(heroSection.layoutSettings) // Layout configuration
  console.log(heroSection.imageUrl)       // Section image URL
}
```

### Fetching Content Items by Type

```typescript
import { getItemsByContentType, getItemBySlug } from '@/lib/content'

// Get all blog posts
const blogPosts = await getItemsByContentType('blog', {
  includeDrafts: false,
  limit: 10
})

// Get featured portfolio items
const featuredWork = await getItemsByContentType('portfolio', {
  featured: true,
  limit: 6
})

// Get a specific blog post
const blogPost = await getItemBySlug('blog', 'my-first-post')
```

## API Reference

### getPageContent(pageSlug, includeInactive?, includeDrafts?)

Fetches all content (sections and items) for a specific page.

**Parameters:**
- `pageSlug` (string): Page identifier (e.g., 'home', 'about', 'services')
- `includeInactive` (boolean, optional): Include inactive sections (default: false)
- `includeDrafts` (boolean, optional): Include draft items (default: false)

**Returns:** `Promise<PageContent>`

### getPageSections(pageSlug, includeInactive?)

Fetches only sections for a specific page.

**Parameters:**
- `pageSlug` (string): Page identifier
- `includeInactive` (boolean, optional): Include inactive sections (default: false)

**Returns:** `Promise<ContentSection[]>`

### getSection(sectionKey, includeInactive?)

Fetches a specific section by its sectionKey.

**Parameters:**
- `sectionKey` (string): Unique section identifier (e.g., 'home-hero')
- `includeInactive` (boolean, optional): Return inactive sections (default: false)

**Returns:** `Promise<ContentSection | null>`

### getItemsByContentType(contentTypeName, options?)

Fetches content items by content type with filtering options.

**Parameters:**
- `contentTypeName` (string): Content type name (e.g., 'blog', 'portfolio')
- `options` (object, optional):
  - `includeDrafts` (boolean): Include draft items
  - `featured` (boolean): Filter by featured status
  - `limit` (number): Maximum number of items
  - `offset` (number): Skip items for pagination
  - `categories` (string[]): Filter by categories
  - `tags` (string[]): Filter by tags

**Returns:** `Promise<ContentItem[]>`

### getItemBySlug(contentTypeName, slug, includeDrafts?)

Fetches a single content item by slug and content type.

**Parameters:**
- `contentTypeName` (string): Content type name
- `slug` (string): Item slug
- `includeDrafts` (boolean, optional): Include draft items (default: false)

**Returns:** `Promise<ContentItem | null>`

## Data Structure

### PageContent
```typescript
interface PageContent {
  pageSlug: string
  sections: ContentSection[]
  items: ContentItem[]
  metadata: {
    totalSections: number
    activeSections: number
    totalItems: number
    publishedItems: number
    lastUpdated: Date
  }
}
```

### ContentSection
```typescript
interface ContentSection {
  id: string
  sectionKey: string
  title?: string
  subtitle?: string
  description?: string
  imageUrl?: string
  layoutSettings: Record<string, unknown>
  isActive: boolean
  order: number
  createdAt: Date
  updatedAt: Date
  contentType: ContentType
}
```

### ContentItem
```typescript
interface ContentItem {
  id: string
  slug?: string
  title: string
  data: Record<string, unknown>
  status: 'draft' | 'published' | 'archived' | 'scheduled'
  featured: boolean
  publishedAt?: Date
  order: number
  categories: string[]
  tags: string[]
  author?: string
  metadata: {
    seoTitle?: string
    seoDescription?: string
    socialTitle?: string
    socialDescription?: string
    socialImage?: string
    customFields?: Record<string, unknown>
  }
  createdAt: Date
  updatedAt: Date
  contentType: ContentType
}
```

## Caching

All functions use React's `cache()` function for automatic request deduplication and caching. This means:

- Multiple calls to the same function with the same parameters will only make one database query
- Cache is automatically invalidated between requests
- Perfect for server-side rendering where the same content might be needed in multiple components

## Error Handling

All functions include proper error handling and will throw descriptive errors if something goes wrong:

```typescript
try {
  const content = await getPageContent('home')
  // Use content
} catch (error) {
  console.error('Failed to load page content:', error.message)
  // Handle error (show fallback content, etc.)
}
```

## Usage in Different Page Types

### Static Pages (SSG)
```typescript
// In a page component
export async function generateStaticParams() {
  return [
    { slug: 'home' },
    { slug: 'about' },
    { slug: 'services' }
  ]
}

export default async function Page({ params }: { params: { slug: string } }) {
  const content = await getPageContent(params.slug)
  return <PageRenderer content={content} />
}
```

### Dynamic Pages (SSR)
```typescript
// In app/[slug]/page.tsx
export default async function DynamicPage({ params }: { params: { slug: string } }) {
  const content = await getPageContent(params.slug)
  
  if (content.sections.length === 0 && content.items.length === 0) {
    notFound()
  }
  
  return <PageRenderer content={content} />
}
```

### API Routes
```typescript
// In app/api/content/[slug]/route.ts
import { getPageContent } from '@/lib/content'

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const content = await getPageContent(params.slug)
    return Response.json(content)
  } catch (error) {
    return Response.json({ error: 'Content not found' }, { status: 404 })
  }
}
```
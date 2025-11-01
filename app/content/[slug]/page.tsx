import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering - don't try to statically generate at build time
export const dynamic = 'force-dynamic'

interface ContentPageProps {
  params: {
    slug: string
  }
}

// Generate metadata for the content
export async function generateMetadata({ params }: ContentPageProps): Promise<Metadata> {
  const content = await prisma.dynamicContentItem.findFirst({
    where: {
      slug: params.slug,
      status: 'published'
    },
    include: {
      contentType: true
    }
  })

  if (!content) {
    return {
      title: 'Content Not Found'
    }
  }

  let parsedData: Record<string, unknown> = {}
  try {
    parsedData = content.data ? JSON.parse(content.data) : {}
  } catch {
    parsedData = {}
  }

  const metaTitle = parsedData.metaTitle as string || content.title
  const metaDescription = parsedData.metaDescription as string || parsedData.excerpt as string || ''

  return {
    title: metaTitle,
    description: metaDescription
  }
}

// Main content display component
export default async function ContentPage({ params }: ContentPageProps) {
  console.log('Looking for content with slug:', params.slug)
  
  // First, try to find the content regardless of status to debug
  const anyContent = await prisma.dynamicContentItem.findFirst({
    where: {
      slug: params.slug
    },
    include: {
      contentType: true
    }
  })
  
  console.log('Found content:', anyContent ? {
    title: anyContent.title,
    slug: anyContent.slug,
    status: anyContent.status
  } : 'NOT FOUND')
  
  const content = await prisma.dynamicContentItem.findFirst({
    where: {
      slug: params.slug,
      status: 'published'
    },
    include: {
      contentType: true
    }
  })

  if (!content) {
    console.log('Content not found or not published')
    notFound()
  }

  console.log('Rendering content:', content.title)

  // Parse JSON fields
  let parsedData: Record<string, unknown> = {}
  let parsedTags: string[] = []
  
  try {
    parsedData = content.data ? JSON.parse(content.data) : {}
  } catch {
    parsedData = {}
  }

  try {
    parsedTags = content.tags ? JSON.parse(content.tags) : []
  } catch {
    parsedTags = []
  }

  const contentText = parsedData.content as string || ''
  const excerpt = parsedData.excerpt as string || ''

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          {/* Content Type Badge */}
          <div className="mb-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              {content.contentType.icon && <span>{content.contentType.icon}</span>}
              {content.contentType.label || content.contentType.name}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold mb-3">{content.title}</h1>
          
          {/* Excerpt */}
          {excerpt && (
            <p className="text-muted-foreground text-lg mb-4">
              {excerpt}
            </p>
          )}

          {/* Meta Info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {content.author && (
              <span>By {content.author}</span>
            )}
            {content.publishedAt && (
              <span>Published {new Date(content.publishedAt).toLocaleDateString()}</span>
            )}
            {content.featured && (
              <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 rounded">
                Featured
              </span>
            )}
          </div>

          {/* Tags */}
          {parsedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {parsedTags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {contentText ? (
            <div 
              className="prose prose-lg dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: contentText }}
            />
          ) : (
            <div className="bg-card rounded-lg border p-8">
              <h2 className="text-2xl font-semibold mb-4">
                {content.title}
              </h2>
              
              {excerpt && (
                <p className="text-muted-foreground mb-6">
                  {excerpt}
                </p>
              )}

              <div className="bg-muted p-4 rounded-md">
                <h3 className="font-semibold mb-2">Content Information:</h3>
                <ul className="space-y-1 text-sm">
                  <li><strong>Title:</strong> {content.title}</li>
                  <li><strong>Slug:</strong> {content.slug}</li>
                  <li><strong>Type:</strong> {content.contentType.name}</li>
                  <li><strong>Status:</strong> {content.status}</li>
                  {content.featured && <li><strong>Featured:</strong> Yes</li>}
                </ul>
              </div>

              <div className="border-t pt-4 mt-6">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> This is a dynamically generated content page. 
                  Add rich content by editing this item in the Super Admin Content Management section.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-6">
          <p className="text-sm text-muted-foreground text-center">
            Last updated: {new Date(content.updatedAt).toLocaleDateString()}
          </p>
        </div>
      </footer>
    </div>
  )
}

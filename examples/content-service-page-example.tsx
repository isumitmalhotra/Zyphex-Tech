import { getPageContent, getItemsByContentType } from '@/lib/content'
import type { ContentSection, ContentItem } from '@/lib/content'
import { notFound } from 'next/navigation'
import Image from 'next/image'

// Example usage of content service in a Next.js page
export default async function HomePage() {
  try {
    // Fetch all content for the home page
    const pageContent = await getPageContent('home')
    
    // Also fetch some featured blog posts
    const featuredPosts = await getItemsByContentType('blog', {
      featured: true,
      limit: 3
    })

    return (
      <div className="min-h-screen">
        {/* Render dynamic sections */}
        {pageContent.sections.length > 0 && (
          <div className="sections">
            {pageContent.sections.map((section) => (
              <DynamicSection key={section.id} section={section} />
            ))}
          </div>
        )}

        {/* Render content items */}
        {pageContent.items.length > 0 && (
          <div className="content-items">
            <h2>Latest Content</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pageContent.items.map((item) => (
                <ContentItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Render featured blog posts */}
        {featuredPosts.length > 0 && (
          <div className="featured-posts">
            <h2>Featured Posts</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredPosts.map((post) => (
                <BlogPostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        )}

        {/* Show metadata */}
        <div className="page-metadata text-sm text-gray-500">
          Last updated: {pageContent.metadata.lastUpdated.toLocaleDateString()}
          <br />
          {pageContent.metadata.activeSections} active sections, {pageContent.metadata.publishedItems} published items
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading page content:', error)
    notFound()
  }
}

// Component to render a dynamic section
function DynamicSection({ section }: { section: ContentSection }) {
  return (
    <section className={`section-${section.contentType.name} mb-8`}>
      {section.imageUrl && (
        <div className="section-image">
          <Image 
            src={section.imageUrl} 
            alt={section.title || 'Section image'} 
            width={800}
            height={400}
            className="w-full h-auto"
          />
        </div>
      )}
      
      {section.title && (
        <h2 className="text-3xl font-bold mb-4">{section.title}</h2>
      )}
      
      {section.subtitle && (
        <p className="text-xl text-gray-600 mb-4">{section.subtitle}</p>
      )}
      
      {section.description && (
        <div className="prose max-w-none">
          <p>{section.description}</p>
        </div>
      )}

      {/* Basic content type information */}
      <div className="text-sm text-gray-500 mt-4">
        Content Type: {section.contentType.label}
      </div>
    </section>
  )
}

// Component to render a content item card
function ContentItemCard({ item }: { item: ContentItem }) {
  // Helper function to safely get data values
  const getDataValue = (key: string): string => {
    if (item.data && typeof item.data === 'object' && key in item.data) {
      const value = (item.data as Record<string, unknown>)[key]
      return typeof value === 'string' ? value : ''
    }
    return ''
  }

  return (
    <article className="content-item-card bg-white rounded-lg shadow-md overflow-hidden">
      {getDataValue('imageUrl') && (
        <Image 
          src={getDataValue('imageUrl')} 
          alt={item.title}
          width={400}
          height={200}
          className="w-full h-48 object-cover"
        />
      )}
      
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
        
        {getDataValue('excerpt') && (
          <p className="text-gray-600 mb-4">{getDataValue('excerpt')}</p>
        )}
        
        <div className="flex flex-wrap gap-2 mb-4">
          {item.categories.map((category: string) => (
            <span key={category} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
              {category}
            </span>
          ))}
        </div>
        
        <div className="text-sm text-gray-500">
          {item.publishedAt && (
            <time>{new Date(item.publishedAt).toLocaleDateString()}</time>
          )}
          {item.author && <span className="ml-2">by {item.author}</span>}
        </div>
      </div>
    </article>
  )
}

// Component to render a blog post card
function BlogPostCard({ post }: { post: ContentItem }) {
  const getDataValue = (key: string): string => {
    if (post.data && typeof post.data === 'object' && key in post.data) {
      const value = (post.data as Record<string, unknown>)[key]
      return typeof value === 'string' ? value : ''
    }
    return ''
  }

  return (
    <article className="blog-post-card">
      <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
      {getDataValue('excerpt') && (
        <p className="text-gray-600">{getDataValue('excerpt')}</p>
      )}
      <a href={`/blog/${post.slug}`} className="text-blue-600 hover:underline">
        Read more →
      </a>
    </article>
  )
}
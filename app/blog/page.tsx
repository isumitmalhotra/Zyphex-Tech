import { Metadata } from 'next'
import Link from 'next/link'
import { BlogGrid } from '@/components/blog/blog-grid'
import { BlogSearch } from '@/components/blog/blog-search'
import { BlogCategories } from '@/components/blog/blog-categories'

export const metadata: Metadata = {
  title: 'Blog | ZyphexTech',
  description: 'Latest insights, tutorials, and updates from ZyphexTech on technology, development, and digital innovation.',
  keywords: ['blog', 'technology', 'development', 'tutorials', 'insights', 'ZyphexTech'],
  openGraph: {
    title: 'Blog | ZyphexTech',
    description: 'Latest insights, tutorials, and updates from ZyphexTech on technology, development, and digital innovation.',
    type: 'website',
  },
}

interface BlogPageProps {
  searchParams: {
    category?: string
    q?: string
    search?: string
    tag?: string
    page?: string
  }
}

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  author: string
  imageUrl?: string
  tags?: string[]
  publishedAt: string
  createdAt: string
  updatedAt: string
}

interface BlogApiResponse {
  success: boolean
  data: BlogPost[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    hasNext: boolean
    hasPrev: boolean
  }
  filters: {
    tags: string[]
    categories: Array<{
      name: string
      count: number
    }>
  }
}

async function fetchBlogData(searchParams: BlogPageProps['searchParams']): Promise<BlogApiResponse> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const params = new URLSearchParams()
    
    if (searchParams.category) params.set('category', searchParams.category)
    if (searchParams.q || searchParams.search) params.set('q', searchParams.q || searchParams.search || '')
    if (searchParams.tag) params.set('tag', searchParams.tag)
    if (searchParams.page) params.set('page', searchParams.page)

    const url = `${baseUrl}/api/blog${params.toString() ? '?' + params.toString() : ''}`
    
    const response = await fetch(url, {
      next: { revalidate: 300 }, // Revalidate every 5 minutes
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching blog data:', error)
    
    // Return fallback data
    return {
      success: false,
      data: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: 12,
        hasNext: false,
        hasPrev: false
      },
      filters: {
        tags: [],
        categories: []
      }
    }
  }
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { data: posts, pagination, filters } = await fetchBlogData(searchParams)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              ZyphexTech Blog
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Stay updated with the latest insights, tutorials, and innovations in technology and development.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <BlogSearch categories={filters.categories} />
            <BlogCategories categories={filters.categories} />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {posts.length > 0 ? (
              <>
                {/* Results Info */}
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <p className="text-gray-600">
                      Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to{' '}
                      {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                      {pagination.totalItems} articles
                    </p>
                  </div>
                  
                  {searchParams.q && (
                    <div className="text-sm text-gray-500">
                      Search results for &quot;{searchParams.q}&quot;
                    </div>
                  )}
                </div>

                {/* Blog Grid */}
                <BlogGrid posts={posts} />

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-center space-x-2">
                    {pagination.hasPrev && (
                      <Link
                        href={`/blog?${new URLSearchParams({
                          ...searchParams,
                          page: (pagination.currentPage - 1).toString()
                        }).toString()}`}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Previous
                      </Link>
                    )}
                    
                    <span className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
                      {pagination.currentPage}
                    </span>
                    
                    {pagination.hasNext && (
                      <Link
                        href={`/blog?${new URLSearchParams({
                          ...searchParams,
                          page: (pagination.currentPage + 1).toString()
                        }).toString()}`}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Next
                      </Link>
                    )}
                  </div>
                )}
              </>
            ) : (
              /* No Posts State */
              <div className="text-center py-16">
                <div className="mx-auto h-24 w-24 text-gray-400 mb-8">
                  <svg
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    className="w-full h-full"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {searchParams.q || searchParams.category ? 'No articles found' : 'Blog Coming Soon'}
                </h2>
                
                <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                  {searchParams.q || searchParams.category
                    ? 'Try adjusting your search criteria or browse all articles.'
                    : "We're preparing an amazing collection of articles, tutorials, and insights. Stay tuned for valuable content about technology, development, and digital innovation."
                  }
                </p>

                {(searchParams.q || searchParams.category) && (
                  <Link
                    href="/blog"
                    className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    View All Articles
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
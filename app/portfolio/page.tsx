import { Metadata } from 'next'
import { PortfolioGrid } from '@/components/portfolio/portfolio-grid'
import { PortfolioFilters } from '@/components/portfolio/portfolio-filters'
import { notFound } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Portfolio | ZyphexTech',
  description: 'Explore our portfolio of successful projects, case studies, and digital solutions. See how we help businesses transform and grow.',
  keywords: 'portfolio, projects, case studies, digital solutions, web development, mobile apps',
  openGraph: {
    title: 'Portfolio | ZyphexTech',
    description: 'Explore our portfolio of successful projects, case studies, and digital solutions.',
    type: 'website',
  },
}

// Define types for portfolio data
interface PortfolioItem {
  id: string
  title: string
  slug: string | null
  description: string | null
  category: string
  technologies: string[] | string | null
  featuredImage: string | null
  imageUrl: string | null
  projectUrl: string | null
  liveUrl: string | null
  githubUrl: string | null
  featured: boolean
  published: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

interface PortfolioApiResponse {
  items: PortfolioItem[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    hasNext: boolean
    hasPrev: boolean
  }
  filters: {
    categories: string[]
    technologies: string[]
  }
}

interface PortfolioPageProps {
  searchParams: {
    category?: string
    technology?: string
    page?: string
  }
}

// Fetch portfolio data from API
async function fetchPortfolioData(searchParams: PortfolioPageProps['searchParams']): Promise<PortfolioApiResponse> {
  try {
    const { category, technology, page = '1' } = searchParams
    
    // Build query parameters
    const params = new URLSearchParams()
    if (category && category !== 'all') {
      params.append('category', category)
    }
    if (technology) {
      params.append('technology', technology)
    }
    params.append('page', page)
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/portfolio?${params.toString()}`, {
      cache: 'no-store' // Always get fresh data
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch portfolio data')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching portfolio data:', error)
    // Return empty response with proper structure
    return {
      items: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        hasNext: false,
        hasPrev: false
      },
      filters: {
        categories: [],
        technologies: []
      }
    }
  }
}

// Helper function to parse technologies
function parseTechnologies(technologies: string[] | string | null): string[] {
  if (!technologies) return []
  if (Array.isArray(technologies)) return technologies
  try {
    return JSON.parse(technologies)
  } catch {
    return technologies.split(',').map((t: string) => t.trim())
  }
}

export default async function PortfolioPage({ searchParams }: PortfolioPageProps) {
  const portfolioData = await fetchPortfolioData(searchParams)
  
  if (!portfolioData || portfolioData.items.length === 0 && portfolioData.pagination.totalItems === 0) {
    // If no data at all (not even due to filters), show not found
    if (!searchParams.category && !searchParams.technology) {
      notFound()
    }
  }

  // Transform portfolio items to match frontend expectations
  const transformedPortfolioItems = portfolioData.items.map((item) => ({
    id: item.id,
    title: item.title,
    slug: item.slug || item.id, // Use id as fallback if slug is null
    description: item.description || 'No description available', // Provide fallback for null descriptions
    category: item.category,
    technologies: parseTechnologies(item.technologies),
    featuredImage: item.featuredImage || item.imageUrl || '/placeholder.svg?height=300&width=400&text=Project', // Ensure we have an image
    liveUrl: item.liveUrl || item.projectUrl || undefined,
    githubUrl: item.githubUrl || undefined,
    featured: item.featured,
    createdAt: item.createdAt,
  }))

  const { currentPage, totalPages } = portfolioData.pagination
  const { categories, technologies } = portfolioData.filters

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
            Our <span className="text-blue-600 dark:text-blue-400">Portfolio</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-8">
            Explore our portfolio of successful projects and digital solutions.
            See how we help businesses transform and achieve their goals.
          </p>
        </div>
      </section>

      {/* Filters Section */}
      <section className="pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <PortfolioFilters
            categories={categories}
            technologies={technologies}
            selectedCategory={searchParams.category}
            selectedTechnology={searchParams.technology}
          />
        </div>
      </section>

      {/* Portfolio Grid */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {transformedPortfolioItems.length > 0 ? (
            <>
              <PortfolioGrid items={transformedPortfolioItems} />
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 flex justify-center">
                  <nav className="flex items-center space-x-2">
                    {/* Previous Button */}
                    {currentPage > 1 && (
                      <a
                        href={`/portfolio?page=${currentPage - 1}${searchParams.category ? `&category=${searchParams.category}` : ''}${searchParams.technology ? `&technology=${searchParams.technology}` : ''}`}
                        className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        Previous
                      </a>
                    )}

                    {/* Page Numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                      if (pageNum > totalPages) return null

                      return (
                        <a
                          key={pageNum}
                          href={`/portfolio?page=${pageNum}${searchParams.category ? `&category=${searchParams.category}` : ''}${searchParams.technology ? `&technology=${searchParams.technology}` : ''}`}
                          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                            pageNum === currentPage
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                          }`}
                        >
                          {pageNum}
                        </a>
                      )
                    })}

                    {/* Next Button */}
                    {currentPage < totalPages && (
                      <a
                        href={`/portfolio?page=${currentPage + 1}${searchParams.category ? `&category=${searchParams.category}` : ''}${searchParams.technology ? `&technology=${searchParams.technology}` : ''}`}
                        className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        Next
                      </a>
                    )}
                  </nav>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎨</div>
              <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
                No portfolio items found
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                {searchParams.category || searchParams.technology
                  ? 'Try adjusting your filter criteria.'
                  : 'Check back soon for new projects!'}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Github, Calendar, Tag } from 'lucide-react'

interface PortfolioItemPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: PortfolioItemPageProps): Promise<Metadata> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const item = await (prisma as any).portfolioItem.findUnique({
      where: { id: params.id, published: true }
    })

    if (!item) {
      return {
        title: 'Project Not Found | ZyphexTech Portfolio',
      }
    }

    return {
      title: `${item.title} | ZyphexTech Portfolio`,
      description: item.description,
      keywords: item.technologies ? item.technologies.join(', ') : '',
      openGraph: {
        title: item.title,
        description: item.description,
        type: 'article',
        images: item.featuredImage ? [item.featuredImage] : [],
      },
    }
  } catch (error) {
    console.error('Metadata generation error:', error)
    return {
      title: 'Portfolio Item | ZyphexTech',
    }
  }
}

export default async function PortfolioItemPage({ params }: PortfolioItemPageProps) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const item = await (prisma as any).portfolioItem.findUnique({
      where: { id: params.id, published: true }
    })

    if (!item) {
      notFound()
    }

    // Get related projects (same category, excluding current)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const relatedItems = await (prisma as any).portfolioItem.findMany({
      where: {
        published: true,
        category: item.category,
        id: { not: item.id }
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        featuredImage: true,
        technologies: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    })

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {/* Back to Portfolio Link */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Portfolio
          </Link>
        </div>

        <article className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Section */}
          {item.featuredImage && (
            <div className="relative h-64 md:h-96 rounded-lg overflow-hidden mb-8">
              <Image
                src={item.featuredImage}
                alt={item.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Project Header */}
          <header className="mb-8">
            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-4">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(item.createdAt), 'MMMM dd, yyyy')}
              </span>
              <span className="inline-flex items-center gap-1">
                <Tag className="h-4 w-4" />
                {item.category}
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              {item.title}
            </h1>

            <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              {item.description}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              {item.liveUrl && (
                <a
                  href={item.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Live Project
                </a>
              )}

              {item.githubUrl && (
                <a
                  href={item.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  <Github className="h-4 w-4" />
                  View Source Code
                </a>
              )}
            </div>
          </header>

          {/* Project Details */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Technologies Used */}
            <div className="md:col-span-2">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Technologies Used
              </h2>
              {item.technologies && item.technologies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {item.technologies.map((tech: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600 dark:text-slate-400">
                  No technologies specified
                </p>
              )}
            </div>

            {/* Project Info */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Project Details
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Category:
                  </span>
                  <p className="text-slate-600 dark:text-slate-400">{item.category}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Status:
                  </span>
                  <p className="text-slate-600 dark:text-slate-400">
                    {item.featured ? 'Featured Project' : 'Completed'}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Date:
                  </span>
                  <p className="text-slate-600 dark:text-slate-400">
                    {format(new Date(item.createdAt), 'MMMM yyyy')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Project Content */}
          {item.content && (
            <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
                Project Overview
              </h2>
              <div
                dangerouslySetInnerHTML={{ __html: item.content }}
                className="text-slate-700 dark:text-slate-300 leading-relaxed"
              />
            </div>
          )}

          {/* Gallery/Images */}
          {item.images && item.images.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
                Project Gallery
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {item.images.map((image: string, index: number) => (
                  <div key={index} className="relative h-48 rounded-lg overflow-hidden">
                    <Image
                      src={image}
                      alt={`${item.title} - Image ${index + 1}`}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Projects */}
          {relatedItems.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-700 pt-8">
              <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
                Related Projects
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {relatedItems.map((relatedItem: any) => (
                  <Link
                    key={relatedItem.id}
                    href={`/portfolio/${relatedItem.id}`}
                    className="group"
                  >
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border hover:shadow-md transition-shadow overflow-hidden">
                      {relatedItem.featuredImage && (
                        <div className="relative h-32">
                          <Image
                            src={relatedItem.featuredImage}
                            alt={relatedItem.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">
                          {relatedItem.title}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
                          {relatedItem.description}
                        </p>
                        {relatedItem.technologies && relatedItem.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {relatedItem.technologies.slice(0, 2).map((tech: string, index: number) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    )
  } catch (error) {
    console.error('Portfolio item page error:', error)
    notFound()
  }
}

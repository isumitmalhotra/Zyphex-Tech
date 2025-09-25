import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import { ExternalLink, Github } from 'lucide-react'

interface PortfolioItem {
  id: string
  title: string
  slug: string
  description: string
  category: string
  technologies: string[]
  featuredImage: string
  liveUrl?: string
  githubUrl?: string
  featured: boolean
  createdAt: Date
}

interface PortfolioGridProps {
  items: PortfolioItem[]
}

export function PortfolioGrid({ items }: PortfolioGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {items.map((item) => (
        <div
          key={item.id}
          className="group bg-white dark:bg-slate-800 rounded-lg shadow-sm border hover:shadow-lg transition-all duration-300 overflow-hidden"
        >
          {/* Featured Badge */}
          {item.featured && (
            <div className="absolute top-4 left-4 z-10">
              <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-medium rounded">
                Featured
              </span>
            </div>
          )}

          {/* Image */}
          {item.featuredImage && (
            <div className="relative h-48 overflow-hidden">
              <Image
                src={item.featuredImage}
                alt={item.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                {item.category}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {format(new Date(item.createdAt), 'MMM yyyy')}
              </span>
            </div>

            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              <Link href={`/portfolio/${item.slug}`}>
                {item.title}
              </Link>
            </h3>

            <p className="text-slate-600 dark:text-slate-300 text-sm mb-4 line-clamp-3">
              {item.description}
            </p>

            {/* Technologies */}
            {item.technologies && item.technologies.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {item.technologies.slice(0, 3).map((tech, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded"
                  >
                    {tech}
                  </span>
                ))}
                {item.technologies.length > 3 && (
                  <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded">
                    +{item.technologies.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Links */}
            <div className="flex items-center gap-3">
              <Link
                href={`/portfolio/${item.slug}`}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
              >
                View Details →
              </Link>

              {item.liveUrl && (
                <a
                  href={item.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}

              {item.githubUrl && (
                <a
                  href={item.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  <Github className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

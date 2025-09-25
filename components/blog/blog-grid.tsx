import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'

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

interface BlogGridProps {
  posts: BlogPost[]
}

export function BlogGrid({ posts }: BlogGridProps) {
  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No blog posts found.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {posts.map((post) => (
        <article
          key={post.id}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden group"
        >
          {/* Cover Image */}
          <div className="relative h-48 overflow-hidden">
            {post.imageUrl ? (
              <Image
                src={post.imageUrl}
                alt={post.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center">
                <div className="text-4xl">📝</div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Tags/Category */}
            {post.tags && post.tags.length > 0 && (
              <div className="mb-3">
                <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-semibold px-3 py-1 rounded-full">
                  {post.tags[0]}
                </span>
              </div>
            )}

            {/* Title */}
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              <Link href={`/blog/${post.slug}`}>
                {post.title}
              </Link>
            </h3>

            {/* Excerpt */}
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-4 line-clamp-3">
              {post.excerpt}
            </p>

            {/* Meta Information */}
            <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {post.author.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span>{post.author}</span>
              </div>
              <time dateTime={post.publishedAt}>
                {format(new Date(post.publishedAt), 'MMM dd, yyyy')}
              </time>
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 1 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {post.tags.slice(1, 4).map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Read More Link */}
            <div className="mt-4">
              <Link
                href={`/blog/${post.slug}`}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium transition-colors"
              >
                Read more →
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

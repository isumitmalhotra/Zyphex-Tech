import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react'

interface BlogPostPageProps {
  params: {
    slug: string
  }
}

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  author: string
  imageUrl?: string
  tags?: string[]
  publishedAt: string
  createdAt: string
  updatedAt: string
}

interface BlogPostApiResponse {
  success: boolean
  data: BlogPost
  relatedPosts: BlogPost[]
}

async function fetchBlogPost(slug: string): Promise<BlogPostApiResponse | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const url = `${baseUrl}/api/blog/${slug}`
    
    const response = await fetch(url, {
      next: { revalidate: 300 }, // Revalidate every 5 minutes
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`Failed to fetch: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching blog post:', error)
    return null
  }
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  try {
    const result = await fetchBlogPost(params.slug)
    
    if (!result || !result.success) {
      return {
        title: 'Post Not Found | ZyphexTech Blog',
        description: 'The blog post you are looking for could not be found.',
      }
    }

    const post = result.data

    return {
      title: `${post.title} | ZyphexTech Blog`,
      description: post.excerpt || post.content.substring(0, 160),
      keywords: post.tags ? post.tags.join(', ') : '',
      openGraph: {
        title: post.title,
        description: post.excerpt || post.content.substring(0, 160),
        type: 'article',
        publishedTime: post.publishedAt,
        authors: [post.author || 'ZyphexTech'],
        tags: post.tags || [],
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: post.excerpt || post.content.substring(0, 160),
      },
    }
  } catch (error) {
    console.error('Metadata generation error:', error)
    return {
      title: 'Blog Post | ZyphexTech',
      description: 'Read the latest insights and updates from ZyphexTech.',
    }
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const result = await fetchBlogPost(params.slug)

  if (!result || !result.success) {
    notFound()
  }

  const { data: post, relatedPosts } = result

  // Calculate read time (roughly 200 words per minute)
  const wordCount = post.content.split(' ').length
  const readTime = Math.ceil(wordCount / 200)

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {/* Back to Blog Link */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>
        </div>

        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Section */}
          {post.imageUrl && (
            <div className="relative h-64 md:h-96 rounded-lg overflow-hidden mb-8">
              <Image
                src={post.imageUrl}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Article Header */}
          <header className="mb-8">
            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-4">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(post.publishedAt), 'MMMM dd, yyyy')}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {readTime} min read
              </span>
              <span className="inline-flex items-center gap-1">
                <User className="h-4 w-4" />
                {post.author}
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
                {post.excerpt}
              </p>
            )}
          </header>

          {/* Article Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
            <div
              dangerouslySetInnerHTML={{ __html: post.content }}
              className="text-slate-700 dark:text-slate-300 leading-relaxed"
            />
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-700 pt-8 mb-12">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-700 pt-8">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">
                Related Posts
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {relatedPosts.map((relatedPost: any) => (
                  <Link
                    key={relatedPost.id}
                    href={`/blog/${relatedPost.slug}`}
                    className="group"
                  >
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border hover:shadow-md transition-shadow overflow-hidden">
                      {relatedPost.imageUrl && (
                        <div className="relative h-32">
                          <Image
                            src={relatedPost.imageUrl}
                            alt={relatedPost.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">
                          {relatedPost.title}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                          {relatedPost.excerpt}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                          {format(new Date(relatedPost.publishedAt), 'MMM dd, yyyy')}
                        </p>
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
}

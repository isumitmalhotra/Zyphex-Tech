'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// Utility function to safely get string values from data
const getDataValue = (data: Record<string, unknown>, key: string, fallback = ''): string => {
  const value = data[key]
  return typeof value === 'string' ? value : fallback
}

// Utility function to safely get array values from data
const getDataArray = (data: Record<string, unknown>, key: string): string[] => {
  const value = data[key]
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return Array.isArray(value) ? value : []
}

interface DynamicContentItem {
  id: string
  title: string
  slug?: string
  data: Record<string, unknown>
  status: string
  featured: boolean
  categories: string[]
  tags: string[]
  metadata: Record<string, unknown>
  order: number
  publishedAt?: string
  contentType: {
    name: string
    label: string
    icon?: string
    fields: Array<{
      id: string
      name: string
      label: string
      type: string
      required?: boolean
    }>
  }
}

interface DynamicContentRendererProps {
  contentTypeNames?: string[]
  sectionKey?: string
  maxItems?: number
  featured?: boolean
  categories?: string[]
  tags?: string[]
  className?: string
  renderMode?: 'grid' | 'list' | 'hero' | 'slider'
  showMetadata?: boolean
}

export default function DynamicContentRenderer({
  contentTypeNames = [],
  sectionKey,
  maxItems = 10,
  featured,
  categories,
  tags,
  className = '',
  renderMode = 'grid',
  showMetadata = false
}: DynamicContentRendererProps) {
  const [items, setItems] = useState<DynamicContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContent = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        limit: maxItems.toString(),
        status: 'published'
      })

      if (featured !== undefined) params.append('featured', featured.toString())
      if (categories?.length) params.append('categories', categories.join(','))
      if (tags?.length) params.append('tags', tags.join(','))

      let url = '/api/content/dynamic-items'
      if (sectionKey) {
        url = `/api/content/sections/${sectionKey}`
      } else if (contentTypeNames.length === 1) {
        url = `/api/content/types/${contentTypeNames[0]}`
      }

      const response = await fetch(`${url}?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch content')
      }

      const data = await response.json()
      setItems(Array.isArray(data) ? data : data.items || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content')
    } finally {
      setLoading(false)
    }
  }, [contentTypeNames, featured, categories, tags, maxItems, sectionKey])

  useEffect(() => {
    fetchContent()
  }, [fetchContent])

  if (loading) {
    return (
      <div className={className}>
        <div className={`grid gap-6 ${renderMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {Array.from({ length: 3 }).map((_, i) => (
            <ContentItemSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-red-500 mb-2">Failed to load content</div>
        <div className="text-sm text-muted-foreground">{error}</div>
        <Button onClick={fetchContent} variant="outline" className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className={`text-center py-8 text-muted-foreground ${className}`}>
        No content available
      </div>
    )
  }

  const renderContent = () => {
    switch (renderMode) {
      case 'hero':
        return <HeroRenderer items={items.slice(0, 1)} showMetadata={showMetadata} />
      case 'list':
        return <ListRenderer items={items} showMetadata={showMetadata} />
      case 'slider':
        return <SliderRenderer items={items} showMetadata={showMetadata} />
      default:
        return <GridRenderer items={items} showMetadata={showMetadata} />
    }
  }

  return (
    <div className={className}>
      {renderContent()}
    </div>
  )
}

// Individual renderers for different content types
function HeroRenderer({ items, showMetadata }: { items: DynamicContentItem[], showMetadata: boolean }) {
  if (items.length === 0) return null

  const item = items[0]
  const { data } = item

  const backgroundImage = getDataValue(data, 'backgroundImage')
  const headline = getDataValue(data, 'headline') || item.title
  const subtitle = getDataValue(data, 'subtitle')
  const ctaText = getDataValue(data, 'ctaText')
  const ctaUrl = getDataValue(data, 'ctaUrl')

  return (
    <section className="relative bg-gradient-to-br from-background to-muted py-20 px-6">
      {backgroundImage && (
        <div className="absolute inset-0 z-0">
          <Image
            src={backgroundImage}
            alt={headline}
            fill
            className="object-cover opacity-20"
          />
        </div>
      )}
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          {headline}
        </h1>
        {subtitle && (
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            {subtitle}
          </p>
        )}
        {ctaText && ctaUrl && (
          <Link href={ctaUrl}>
            <Button size="lg" className="mr-4">
              {ctaText}
            </Button>
          </Link>
        )}
        {showMetadata && item.categories.length > 0 && (
          <div className="mt-8 flex justify-center gap-2">
            {item.categories.map(category => (
              <Badge key={category} variant="secondary">
                {category}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function GridRenderer({ items, showMetadata }: { items: DynamicContentItem[], showMetadata: boolean }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map(item => (
        <ContentCard key={item.id} item={item} showMetadata={showMetadata} />
      ))}
    </div>
  )
}

function ListRenderer({ items, showMetadata }: { items: DynamicContentItem[], showMetadata: boolean }) {
  return (
    <div className="space-y-6">
      {items.map(item => (
        <ContentCard key={item.id} item={item} showMetadata={showMetadata} layout="horizontal" />
      ))}
    </div>
  )
}

function SliderRenderer({ items, showMetadata }: { items: DynamicContentItem[], showMetadata: boolean }) {
  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {items.map(item => (
        <div key={item.id} className="flex-none w-80">
          <ContentCard item={item} showMetadata={showMetadata} />
        </div>
      ))}
    </div>
  )
}

function ContentCard({ 
  item, 
  showMetadata, 
  layout = 'vertical' 
}: { 
  item: DynamicContentItem
  showMetadata: boolean
  layout?: 'vertical' | 'horizontal'
}) {
  const { data, contentType } = item
  
  // Safely extract data values
  const mainImage = getDataValue(data, 'image') || 
                   getDataValue(data, 'backgroundImage') || 
                   getDataValue(data, 'photo') || 
                   getDataValue(data, 'featuredImage')

  const title = getDataValue(data, 'title') || 
               getDataValue(data, 'headline') || 
               getDataValue(data, 'name') || 
               item.title

  const description = getDataValue(data, 'subtitle') || 
                     getDataValue(data, 'description') || 
                     getDataValue(data, 'bio')

  const quote = getDataValue(data, 'quote')
  const authorName = getDataValue(data, 'authorName')
  const authorImage = getDataValue(data, 'authorImage')
  const company = getDataValue(data, 'company')
  const position = getDataValue(data, 'position')
  const email = getDataValue(data, 'email')
  const price = getDataValue(data, 'price')
  const billingPeriod = getDataValue(data, 'billingPeriod')
  const features = getDataValue(data, 'features')
  const ctaText = getDataValue(data, 'ctaText')
  const ctaUrl = getDataValue(data, 'ctaUrl')
  const highlighted = data.highlighted === true

  const content = (
    <>
      {mainImage && (
        <div className={`relative ${layout === 'horizontal' ? 'w-48 h-48' : 'h-48'}`}>
          <Image
            src={mainImage}
            alt={title}
            fill
            className="object-cover rounded-md"
          />
        </div>
      )}
      <div className={layout === 'horizontal' ? 'flex-1' : ''}>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            {contentType.icon && (
              <span className="text-lg">{contentType.icon}</span>
            )}
            <Badge variant="outline" className="text-xs">
              {contentType.label}
            </Badge>
            {item.featured && (
              <Badge variant="default" className="text-xs">
                Featured
              </Badge>
            )}
          </div>
          <CardTitle className="line-clamp-2">
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="line-clamp-3">
              {description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {/* Render content type specific fields */}
          {contentType.name === 'testimonial' && (
            <div>
              {quote && (
                <blockquote className="italic mb-4">&ldquo;{quote}&rdquo;</blockquote>
              )}
              <div className="flex items-center gap-2">
                {authorImage && (
                  <div className="relative w-8 h-8">
                    <Image
                      src={authorImage}
                      alt={authorName || 'Author'}
                      fill
                      className="object-cover rounded-full"
                    />
                  </div>
                )}
                <div>
                  <div className="font-medium text-sm">{authorName}</div>
                  {company && (
                    <div className="text-xs text-muted-foreground">{company}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {contentType.name === 'team_member' && (
            <div>
              {position && (
                <div className="font-medium text-sm mb-2">{position}</div>
              )}
              {email && (
                <div className="text-sm text-muted-foreground mb-2">{email}</div>
              )}
            </div>
          )}

          {contentType.name === 'pricing_plan' && (
            <div>
              <div className="text-2xl font-bold mb-2">
                ${price}
                <span className="text-sm text-muted-foreground">/{billingPeriod}</span>
              </div>
              {features && (
                <ul className="text-sm space-y-1">
                  {getDataArray(data, 'features').slice(0, 3).map((feature: string, i: number) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {showMetadata && (
            <div className="mt-4 space-y-2">
              {item.categories.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.categories.map(category => (
                    <Badge key={category} variant="secondary" className="text-xs">
                      {category}
                    </Badge>
                  ))}
                </div>
              )}
              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Call to action buttons */}
          {(ctaText && ctaUrl) && (
            <div className="mt-4">
              <Link href={ctaUrl}>
                <Button size="sm" variant={highlighted ? 'default' : 'outline'}>
                  {ctaText}
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </div>
    </>
  )

  if (layout === 'horizontal') {
    return (
      <Card className="flex gap-4 p-4">
        {content}
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      {content}
    </Card>
  )
}

function ContentItemSkeleton() {
  return (
    <Card>
      <div className="relative h-48">
        <Skeleton className="w-full h-full" />
      </div>
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="w-6 h-6" />
          <Skeleton className="w-16 h-5" />
        </div>
        <Skeleton className="w-3/4 h-6" />
        <Skeleton className="w-full h-4" />
        <Skeleton className="w-2/3 h-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="w-full h-10" />
      </CardContent>
    </Card>
  )
}
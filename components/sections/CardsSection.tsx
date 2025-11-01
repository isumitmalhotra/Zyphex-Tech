/**
 * Cards Section Component
 * 
 * Generic card grid with images, titles, descriptions, and CTAs
 */

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export interface CardItem {
  image?: string
  badge?: string
  title: string
  description: string
  cta?: {
    text: string
    href: string
  }
  metadata?: {
    date?: string
    author?: string
    category?: string
    [key: string]: string | undefined
  }
}

export interface CardsSectionData {
  heading?: string
  subheading?: string
  description?: string
  cards: CardItem[]
  columns?: 2 | 3 | 4
  cardStyle?: 'elevated' | 'bordered' | 'minimal'
  backgroundColor?: string
  showImages?: boolean
}

interface CardsSectionProps {
  data: CardsSectionData
  className?: string
}

export function CardsSection({ data, className = '' }: CardsSectionProps) {
  const {
    heading,
    subheading,
    description,
    cards = [],
    columns = 3,
    cardStyle = 'elevated',
    backgroundColor,
    showImages = true
  } = data || {}

  const columnClasses = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4'
  }

  const cardStyleClasses = {
    elevated: 'shadow-md hover:shadow-xl',
    bordered: 'border-2 hover:border-purple-300 dark:hover:border-purple-700',
    minimal: 'border-0 shadow-none hover:bg-gray-50 dark:hover:bg-gray-800'
  }

  return (
    <section
      className={cn(
        'py-16 md:py-24',
        backgroundColor || 'bg-white dark:bg-gray-900',
        className
      )}
    >
      <div className="container px-4">
        {/* Header */}
        {(heading || subheading || description) && (
          <div className="max-w-3xl mx-auto text-center mb-12">
            {subheading && (
              <p className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-3">
                {subheading}
              </p>
            )}
            {heading && (
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
                {heading}
              </h2>
            )}
            {description && (
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {description}
              </p>
            )}
          </div>
        )}

        {/* Cards Grid */}
        <div
          className={cn(
            'grid grid-cols-1 gap-6',
            columnClasses[columns]
          )}
        >
          {cards && cards.length > 0 ? (
            cards.map((card, index) => (
            <Card
              key={index}
              className={cn(
                'overflow-hidden transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-gray-800',
                cardStyleClasses[cardStyle]
              )}
            >
              {/* Image */}
              {showImages && card.image && (
                <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-700">
                  <Image
                    src={card.image}
                    alt={card.title}
                    fill
                    className="object-cover"
                  />
                  {card.badge && (
                    <Badge
                      className="absolute top-4 left-4 bg-white/90 dark:bg-gray-800/90 text-purple-600 dark:text-purple-400"
                    >
                      {card.badge}
                    </Badge>
                  )}
                </div>
              )}

              <CardHeader>
                {/* Badge (if no image) */}
                {(!showImages || !card.image) && card.badge && (
                  <Badge className="w-fit mb-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                    {card.badge}
                  </Badge>
                )}

                {/* Title */}
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                  {card.title}
                </CardTitle>

                {/* Metadata */}
                {card.metadata && (
                  <div className="flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {card.metadata.date && (
                      <span>{card.metadata.date}</span>
                    )}
                    {card.metadata.author && (
                      <>
                        {card.metadata.date && <span>•</span>}
                        <span>{card.metadata.author}</span>
                      </>
                    )}
                    {card.metadata.category && (
                      <>
                        {(card.metadata.date || card.metadata.author) && (
                          <span>•</span>
                        )}
                        <span className="text-purple-600 dark:text-purple-400">
                          {card.metadata.category}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </CardHeader>

              <CardContent>
                {/* Description */}
                <CardDescription className="text-base text-gray-600 dark:text-gray-300">
                  {card.description}
                </CardDescription>
              </CardContent>

              {/* CTA */}
              {card.cta && (
                <CardFooter>
                  <Button
                    asChild
                    variant="ghost"
                    className="group text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                  >
                    <Link href={card.cta.href}>
                      {card.cta.text}
                      <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))
          ) : (
            <div className="col-span-full text-center text-gray-500 dark:text-gray-400">
              No cards available
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

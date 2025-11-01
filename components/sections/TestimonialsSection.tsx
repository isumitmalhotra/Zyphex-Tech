/**
 * Testimonials Section Component
 * 
 * Renders customer testimonials with ratings and company info
 */

import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { Star, Quote } from 'lucide-react'

export interface Testimonial {
  quote: string
  author: string
  role: string
  company?: string
  avatar?: string
  rating?: number
}

export interface TestimonialsSectionData {
  heading?: string
  subheading?: string
  description?: string
  testimonials: Testimonial[]
  columns?: 1 | 2 | 3
  backgroundColor?: string
  showRatings?: boolean
}

interface TestimonialsSectionProps {
  data: TestimonialsSectionData
  className?: string
}

export function TestimonialsSection({ data, className = '' }: TestimonialsSectionProps) {
  const {
    heading,
    subheading,
    description,
    testimonials = [],
    columns = 3,
    backgroundColor,
    showRatings = true
  } = data || {}

  const columnClasses = {
    1: 'md:grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3'
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
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

        {/* Testimonials Grid */}
        <div
          className={cn(
            'grid grid-cols-1 gap-6',
            columnClasses[columns]
          )}
        >
          {testimonials && testimonials.length > 0 ? (
            testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="relative overflow-hidden bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300"
            >
              <CardContent className="pt-6">
                {/* Quote Icon */}
                <Quote className="w-10 h-10 text-purple-200 dark:text-purple-800 mb-4" />

                {/* Rating */}
                {showRatings && testimonial.rating && (
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'w-5 h-5',
                          i < testimonial.rating!
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300 dark:text-gray-600'
                        )}
                      />
                    ))}
                  </div>
                )}

                {/* Quote */}
                <blockquote className="text-gray-700 dark:text-gray-300 mb-6 text-base leading-relaxed">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>

                {/* Author Info */}
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={testimonial.avatar} alt={testimonial.author} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                      {getInitials(testimonial.author)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.author}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {testimonial.role}
                      {testimonial.company && ` at ${testimonial.company}`}
                    </div>
                  </div>
                </div>

                {/* Decorative gradient */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-purple-500/5 to-blue-500/5 rounded-full blur-2xl" />
              </CardContent>
            </Card>
          ))
          ) : (
            <div className="col-span-full text-center text-gray-500 dark:text-gray-400">
              No testimonials available
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

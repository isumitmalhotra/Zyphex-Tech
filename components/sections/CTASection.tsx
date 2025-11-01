/**
 * CTA (Call-to-Action) Section Component
 * 
 * Renders a prominent call-to-action banner with buttons
 */

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

export interface CTASectionData {
  heading: string
  description?: string
  primaryCta?: {
    text: string
    href: string
  }
  secondaryCta?: {
    text: string
    href: string
  }
  backgroundColor?: string
  style?: 'gradient' | 'solid' | 'minimal'
}

interface CTASectionProps {
  data: CTASectionData
  className?: string
}

export function CTASection({ data, className = '' }: CTASectionProps) {
  const {
    heading = '',
    description,
    primaryCta,
    secondaryCta,
    backgroundColor,
    style = 'gradient'
  } = data || {}

  const styleClasses = {
    gradient: 'bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600',
    solid: backgroundColor || 'bg-purple-600',
    minimal: 'bg-gray-100 dark:bg-gray-800'
  }

  const textColorClasses = {
    gradient: 'text-white',
    solid: 'text-white',
    minimal: 'text-gray-900 dark:text-white'
  }

  return (
    <section
      className={cn(
        'py-16 md:py-24 relative overflow-hidden',
        styleClasses[style],
        className
      )}
    >
      {/* Animated Background Elements (for gradient style) */}
      {style === 'gradient' && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse animation-delay-2000" />
        </div>
      )}

      {/* Content */}
      <div className="container relative z-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Icon decoration */}
          {style === 'gradient' && (
            <div className="inline-flex mb-6">
              <Sparkles className="w-12 h-12 text-white/80 animate-pulse" />
            </div>
          )}

          {/* Heading */}
          <h2
            className={cn(
              'text-3xl md:text-4xl lg:text-5xl font-bold mb-6',
              textColorClasses[style]
            )}
          >
            {heading}
          </h2>

          {/* Description */}
          {description && (
            <p
              className={cn(
                'text-lg md:text-xl mb-8 max-w-2xl mx-auto',
                style === 'minimal'
                  ? 'text-gray-600 dark:text-gray-300'
                  : 'text-white/90'
              )}
            >
              {description}
            </p>
          )}

          {/* CTA Buttons */}
          {(primaryCta || secondaryCta) && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {primaryCta && (
                <Button
                  asChild
                  size="lg"
                  className={cn(
                    'shadow-lg hover:shadow-xl transition-all duration-300',
                    style === 'minimal'
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                      : 'bg-white text-purple-600 hover:bg-gray-100'
                  )}
                >
                  <Link href={primaryCta.href}>
                    {primaryCta.text}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
              )}
              {secondaryCta && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className={cn(
                    'border-2 transition-all duration-300',
                    style === 'minimal'
                      ? 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
                      : 'bg-transparent hover:bg-white/10 border-white text-white hover:text-white'
                  )}
                >
                  <Link href={secondaryCta.href}>{secondaryCta.text}</Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

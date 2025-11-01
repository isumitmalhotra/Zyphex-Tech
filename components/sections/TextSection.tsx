/**
 * Text Section Component
 * 
 * Renders rich text content with headings, paragraphs, and lists
 */

import { cn } from '@/lib/utils'

export interface TextSectionData {
  heading?: string
  subheading?: string
  content: string | string[] // Can be single string or array of paragraphs
  alignment?: 'left' | 'center' | 'right'
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  backgroundColor?: string
  textColor?: string
  list?: Array<{
    icon?: string
    text: string
  }>
}

interface TextSectionProps {
  data: TextSectionData
  className?: string
}

export function TextSection({ data, className = '' }: TextSectionProps) {
  const {
    heading,
    subheading,
    content = '',
    alignment = 'left',
    maxWidth = 'lg',
    backgroundColor,
    textColor,
    list
  } = data || {}

  const maxWidthClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-3xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full'
  }

  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center mx-auto',
    right: 'text-right ml-auto'
  }

  const contentArray = Array.isArray(content) ? content : [content]

  return (
    <section
      className={cn(
        'py-16 md:py-24',
        backgroundColor || 'bg-white dark:bg-gray-900',
        className
      )}
    >
      <div className="container px-4">
        <div
          className={cn(
            maxWidthClasses[maxWidth],
            alignmentClasses[alignment]
          )}
        >
          {/* Subheading */}
          {subheading && (
            <p className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-3">
              {subheading}
            </p>
          )}

          {/* Heading */}
          {heading && (
            <h2
              className={cn(
                'text-3xl md:text-4xl lg:text-5xl font-bold mb-6',
                textColor ||
                  'text-gray-900 dark:text-white'
              )}
            >
              {heading}
            </h2>
          )}

          {/* Content Paragraphs */}
          <div className="space-y-4">
            {contentArray.map((paragraph, index) => (
              <p
                key={index}
                className={cn(
                  'text-base md:text-lg leading-relaxed',
                  textColor || 'text-gray-600 dark:text-gray-300'
                )}
              >
                {paragraph}
              </p>
            ))}
          </div>

          {/* List Items */}
          {list && list.length > 0 && (
            <ul className="mt-8 space-y-4">
              {list.map((item, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3"
                >
                  {item.icon && (
                    <span className="flex-shrink-0 text-2xl">
                      {item.icon}
                    </span>
                  )}
                  <span
                    className={cn(
                      'text-base md:text-lg',
                      textColor || 'text-gray-600 dark:text-gray-300'
                    )}
                  >
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}

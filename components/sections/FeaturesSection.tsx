/**
 * Features Section Component
 * 
 * Renders a grid of feature cards with icons, titles, and descriptions
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { 
  Code, 
  Cloud, 
  Shield, 
  Zap, 
  Users, 
  Target,
  Rocket,
  Globe,
  Sparkles,
  CheckCircle,
  TrendingUp,
  Award
} from 'lucide-react'

// Map of available icons
const iconMap = {
  code: Code,
  cloud: Cloud,
  shield: Shield,
  zap: Zap,
  users: Users,
  target: Target,
  rocket: Rocket,
  globe: Globe,
  sparkles: Sparkles,
  check: CheckCircle,
  trending: TrendingUp,
  award: Award
}

export interface Feature {
  icon?: keyof typeof iconMap | string
  title: string
  description: string
  badge?: string
}

export interface FeaturesSectionData {
  heading?: string
  subheading?: string
  description?: string
  features: Feature[]
  columns?: 2 | 3 | 4
  backgroundColor?: string
}

interface FeaturesSectionProps {
  data: FeaturesSectionData
  className?: string
}

export function FeaturesSection({ data, className = '' }: FeaturesSectionProps) {
  const {
    heading,
    subheading,
    description,
    features = [],
    columns = 3,
    backgroundColor
  } = data || {}

  const columnClasses = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4'
  }

  const getIcon = (iconName?: string) => {
    if (!iconName) return Sparkles
    return iconMap[iconName as keyof typeof iconMap] || Sparkles
  }

  return (
    <section
      className={cn(
        'py-16 md:py-24',
        backgroundColor || 'bg-gray-50 dark:bg-gray-800/50',
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

        {/* Features Grid */}
        <div
          className={cn(
            'grid grid-cols-1 gap-6',
            columnClasses[columns]
          )}
        >
          {features && features.length > 0 ? (
            features.map((feature, index) => {
            const Icon = getIcon(feature.icon)
            
            return (
              <Card
                key={index}
                className="relative overflow-hidden border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-gray-900"
              >
                <CardHeader>
                  {/* Icon */}
                  <div className="mb-4 inline-flex">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30">
                      <Icon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>

                  {/* Badge */}
                  {feature.badge && (
                    <span className="inline-block px-2 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-2 w-fit">
                      {feature.badge}
                    </span>
                  )}

                  {/* Title */}
                  <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                    {feature.title}
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  {/* Description */}
                  <CardDescription className="text-base text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </CardDescription>
                </CardContent>

                {/* Decorative gradient */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-full blur-2xl" />
              </Card>
            )
          })
          ) : (
            <div className="col-span-full text-center text-gray-500 dark:text-gray-400">
              No features available
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

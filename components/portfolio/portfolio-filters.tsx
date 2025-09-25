'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface PortfolioFiltersProps {
  categories: string[]
  technologies: string[]
  selectedCategory?: string
  selectedTechnology?: string
}

export function PortfolioFilters({
  categories,
  technologies,
  selectedCategory,
  selectedTechnology
}: PortfolioFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleCategoryChange = (category: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (category && category !== 'all') {
      params.set('category', category)
    } else {
      params.delete('category')
    }
    params.set('page', '1') // Reset to first page
    router.push(`/portfolio?${params.toString()}`)
  }

  const handleTechnologyChange = (technology: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (technology && technology !== 'all') {
      params.set('technology', technology)
    } else {
      params.delete('technology')
    }
    params.set('page', '1') // Reset to first page
    router.push(`/portfolio?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push('/portfolio')
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border p-6 mb-8">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Category Filter */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Category
          </label>
          <select
            value={selectedCategory || ''}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Technology Filter */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Technology
          </label>
          <select
            value={selectedTechnology || ''}
            onChange={(e) => handleTechnologyChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Technologies</option>
            {technologies.map((tech) => (
              <option key={tech} value={tech}>
                {tech}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        {(selectedCategory || selectedTechnology) && (
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {(selectedCategory || selectedTechnology) && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <span>Active filters:</span>
            {selectedCategory && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                Category: {selectedCategory}
              </span>
            )}
            {selectedTechnology && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
                Technology: {selectedTechnology}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

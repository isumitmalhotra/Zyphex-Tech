'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'

interface BlogSearchProps {
  categories: Array<{
    name: string
    count: number
  }>
}

export function BlogSearch({ categories }: BlogSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())

    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim())
    } else {
      params.delete('q')
    }

    if (selectedCategory) {
      params.set('category', selectedCategory)
    } else {
      params.delete('category')
    }

    params.set('page', '1') // Reset to first page on new search
    router.push(`/blog?${params.toString()}`)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSelectedCategory('')
    router.push('/blog')
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border p-6 mb-8">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search blog posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.name} value={category.name}>
                {category.name} ({category.count})
              </option>
            ))}
          </select>

          {/* Search Button */}
          <Button type="submit" className="px-6">
            Search
          </Button>
        </div>

        {/* Clear Filters */}
        {(searchQuery || selectedCategory) && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearSearch}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Clear Filters
            </Button>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {searchQuery && `Searching: "${searchQuery}"`}
              {searchQuery && selectedCategory && ' • '}
              {selectedCategory && `Category: ${selectedCategory}`}
            </span>
          </div>
        )}
      </form>
    </div>
  )
}

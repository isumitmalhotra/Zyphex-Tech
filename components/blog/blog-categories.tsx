'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface BlogCategoriesProps {
  categories: Array<{
    name: string
    count: number
  }>
}

export function BlogCategories({ categories }: BlogCategoriesProps) {
  const searchParams = useSearchParams()
  const activeCategory = searchParams.get('category')

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border p-6 mb-8">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
        Categories
      </h3>
      <div className="space-y-2">
        <Link
          href="/blog"
          className={`block px-3 py-2 rounded-md text-sm transition-colors ${
            !activeCategory
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          All Posts ({categories.reduce((sum, cat) => sum + cat.count, 0)})
        </Link>
        {categories.map((category) => (
          <Link
            key={category.name}
            href={`/blog?category=${encodeURIComponent(category.name)}`}
            className={`block px-3 py-2 rounded-md text-sm transition-colors ${
              activeCategory === category.name
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {category.name} ({category.count})
          </Link>
        ))}
      </div>
    </div>
  )
}

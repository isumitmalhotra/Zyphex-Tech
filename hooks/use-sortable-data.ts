import { useState, useMemo } from 'react'

export type SortDirection = 'asc' | 'desc' | null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface SortConfig<T = any> {
  key: keyof T | string
  direction: SortDirection
}

export function useSortableData<T>(
  items: T[],
  initialSortConfig: SortConfig<T> | null = null
) {
  const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(initialSortConfig)

  const sortedItems = useMemo(() => {
    if (!sortConfig || !sortConfig.direction) {
      return items
    }

    const sorted = [...items].sort((a, b) => {
      const key = sortConfig.key as keyof T
      
      // Get the values to compare
      const aValue = a[key]
      const bValue = b[key]

      // Handle null/undefined
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return 1
      if (bValue == null) return -1

      // Handle different types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc'
          ? aValue - bValue
          : bValue - aValue
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        return sortConfig.direction === 'asc'
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime()
      }

      // Handle date strings
      const aDate = new Date(aValue as string | number | Date)
      const bDate = new Date(bValue as string | number | Date)
      if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
        return sortConfig.direction === 'asc'
          ? aDate.getTime() - bDate.getTime()
          : bDate.getTime() - aDate.getTime()
      }

      // Fallback to string comparison
      const aString = String(aValue)
      const bString = String(bValue)
      return sortConfig.direction === 'asc'
        ? aString.localeCompare(bString)
        : bString.localeCompare(aString)
    })

    return sorted
  }, [items, sortConfig])

  const requestSort = (key: keyof T | string) => {
    let direction: SortDirection = 'asc'

    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'asc'
    ) {
      direction = 'desc'
    } else if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'desc'
    ) {
      direction = null
    }

    setSortConfig(direction ? { key, direction } : null)
  }

  const getSortDirection = (key: keyof T | string): SortDirection => {
    if (!sortConfig || sortConfig.key !== key) {
      return null
    }
    return sortConfig.direction
  }

  return {
    items: sortedItems,
    requestSort,
    sortConfig,
    getSortDirection
  }
}

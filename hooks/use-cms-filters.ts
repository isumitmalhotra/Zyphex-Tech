/**
 * CMS Filters Hook
 * Manage filter state for CMS entities with URL synchronization
 */

'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { FilterOptions, buildFilterSummary } from '@/lib/cms/filter-builder';

export interface UseCMSFiltersReturn {
  filters: FilterOptions;
  setFilter: (key: keyof FilterOptions, value: unknown) => void;
  clearFilter: (key: keyof FilterOptions) => void;
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
  filterSummary: string[];
  buildQueryString: () => string;
}

/**
 * Hook to manage CMS filter state with URL synchronization
 */
export function useCMSFilters(): UseCMSFiltersReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parse current filters from URL
  const filters = useMemo<FilterOptions>(() => {
    const params: FilterOptions = {};

    // Text search
    if (searchParams.get('search')) {
      params.search = searchParams.get('search') || undefined;
    }

    // Status
    const status = searchParams.get('status');
    if (status) {
      params.status = status.includes(',') ? status.split(',') : status;
    }

    // Types
    const pageType = searchParams.get('pageType');
    if (pageType) {
      params.pageType = pageType.includes(',') ? pageType.split(',') : pageType;
    }

    const assetType = searchParams.get('assetType');
    if (assetType) {
      params.assetType = assetType.includes(',') ? assetType.split(',') : assetType;
    }

    const sectionType = searchParams.get('sectionType');
    if (sectionType) {
      params.sectionType = sectionType.includes(',') ? sectionType.split(',') : sectionType;
    }

    // Category
    const category = searchParams.get('category');
    if (category) {
      params.category = category.includes(',') ? category.split(',') : category;
    }

    // User filters
    if (searchParams.get('authorId')) {
      params.authorId = searchParams.get('authorId') || undefined;
    }

    if (searchParams.get('createdBy')) {
      params.createdBy = searchParams.get('createdBy') || undefined;
    }

    if (searchParams.get('uploadedBy')) {
      params.uploadedBy = searchParams.get('uploadedBy') || undefined;
    }

    // Date filters
    if (searchParams.get('createdAfter')) {
      params.createdAfter = searchParams.get('createdAfter') || undefined;
    }

    if (searchParams.get('createdBefore')) {
      params.createdBefore = searchParams.get('createdBefore') || undefined;
    }

    if (searchParams.get('updatedAfter')) {
      params.updatedAfter = searchParams.get('updatedAfter') || undefined;
    }

    if (searchParams.get('updatedBefore')) {
      params.updatedBefore = searchParams.get('updatedBefore') || undefined;
    }

    if (searchParams.get('publishedAfter')) {
      params.publishedAfter = searchParams.get('publishedAfter') || undefined;
    }

    if (searchParams.get('publishedBefore')) {
      params.publishedBefore = searchParams.get('publishedBefore') || undefined;
    }

    // Boolean filters
    if (searchParams.get('isPublic') !== null) {
      params.isPublic = searchParams.get('isPublic') === 'true';
    }

    if (searchParams.get('isActive') !== null) {
      params.isActive = searchParams.get('isActive') === 'true';
    }

    if (searchParams.get('isVisible') !== null) {
      params.isVisible = searchParams.get('isVisible') === 'true';
    }

    if (searchParams.get('requiresAuth') !== null) {
      params.requiresAuth = searchParams.get('requiresAuth') === 'true';
    }

    if (searchParams.get('isSystem') !== null) {
      params.isSystem = searchParams.get('isSystem') === 'true';
    }

    // ID filters
    if (searchParams.get('templateId')) {
      params.templateId = searchParams.get('templateId') || undefined;
    }

    if (searchParams.get('folderId')) {
      params.folderId = searchParams.get('folderId') || undefined;
    }

    // Tags
    const tags = searchParams.get('tags');
    if (tags) {
      params.tags = tags.includes(',') ? tags.split(',') : tags;
    }

    // Number filters
    if (searchParams.get('minSeoScore')) {
      params.minSeoScore = parseInt(searchParams.get('minSeoScore') || '0');
    }

    if (searchParams.get('maxSeoScore')) {
      params.maxSeoScore = parseInt(searchParams.get('maxSeoScore') || '100');
    }

    if (searchParams.get('minFileSize')) {
      params.minFileSize = parseInt(searchParams.get('minFileSize') || '0');
    }

    if (searchParams.get('maxFileSize')) {
      params.maxFileSize = parseInt(searchParams.get('maxFileSize') || '0');
    }

    // Sorting
    if (searchParams.get('sortBy')) {
      params.sortBy = searchParams.get('sortBy') || undefined;
    }

    if (searchParams.get('sortOrder')) {
      params.sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';
    }

    // Pagination
    if (searchParams.get('page')) {
      params.page = parseInt(searchParams.get('page') || '1');
    }

    if (searchParams.get('limit')) {
      params.limit = parseInt(searchParams.get('limit') || '20');
    }

    return params;
  }, [searchParams]);

  // Build query string from filters
  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          params.set(key, value.join(','));
        } else {
          params.set(key, String(value));
        }
      }
    });

    return params.toString();
  }, [filters]);

  // Set a single filter
  const setFilter = useCallback((key: keyof FilterOptions, value: unknown) => {
    const params = new URLSearchParams(searchParams.toString());

    // Reset to page 1 when filters change
    params.set('page', '1');

    if (value === undefined || value === null || value === '') {
      params.delete(key);
    } else if (Array.isArray(value)) {
      if (value.length > 0) {
        params.set(key, value.join(','));
      } else {
        params.delete(key);
      }
    } else {
      params.set(key, String(value));
    }

    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, pathname, router]);

  // Clear a single filter
  const clearFilter = useCallback((key: keyof FilterOptions) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    
    // Reset to page 1
    params.set('page', '1');
    
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, pathname, router]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    // Keep only pagination params
    const params = new URLSearchParams();
    params.set('page', '1');
    
    // Optionally keep limit if it was set
    const currentLimit = searchParams.get('limit');
    if (currentLimit) {
      params.set('limit', currentLimit);
    }
    
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, pathname, router]);

  // Check if any filters are active (excluding pagination)
  const hasActiveFilters = useMemo(() => {
    const filterKeys = Object.keys(filters).filter(
      key => key !== 'page' && key !== 'limit' && key !== 'sortBy' && key !== 'sortOrder'
    );
    return filterKeys.length > 0;
  }, [filters]);

  // Generate human-readable filter summary
  const filterSummary = useMemo(() => {
    return buildFilterSummary(filters);
  }, [filters]);

  return {
    filters,
    setFilter,
    clearFilter,
    clearAllFilters,
    hasActiveFilters,
    filterSummary,
    buildQueryString,
  };
}

/**
 * Hook to manage search query state
 */
export function useCMSSearch() {
  const { filters, setFilter } = useCMSFilters();

  const searchQuery = filters.search || '';

  const setSearchQuery = useCallback((query: string) => {
    setFilter('search', query);
  }, [setFilter]);

  const clearSearch = useCallback(() => {
    setFilter('search', '');
  }, [setFilter]);

  return {
    searchQuery,
    setSearchQuery,
    clearSearch,
  };
}

/**
 * Hook to manage pagination state
 */
export function useCMSPagination() {
  const { filters, setFilter } = useCMSFilters();

  const page = filters.page || 1;
  const limit = filters.limit || 20;

  const setPage = useCallback((newPage: number) => {
    setFilter('page', newPage);
  }, [setFilter]);

  const setLimit = useCallback((newLimit: number) => {
    setFilter('limit', newLimit);
    setFilter('page', 1); // Reset to page 1 when changing limit
  }, [setFilter]);

  const nextPage = useCallback(() => {
    setFilter('page', page + 1);
  }, [page, setFilter]);

  const prevPage = useCallback(() => {
    if (page > 1) {
      setFilter('page', page - 1);
    }
  }, [page, setFilter]);

  return {
    page,
    limit,
    setPage,
    setLimit,
    nextPage,
    prevPage,
  };
}

/**
 * Hook to manage sorting state
 */
export function useCMSSorting() {
  const { filters, setFilter } = useCMSFilters();

  const sortBy = filters.sortBy || 'created';
  const sortOrder = filters.sortOrder || 'desc';

  const setSorting = useCallback((field: string, order: 'asc' | 'desc') => {
    setFilter('sortBy', field);
    setFilter('sortOrder', order);
  }, [setFilter]);

  const toggleSortOrder = useCallback(() => {
    setFilter('sortOrder', sortOrder === 'asc' ? 'desc' : 'asc');
  }, [sortOrder, setFilter]);

  return {
    sortBy,
    sortOrder,
    setSorting,
    toggleSortOrder,
  };
}

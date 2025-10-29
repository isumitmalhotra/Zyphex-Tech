/**
 * Bulk Selection Hook
 * Manages multi-select state for bulk operations
 */

'use client';

import { useState, useCallback, useMemo } from 'react';

export interface UseBulkSelectionOptions {
  onSelectionChange?: (selectedIds: string[]) => void;
}

export interface UseBulkSelectionReturn {
  selectedIds: string[];
  isSelected: (id: string) => boolean;
  isAllSelected: (ids: string[]) => boolean;
  isSomeSelected: (ids: string[]) => boolean;
  selectedCount: number;
  toggleSelection: (id: string) => void;
  toggleAll: (ids: string[]) => void;
  selectAll: (ids: string[]) => void;
  deselectAll: () => void;
  selectMultiple: (ids: string[]) => void;
  deselectMultiple: (ids: string[]) => void;
  reset: () => void;
}

/**
 * Hook for managing bulk selection state
 * 
 * @example
 * ```tsx
 * const { selectedIds, toggleSelection, toggleAll, selectedCount } = useBulkSelection();
 * 
 * return (
 *   <div>
 *     <input
 *       type="checkbox"
 *       checked={isAllSelected(itemIds)}
 *       onChange={() => toggleAll(itemIds)}
 *     />
 *     
 *     {items.map(item => (
 *       <input
 *         key={item.id}
 *         type="checkbox"
 *         checked={isSelected(item.id)}
 *         onChange={() => toggleSelection(item.id)}
 *       />
 *     ))}
 *     
 *     {selectedCount > 0 && (
 *       <button onClick={() => handleBulkDelete(selectedIds)}>
 *         Delete {selectedCount} items
 *       </button>
 *     )}
 *   </div>
 * );
 * ```
 */
export function useBulkSelection(
  options: UseBulkSelectionOptions = {}
): UseBulkSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Notify parent of selection changes
  const notifyChange = useCallback((ids: string[]) => {
    if (options.onSelectionChange) {
      options.onSelectionChange(ids);
    }
  }, [options]);

  // Check if a single item is selected
  const isSelected = useCallback((id: string): boolean => {
    return selectedIds.includes(id);
  }, [selectedIds]);

  // Check if all items are selected
  const isAllSelected = useCallback((ids: string[]): boolean => {
    if (ids.length === 0) return false;
    return ids.every(id => selectedIds.includes(id));
  }, [selectedIds]);

  // Check if some (but not all) items are selected
  const isSomeSelected = useCallback((ids: string[]): boolean => {
    if (ids.length === 0) return false;
    const selectedCount = ids.filter(id => selectedIds.includes(id)).length;
    return selectedCount > 0 && selectedCount < ids.length;
  }, [selectedIds]);

  // Toggle selection of a single item
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSelection = prev.includes(id)
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id];
      notifyChange(newSelection);
      return newSelection;
    });
  }, [notifyChange]);

  // Toggle selection of all items
  const toggleAll = useCallback((ids: string[]) => {
    setSelectedIds(prev => {
      const allSelected = ids.every(id => prev.includes(id));
      const newSelection = allSelected
        ? prev.filter(id => !ids.includes(id))
        : Array.from(new Set([...prev, ...ids]));
      notifyChange(newSelection);
      return newSelection;
    });
  }, [notifyChange]);

  // Select all items
  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(prev => {
      const newSelection = Array.from(new Set([...prev, ...ids]));
      notifyChange(newSelection);
      return newSelection;
    });
  }, [notifyChange]);

  // Deselect all items
  const deselectAll = useCallback(() => {
    setSelectedIds([]);
    notifyChange([]);
  }, [notifyChange]);

  // Select multiple specific items
  const selectMultiple = useCallback((ids: string[]) => {
    setSelectedIds(prev => {
      const newSelection = Array.from(new Set([...prev, ...ids]));
      notifyChange(newSelection);
      return newSelection;
    });
  }, [notifyChange]);

  // Deselect multiple specific items
  const deselectMultiple = useCallback((ids: string[]) => {
    setSelectedIds(prev => {
      const newSelection = prev.filter(id => !ids.includes(id));
      notifyChange(newSelection);
      return newSelection;
    });
  }, [notifyChange]);

  // Reset selection
  const reset = useCallback(() => {
    setSelectedIds([]);
    notifyChange([]);
  }, [notifyChange]);

  // Memoize selected count
  const selectedCount = useMemo(() => selectedIds.length, [selectedIds]);

  return {
    selectedIds,
    isSelected,
    isAllSelected,
    isSomeSelected,
    selectedCount,
    toggleSelection,
    toggleAll,
    selectAll,
    deselectAll,
    selectMultiple,
    deselectMultiple,
    reset
  };
}

/**
 * Hook for managing bulk operations with progress tracking
 * 
 * @example
 * ```tsx
 * const { executeOperation, isProcessing, progress } = useBulkOperation();
 * 
 * const handleBulkDelete = async () => {
 *   const result = await executeOperation({
 *     operation: 'delete',
 *     entityType: 'page',
 *     entityIds: selectedIds
 *   });
 *   
 *   if (result.success) {
 *     toast.success(`Deleted ${result.successCount} items`);
 *   }
 * };
 * ```
 */
export function useBulkOperation() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  const executeOperation = useCallback(async (
    request: {
      operation: string;
      entityType: 'page' | 'media' | 'section';
      entityIds: string[];
      data?: Record<string, unknown>;
      options?: {
        continueOnError?: boolean;
        batchSize?: number;
        parallel?: boolean;
      };
    }
  ) => {
    setIsProcessing(true);
    setProgress({ current: 0, total: request.entityIds.length });
    setError(null);

    try {
      const endpoint = `/api/cms/${request.entityType === 'page' ? 'pages' : request.entityType === 'media' ? 'media' : 'sections'}/bulk`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: request.operation,
          [`${request.entityType}Ids`]: request.entityIds,
          data: request.data,
          options: request.options
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Bulk operation failed');
      }

      const result = await response.json();
      setProgress({ current: result.data.totalItems, total: result.data.totalItems });
      
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    executeOperation,
    isProcessing,
    progress,
    error,
    reset: () => {
      setProgress({ current: 0, total: 0 });
      setError(null);
    }
  };
}

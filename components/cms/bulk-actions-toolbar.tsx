/**
 * Bulk Actions Toolbar
 * Displays action buttons when items are selected for bulk operations
 */

'use client';

import React, { useState } from 'react';
import {
  Trash2,
  Archive,
  CheckCircle,
  XCircle,
  Copy,
  FolderInput,
  Tag,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface BulkAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  requireConfirm?: boolean;
  confirmMessage?: string;
}

export interface BulkActionsToolbarProps {
  selectedCount: number;
  onAction: (actionId: string) => void;
  onClearSelection: () => void;
  actions?: BulkAction[];
  entityType?: 'page' | 'media' | 'section';
  className?: string;
  isProcessing?: boolean;
}

const defaultPageActions: BulkAction[] = [
  {
    id: 'publish',
    label: 'Publish',
    icon: <CheckCircle className="w-4 h-4" />,
    variant: 'default'
  },
  {
    id: 'unpublish',
    label: 'Unpublish',
    icon: <XCircle className="w-4 h-4" />,
    variant: 'secondary'
  },
  {
    id: 'archive',
    label: 'Archive',
    icon: <Archive className="w-4 h-4" />,
    variant: 'secondary',
    requireConfirm: true,
    confirmMessage: 'Are you sure you want to archive the selected pages?'
  },
  {
    id: 'duplicate',
    label: 'Duplicate',
    icon: <Copy className="w-4 h-4" />,
    variant: 'outline'
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: <Trash2 className="w-4 h-4" />,
    variant: 'destructive',
    requireConfirm: true,
    confirmMessage: 'Are you sure you want to delete the selected pages? This action cannot be undone.'
  }
];

const defaultMediaActions: BulkAction[] = [
  {
    id: 'move',
    label: 'Move to Folder',
    icon: <FolderInput className="w-4 h-4" />,
    variant: 'default'
  },
  {
    id: 'tag',
    label: 'Add Tags',
    icon: <Tag className="w-4 h-4" />,
    variant: 'outline'
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: <Trash2 className="w-4 h-4" />,
    variant: 'destructive',
    requireConfirm: true,
    confirmMessage: 'Are you sure you want to delete the selected media? This action cannot be undone.'
  }
];

const defaultSectionActions: BulkAction[] = [
  {
    id: 'duplicate',
    label: 'Duplicate',
    icon: <Copy className="w-4 h-4" />,
    variant: 'default'
  },
  {
    id: 'move',
    label: 'Move to Page',
    icon: <FolderInput className="w-4 h-4" />,
    variant: 'outline'
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: <Trash2 className="w-4 h-4" />,
    variant: 'destructive',
    requireConfirm: true,
    confirmMessage: 'Are you sure you want to delete the selected sections? This action cannot be undone.'
  }
];

/**
 * Bulk Actions Toolbar Component
 * Shows action buttons when items are selected
 * 
 * @example
 * ```tsx
 * <BulkActionsToolbar
 *   selectedCount={selectedIds.length}
 *   onAction={handleBulkAction}
 *   onClearSelection={deselectAll}
 *   entityType="page"
 *   isProcessing={isProcessing}
 * />
 * ```
 */
export function BulkActionsToolbar({
  selectedCount,
  onAction,
  onClearSelection,
  actions,
  entityType = 'page',
  className,
  isProcessing = false
}: BulkActionsToolbarProps) {
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  // Get default actions based on entity type
  const defaultActions = entityType === 'page'
    ? defaultPageActions
    : entityType === 'media'
    ? defaultMediaActions
    : defaultSectionActions;

  const effectiveActions = actions || defaultActions;

  const handleAction = (action: BulkAction) => {
    if (action.requireConfirm) {
      setConfirmAction(action.id);
    } else {
      onAction(action.id);
    }
  };

  const handleConfirm = () => {
    if (confirmAction) {
      onAction(confirmAction);
      setConfirmAction(null);
    }
  };

  const handleCancel = () => {
    setConfirmAction(null);
  };

  if (selectedCount === 0) {
    return null;
  }

  const confirmingAction = effectiveActions.find(a => a.id === confirmAction);

  return (
    <>
      <div
        className={cn(
          'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
          'bg-background border border-border rounded-lg shadow-lg',
          'px-4 py-3 flex items-center gap-4',
          'animate-in slide-in-from-bottom-4',
          className
        )}
      >
        {/* Selection count */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {selectedCount} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={isProcessing}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-border" />

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {effectiveActions.map((action, index) => {
            // Show first 3 actions as buttons, rest in dropdown
            if (index < 3) {
              return (
                <Button
                  key={action.id}
                  variant={action.variant || 'outline'}
                  size="sm"
                  onClick={() => handleAction(action)}
                  disabled={isProcessing}
                  className="gap-2"
                >
                  {action.icon}
                  {action.label}
                </Button>
              );
            }
            return null;
          })}

          {/* More actions dropdown */}
          {effectiveActions.length > 3 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isProcessing}>
                  More
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {effectiveActions.slice(3).map((action, index) => (
                  <React.Fragment key={action.id}>
                    {index > 0 && action.variant === 'destructive' && (
                      <DropdownMenuSeparator />
                    )}
                    <DropdownMenuItem
                      onClick={() => handleAction(action)}
                      disabled={isProcessing}
                      className={cn(
                        action.variant === 'destructive' && 'text-destructive focus:text-destructive'
                      )}
                    >
                      {action.icon}
                      <span className="ml-2">{action.label}</span>
                    </DropdownMenuItem>
                  </React.Fragment>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Confirmation dialog */}
      {confirmingAction && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
            <div className="bg-background border border-border rounded-lg shadow-lg p-6 max-w-md">
              <h3 className="text-lg font-semibold mb-2">Confirm Action</h3>
              <p className="text-sm text-muted-foreground mb-6">
                {confirmingAction.confirmMessage || 'Are you sure you want to perform this action?'}
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  variant={confirmingAction.variant || 'default'}
                  onClick={handleConfirm}
                  disabled={isProcessing}
                >
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

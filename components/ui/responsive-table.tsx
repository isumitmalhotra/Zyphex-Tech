/**
 * Responsive Table Component
 * Automatically switches between table and card layout based on screen size
 * Uses CSS-based responsive design to avoid SSR/hydration mismatches
 */

'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface ResponsiveTableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  mobileLabel?: string; // Custom label for mobile view
  hideOnMobile?: boolean; // Hide this column on mobile card view
  className?: string;
}

export interface ResponsiveTableProps<T> {
  data: T[];
  columns: ResponsiveTableColumn<T>[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  className?: string;
  mobileCardRender?: (item: T) => React.ReactNode; // Custom mobile card renderer
}

export function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  emptyMessage = 'No data available',
  className,
  mobileCardRender,
}: ResponsiveTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  // Render both views, use CSS to show/hide based on viewport
  return (
    <div data-testid="responsive-table" className={className}>
      {/* Mobile card view - visible only on mobile (< 768px) */}
      <div data-testid="table-card-view" className="md:hidden space-y-3">
        {data.map((item) => (
          <Card
            key={keyExtractor(item)}
            data-testid="table-card"
            className={cn(
              'cursor-pointer hover:shadow-md transition-shadow',
              onRowClick && 'active:scale-[0.98]'
            )}
            onClick={() => onRowClick?.(item)}
          >
            <CardContent className="p-4">
              {mobileCardRender ? (
                mobileCardRender(item)
              ) : (
                <div className="space-y-2">
                  {columns
                    .filter((col) => !col.hideOnMobile)
                    .map((column) => (
                      <div key={column.key} className="flex justify-between items-start gap-4">
                        <span className="text-sm font-medium text-muted-foreground min-w-[100px]">
                          {column.mobileLabel || column.label}
                        </span>
                        <span className="text-sm text-right flex-1">
                          {column.render
                            ? column.render(item)
                            : String((item as Record<string, unknown>)[column.key] || '-')}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop table view - visible only on tablet/desktop (≥ 768px) */}
      <div data-testid="table-table-view" className="hidden md:block rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className={column.className}>
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow
                key={keyExtractor(item)}
                className={cn(onRowClick && 'cursor-pointer')}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column) => (
                  <TableCell key={column.key} className={column.className}>
                    {column.render
                      ? column.render(item)
                      : String((item as Record<string, unknown>)[column.key] || '-')}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

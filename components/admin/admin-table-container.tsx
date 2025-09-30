"use client"

import React from 'react'
import { cn } from '@/lib/utils'

interface AdminTableContainerProps {
  children: React.ReactNode
  className?: string
  /**
   * Optional minimum width for the table content
   * Defaults to 'min-w-max' for responsive tables
   */
  minWidth?: string
}

/**
 * AdminTableContainer - A specialized container for tables in admin pages
 * 
 * This component ensures that horizontally scrolling tables stay within
 * the admin content area and don't overlap with the sidebar. It provides:
 * 
 * - Proper horizontal scrolling with custom scrollbar styling
 * - Z-index management to prevent sidebar overlap
 * - Responsive behavior that adapts to different screen sizes
 * - Consistent spacing and padding
 * 
 * Usage:
 * ```tsx
 * <AdminTableContainer>
 *   <Table>
 *     <TableHeader>...</TableHeader>
 *     <TableBody>...</TableBody>
 *   </Table>
 * </AdminTableContainer>
 * ```
 */
export function AdminTableContainer({ 
  children, 
  className, 
  minWidth = 'min-w-max' 
}: AdminTableContainerProps) {
  return (
    <div className="p-0">
      <div className={cn("admin-table-container", className)}>
        <div className={cn("p-4", minWidth)}>
          {children}
        </div>
      </div>
    </div>
  )
}

export default AdminTableContainer
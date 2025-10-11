import React from 'react';

/**
 * Reusable Loading Skeleton Components
 * 
 * A comprehensive collection of skeleton loading components that can be used
 * throughout the application for consistent loading states.
 * 
 * Features:
 * - Consistent design language
 * - Responsive layouts
 * - Dark mode support
 * - Accessibility compliance
 * - Smooth animations
 * - TypeScript support
 */

// Base animation classes for consistent timing
const SKELETON_ANIMATION = 'animate-pulse';
const SKELETON_BASE = 'bg-slate-200 dark:bg-slate-700 rounded';
const SKELETON_CONTENT = 'bg-slate-200 dark:bg-slate-600 rounded';

/**
 * Basic Skeleton Elements
 */
export function SkeletonLine({ 
  width = 'w-full', 
  height = 'h-4', 
  className = '' 
}: { 
  width?: string; 
  height?: string; 
  className?: string; 
}) {
  return <div className={`${SKELETON_BASE} ${width} ${height} ${SKELETON_ANIMATION} ${className}`}></div>;
}

export function SkeletonCircle({ 
  size = 'w-10 h-10', 
  className = '' 
}: { 
  size?: string; 
  className?: string; 
}) {
  return <div className={`${SKELETON_BASE} ${size} rounded-full ${SKELETON_ANIMATION} ${className}`}></div>;
}

export function SkeletonBox({ 
  width = 'w-full', 
  height = 'h-32', 
  className = '' 
}: { 
  width?: string; 
  height?: string; 
  className?: string; 
}) {
  return <div className={`${SKELETON_BASE} ${width} ${height} ${SKELETON_ANIMATION} ${className}`}></div>;
}

/**
 * Card Skeletons
 */
export function CardSkeleton({ 
  showHeader = true, 
  showFooter = true, 
  linesCount = 3,
  className = '' 
}: {
  showHeader?: boolean;
  showFooter?: boolean;
  linesCount?: number;
  className?: string;
}) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 space-y-4 ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between">
          <SkeletonLine width="w-32" height="h-6" />
          <SkeletonLine width="w-20" height="h-5" />
        </div>
      )}
      
      <div className="space-y-3">
        {[...Array(linesCount)].map((_, i) => (
          <SkeletonLine 
            key={i} 
            width={i === linesCount - 1 ? 'w-3/4' : 'w-full'} 
            height="h-4" 
          />
        ))}
      </div>
      
      {showFooter && (
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-2">
            <SkeletonCircle size="w-6 h-6" />
            <SkeletonLine width="w-20" height="h-4" />
          </div>
          <SkeletonLine width="w-16" height="h-4" />
        </div>
      )}
    </div>
  );
}

export function StatCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 space-y-4 ${className}`}>
      {/* Icon */}
      <SkeletonBox width="w-12 h-12" height="h-12" className="rounded-lg" />
      
      {/* Value */}
      <SkeletonLine width="w-20" height="h-8" />
      
      {/* Label */}
      <SkeletonLine width="w-24" height="h-4" />
      
      {/* Change indicator */}
      <div className="flex items-center space-x-2">
        <SkeletonBox width="w-4 h-4" height="h-4" className="rounded" />
        <SkeletonLine width="w-16" height="h-4" />
      </div>
    </div>
  );
}

/**
 * Table Skeletons
 */
export function TableSkeleton({ 
  rows = 5, 
  columns = 4, 
  showHeader = true,
  className = '' 
}: {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
}) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 ${className}`}>
      {/* Table Header */}
      {showHeader && (
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <SkeletonLine width="w-40" height="h-6" />
            <div className="flex items-center space-x-3">
              <SkeletonLine width="w-24" height="h-8" />
              <SkeletonLine width="w-32" height="h-8" />
            </div>
          </div>
        </div>
      )}
      
      {/* Table Body */}
      <div className="divide-y divide-slate-200 dark:divide-slate-700">
        {[...Array(rows)].map((_, rowIndex) => (
          <div key={rowIndex} className="p-4 flex items-center space-x-4">
            {/* Checkbox */}
            <SkeletonBox width="w-4 h-4" height="h-4" />
            
            {/* Table columns */}
            {[...Array(columns)].map((_, colIndex) => (
              <SkeletonLine 
                key={colIndex} 
                width={colIndex === 0 ? 'w-32' : colIndex === 1 ? 'w-24' : colIndex === 2 ? 'w-20' : 'w-16'} 
                height="h-4" 
              />
            ))}
            
            {/* Actions */}
            <div className="ml-auto flex items-center space-x-2">
              <SkeletonBox width="w-8 h-8" height="h-8" />
              <SkeletonBox width="w-8 h-8" height="h-8" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DataTableSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and filters */}
      <div className="flex items-center justify-between">
        <SkeletonLine width="w-64" height="h-10" />
        <div className="flex items-center space-x-3">
          <SkeletonLine width="w-32" height="h-10" />
          <SkeletonLine width="w-24" height="h-10" />
        </div>
      </div>
      
      {/* Table */}
      <TableSkeleton rows={8} columns={5} />
      
      {/* Pagination */}
      <div className="flex items-center justify-between">
        <SkeletonLine width="w-32" height="h-5" />
        <div className="flex items-center space-x-2">
          {[...Array(5)].map((_, i) => (
            <SkeletonBox key={i} width="w-8 h-8" height="h-8" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Form Skeletons
 */
export function FormSkeleton({ 
  fields = 4, 
  showSubmit = true,
  className = '' 
}: {
  fields?: number;
  showSubmit?: boolean;
  className?: string;
}) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 space-y-6 ${className}`}>
      {/* Form Header */}
      <div className="space-y-2">
        <SkeletonLine width="w-48" height="h-7" />
        <SkeletonLine width="w-64" height="h-4" />
      </div>
      
      {/* Form Fields */}
      <div className="space-y-4">
        {[...Array(fields)].map((_, i) => (
          <div key={i} className="space-y-2">
            <SkeletonLine width="w-24" height="h-5" />
            <SkeletonLine width="w-full" height="h-10" />
            {i % 3 === 0 && <SkeletonLine width="w-48" height="h-3" />}
          </div>
        ))}
      </div>
      
      {/* Form Actions */}
      {showSubmit && (
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <SkeletonLine width="w-20" height="h-10" />
          <SkeletonLine width="w-24" height="h-10" />
        </div>
      )}
    </div>
  );
}

export function SearchFormSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 ${className}`}>
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <SkeletonLine width="w-full" height="h-10" />
        </div>
        <SkeletonLine width="w-24" height="h-10" />
        <SkeletonLine width="w-20" height="h-10" />
      </div>
    </div>
  );
}

/**
 * Dashboard Skeletons
 */
export function DashboardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonLine width="w-48" height="h-8" />
          <SkeletonLine width="w-64" height="h-5" />
        </div>
        <div className="flex items-center space-x-3">
          <SkeletonLine width="w-24" height="h-10" />
          <SkeletonLine width="w-32" height="h-10" />
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2">
          <ChartSkeleton />
        </div>
        
        {/* Side Panel */}
        <CardSkeleton linesCount={6} />
      </div>
      
      {/* Data Table */}
      <DataTableSkeleton />
    </div>
  );
}

export function ChartSkeleton({ 
  height = 'h-80', 
  showHeader = true,
  className = '' 
}: {
  height?: string;
  showHeader?: boolean;
  className?: string;
}) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 space-y-4 ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <SkeletonLine width="w-48" height="h-6" />
            <SkeletonLine width="w-32" height="h-4" />
          </div>
          <div className="flex items-center space-x-2">
            <SkeletonLine width="w-24" height="h-8" />
            <SkeletonBox width="w-8 h-8" height="h-8" />
          </div>
        </div>
      )}
      
      {/* Chart Area */}
      <div className={`${SKELETON_BASE} ${height} ${SKELETON_ANIMATION} relative overflow-hidden`}>
        {/* Chart bars simulation */}
        <div className="absolute inset-4 flex items-end justify-between">
          {[...Array(12)].map((_, i) => (
            <div 
              key={i} 
              className="bg-blue-300 dark:bg-blue-600 rounded-t animate-pulse"
              style={{ 
                width: '6%', 
                height: `${Math.random() * 60 + 20}%`,
                animationDelay: `${i * 0.1}s`
              }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * List Skeletons
 */
export function ListSkeleton({ 
  items = 5, 
  showAvatar = true, 
  showActions = true,
  className = '' 
}: {
  items?: number;
  showAvatar?: boolean;
  showActions?: boolean;
  className?: string;
}) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-700 ${className}`}>
      {[...Array(items)].map((_, i) => (
        <div key={i} className="p-4 flex items-center space-x-4">
          {showAvatar && <SkeletonCircle size="w-10 h-10" />}
          
          <div className="flex-1 space-y-2">
            <SkeletonLine width="w-3/4" height="h-4" />
            <SkeletonLine width="w-1/2" height="h-3" />
          </div>
          
          {showActions && (
            <div className="flex items-center space-x-2">
              <SkeletonBox width="w-8 h-8" height="h-8" />
              <SkeletonBox width="w-8 h-8" height="h-8" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function NotificationListSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-start space-x-3 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
          <SkeletonBox width="w-8 h-8" height="h-8" className="rounded mt-0.5" />
          <div className="flex-1 space-y-2">
            <SkeletonLine width="w-full" height="h-4" />
            <SkeletonLine width="w-2/3" height="h-3" />
            <SkeletonLine width="w-20" height="h-3" />
          </div>
          <SkeletonBox width="w-6 h-6" height="h-6" />
        </div>
      ))}
    </div>
  );
}

/**
 * Profile Skeletons
 */
export function ProfileSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 ${className}`}>
      {/* Cover Image */}
      <SkeletonBox width="w-full" height="h-32" className="rounded-t-lg" />
      
      <div className="p-6 space-y-6">
        {/* Profile Header */}
        <div className="flex items-center space-x-4 -mt-16">
          <SkeletonCircle size="w-24 h-24" className="border-4 border-white dark:border-slate-800" />
          <div className="flex-1 space-y-2 mt-12">
            <SkeletonLine width="w-48" height="h-7" />
            <SkeletonLine width="w-32" height="h-5" />
            <SkeletonLine width="w-40" height="h-4" />
          </div>
          <div className="mt-12">
            <SkeletonLine width="w-24" height="h-10" />
          </div>
        </div>
        
        {/* Profile Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="text-center space-y-1">
              <SkeletonLine width="w-16 mx-auto" height="h-6" />
              <SkeletonLine width="w-20 mx-auto" height="h-4" />
            </div>
          ))}
        </div>
        
        {/* Profile Content */}
        <div className="space-y-4">
          <SkeletonLine width="w-24" height="h-6" />
          <SkeletonLine width="w-full" height="h-4" />
          <SkeletonLine width="w-3/4" height="h-4" />
          <SkeletonLine width="w-5/6" height="h-4" />
        </div>
      </div>
    </div>
  );
}

/**
 * Navigation Skeletons
 */
export function NavigationSkeleton({ items = 6, className = '' }: { items?: number; className?: string }) {
  return (
    <nav className={`space-y-2 ${className}`}>
      {[...Array(items)].map((_, i) => (
        <div key={i} className="flex items-center space-x-3 px-3 py-2">
          <SkeletonBox width="w-5 h-5" height="h-5" />
          <SkeletonLine width="w-20" height="h-4" />
        </div>
      ))}
    </nav>
  );
}

/**
 * Specialized Loading States
 */
export function LoadingStateWrapper({ 
  children,
  isLoading,
  skeleton,
  className = ''
}: {
  children: React.ReactNode;
  isLoading: boolean;
  skeleton: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {isLoading ? skeleton : children}
    </div>
  );
}

// Export all components for easy importing
export {
  SKELETON_ANIMATION,
  SKELETON_BASE,
  SKELETON_CONTENT
};
import React from 'react';

/**
 * Admin Panel Loading Component
 * 
 * Specialized loading state for admin routes with admin-specific layout elements.
 * Features comprehensive admin dashboard skeleton with metrics, charts, and data tables.
 */
export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Admin Header Skeleton */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Admin title */}
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 bg-red-200 dark:bg-red-800 rounded animate-pulse"></div>
            <div className="space-y-1">
              <div className="h-7 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            </div>
          </div>
          
          {/* Right side - Admin actions */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-28 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse"></div>
            <div className="h-10 w-32 bg-red-200 dark:bg-red-800 rounded-md animate-pulse"></div>
            <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Admin Navigation Tabs Skeleton */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6">
        <div className="flex space-x-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="py-4">
              <div className={`h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse ${
                i === 0 ? 'w-20' : i === 1 ? 'w-16' : i === 2 ? 'w-24' : i === 3 ? 'w-18' : i === 4 ? 'w-22' : 'w-14'
              }`}></div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Admin Content */}
      <div className="p-6 space-y-8">
        {/* Admin Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { color: 'blue', label: 'Total Users' },
            { color: 'green', label: 'Active Projects' },
            { color: 'yellow', label: 'Revenue' },
            { color: 'red', label: 'System Status' }
          ].map((metric, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="space-y-4">
                {/* Metric icon */}
                <div className={`h-12 w-12 bg-${metric.color}-200 dark:bg-${metric.color}-800 rounded-lg animate-pulse`}></div>
                
                {/* Large metric value */}
                <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                
                {/* Metric label */}
                <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                
                {/* Trend indicator */}
                <div className="flex items-center space-x-2">
                  <div className={`h-4 w-4 bg-${metric.color}-200 dark:bg-${metric.color}-800 rounded animate-pulse`}></div>
                  <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Admin Charts and Analytics Row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Analytics Chart */}
          <div className="xl:col-span-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="space-y-6">
              {/* Chart Header */}
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                  <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                  <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                </div>
              </div>
              
              {/* Chart Area */}
              <div className="h-80 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse relative overflow-hidden">
                {/* Chart lines simulation */}
                <div className="absolute inset-4 flex items-end justify-between">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center space-y-2">
                      <div 
                        className="bg-blue-300 dark:bg-blue-600 rounded-t animate-pulse"
                        style={{ 
                          width: '20px', 
                          height: `${Math.random() * 120 + 40}px`,
                          animationDelay: `${i * 0.1}s`
                        }}
                      ></div>
                      <div className="h-3 w-8 bg-slate-300 dark:bg-slate-600 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* System Status Panel */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="space-y-6">
              {/* Header */}
              <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
              
              {/* Status Items */}
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                    <div className="flex items-center space-x-3">
                      <div className={`h-3 w-3 rounded-full animate-pulse ${
                        i % 3 === 0 ? 'bg-green-400' : i % 3 === 1 ? 'bg-yellow-400' : 'bg-red-400'
                      }`}></div>
                      <div className="h-4 w-24 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                    </div>
                    <div className="h-4 w-12 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
              
              {/* Action Button */}
              <div className="h-10 w-full bg-blue-200 dark:bg-blue-800 rounded-md animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Admin Data Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users Table */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            {/* Table Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
              </div>
            </div>
            
            {/* Table Rows */}
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-4 flex items-center space-x-4">
                  <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                  </div>
                  <div className="h-6 w-16 bg-green-200 dark:bg-green-800 rounded-full animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity Table */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            {/* Table Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="h-6 w-36 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
              </div>
            </div>
            
            {/* Activity Items */}
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-4 flex items-start space-x-3">
                  <div className="h-8 w-8 bg-blue-200 dark:bg-blue-800 rounded animate-pulse mt-1"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Loading Indicator */}
      <div className="fixed bottom-6 right-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-4 flex items-center space-x-3">
          <div className="h-5 w-5 border-2 border-slate-200 dark:border-slate-600 border-t-red-500 rounded-full animate-spin"></div>
          <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Loading admin panel...</span>
        </div>
      </div>
    </div>
  );
}
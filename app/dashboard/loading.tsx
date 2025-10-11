import React from 'react';

/**
 * Dashboard Loading Component
 * 
 * Specialized loading state for the main dashboard route.
 * Features dashboard-specific skeleton elements and layout.
 */
export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header Skeleton */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Title skeleton */}
          <div className="space-y-2">
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse"></div>
            <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
          </div>
          
          {/* Right side - Actions skeleton */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse"></div>
            <div className="h-10 w-32 bg-blue-200 dark:bg-blue-800 rounded-md animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="p-6 space-y-6">
        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="space-y-3">
                {/* Icon placeholder */}
                <div className="h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                
                {/* Value placeholder */}
                <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                
                {/* Label placeholder */}
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                
                {/* Change indicator placeholder */}
                <div className="h-4 w-16 bg-green-200 dark:bg-green-800 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts and Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart Skeleton */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="space-y-4">
              {/* Chart Header */}
              <div className="flex items-center justify-between">
                <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
              </div>
              
              {/* Chart Area */}
              <div className="h-64 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse flex items-end justify-center space-x-2 p-4">
                {[...Array(7)].map((_, i) => (
                  <div 
                    key={i} 
                    className="bg-blue-200 dark:bg-blue-800 rounded-t animate-pulse"
                    style={{ 
                      width: '12%', 
                      height: `${Math.random() * 60 + 20}%`,
                      animationDelay: `${i * 0.1}s`
                    }}
                  ></div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions/Recent Activity */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="h-6 w-36 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
              </div>
              
              {/* List Items */}
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                    {/* Avatar */}
                    <div className="h-10 w-10 bg-slate-200 dark:bg-slate-600 rounded-full animate-pulse"></div>
                    
                    {/* Content */}
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                      <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                    </div>
                    
                    {/* Time */}
                    <div className="h-3 w-12 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Data Table Skeleton */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          {/* Table Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse"></div>
                <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse"></div>
              </div>
            </div>
          </div>
          
          {/* Table Content */}
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-6 flex items-center space-x-4">
                {/* Checkbox */}
                <div className="h-4 w-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                
                {/* Main content columns */}
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                <div className="h-6 w-16 bg-green-200 dark:bg-green-800 rounded-full animate-pulse"></div>
                
                {/* Actions */}
                <div className="ml-auto flex items-center space-x-2">
                  <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                  <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Loading State Indicator */}
      <div className="fixed bottom-6 right-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-4 flex items-center space-x-3">
          <div className="h-5 w-5 border-2 border-slate-200 dark:border-slate-600 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Loading dashboard...</span>
        </div>
      </div>
    </div>
  );
}
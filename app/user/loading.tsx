import React from 'react';

/**
 * User Dashboard Loading Component
 * 
 * Specialized loading state for user-specific dashboard routes.
 * Features user-centric layout with projects, notifications, and personal data.
 */
export default function UserLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* User Header Skeleton */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-6">
        <div className="flex items-center justify-between">
          {/* Left side - User welcome */}
          <div className="flex items-center space-x-4">
            {/* User avatar */}
            <div className="h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-7 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            </div>
          </div>
          
          {/* Right side - User actions */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse"></div>
            <div className="h-10 w-32 bg-blue-200 dark:bg-blue-800 rounded-md animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Main User Content */}
      <div className="p-6 space-y-6">
        {/* User Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { color: 'blue', label: 'My Projects' },
            { color: 'green', label: 'Completed' },
            { color: 'yellow', label: 'In Progress' },
            { color: 'purple', label: 'Messages' }
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="space-y-3">
                {/* Icon */}
                <div className={`h-10 w-10 bg-${stat.color}-200 dark:bg-${stat.color}-800 rounded-lg animate-pulse`}></div>
                
                {/* Value */}
                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                
                {/* Label */}
                <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        {/* User Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Projects */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
              </div>
              
              {/* Project Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3">
                    {/* Project header */}
                    <div className="flex items-center justify-between">
                      <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                      <div className="h-6 w-16 bg-green-200 dark:bg-green-800 rounded-full animate-pulse"></div>
                    </div>
                    
                    {/* Project description */}
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                      <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                        <div className="h-3 w-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                      </div>
                      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-300 dark:bg-blue-600 rounded-full animate-pulse"
                          style={{ width: `${Math.random() * 60 + 20}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Project footer */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center space-x-2">
                        <div className="h-6 w-6 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
                        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                      </div>
                      <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="space-y-6">
            {/* Notifications */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="h-6 w-28 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                  <div className="h-6 w-6 bg-red-200 dark:bg-red-800 rounded-full animate-pulse"></div>
                </div>
                
                {/* Notification items */}
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                      <div className="h-8 w-8 bg-blue-200 dark:bg-blue-800 rounded animate-pulse mt-0.5"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-full bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                        <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                        <div className="h-3 w-12 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* View all button */}
                <div className="h-8 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="h-6 w-28 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                
                {/* Action buttons */}
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <div className="h-8 w-8 bg-blue-200 dark:bg-blue-800 rounded animate-pulse"></div>
                      <div className="flex-1 space-y-1">
                        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                        <div className="h-3 w-32 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                      </div>
                      <div className="h-5 w-5 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* User Profile Summary */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                
                {/* Profile info */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-3 w-3 bg-green-400 rounded-full animate-pulse"></div>
                    <div className="h-4 w-20 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="h-3 w-3 bg-blue-400 rounded-full animate-pulse"></div>
                    <div className="h-4 w-28 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="h-3 w-3 bg-yellow-400 rounded-full animate-pulse"></div>
                    <div className="h-4 w-24 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                  </div>
                </div>
                
                {/* Profile action */}
                <div className="h-8 w-full bg-blue-200 dark:bg-blue-800 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Loading Indicator */}
      <div className="fixed bottom-6 right-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-4 flex items-center space-x-3">
          <div className="h-5 w-5 border-2 border-slate-200 dark:border-slate-600 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Loading your dashboard...</span>
        </div>
      </div>
    </div>
  );
}
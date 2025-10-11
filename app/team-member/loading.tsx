import React from 'react';

/**
 * Team Member Dashboard Loading Component
 * 
 * Specialized loading state for team member routes.
 * Features task management, collaboration tools, and personal productivity views.
 */
export default function TeamMemberLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Team Member Header Skeleton */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-6">
        <div className="flex items-center justify-between">
          {/* Left side - Team member welcome */}
          <div className="flex items-center space-x-4">
            {/* Member avatar */}
            <div className="h-12 w-12 bg-gradient-to-r from-green-200 to-teal-200 dark:from-green-800 dark:to-teal-800 rounded-full animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-7 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            </div>
          </div>
          
          {/* Right side - Member actions */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse"></div>
            <div className="h-10 w-28 bg-green-200 dark:bg-green-800 rounded-md animate-pulse"></div>
            <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Main Team Member Content */}
      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { color: 'blue', label: 'My Tasks' },
            { color: 'green', label: 'Completed Today' },
            { color: 'yellow', label: 'In Progress' },
            { color: 'purple', label: 'Team Projects' }
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="space-y-3">
                {/* Icon */}
                <div className={`h-10 w-10 bg-${stat.color}-200 dark:bg-${stat.color}-800 rounded-lg animate-pulse`}></div>
                
                {/* Value */}
                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                
                {/* Label */}
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                
                {/* Change indicator */}
                <div className="flex items-center space-x-1">
                  <div className={`h-3 w-3 bg-${stat.color}-400 rounded animate-pulse`}></div>
                  <div className="h-3 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Task Board */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="h-6 w-28 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                  <div className="h-8 w-24 bg-green-200 dark:bg-green-800 rounded animate-pulse"></div>
                </div>
              </div>
              
              {/* Task Sections */}
              <div className="space-y-6">
                {/* Today's Tasks */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    <div className="h-6 w-6 bg-red-200 dark:bg-red-800 rounded-full animate-pulse"></div>
                  </div>
                  
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                        {/* Checkbox */}
                        <div className="h-5 w-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                        
                        {/* Task content */}
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-full bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                          <div className="flex items-center space-x-4">
                            <div className="h-3 w-20 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                            <div className="h-5 w-12 bg-blue-200 dark:bg-blue-800 rounded-full animate-pulse"></div>
                            <div className="h-3 w-16 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                          </div>
                        </div>
                        
                        {/* Priority */}
                        <div className={`h-3 w-3 rounded-full animate-pulse ${
                          i % 3 === 0 ? 'bg-red-400' : i % 3 === 1 ? 'bg-yellow-400' : 'bg-green-400'
                        }`}></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* This Week's Tasks */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="h-5 w-28 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    <div className="h-6 w-6 bg-blue-200 dark:bg-blue-800 rounded-full animate-pulse"></div>
                  </div>
                  
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                        {/* Checkbox */}
                        <div className="h-5 w-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                        
                        {/* Task content */}
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                          <div className="flex items-center space-x-4">
                            <div className="h-3 w-24 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                            <div className="h-5 w-16 bg-purple-200 dark:bg-purple-800 rounded-full animate-pulse"></div>
                            <div className="h-3 w-12 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                          </div>
                        </div>
                        
                        {/* Priority */}
                        <div className={`h-3 w-3 rounded-full animate-pulse ${
                          i % 2 === 0 ? 'bg-yellow-400' : 'bg-green-400'
                        }`}></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Time Tracking */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="h-6 w-28 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                  <div className="h-8 w-16 bg-green-200 dark:bg-green-800 rounded animate-pulse"></div>
                </div>
                
                {/* Time display */}
                <div className="text-center space-y-2">
                  <div className="h-12 w-32 mx-auto bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                  <div className="h-4 w-24 mx-auto bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                </div>
                
                {/* Current task */}
                <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-2">
                  <div className="h-4 w-full bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                  <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                </div>
                
                {/* Controls */}
                <div className="flex items-center space-x-2">
                  <div className="h-10 w-10 bg-green-200 dark:bg-green-800 rounded-full animate-pulse"></div>
                  <div className="h-10 w-10 bg-red-200 dark:bg-red-800 rounded-full animate-pulse"></div>
                  <div className="h-10 w-10 bg-yellow-200 dark:bg-yellow-800 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Today's Schedule */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                
                {/* Schedule items */}
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                      <div className="h-8 w-12 bg-blue-200 dark:bg-blue-800 rounded animate-pulse"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-full bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                        <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                      </div>
                      <div className={`h-3 w-3 rounded-full animate-pulse ${
                        i % 3 === 0 ? 'bg-green-400' : i % 3 === 1 ? 'bg-yellow-400' : 'bg-blue-400'
                      }`}></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Team Activity */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="h-6 w-28 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                
                {/* Activity items */}
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-start space-x-3">
                      <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse mt-0.5"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-full bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                        <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                        <div className="h-3 w-16 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
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
                <div className="grid grid-cols-2 gap-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center space-y-2 p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div className="h-8 w-8 bg-blue-200 dark:bg-blue-800 rounded animate-pulse"></div>
                      <div className="h-3 w-16 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Member Loading Indicator */}
      <div className="fixed bottom-6 right-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-4 flex items-center space-x-3">
          <div className="h-5 w-5 border-2 border-slate-200 dark:border-slate-600 border-t-green-500 rounded-full animate-spin"></div>
          <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Loading workspace...</span>
        </div>
      </div>
    </div>
  );
}
import React from 'react';

/**
 * Project Manager Dashboard Loading Component
 * 
 * Specialized loading state for project manager routes.
 * Features project management tools, team coordination, and resource allocation views.
 */
export default function ProjectManagerLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Project Manager Header Skeleton */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-6">
        <div className="flex items-center justify-between">
          {/* Left side - PM welcome */}
          <div className="flex items-center space-x-4">
            {/* PM badge */}
            <div className="h-12 w-12 bg-gradient-to-r from-purple-200 to-pink-200 dark:from-purple-800 dark:to-pink-800 rounded-lg animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-7 w-44 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
              <div className="h-4 w-36 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            </div>
          </div>
          
          {/* Right side - PM actions */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse"></div>
            <div className="h-10 w-28 bg-purple-200 dark:bg-purple-800 rounded-md animate-pulse"></div>
            <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* PM Navigation */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6">
        <div className="flex space-x-8">
          {['Dashboard', 'Projects', 'Team', 'Resources', 'Reports', 'Calendar'].map((_, i) => (
            <div key={i} className="py-4">
              <div className={`h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse ${
                i === 0 ? 'w-20' : i === 1 ? 'w-16' : i === 2 ? 'w-12' : i === 3 ? 'w-20' : i === 4 ? 'w-16' : 'w-18'
              }`}></div>
            </div>
          ))}
        </div>
      </div>

      {/* Main PM Content */}
      <div className="p-6 space-y-6">
        {/* PM Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {[
            { color: 'blue', label: 'Active Projects' },
            { color: 'green', label: 'On Track' },
            { color: 'yellow', label: 'At Risk' },
            { color: 'red', label: 'Blocked' },
            { color: 'purple', label: 'Team Members' }
          ].map((card, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="space-y-3">
                {/* Icon */}
                <div className={`h-10 w-10 bg-${card.color}-200 dark:bg-${card.color}-800 rounded-lg animate-pulse`}></div>
                
                {/* Value */}
                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                
                {/* Label */}
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                
                {/* Trend */}
                <div className="flex items-center space-x-1">
                  <div className={`h-3 w-3 bg-${card.color}-400 rounded animate-pulse`}></div>
                  <div className="h-3 w-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Project Pipeline */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                  <div className="h-8 w-32 bg-purple-200 dark:bg-purple-800 rounded animate-pulse"></div>
                </div>
              </div>
              
              {/* Kanban Board Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {['Planning', 'In Progress', 'Review', 'Completed'].map((status, colIndex) => (
                  <div key={colIndex} className="space-y-4">
                    {/* Column header */}
                    <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                      <div className="h-4 w-20 bg-slate-300 dark:bg-slate-600 rounded animate-pulse"></div>
                      <div className="h-6 w-6 bg-slate-300 dark:bg-slate-600 rounded-full animate-pulse"></div>
                    </div>
                    
                    {/* Cards in column */}
                    <div className="space-y-3">
                      {[...Array(Math.floor(Math.random() * 3) + 1)].map((_, cardIndex) => (
                        <div key={cardIndex} className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
                          <div className="space-y-3">
                            {/* Card header */}
                            <div className="space-y-2">
                              <div className="h-4 w-full bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                              <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                            </div>
                            
                            {/* Priority badge */}
                            <div className="h-5 w-16 bg-orange-200 dark:bg-orange-800 rounded-full animate-pulse"></div>
                            
                            {/* Progress */}
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <div className="h-3 w-12 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                                <div className="h-3 w-8 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                              </div>
                              <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-blue-300 dark:bg-blue-600 rounded-full animate-pulse"
                                  style={{ width: `${Math.random() * 60 + 20}%` }}
                                ></div>
                              </div>
                            </div>
                            
                            {/* Card footer */}
                            <div className="flex items-center justify-between pt-2">
                              <div className="flex -space-x-1">
                                {[...Array(Math.floor(Math.random() * 3) + 1)].map((_, i) => (
                                  <div key={i} className="h-6 w-6 bg-slate-300 dark:bg-slate-600 rounded-full border-2 border-white dark:border-slate-800 animate-pulse"></div>
                                ))}
                              </div>
                              <div className="h-4 w-12 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Team Status */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                
                {/* Team members */}
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
                      <div className="flex-1 space-y-1">
                        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                        <div className="h-3 w-16 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                      </div>
                      <div className={`h-3 w-3 rounded-full animate-pulse ${
                        i % 3 === 0 ? 'bg-green-400' : i % 3 === 1 ? 'bg-yellow-400' : 'bg-red-400'
                      }`}></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Resource Allocation */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                
                {/* Resource items */}
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between">
                        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                        <div className="h-4 w-12 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                      </div>
                      <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-300 dark:bg-purple-600 rounded-full animate-pulse"
                          style={{ width: `${Math.random() * 60 + 20}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="h-6 w-36 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                
                {/* Deadline items */}
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                      <div className={`h-3 w-3 rounded-full mt-2 animate-pulse ${
                        i % 3 === 0 ? 'bg-red-400' : i % 3 === 1 ? 'bg-yellow-400' : 'bg-green-400'
                      }`}></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-full bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                        <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                        <div className="h-3 w-16 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PM Loading Indicator */}
      <div className="fixed bottom-6 right-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-4 flex items-center space-x-3">
          <div className="h-5 w-5 border-2 border-slate-200 dark:border-slate-600 border-t-purple-500 rounded-full animate-spin"></div>
          <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Loading project manager...</span>
        </div>
      </div>
    </div>
  );
}
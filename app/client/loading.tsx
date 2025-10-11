import React from 'react';

/**
 * Client Portal Loading Component
 * 
 * Specialized loading state for client-facing routes.
 * Features client-focused layout with project status, communications, and billing.
 */
export default function ClientLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Client Header Skeleton */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-6">
        <div className="flex items-center justify-between">
          {/* Left side - Client welcome */}
          <div className="flex items-center space-x-4">
            {/* Company logo */}
            <div className="h-12 w-12 bg-gradient-to-r from-blue-200 to-indigo-200 dark:from-blue-800 dark:to-indigo-800 rounded-lg animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-7 w-52 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
              <div className="h-4 w-36 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            </div>
          </div>
          
          {/* Right side - Client actions */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-28 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse"></div>
            <div className="h-10 w-32 bg-green-200 dark:bg-green-800 rounded-md animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Client Navigation */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6">
        <div className="flex space-x-8">
          {['Overview', 'Projects', 'Messages', 'Invoices', 'Support'].map((_, i) => (
            <div key={i} className="py-4">
              <div className={`h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse ${
                i === 0 ? 'w-20' : i === 1 ? 'w-16' : i === 2 ? 'w-18' : i === 3 ? 'w-16' : 'w-14'
              }`}></div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Client Content */}
      <div className="p-6 space-y-6">
        {/* Client Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { color: 'blue', label: 'Active Projects' },
            { color: 'green', label: 'Completed' },
            { color: 'orange', label: 'Pending Review' },
            { color: 'purple', label: 'Total Investment' }
          ].map((card, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="space-y-4">
                {/* Icon */}
                <div className={`h-12 w-12 bg-${card.color}-200 dark:bg-${card.color}-800 rounded-lg animate-pulse`}></div>
                
                {/* Value */}
                <div className="h-10 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                
                {/* Label */}
                <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                
                {/* Status indicator */}
                <div className="flex items-center space-x-2">
                  <div className={`h-2 w-2 bg-${card.color}-400 rounded-full animate-pulse`}></div>
                  <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Projects */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="h-6 w-36 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                <div className="h-8 w-28 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
              </div>
              
              {/* Project Timeline */}
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                    {/* Project header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="space-y-2">
                        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                      </div>
                      <div className="h-8 w-24 bg-green-200 dark:bg-green-800 rounded-full animate-pulse"></div>
                    </div>
                    
                    {/* Project progress */}
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                        <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                      </div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-300 dark:bg-blue-600 rounded-full animate-pulse"
                          style={{ width: `${Math.random() * 50 + 30}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Project details */}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                        <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex items-center space-x-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <div className="h-8 w-24 bg-blue-200 dark:bg-blue-800 rounded animate-pulse"></div>
                      <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Messages */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                  <div className="h-6 w-6 bg-blue-200 dark:bg-blue-800 rounded-full animate-pulse"></div>
                </div>
                
                {/* Message items */}
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                      <div className="h-8 w-8 bg-blue-200 dark:bg-blue-800 rounded-full animate-pulse mt-0.5"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-full bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                        <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                        <div className="h-3 w-16 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* View all button */}
                <div className="h-8 w-full bg-blue-200 dark:bg-blue-800 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Billing Summary */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="h-6 w-28 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                
                {/* Billing items */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-24 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                    <div className="h-4 w-16 bg-green-200 dark:bg-green-600 rounded animate-pulse"></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-20 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                    <div className="h-4 w-14 bg-yellow-200 dark:bg-yellow-600 rounded animate-pulse"></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-28 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                    <div className="h-4 w-18 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                  </div>
                </div>
                
                <hr className="border-slate-200 dark:border-slate-700" />
                
                {/* Total */}
                <div className="flex justify-between items-center">
                  <div className="h-5 w-16 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                  <div className="h-6 w-20 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                </div>
                
                {/* Pay button */}
                <div className="h-10 w-full bg-green-200 dark:bg-green-800 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Quick Support */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                
                {/* Support options */}
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="h-6 w-6 bg-blue-200 dark:bg-blue-800 rounded animate-pulse"></div>
                      <div className="flex-1 h-4 w-28 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Client Loading Indicator */}
      <div className="fixed bottom-6 right-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-4 flex items-center space-x-3">
          <div className="h-5 w-5 border-2 border-slate-200 dark:border-slate-600 border-t-green-500 rounded-full animate-spin"></div>
          <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Loading client portal...</span>
        </div>
      </div>
    </div>
  );
}
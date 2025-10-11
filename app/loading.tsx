import React from 'react';

/**
 * Global App-Level Loading Component
 * 
 * This component serves as the default loading state for the entire application.
 * It's displayed when navigating between routes or during initial app load.
 * 
 * Features:
 * - Smooth fade-in animation
 * - Branded loading spinner with Zyphex Tech colors
 * - Accessible loading state with proper ARIA labels
 * - Responsive design that works on all screen sizes
 * - Modern glassmorphism design aesthetic
 */
export default function AppLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
      {/* Loading Container with Glassmorphism Effect */}
      <div className="relative">
        {/* Background Blur Effect */}
        <div className="absolute inset-0 bg-white/20 dark:bg-white/5 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 dark:border-white/10"></div>
        
        {/* Main Loading Content */}
        <div className="relative px-12 py-16 text-center">
          {/* Animated Logo/Brand Area */}
          <div className="mb-8">
            <div className="relative mx-auto w-20 h-20 mb-6">
              {/* Outer Rotating Ring */}
              <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin border-t-blue-600 dark:border-t-blue-400"></div>
              
              {/* Inner Pulsing Dot */}
              <div className="absolute inset-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full animate-pulse shadow-lg"></div>
              
              {/* Center Icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg 
                  className="w-8 h-8 text-white animate-pulse" 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                </svg>
              </div>
            </div>
            
            {/* Brand Text */}
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              Zyphex Tech
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
              IT Services Platform
            </p>
          </div>
          
          {/* Loading Progress Indicator */}
          <div className="space-y-4">
            {/* Loading Text */}
            <p className="text-slate-700 dark:text-slate-300 font-medium">
              Loading your dashboard...
            </p>
            
            {/* Progress Bar */}
            <div className="w-64 mx-auto">
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse shadow-sm"></div>
              </div>
            </div>
            
            {/* Loading Dots */}
            <div className="flex justify-center space-x-2 mt-6">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
          
          {/* Accessibility */}
          <div className="sr-only" role="status" aria-live="polite">
            Loading application, please wait...
          </div>
        </div>
      </div>
      
      {/* Background Animated Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Shapes */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
    </div>
  );
}

/**
 * Loading Component Variants
 * 
 * Export additional loading variants for different contexts
 */

// Minimal loading spinner for inline use
export function LoadingSpinner({ size = 'md', className = '' }: { 
  size?: 'sm' | 'md' | 'lg' | 'xl'; 
  className?: string; 
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <div className={`inline-block ${sizeClasses[size]} ${className}`}>
      <div className="border-2 border-slate-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
    </div>
  );
}

// Compact loading state for smaller areas
export function CompactLoading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
          {message}
        </p>
      </div>
    </div>
  );
}

// Inline loading state for buttons and small components
export function InlineLoading({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex items-center space-x-2">
      <LoadingSpinner size="sm" />
      <span className="text-sm text-slate-600 dark:text-slate-400">{text}</span>
    </div>
  );
}
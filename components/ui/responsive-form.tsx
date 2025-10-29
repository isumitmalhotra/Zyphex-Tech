/**
 * Responsive Form Layout Components
 * Optimized form layouts for mobile and desktop
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-media-query';

/**
 * Responsive Form Container
 * Adjusts padding and spacing based on screen size
 */
interface ResponsiveFormContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveFormContainer({
  children,
  className,
}: ResponsiveFormContainerProps) {
  const isMobile = useIsMobile();

  return (
    <div
      className={cn(
        'w-full',
        isMobile ? 'px-4 py-4 space-y-4' : 'px-6 py-6 space-y-6',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Responsive Form Grid
 * Auto-responsive grid for form fields
 */
interface ResponsiveFormGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}

export function ResponsiveFormGrid({
  children,
  columns = 2,
  className,
}: ResponsiveFormGridProps) {
  const isMobile = useIsMobile();

  const gridClasses = {
    1: 'grid-cols-1',
    2: isMobile ? 'grid-cols-1' : 'sm:grid-cols-2',
    3: isMobile ? 'grid-cols-1' : 'sm:grid-cols-2 lg:grid-cols-3',
  };

  return (
    <div
      className={cn(
        'grid gap-4',
        gridClasses[columns],
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Responsive Form Section
 * Collapsible section for mobile, always open on desktop
 */
interface ResponsiveFormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
  className?: string;
}

export function ResponsiveFormSection({
  title,
  description,
  children,
  defaultOpen = true,
  collapsible = true,
  className,
}: ResponsiveFormSectionProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  const showCollapse = collapsible && isMobile;

  return (
    <div className={cn('border rounded-lg', className)}>
      {/* Header */}
      <button
        type="button"
        onClick={() => showCollapse && setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between p-4',
          showCollapse && 'cursor-pointer hover:bg-muted/50'
        )}
        disabled={!showCollapse}
      >
        <div className="text-left">
          <h3 className="font-semibold text-base">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {showCollapse && (
          <svg
            className={cn(
              'h-5 w-5 transition-transform',
              isOpen && 'transform rotate-180'
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        )}
      </button>

      {/* Content */}
      {(!showCollapse || isOpen) && (
        <div className="p-4 pt-0 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Responsive Form Actions
 * Button group that stacks on mobile
 */
interface ResponsiveFormActionsProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export function ResponsiveFormActions({
  children,
  align = 'right',
  className,
}: ResponsiveFormActionsProps) {
  const isMobile = useIsMobile();

  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  return (
    <div
      className={cn(
        'flex gap-3',
        isMobile ? 'flex-col' : `flex-row ${alignClasses[align]}`,
        // Fixed bottom on mobile for better UX
        isMobile && 'sticky bottom-0 bg-background p-4 border-t -mx-4 -mb-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Touch-Friendly Input Wrapper
 * Larger touch targets for mobile
 */
interface TouchFriendlyInputProps {
  children: React.ReactNode;
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
}

export function TouchFriendlyInput({
  children,
  label,
  required,
  error,
  hint,
  className,
}: TouchFriendlyInputProps) {
  const isMobile = useIsMobile();

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className={cn(
          'block font-medium',
          isMobile ? 'text-base' : 'text-sm'
        )}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      
      <div className={cn(isMobile && '[&_input]:min-h-[44px] [&_textarea]:min-h-[44px] [&_button]:min-h-[44px]')}>
        {children}
      </div>
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      
      {hint && !error && (
        <p className="text-sm text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

/**
 * Responsive Modal Component
 * Full-screen on mobile, dialog on desktop
 */

'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-media-query';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResponsiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  showCloseButton = true,
  size = 'md',
}: ResponsiveModalProps) {
  const isMobile = useIsMobile();

  const sizeClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    full: 'sm:max-w-[90vw]',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          // Mobile: Full screen
          isMobile && 'h-full max-h-screen w-full max-w-full m-0 rounded-none',
          // Desktop: Standard dialog
          !isMobile && sizeClasses[size],
          'flex flex-col',
          className
        )}
      >
        {/* Header */}
        {(title || description) && (
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {title && <DialogTitle>{title}</DialogTitle>}
                {description && (
                  <DialogDescription className="mt-2">
                    {description}
                  </DialogDescription>
                )}
              </div>
              {showCloseButton && isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  className="flex-shrink-0"
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>
          </DialogHeader>
        )}

        {/* Content - Scrollable */}
        <div
          className={cn(
            'flex-1 overflow-y-auto',
            isMobile && 'pb-safe' // Safe area padding for mobile
          )}
        >
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Responsive Bottom Sheet
 * Slides up from bottom on mobile, dialog on desktop
 */
interface ResponsiveBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveBottomSheet({
  open,
  onOpenChange,
  title,
  children,
  className,
}: ResponsiveBottomSheetProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        {open && (
          <div
            className="fixed inset-0 bg-black/50 z-40 animate-in fade-in"
            onClick={() => onOpenChange(false)}
          />
        )}

        {/* Bottom Sheet */}
        <div
          className={cn(
            'fixed bottom-0 left-0 right-0 bg-background z-50 rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-out max-h-[90vh]',
            open ? 'translate-y-0' : 'translate-y-full',
            className
          )}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
          </div>

          {/* Header */}
          {title && (
            <div className="px-6 py-3 border-b">
              <h3 className="font-semibold text-lg">{title}</h3>
            </div>
          )}

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)] px-6 py-4">
            {children}
          </div>
        </div>
      </>
    );
  }

  // Desktop: Use standard dialog
  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      className={className}
    >
      {children}
    </ResponsiveModal>
  );
}

/**
 * Responsive Sidebar Wrapper
 * Wraps existing sidebars with mobile drawer functionality
 */

'use client';

import React, { useState } from 'react';
import { useIsMobile } from '@/hooks/use-media-query';
import { MobileDrawer, MobileMenuButton } from '@/components/ui/mobile-drawer';
import { cn } from '@/lib/utils';

interface ResponsiveSidebarWrapperProps {
  children: React.ReactNode;
  className?: string;
  mobileTitle?: string;
}

export function ResponsiveSidebarWrapper({
  children,
  className,
  mobileTitle = 'Menu',
}: ResponsiveSidebarWrapperProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  if (isMobile) {
    return (
      <>
        {/* Mobile Menu Button - Fixed position */}
        <div className="fixed top-4 left-4 z-30">
          <MobileMenuButton onClick={() => setIsOpen(true)} />
        </div>

        {/* Mobile Drawer */}
        <MobileDrawer
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title={mobileTitle}
        >
          <div onClick={() => setIsOpen(false)}>
            {children}
          </div>
        </MobileDrawer>
      </>
    );
  }

  // Desktop: Normal sidebar
  return (
    <aside className={cn('hidden md:block', className)}>
      {children}
    </aside>
  );
}

/**
 * Responsive Content Wrapper
 * Adjusts main content area for mobile/desktop
 */
interface ResponsiveContentWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveContentWrapper({
  children,
  className,
}: ResponsiveContentWrapperProps) {
  const isMobile = useIsMobile();

  return (
    <main
      className={cn(
        'flex-1 overflow-auto',
        isMobile ? 'pt-16 px-4' : 'p-6',
        className
      )}
    >
      {children}
    </main>
  );
}

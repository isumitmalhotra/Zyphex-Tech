/**
 * Mobile Navigation Wrapper
 * Wraps sidebar content for mobile drawer navigation
 * Uses CSS-based responsive design to avoid SSR/hydration mismatches
 */

'use client';

import { useState } from 'react';
import { MobileDrawer } from '@/components/ui/mobile-drawer';
import { MobileNavButton } from '@/components/mobile-nav-button';

interface MobileNavWrapperProps {
  children: React.ReactNode;
  sidebarContent: React.ReactNode;
  headerContent?: React.ReactNode;
}

export function MobileNavWrapper({
  children,
  sidebarContent,
  headerContent,
}: MobileNavWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Header with Menu Button - visible only on mobile (< 768px) */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
        <div className="flex h-14 items-center gap-4 px-4">
          <MobileNavButton 
            onClick={() => setIsOpen(true)} 
            data-testid="mobile-menu-button"
          />
          <div className="flex-1">
            {headerContent || (
              <h1 className="text-lg font-semibold">Dashboard</h1>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <MobileDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Navigation"
      >
        {sidebarContent}
      </MobileDrawer>

      {/* Main Content */}
      {children}
    </>
  );
}

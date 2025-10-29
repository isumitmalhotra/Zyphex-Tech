/**
 * Mobile Drawer Component
 * Collapsible sidebar drawer for mobile devices
 * Uses CSS-based responsive design to avoid SSR/hydration mismatches
 */

'use client';

import React from 'react';
import { X, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  side?: 'left' | 'right';
}

export function MobileDrawer({
  isOpen,
  onClose,
  children,
  title,
  side = 'left',
}: MobileDrawerProps) {
  return (
    <>
      {/* Backdrop - only visible on mobile when drawer is open */}
      {isOpen && (
        <div
          data-testid="drawer-backdrop"
          className="fixed inset-0 bg-black/50 z-40 animate-in fade-in md:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer - only visible on mobile */}
      <div
        data-testid="mobile-drawer"
        className={cn(
          'fixed top-0 bottom-0 w-[280px] bg-background z-50 shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden',
          side === 'left' ? 'left-0' : 'right-0',
          isOpen
            ? 'translate-x-0'
            : side === 'left'
            ? '-translate-x-full'
            : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          {title && <h2 className="font-semibold">{title}</h2>}
          <Button
            data-testid="mobile-drawer-close"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="ml-auto"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100vh-64px)]">
          {children}
        </div>
      </div>
    </>
  );
}

/**
 * Mobile Menu Button
 * Hamburger menu button for opening mobile drawer
 */
interface MobileMenuButtonProps {
  onClick: () => void;
  className?: string;
}

export function MobileMenuButton({ onClick, className }: MobileMenuButtonProps) {
  return (
    <Button
      data-testid="mobile-menu-button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn('md:hidden', className)}
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}

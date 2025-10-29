/**
 * Mobile Navigation Button
 * Hamburger menu button for triggering mobile navigation drawer
 */

'use client';

import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileNavButtonProps {
  onClick: () => void;
  className?: string;
  'data-testid'?: string;
}

export function MobileNavButton({ 
  onClick, 
  className,
  'data-testid': testId = 'mobile-nav-button'
}: MobileNavButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        'md:hidden', // Only show on mobile
        className
      )}
      onClick={onClick}
      data-testid={testId}
      aria-label="Open navigation menu"
    >
      <Menu className="h-6 w-6" />
    </Button>
  );
}

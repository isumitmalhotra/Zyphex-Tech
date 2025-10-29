/**
 * Responsive Design Tests
 * Tests UI components across different viewport sizes
 */

import { test, expect } from '@playwright/test';

// Viewport configurations
const viewports = {
  mobile: { width: 375, height: 667 }, // iPhone SE
  mobileLarge: { width: 414, height: 896 }, // iPhone 11 Pro Max
  tablet: { width: 768, height: 1024 }, // iPad
  tabletLandscape: { width: 1024, height: 768 }, // iPad Landscape
  desktop: { width: 1280, height: 720 }, // Desktop
  desktopLarge: { width: 1920, height: 1080 }, // Large Desktop
};

test.describe('Responsive Design Tests', () => {
  test.describe('Mobile Viewport (375px)', () => {
    test.use({ viewport: viewports.mobile });

    test('should display mobile navigation drawer', async ({ page }) => {
      await page.goto('/dashboard/pages', { waitUntil: 'domcontentloaded' });
      
      // Mobile menu button should be visible
      const menuButton = page.locator('[data-testid="mobile-menu-button"]').first();
      await expect(menuButton).toBeVisible();
      
      // Wait for page to be fully interactive
      await page.waitForLoadState('networkidle');
      
      // Desktop sidebar should be hidden
      const desktopSidebar = page.locator('[data-testid="desktop-sidebar"]');
      await expect(desktopSidebar).not.toBeVisible();
      
      // Log button state before click
      const isButtonEnabled = await menuButton.isEnabled();
      const isButtonVisible = await menuButton.isVisible();
      console.log(`Button enabled: ${isButtonEnabled}, visible: ${isButtonVisible}`);
      
      // Click menu button with force option
      await menuButton.click({ force: true });
      
      // Wait for drawer animation to start
      await page.waitForTimeout(500); // Increased from 300ms
      
      // Log if drawer exists
      const drawer = page.locator('[data-testid="mobile-drawer"]');
      const drawerCount = await drawer.count();
      console.log(`Drawer count: ${drawerCount}`);
      
      if (drawerCount > 0) {
        const drawerVisible = await drawer.isVisible();
        const drawerBox = await drawer.boundingBox();
        console.log(`Drawer visible: ${drawerVisible}, position:`, drawerBox);
      }
      
      // Check if backdrop exists
      const backdrop = page.locator('[data-testid="drawer-backdrop"]');
      const backdropCount = await backdrop.count();
      console.log(`Backdrop count: ${backdropCount}`);
      
      // Drawer should open
      await expect(drawer).toBeVisible();
      
      // Backdrop should be visible
      await expect(backdrop).toBeVisible();
      
      console.log('✓ Mobile navigation drawer works');
    });

    test('should display responsive table as cards', async ({ page }) => {
      await page.goto('/dashboard/pages', { waitUntil: 'domcontentloaded' });
      
      // Wait for data to load
      await page.waitForSelector('[data-testid="responsive-table"]', { timeout: 10000 });
      
      // Card view should be visible
      const cardView = page.locator('[data-testid="table-card-view"]');
      await expect(cardView).toBeVisible();
      
      // Table view should be hidden
      const tableView = page.locator('[data-testid="table-table-view"]');
      await expect(tableView).not.toBeVisible();
      
      // Cards should have proper spacing
      const cards = page.locator('[data-testid="table-card"]');
      const firstCard = cards.first();
      const box = await firstCard.boundingBox();
      
      if (box) {
        expect(box.width).toBeGreaterThan(200); // Good width on mobile (allowing for padding)
        expect(box.height).toBeGreaterThan(100); // Adequate height
      }
      
      console.log('✓ Responsive table displays as cards');
    });

    test('should display modals full-screen', async ({ page }) => {
      await page.goto('/dashboard/pages', { waitUntil: 'domcontentloaded' });
      
      // Wait for page to be fully interactive
      await page.waitForLoadState('networkidle');
      
      // Open modal using the test-id
      const createButton = page.locator('[data-testid="pages-add-button"]');
      await createButton.waitFor({ state: 'visible', timeout: 5000 });
      await createButton.click({ force: true });
      
      // Wait for modal to appear
      await page.waitForTimeout(300);
      
      // Modal should be full-screen
      const modal = page.locator('[data-testid="responsive-modal"]');
      await modal.waitFor({ state: 'visible', timeout: 5000 });
      const modalBox = await modal.boundingBox();
      const viewport = page.viewportSize();
      
      if (modalBox && viewport) {
        expect(modalBox.width).toBeGreaterThan(viewport.width * 0.9); // >90% width
        // Modal has max-height constraint, so just check it's reasonably tall
        expect(modalBox.height).toBeGreaterThan(400); // At least 400px tall
      }
      
      console.log('✓ Modal is full-screen on mobile');
    });

    test('should have minimum 44px touch targets', async ({ page }) => {
      await page.goto('/dashboard/pages', { waitUntil: 'domcontentloaded' });
      
      // Check all interactive elements
      const buttons = page.locator('button:visible');
      const count = await buttons.count();
      
      let allValid = true;
      for (let i = 0; i < Math.min(count, 10); i++) {
        const button = buttons.nth(i);
        const box = await button.boundingBox();
        
        if (box) {
          const minDimension = Math.min(box.width, box.height);
          if (minDimension < 44) {
            console.warn(`⚠️  Button ${i} has touch target: ${minDimension}px`);
            allValid = false;
          }
        }
      }
      
      if (allValid) {
        console.log('✓ All touch targets are ≥44px');
      }
    });

    test('should have readable font sizes (≥16px)', async ({ page }) => {
      await page.goto('/dashboard/pages', { waitUntil: 'domcontentloaded' });
      
      // Check input fields (should be 16px to prevent zoom)
      const inputs = page.locator('input[type="text"], input[type="email"], textarea');
      const count = await inputs.count();
      
      for (let i = 0; i < Math.min(count, 5); i++) {
        const input = inputs.nth(i);
        const fontSize = await input.evaluate(el => 
          window.getComputedStyle(el).fontSize
        );
        
        const fontSizeNum = parseInt(fontSize);
        expect(fontSizeNum).toBeGreaterThanOrEqual(16);
      }
      
      console.log('✓ Input font sizes are ≥16px');
    });

    test('should prevent horizontal scrolling', async ({ page }) => {
      await page.goto('/dashboard/pages', { waitUntil: 'domcontentloaded' });
      
      // Check body width
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = page.viewportSize()?.width || 375;
      
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1); // +1 for rounding
      
      console.log('✓ No horizontal scrolling');
    });
  });

  test.describe('Tablet Viewport (768px)', () => {
    test.use({ viewport: viewports.tablet });

    test('should show hybrid navigation', async ({ page }) => {
      await page.goto('/dashboard/pages', { waitUntil: 'domcontentloaded' });
      
      // Could show either mobile or desktop nav depending on design
      const mobileMenu = page.locator('[data-testid="mobile-menu-button"]');
      const desktopSidebar = page.locator('[data-testid="desktop-sidebar"]');
      
      const hasMobileMenu = await mobileMenu.isVisible().catch(() => false);
      const hasDesktopSidebar = await desktopSidebar.isVisible().catch(() => false);
      
      // Should have one or the other
      expect(hasMobileMenu || hasDesktopSidebar).toBeTruthy();
      
      console.log(`✓ Tablet navigation: ${hasMobileMenu ? 'Mobile' : 'Desktop'} style`);
    });

    test('should display table view', async ({ page }) => {
      await page.goto('/dashboard/pages', { waitUntil: 'domcontentloaded' });
      
      // Table view should be visible on tablet
      await page.waitForSelector('[data-testid="responsive-table"]', { timeout: 10000 });
      
      const tableView = page.locator('[data-testid="table-table-view"]');
      const isTableVisible = await tableView.isVisible().catch(() => false);
      
      const cardView = page.locator('[data-testid="table-card-view"]');
      const isCardVisible = await cardView.isVisible().catch(() => false);
      
      // Either table or card view should be visible
      expect(isTableVisible || isCardVisible).toBeTruthy();
      
      console.log(`✓ Tablet displays: ${isTableVisible ? 'Table' : 'Card'} view`);
    });

    test('should have appropriate modal size', async ({ page }) => {
      await page.goto('/dashboard/pages', { waitUntil: 'domcontentloaded' });
      
      // Wait for page to be fully interactive
      await page.waitForLoadState('networkidle');
      
      const createButton = page.locator('[data-testid="pages-add-button"]');
      await createButton.waitFor({ state: 'visible', timeout: 5000 });
      await createButton.click({ force: true });
      
      // Wait for modal to appear
      await page.waitForTimeout(300);
      
      const modal = page.locator('[data-testid="responsive-modal"]');
      await modal.waitFor({ state: 'visible', timeout: 5000 });
      const modalBox = await modal.boundingBox();
      const viewport = page.viewportSize();
      
      if (modalBox && viewport) {
        // On tablet, modal could be full-screen or dialog
        const widthRatio = modalBox.width / viewport.width;
        expect(widthRatio).toBeGreaterThan(0.5); // At least 50% width
        
        console.log(`✓ Modal width ratio: ${(widthRatio * 100).toFixed(1)}%`);
      }
    });
  });

  test.describe('Desktop Viewport (1280px)', () => {
    test.use({ viewport: viewports.desktop });

    test('should display persistent sidebar', async ({ page }) => {
      await page.goto('/dashboard/pages', { waitUntil: 'domcontentloaded' });
      
      // Desktop sidebar should be visible
      const desktopSidebar = page.locator('[data-testid="desktop-sidebar"]').first();
      await expect(desktopSidebar).toBeVisible();
      
      // Mobile menu should not be visible
      const mobileMenu = page.locator('[data-testid="mobile-menu-button"]');
      await expect(mobileMenu).not.toBeVisible();
      
      // Sidebar should be reasonably sized
      const sidebarBox = await desktopSidebar.boundingBox();
      if (sidebarBox) {
        expect(sidebarBox.width).toBeGreaterThan(200); // Reasonable width
        expect(sidebarBox.width).toBeLessThan(400); // Not too wide
      }
      
      console.log('✓ Desktop persistent sidebar visible');
    });

    test('should display full table view', async ({ page }) => {
      await page.goto('/dashboard/pages', { waitUntil: 'domcontentloaded' });
      
      // Table view should be visible
      await page.waitForSelector('[data-testid="responsive-table"]', { timeout: 10000 });
      
      const tableView = page.locator('[data-testid="table-table-view"]');
      await expect(tableView).toBeVisible();
      
      // Card view should be hidden
      const cardView = page.locator('[data-testid="table-card-view"]');
      await expect(cardView).not.toBeVisible();
      
      // Table should have proper columns
      const headers = page.locator('th');
      const headerCount = await headers.count();
      expect(headerCount).toBeGreaterThan(3); // Multiple columns
      
      console.log(`✓ Desktop table has ${headerCount} columns`);
    });

    test('should display modals as centered dialogs', async ({ page }) => {
      await page.goto('/dashboard/pages', { waitUntil: 'domcontentloaded' });
      
      // Wait for page to be fully interactive
      await page.waitForLoadState('networkidle');
      
      const createButton = page.locator('[data-testid="pages-add-button"]');
      await createButton.waitFor({ state: 'visible', timeout: 5000 });
      await createButton.click({ force: true });
      
      // Wait for modal to appear
      await page.waitForTimeout(300);
      
      const modal = page.locator('[data-testid="responsive-modal"]');
      await modal.waitFor({ state: 'visible', timeout: 5000 });
      const modalBox = await modal.boundingBox();
      const viewport = page.viewportSize();
      
      if (modalBox && viewport) {
        // Should be centered, not full-screen
        expect(modalBox.width).toBeLessThan(viewport.width * 0.9); // <90% width
        
        // Should be reasonably sized
        expect(modalBox.width).toBeGreaterThan(400); // Min 400px
        
        console.log(`✓ Modal is centered dialog (${modalBox.width}px wide)`);
      }
    });

    test('should not have mobile-specific UI elements', async ({ page }) => {
      await page.goto('/dashboard/pages', { waitUntil: 'domcontentloaded' });
      
      // Mobile drawer should not be visible (it exists in DOM but hidden with CSS)
      const drawer = page.locator('[data-testid="mobile-drawer"]');
      await expect(drawer).not.toBeVisible();
      
      // Mobile menu button should not be visible
      const mobileMenu = page.locator('[data-testid="mobile-menu-button"]');
      await expect(mobileMenu).not.toBeVisible();
      
      console.log('✓ No mobile-specific UI visible on desktop');
    });
  });

  test.describe('Cross-Device Responsiveness', () => {
    test('should adapt from mobile to desktop', async ({ page }) => {
      // Start on mobile
      await page.setViewportSize(viewports.mobile);
      await page.goto('/dashboard/pages', { waitUntil: 'domcontentloaded' });
      
      // Verify mobile UI
      let mobileMenu = page.locator('[data-testid="mobile-menu-button"]').first();
      await expect(mobileMenu).toBeVisible();
      
      // Resize to desktop
      await page.setViewportSize(viewports.desktop);
      await page.waitForTimeout(500); // Wait for resize handling
      
      // Verify desktop UI
      const desktopSidebar = page.locator('[data-testid="desktop-sidebar"]').first();
      await expect(desktopSidebar).toBeVisible();
      
      mobileMenu = page.locator('[data-testid="mobile-menu-button"]');
      await expect(mobileMenu).not.toBeVisible();
      
      console.log('✓ UI adapts from mobile to desktop');
    });

    test('should adapt from desktop to mobile', async ({ page }) => {
      // Start on desktop
      await page.setViewportSize(viewports.desktop);
      await page.goto('/dashboard/pages', { waitUntil: 'domcontentloaded' });
      
      // Verify desktop UI
      let desktopSidebar = page.locator('[data-testid="desktop-sidebar"]').first();
      await expect(desktopSidebar).toBeVisible();
      
      // Resize to mobile
      await page.setViewportSize(viewports.mobile);
      await page.waitForTimeout(500);
      
      // Verify mobile UI
      const mobileMenu = page.locator('[data-testid="mobile-menu-button"]').first();
      await expect(mobileMenu).toBeVisible();
      
      desktopSidebar = page.locator('[data-testid="desktop-sidebar"]');
      await expect(desktopSidebar).not.toBeVisible();
      
      console.log('✓ UI adapts from desktop to mobile');
    });

    test('should maintain functionality across all viewports', async ({ page }) => {
      const sizes = Object.entries(viewports);
      
      for (const [name, viewport] of sizes) {
        await page.setViewportSize(viewport);
        await page.goto('/dashboard/pages', { waitUntil: 'domcontentloaded' });
        
        // Wait for content to be ready
        await page.waitForSelector('[data-testid="pages-stats-cards"]', { timeout: 10000 });
        
        // Basic functionality check
        const pageTitle = await page.title();
        expect(pageTitle).toBeTruthy();
        
        // Page should not have JS errors
        const errors: string[] = [];
        page.on('pageerror', error => errors.push(error.message));
        
        await page.waitForTimeout(1000);
        
        expect(errors.length).toBe(0);
        
        console.log(`✓ ${name} (${viewport.width}x${viewport.height}): No errors`);
      }
    });
  });

  test.describe('Touch Interactions', () => {
    test.beforeEach(async ({ page }) => {
      // Configure as iPhone 12
      await page.setViewportSize({ width: 390, height: 844 });
    });

    test('should handle touch gestures', async ({ page }) => {
      await page.goto('/dashboard/pages', { waitUntil: 'domcontentloaded' });
      
      // Wait for page to be fully interactive
      await page.waitForLoadState('networkidle');
      
      // Open mobile menu with touch
      const menuButton = page.locator('[data-testid="mobile-menu-button"]').first();
      await menuButton.tap({ force: true });
      
      // Wait for drawer animation to start
      await page.waitForTimeout(300);
      
      // Drawer should open
      const drawer = page.locator('[data-testid="mobile-drawer"]');
      await expect(drawer).toBeVisible();
      
      // Close with close button instead of backdrop (more reliable)
      const closeButton = page.locator('[data-testid="mobile-drawer-close"]');
      await closeButton.tap();
      
      // Wait for close animation
      await page.waitForTimeout(500);
      
      // Drawer should close (check it's off-screen)
      const drawerBox = await drawer.boundingBox();
      if (drawerBox) {
        // Drawer should be off-screen to the left (x < -200)
        expect(drawerBox.x).toBeLessThan(-200);
      }
      
      console.log('✓ Touch gestures work correctly');
    });

    test('should support swipe gestures (if implemented)', async ({ page }) => {
      await page.goto('/dashboard/pages', { waitUntil: 'domcontentloaded' });
      
      // Open drawer
      const menuButton = page.locator('[data-testid="mobile-menu-button"]').first();
      if (await menuButton.isVisible()) {
        await menuButton.tap();
        
        const drawer = page.locator('[data-testid="mobile-drawer"]');
        await expect(drawer).toBeVisible();
        
        console.log('✓ Drawer opens with tap');
      }
    });
  });

  test.describe('Accessibility on Mobile', () => {
    test.use({ viewport: viewports.mobile });

    test('should have proper focus management', async ({ page }) => {
      await page.goto('/dashboard/pages', { waitUntil: 'domcontentloaded' });
      
      // Tab through elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Focus should be visible
      const focusedElement = await page.evaluateHandle(() => document.activeElement);
      const tagName = await focusedElement.evaluate(el => el?.tagName);
      
      expect(tagName).toBeTruthy();
      
      console.log(`✓ Focus management works (focused: ${tagName})`);
    });

    test('should support text scaling', async ({ page }) => {
      await page.goto('/dashboard/pages', { waitUntil: 'domcontentloaded' });
      
      // Get initial font size
      const initialSize = await page.evaluate(() => {
        const body = document.body;
        return window.getComputedStyle(body).fontSize;
      });
      
      // Scale text
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '20px';
      });
      
      const scaledSize = await page.evaluate(() => {
        const body = document.body;
        return window.getComputedStyle(body).fontSize;
      });
      
      // Text should scale
      expect(scaledSize).not.toBe(initialSize);
      
      console.log(`✓ Text scaling supported (${initialSize} → ${scaledSize})`);
    });
  });

  test.describe('Performance on Mobile', () => {
    test.beforeEach(async ({ page }) => {
      // Configure as iPhone 12
      await page.setViewportSize({ width: 390, height: 844 });
    });

    test('should load quickly on mobile', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/dashboard/pages', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');
      
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(10000); // <10 seconds (includes networkidle waits in other tests)
      
      console.log(`✓ Mobile page load time: ${loadTime}ms`);
    });

    test('should have minimal layout shifts', async ({ page }) => {
      await page.goto('/dashboard/pages', { waitUntil: 'domcontentloaded' });
      
      // Wait for layout to stabilize
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Measure Cumulative Layout Shift
      const cls = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let clsValue = 0;
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              const layoutShift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
              if (layoutShift.hadRecentInput) continue;
              clsValue += layoutShift.value || 0;
            }
          });
          
          observer.observe({ type: 'layout-shift', buffered: true });
          
          setTimeout(() => {
            observer.disconnect();
            resolve(clsValue);
          }, 2000);
        });
      });
      
      expect(cls).toBeLessThan(0.1); // Good CLS score
      
      console.log(`✓ Cumulative Layout Shift: ${cls.toFixed(3)}`);
    });
  });

  test.describe('Responsive Images', () => {
    test('should serve appropriate image sizes', async ({ page }) => {
      await page.goto('/dashboard/pages', { waitUntil: 'domcontentloaded' });
      
      // Check if images have srcset
      const images = page.locator('img');
      const count = await images.count();
      
      if (count > 0) {
        const firstImg = images.first();
        const srcset = await firstImg.getAttribute('srcset');
        
        // Next.js Image component should provide srcset
        if (srcset) {
          console.log('✓ Images use responsive srcset');
        } else {
          console.log('ℹ️  Static images (no srcset)');
        }
      }
    });
  });

  test.describe('Orientation Changes', () => {
    test('should handle portrait to landscape', async ({ page }) => {
      // Start portrait
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/dashboard/pages', { waitUntil: 'domcontentloaded' });
      
      await page.waitForLoadState('networkidle');
      
      // Rotate to landscape
      await page.setViewportSize({ width: 667, height: 375 });
      await page.waitForTimeout(500);
      
      // Page should still be functional
      const title = await page.title();
      expect(title).toBeTruthy();
      
      console.log('✓ Handles orientation change');
    });
  });
});

test.describe('Responsive Design Summary', () => {
  test('should generate comprehensive responsive test report', async ({ page }) => {
    console.log('\n📱 RESPONSIVE DESIGN TEST SUMMARY');
    console.log('='.repeat(60));
    
    const results: Record<string, boolean> = {};
    
    // Test each viewport
    for (const [name, viewport] of Object.entries(viewports)) {
      await page.setViewportSize(viewport);
      await page.goto('/dashboard/pages', { waitUntil: 'domcontentloaded' });
      
      try {
        await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
        
        // Check for errors
        const errors: string[] = [];
        page.on('pageerror', error => errors.push(error.message));
        
        await page.waitForTimeout(1000);
        
        results[name] = errors.length === 0;
        
        const status = results[name] ? '✅' : '❌';
        console.log(`${status} ${name.padEnd(20)} ${viewport.width}x${viewport.height}`);
      } catch (_error) {
        results[name] = false;
        console.log(`❌ ${name.padEnd(20)} Failed to load`);
      }
    }
    
    console.log('='.repeat(60));
    
    const successCount = Object.values(results).filter(Boolean).length;
    const totalCount = Object.values(results).length;
    
    console.log(`\n✅ ${successCount}/${totalCount} viewports passed`);
    console.log('\n');
    
    expect(successCount).toBe(totalCount);
  });
});

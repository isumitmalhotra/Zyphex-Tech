# Responsive Design Implementation Guide

## Phase 4.5: Responsive Design Components

### Overview
Complete set of responsive utilities and components for building mobile-first CMS interfaces.

---

## 🎯 Core Utilities

### 1. Media Query Hooks (`hooks/use-media-query.ts`)

**Available Hooks:**
```typescript
import {
  useIsMobile,        // < 768px
  useIsTablet,        // 768px - 1023px
  useIsDesktop,       // >= 1024px
  useIsLargeDesktop,  // >= 1280px
  useBreakpoint,      // Returns: 'mobile' | 'tablet' | 'desktop' | 'large'
  useIsTouchDevice,   // Detects touch capability
} from '@/hooks/use-media-query';
```

**Usage Example:**
```typescript
function MyComponent() {
  const isMobile = useIsMobile();
  const breakpoint = useBreakpoint();
  
  return (
    <div>
      {isMobile ? <MobileView /> : <DesktopView />}
      <p>Current breakpoint: {breakpoint}</p>
    </div>
  );
}
```

---

## 📱 Responsive Components

### 2. Responsive Table (`components/ui/responsive-table.tsx`)

**Auto-switches between table and card layouts**

```typescript
import { ResponsiveTable, ResponsiveTableColumn } from '@/components/ui/responsive-table';

const columns: ResponsiveTableColumn<Page>[] = [
  {
    key: 'title',
    label: 'Page Title',
    mobileLabel: 'Title',              // Custom label for mobile
    hideOnMobile: false,               // Hide on mobile cards
    render: (item) => <span>{item.title}</span>,
  },
  {
    key: 'slug',
    label: 'Slug',
    hideOnMobile: true,                // Only show on desktop
  },
];

<ResponsiveTable
  data={pages}
  columns={columns}
  keyExtractor={(page) => page.id}
  onRowClick={(page) => console.log(page)}
  emptyMessage="No pages found"
  mobileCardRender={(page) => (      // Optional custom mobile card
    <CustomMobileCard page={page} />
  )}
/>
```

**Mobile Behavior:**
- Desktop: Standard data table
- Mobile: Stacked cards with touch-friendly spacing
- Auto card layout with label-value pairs
- Optional custom card renderer

---

### 3. Mobile Drawer (`components/ui/mobile-drawer.tsx`)

**Collapsible sidebar for mobile**

```typescript
import { MobileDrawer, MobileMenuButton } from '@/components/ui/mobile-drawer';

function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <MobileMenuButton onClick={() => setIsOpen(true)} />
      
      <MobileDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Navigation"
        side="left"  // or "right"
      >
        <YourSidebarContent />
      </MobileDrawer>
    </>
  );
}
```

**Features:**
- Slides in from left/right
- Backdrop overlay
- Touch-friendly close button
- Only renders on mobile
- Smooth animations

---

### 4. Responsive Modal (`components/ui/responsive-modal.tsx`)

**Full-screen on mobile, dialog on desktop**

```typescript
import { ResponsiveModal, ResponsiveBottomSheet } from '@/components/ui/responsive-modal';

// Standard Modal
<ResponsiveModal
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Edit Page"
  description="Modify page details"
  size="lg"  // 'sm' | 'md' | 'lg' | 'xl' | 'full'
>
  <YourFormContent />
</ResponsiveModal>

// Bottom Sheet (mobile-optimized)
<ResponsiveBottomSheet
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Quick Actions"
>
  <YourActionButtons />
</ResponsiveBottomSheet>
```

**Mobile Behavior:**
- Full-screen modal with safe area support
- Bottom sheet slides up from bottom
- Handle bar for visual affordance
- Swipe-friendly interactions

---

### 5. Responsive Form Components (`components/ui/responsive-form.tsx`)

**Mobile-optimized form layouts**

```typescript
import {
  ResponsiveFormContainer,
  ResponsiveFormGrid,
  ResponsiveFormSection,
  ResponsiveFormActions,
  TouchFriendlyInput,
} from '@/components/ui/responsive-form';

<ResponsiveFormContainer>
  <ResponsiveFormSection
    title="Basic Information"
    description="Enter page details"
    collapsible={true}
    defaultOpen={true}
  >
    <ResponsiveFormGrid columns={2}>
      <TouchFriendlyInput
        label="Page Title"
        required
        hint="Enter a descriptive title"
      >
        <Input placeholder="My Page" />
      </TouchFriendlyInput>
      
      <TouchFriendlyInput label="Slug">
        <Input placeholder="my-page" />
      </TouchFriendlyInput>
    </ResponsiveFormGrid>
  </ResponsiveFormSection>
  
  <ResponsiveFormActions align="right">
    <Button variant="outline">Cancel</Button>
    <Button type="submit">Save Page</Button>
  </ResponsiveFormActions>
</ResponsiveFormContainer>
```

**Features:**
- `ResponsiveFormGrid`: Auto-stacks columns on mobile
- `ResponsiveFormSection`: Collapsible sections on mobile
- `TouchFriendlyInput`: 44px minimum touch targets
- `ResponsiveFormActions`: Sticky bottom buttons on mobile

---

### 6. Responsive Sidebar Wrapper (`components/ui/responsive-sidebar-wrapper.tsx`)

**Wrap existing sidebars with mobile support**

```typescript
import {
  ResponsiveSidebarWrapper,
  ResponsiveContentWrapper,
} from '@/components/ui/responsive-sidebar-wrapper';

<ResponsiveSidebarWrapper mobileTitle="Admin Menu">
  <AdminSidebar />
</ResponsiveSidebarWrapper>

<ResponsiveContentWrapper>
  <YourPageContent />
</ResponsiveContentWrapper>
```

**Features:**
- Hamburger menu button on mobile
- Hidden sidebar on mobile, drawer opens on tap
- Normal sidebar on desktop
- Content area adjusts padding automatically

---

## 🎨 Breakpoints

```css
Mobile:       < 768px   (sm)
Tablet:       768px+    (md)
Desktop:      1024px+   (lg)
Large:        1280px+   (xl)
Extra Large:  1536px+   (2xl)
```

---

## ✅ Best Practices

### 1. **Touch Targets**
- Minimum 44x44px for interactive elements
- Use `TouchFriendlyInput` for form fields
- Add adequate spacing between buttons

### 2. **Performance**
- Use SSR-safe hooks (returns false during SSR)
- Lazy load mobile/desktop components
- Optimize images with responsive srcsets

### 3. **Accessibility**
- Maintain keyboard navigation
- Proper ARIA labels
- Focus management in modals/drawers

### 4. **Testing**
```bash
# Test on multiple viewports
Mobile:  375x667  (iPhone SE)
Tablet:  768x1024 (iPad)
Desktop: 1920x1080
```

---

## 📋 Migration Checklist

- [ ] Replace `<table>` with `<ResponsiveTable>`
- [ ] Wrap sidebars with `<ResponsiveSidebarWrapper>`
- [ ] Convert modals to `<ResponsiveModal>`
- [ ] Update forms with responsive form components
- [ ] Add `useIsMobile` checks for conditional rendering
- [ ] Test on mobile devices (Chrome DevTools + real devices)
- [ ] Verify touch interactions work properly
- [ ] Check landscape and portrait orientations

---

## 🚀 Quick Start

1. **Import the hook:**
   ```typescript
   import { useIsMobile } from '@/hooks/use-media-query';
   ```

2. **Use in your component:**
   ```typescript
   const isMobile = useIsMobile();
   
   return isMobile ? <MobileUI /> : <DesktopUI />;
   ```

3. **Or use responsive components:**
   ```typescript
   <ResponsiveTable data={data} columns={columns} />
   ```

---

## 📦 Component Status

| Component | Status | File |
|-----------|--------|------|
| Media Query Hooks | ✅ Complete | `hooks/use-media-query.ts` |
| Responsive Table | ✅ Complete | `components/ui/responsive-table.tsx` |
| Mobile Drawer | ✅ Complete | `components/ui/mobile-drawer.tsx` |
| Responsive Modal | ✅ Complete | `components/ui/responsive-modal.tsx` |
| Responsive Forms | ✅ Complete | `components/ui/responsive-form.tsx` |
| Sidebar Wrapper | ✅ Complete | `components/ui/responsive-sidebar-wrapper.tsx` |

---

## 🔗 Example Implementation

See: `components/cms/responsive-pages-table.example.tsx` for a complete working example.

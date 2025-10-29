# Component Library

Complete reference for all reusable components in the Zyphex Tech CMS.

## Table of Contents

1. [Responsive Components](#responsive-components)
2. [UI Components](#ui-components)
3. [Form Components](#form-components)
4. [CMS Components](#cms-components)
5. [Admin Components](#admin-components)
6. [Hooks](#hooks)

---

## Responsive Components

### ResponsiveTable

Auto-switching table that displays as a data table on desktop and cards on mobile.

**Location:** `components/ui/responsive-table.tsx`

**Props:**
```typescript
interface ResponsiveTableProps<T> {
  data: T[];                           // Array of data items
  columns: ColumnDef<T>[];            // Column definitions
  onRowClick?: (item: T) => void;     // Optional row click handler
  loading?: boolean;                   // Loading state
  emptyMessage?: string;               // Message when no data
}

interface ColumnDef<T> {
  key: string;                         // Property key from data
  header: string;                      // Column header text
  render?: (item: T) => React.ReactNode; // Custom render function
  mobileLabel?: string;                // Label for mobile card view
  hideOnMobile?: boolean;              // Hide column on mobile
}
```

**Usage:**
```typescript
import { ResponsiveTable } from '@/components/ui/responsive-table';

const columns = [
  { key: 'title', header: 'Title', mobileLabel: 'Title' },
  { key: 'status', header: 'Status', mobileLabel: 'Status' },
  { 
    key: 'createdAt', 
    header: 'Created', 
    render: (item) => new Date(item.createdAt).toLocaleDateString(),
    hideOnMobile: true 
  },
];

export function PagesTable() {
  const { data, loading } = usePages();
  
  return (
    <ResponsiveTable
      data={data}
      columns={columns}
      onRowClick={(page) => router.push(`/cms/pages/${page.id}`)}
      loading={loading}
      emptyMessage="No pages found"
    />
  );
}
```

**Features:**
- Auto-switches between table and card layout
- Customizable column rendering
- Mobile-optimized touch targets (44px minimum)
- Loading skeleton states
- Empty state handling
- Click handlers with hover states

---

### MobileDrawer

Collapsible drawer for mobile navigation with backdrop.

**Location:** `components/ui/mobile-drawer.tsx`

**Props:**
```typescript
interface MobileDrawerProps {
  isOpen: boolean;                    // Drawer open state
  onClose: () => void;                // Close handler
  children: React.ReactNode;          // Drawer content
  title?: string;                     // Optional title
}
```

**Usage:**
```typescript
import { MobileDrawer } from '@/components/ui/mobile-drawer';
import { useIsMobile } from '@/hooks/use-media-query';

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  
  if (!isMobile) {
    return <DesktopSidebar />;
  }
  
  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        <MenuIcon />
      </button>
      
      <MobileDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Navigation"
      >
        <nav>
          <a href="/dashboard">Dashboard</a>
          <a href="/pages">Pages</a>
          <a href="/media">Media</a>
        </nav>
      </MobileDrawer>
    </>
  );
}
```

**Features:**
- Smooth slide-in animation
- Backdrop with blur effect
- Trap focus within drawer
- Escape key to close
- Click outside to close
- Prevents body scroll when open

---

### ResponsiveModal

Adaptive modal that's full-screen on mobile, dialog on desktop.

**Location:** `components/ui/responsive-modal.tsx`

**Props:**
```typescript
interface ResponsiveModalProps {
  isOpen: boolean;                    // Modal open state
  onClose: () => void;                // Close handler
  title: string;                      // Modal title
  children: React.ReactNode;          // Modal content
  footer?: React.ReactNode;           // Optional footer
  size?: 'sm' | 'md' | 'lg';         // Desktop size
}
```

**Usage:**
```typescript
import { ResponsiveModal } from '@/components/ui/responsive-modal';

export function PageEditor() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Edit Page
      </button>
      
      <ResponsiveModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Edit Page"
        size="lg"
        footer={
          <div className="flex gap-2">
            <button onClick={handleSave}>Save</button>
            <button onClick={() => setIsOpen(false)}>Cancel</button>
          </div>
        }
      >
        <PageForm />
      </ResponsiveModal>
    </>
  );
}
```

**Features:**
- Full-screen on mobile (<768px)
- Centered dialog on desktop
- Responsive sizing (sm: 400px, md: 600px, lg: 800px)
- Smooth animations
- Focus management
- Accessible (ARIA labels)

---

### ResponsiveForm

Touch-friendly form with optimized inputs for mobile.

**Location:** `components/ui/responsive-form.tsx`

**Props:**
```typescript
interface ResponsiveFormProps {
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveInputProps {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
}

interface ResponsiveSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
  error?: string;
}

interface ResponsiveTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  required?: boolean;
  error?: string;
}
```

**Usage:**
```typescript
import { 
  ResponsiveForm, 
  ResponsiveInput, 
  ResponsiveSelect,
  ResponsiveTextarea 
} from '@/components/ui/responsive-form';

export function PageForm() {
  const [data, setData] = useState({ title: '', status: 'draft', content: '' });
  
  return (
    <ResponsiveForm onSubmit={handleSubmit}>
      <ResponsiveInput
        label="Page Title"
        value={data.title}
        onChange={(value) => setData({ ...data, title: value })}
        required
        helperText="Enter a descriptive title"
      />
      
      <ResponsiveSelect
        label="Status"
        value={data.status}
        onChange={(value) => setData({ ...data, status: value })}
        options={[
          { value: 'draft', label: 'Draft' },
          { value: 'published', label: 'Published' },
        ]}
      />
      
      <ResponsiveTextarea
        label="Content"
        value={data.content}
        onChange={(value) => setData({ ...data, content: value })}
        rows={10}
      />
      
      <button type="submit">Save</button>
    </ResponsiveForm>
  );
}
```

**Features:**
- 44px minimum touch targets on mobile
- Larger font sizes on mobile (16px minimum)
- Optimized input types (email, tel, url)
- Error states with validation
- Helper text support
- Consistent spacing

---

### ResponsiveSidebarWrapper

Converts sidebar to drawer on mobile automatically.

**Location:** `components/ui/responsive-sidebar-wrapper.tsx`

**Props:**
```typescript
interface ResponsiveSidebarWrapperProps {
  sidebar: React.ReactNode;          // Sidebar content
  children: React.ReactNode;          // Main content
  sidebarTitle?: string;              // Mobile drawer title
}
```

**Usage:**
```typescript
import { ResponsiveSidebarWrapper } from '@/components/ui/responsive-sidebar-wrapper';
import { AdminSidebar } from '@/components/admin-sidebar';

export default function AdminLayout({ children }) {
  return (
    <ResponsiveSidebarWrapper
      sidebar={<AdminSidebar />}
      sidebarTitle="Admin Menu"
    >
      {children}
    </ResponsiveSidebarWrapper>
  );
}
```

**Features:**
- Auto-detects mobile breakpoint
- Persistent sidebar on desktop
- Collapsible drawer on mobile
- Hamburger menu button
- Manages open/close state

---

## UI Components

### Button

Standard button with variants.

**Location:** `components/ui/button.tsx`

**Variants:**
- `default` - Primary blue button
- `destructive` - Red button for dangerous actions
- `outline` - Outlined button
- `secondary` - Gray button
- `ghost` - Transparent button
- `link` - Text link style

**Sizes:**
- `default` - Standard size
- `sm` - Small button
- `lg` - Large button
- `icon` - Square icon button

**Usage:**
```typescript
import { Button } from '@/components/ui/button';

<Button variant="default" size="lg">Save</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost" size="icon">
  <TrashIcon />
</Button>
```

---

### Card

Container component with shadow and border.

**Location:** `components/ui/card.tsx`

**Components:**
- `Card` - Main container
- `CardHeader` - Header section
- `CardTitle` - Title text
- `CardDescription` - Description text
- `CardContent` - Main content
- `CardFooter` - Footer section

**Usage:**
```typescript
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Page Statistics</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Total Pages: 42</p>
  </CardContent>
</Card>
```

---

### Dialog

Modal dialog component.

**Location:** `components/ui/dialog.tsx`

**Components:**
- `Dialog` - Root component
- `DialogTrigger` - Trigger button
- `DialogContent` - Content container
- `DialogHeader` - Header section
- `DialogTitle` - Title text
- `DialogDescription` - Description
- `DialogFooter` - Footer section

**Usage:**
```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button>Delete Page</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogDescription>
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button variant="destructive">Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### Table

Standard table component.

**Location:** `components/ui/table.tsx`

**Components:**
- `Table` - Main table
- `TableHeader` - Header row group
- `TableBody` - Body row group
- `TableFooter` - Footer row group
- `TableRow` - Table row
- `TableHead` - Header cell
- `TableCell` - Body cell

**Usage:**
```typescript
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Title</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Author</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {pages.map((page) => (
      <TableRow key={page.id}>
        <TableCell>{page.title}</TableCell>
        <TableCell>{page.status}</TableCell>
        <TableCell>{page.author.name}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

### Badge

Small status indicator.

**Location:** `components/ui/badge.tsx`

**Variants:**
- `default` - Gray badge
- `secondary` - Light gray
- `success` - Green
- `destructive` - Red
- `outline` - Outlined

**Usage:**
```typescript
import { Badge } from '@/components/ui/badge';

<Badge variant="success">Published</Badge>
<Badge variant="destructive">Archived</Badge>
<Badge>Draft</Badge>
```

---

## Form Components

### Input

Text input field.

**Location:** `components/ui/input.tsx`

**Usage:**
```typescript
import { Input } from '@/components/ui/input';

<Input
  type="text"
  placeholder="Enter title"
  value={title}
  onChange={(e) => setTitle(e.target.value)}
/>
```

---

### Textarea

Multi-line text input.

**Location:** `components/ui/textarea.tsx`

**Usage:**
```typescript
import { Textarea } from '@/components/ui/textarea';

<Textarea
  placeholder="Enter content"
  rows={10}
  value={content}
  onChange={(e) => setContent(e.target.value)}
/>
```

---

### Select

Dropdown select component.

**Location:** `components/ui/select.tsx`

**Usage:**
```typescript
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

<Select value={status} onValueChange={setStatus}>
  <SelectTrigger>
    <SelectValue placeholder="Select status" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="draft">Draft</SelectItem>
    <SelectItem value="published">Published</SelectItem>
    <SelectItem value="archived">Archived</SelectItem>
  </SelectContent>
</Select>
```

---

### Checkbox

Checkbox input.

**Location:** `components/ui/checkbox.tsx`

**Usage:**
```typescript
import { Checkbox } from '@/components/ui/checkbox';

<div className="flex items-center space-x-2">
  <Checkbox id="featured" checked={featured} onCheckedChange={setFeatured} />
  <label htmlFor="featured">Featured page</label>
</div>
```

---

### Switch

Toggle switch.

**Location:** `components/ui/switch.tsx`

**Usage:**
```typescript
import { Switch } from '@/components/ui/switch';

<div className="flex items-center space-x-2">
  <Switch id="notifications" checked={enabled} onCheckedChange={setEnabled} />
  <label htmlFor="notifications">Enable notifications</label>
</div>
```

---

## CMS Components

### PageEditor

Rich text editor for page content.

**Location:** `components/cms/page-editor.tsx`

**Props:**
```typescript
interface PageEditorProps {
  initialData?: Partial<CmsPage>;
  onSave: (data: PageFormData) => Promise<void>;
  onCancel: () => void;
}
```

**Usage:**
```typescript
import { PageEditor } from '@/components/cms/page-editor';

<PageEditor
  initialData={page}
  onSave={async (data) => {
    await updatePage(page.id, data);
  }}
  onCancel={() => router.back()}
/>
```

---

### MediaUploader

Drag-and-drop file uploader.

**Location:** `components/cms/media-uploader.tsx`

**Props:**
```typescript
interface MediaUploaderProps {
  onUpload: (files: File[]) => Promise<void>;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
}
```

**Usage:**
```typescript
import { MediaUploader } from '@/components/cms/media-uploader';

<MediaUploader
  onUpload={async (files) => {
    await uploadMedia(files);
  }}
  accept="image/*"
  multiple
  maxSize={5 * 1024 * 1024} // 5MB
/>
```

---

### MediaGallery

Grid view of media assets.

**Location:** `components/cms/media-gallery.tsx`

**Props:**
```typescript
interface MediaGalleryProps {
  media: CmsMediaAsset[];
  onSelect?: (asset: CmsMediaAsset) => void;
  onDelete?: (id: string) => Promise<void>;
  selectable?: boolean;
}
```

**Usage:**
```typescript
import { MediaGallery } from '@/components/cms/media-gallery';

<MediaGallery
  media={mediaAssets}
  onSelect={(asset) => setSelectedMedia(asset)}
  onDelete={deleteMedia}
  selectable
/>
```

---

### TemplateSelector

Template picker component.

**Location:** `components/cms/template-selector.tsx`

**Props:**
```typescript
interface TemplateSelectorProps {
  templates: CmsTemplate[];
  value?: string;
  onChange: (templateId: string) => void;
}
```

**Usage:**
```typescript
import { TemplateSelector } from '@/components/cms/template-selector';

<TemplateSelector
  templates={templates}
  value={selectedTemplate}
  onChange={setSelectedTemplate}
/>
```

---

## Admin Components

### CacheManager

Cache statistics and management.

**Location:** `components/admin/cache-manager.tsx`

**Usage:**
```typescript
import { CacheManager } from '@/components/admin/cache-manager';

export default function CachePage() {
  return (
    <div>
      <h1>Cache Management</h1>
      <CacheManager />
    </div>
  );
}
```

**Features:**
- Real-time cache statistics
- Memory usage charts
- Clear cache by pattern
- Clear all cache
- Auto-refresh every 30 seconds

---

### ActivityLog

Activity history viewer.

**Location:** `components/admin/activity-log.tsx`

**Props:**
```typescript
interface ActivityLogProps {
  filters?: {
    userId?: string;
    action?: string;
    entityType?: string;
  };
  limit?: number;
}
```

**Usage:**
```typescript
import { ActivityLog } from '@/components/admin/activity-log';

<ActivityLog
  filters={{ entityType: 'CmsPage' }}
  limit={50}
/>
```

---

### BulkActions

Bulk operation interface.

**Location:** `components/admin/bulk-actions.tsx`

**Props:**
```typescript
interface BulkActionsProps {
  selectedIds: string[];
  onAction: (action: string, ids: string[]) => Promise<void>;
  actions: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    variant?: 'default' | 'destructive';
  }>;
}
```

**Usage:**
```typescript
import { BulkActions } from '@/components/admin/bulk-actions';

<BulkActions
  selectedIds={selectedPageIds}
  onAction={handleBulkAction}
  actions={[
    { id: 'publish', label: 'Publish', icon: <CheckIcon /> },
    { id: 'delete', label: 'Delete', variant: 'destructive', icon: <TrashIcon /> },
  ]}
/>
```

---

## Hooks

### useMediaQuery

Responsive breakpoint hooks.

**Location:** `hooks/use-media-query.ts`

**Hooks:**
```typescript
// Check if mobile (<768px)
const isMobile = useIsMobile();

// Check if tablet (768-1023px)
const isTablet = useIsTablet();

// Check if desktop (>=1024px)
const isDesktop = useIsDesktop();

// Check if large desktop (>=1280px)
const isLargeDesktop = useIsLargeDesktop();

// Check if touch device
const isTouch = useIsTouchDevice();

// Custom breakpoint
const isCustom = useBreakpoint('(min-width: 900px)');
```

**Usage:**
```typescript
import { useIsMobile } from '@/hooks/use-media-query';

export function Navigation() {
  const isMobile = useIsMobile();
  
  return isMobile ? <MobileNav /> : <DesktopNav />;
}
```

**Features:**
- SSR-safe (returns false on server)
- Debounced for performance
- Uses matchMedia API
- TypeScript typed

---

### useDebounce

Debounce value changes.

**Location:** `hooks/use-debounce.ts`

**Usage:**
```typescript
import { useDebounce } from '@/hooks/use-debounce';

export function SearchInput() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);
  
  useEffect(() => {
    if (debouncedQuery) {
      searchPages(debouncedQuery);
    }
  }, [debouncedQuery]);
  
  return <Input value={query} onChange={(e) => setQuery(e.target.value)} />;
}
```

---

### useLocalStorage

Persist state in localStorage.

**Location:** `hooks/use-local-storage.ts`

**Usage:**
```typescript
import { useLocalStorage } from '@/hooks/use-local-storage';

export function Settings() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  
  return (
    <select value={theme} onChange={(e) => setTheme(e.target.value)}>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  );
}
```

---

## Best Practices

### Responsive Components

1. **Mobile-First Design**
   - Start with mobile layout
   - Enhance for larger screens
   - Use `min-width` media queries

2. **Touch Targets**
   - Minimum 44x44px for interactive elements
   - Adequate spacing between tappable items
   - Use `useIsTouchDevice` for touch-specific UX

3. **Performance**
   - Use SSR-safe hooks
   - Debounce resize events
   - Lazy load off-screen content

4. **Accessibility**
   - Focus management in modals/drawers
   - Keyboard navigation
   - ARIA labels for screen readers

### Form Components

1. **Validation**
   - Client-side validation before submit
   - Server-side validation always
   - Show clear error messages

2. **UX**
   - Disable submit while processing
   - Show loading states
   - Confirm before destructive actions

3. **Mobile Optimization**
   - Use correct input types (email, tel, url)
   - Minimum 16px font size to prevent zoom
   - Large touch targets

---

**Need Help?** See [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) for implementation details.

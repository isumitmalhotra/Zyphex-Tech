# Developer Guide

Complete guide for developers working on the Zyphex Tech CMS.

## Table of Contents

1. [Architecture](#architecture)
2. [Development Setup](#development-setup)
3. [Code Structure](#code-structure)
4. [Database Schema](#database-schema)
5. [Adding Features](#adding-features)
6. [Testing](#testing)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Architecture

### Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript 5
- Tailwind CSS 3
- shadcn/ui components
- Framer Motion (animations)

**Backend:**
- Next.js API Routes
- Prisma ORM
- PostgreSQL
- Redis (caching)
- NextAuth.js (authentication)

**Infrastructure:**
- Vercel (hosting)
- AWS S3 (file storage)
- Redis Cloud (caching)
- Neon/Supabase (database)

### System Architecture

```
┌──────────────────────────────────────────────────┐
│                 Client (Browser)                  │
└────────────────────┬─────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────┐
│            Next.js Middleware                     │
│  - Authentication Check                           │
│  - Permission Validation                          │
│  - Request Logging                                │
└────────────────────┬─────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌───────────────┐       ┌───────────────────┐
│  App Routes   │       │   API Routes      │
│  (RSC/SSR)    │       │   /api/cms/*      │
└───────┬───────┘       └────────┬──────────┘
        │                        │
        │                        ▼
        │             ┌──────────────────────┐
        │             │  Business Logic      │
        │             │  - Authorization     │
        │             │  - Validation        │
        │             │  - Transform         │
        │             └──────────┬───────────┘
        │                        │
        └────────────┬───────────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
         ▼           ▼           ▼
   ┌─────────┐  ┌────────┐  ┌─────────┐
   │ Prisma  │  │ Redis  │  │  S3     │
   │   ORM   │  │ Cache  │  │ Storage │
   └────┬────┘  └────┬───┘  └────┬────┘
        │            │           │
        ▼            ▼           ▼
  ┌──────────┐  ┌────────┐  ┌────────┐
  │PostgreSQL│  │ Redis  │  │  AWS   │
  └──────────┘  └────────┘  └────────┘
```

---

## Development Setup

### Prerequisites

```bash
node -v    # v18.0.0 or higher
npm -v     # v9.0.0 or higher
psql --version  # PostgreSQL 14+
redis-cli --version  # Redis 6+ (optional)
```

### Initial Setup

1. **Clone and Install**
   ```bash
   git clone <repository>
   cd zyphex-tech
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```

   Configure:
   ```env
   # Database
   DATABASE_URL="postgresql://user:pass@localhost:5432/zyphex_dev"
   
   # Auth
   NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
   NEXTAUTH_URL="http://localhost:3000"
   
   # Redis (optional)
   REDIS_URL="redis://localhost:6379"
   
   # File Storage
   UPLOAD_DIR="./uploads"  # or S3 config
   ```

3. **Database Setup**
   ```bash
   # Run migrations
   npx prisma migrate dev
   
   # Seed data
   npx prisma db seed
   
   # Open Prisma Studio (optional)
   npx prisma studio
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

   Access:
   - App: http://localhost:3000
   - Admin: http://localhost:3000/super-admin

### Development Tools

```bash
# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Format code
npm run format

# Database commands
npx prisma generate     # Generate Prisma Client
npx prisma migrate dev  # Create migration
npx prisma studio       # Open database GUI

# Build for production
npm run build
npm run start
```

---

## Code Structure

### Directory Layout

```
zyphex-tech/
├── app/                      # Next.js App Router
│   ├── api/
│   │   └── cms/             # CMS API routes
│   │       ├── pages/
│   │       ├── templates/
│   │       ├── media/
│   │       ├── search/
│   │       └── cache/
│   ├── super-admin/         # Admin dashboard
│   │   └── cms/             # CMS admin pages
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Homepage
│
├── components/              # React components
│   ├── ui/                  # Base UI components (shadcn)
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── responsive-table.tsx
│   │   ├── responsive-modal.tsx
│   │   └── ...
│   ├── cms/                 # CMS-specific components
│   │   ├── pages-table.tsx
│   │   ├── media-gallery.tsx
│   │   ├── template-editor.tsx
│   │   └── ...
│   └── admin/               # Admin components
│       ├── cache-manager.tsx
│       └── ...
│
├── lib/                     # Utility libraries
│   ├── cms/                 # CMS business logic
│   │   ├── authorization.ts     # Permission system
│   │   ├── filter-builder.ts    # Query builder
│   │   ├── search-engine.ts     # Search logic
│   │   ├── file-storage.ts      # File operations
│   │   └── error-handler.ts     # Error handling
│   ├── cache/               # Caching utilities
│   │   ├── redis.ts             # Redis client
│   │   └── invalidation.ts      # Cache invalidation
│   ├── auth/                # Authentication
│   │   ├── permissions.ts       # Permission definitions
│   │   └── roles.ts             # Role definitions
│   ├── prisma.ts            # Prisma client
│   └── utils.ts             # General utilities
│
├── hooks/                   # React hooks
│   ├── use-media-query.ts   # Responsive hooks
│   └── use-permissions.ts   # Permission hooks
│
├── prisma/                  # Database
│   ├── schema.prisma        # Database schema
│   ├── migrations/          # Migration history
│   └── seed.ts              # Seed data
│
├── types/                   # TypeScript types
│   └── index.ts
│
├── public/                  # Static assets
│
├── docs/                    # Documentation
│   ├── CMS_DOCUMENTATION.md
│   ├── API_DOCUMENTATION.md
│   └── DEVELOPER_GUIDE.md
│
└── package.json
```

### File Naming Conventions

- **Components**: `kebab-case.tsx` (e.g., `pages-table.tsx`)
- **Utilities**: `kebab-case.ts` (e.g., `filter-builder.ts`)
- **Types**: `PascalCase` (e.g., `CmsPage`, `MediaAsset`)
- **API Routes**: `route.ts` (Next.js 14 convention)
- **Constants**: `SCREAMING_SNAKE_CASE`

---

## Database Schema

### Core CMS Tables

```prisma
model CmsPage {
  id                   String    @id @default(uuid())
  pageKey              String    @unique
  pageTitle            String
  slug                 String    @unique
  pageType             String    @default("standard")
  status               String    @default("draft")
  templateId           String?
  template             CmsTemplate? @relation(fields: [templateId], ...)
  sections             CmsPageSection[]
  versions             CmsPageVersion[]
  metaTitle            String?
  metaDescription      String?
  publishedAt          DateTime?
  scheduledPublishAt   DateTime?
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
  deletedAt            DateTime?
  authorId             String
  lastEditedBy         String
}

model CmsTemplate {
  id                   String    @id @default(uuid())
  name                 String
  category             String
  templateStructure    Json
  defaultContent       Json?
  pages                CmsPage[]
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
}

model CmsMediaAsset {
  id                   String    @id @default(uuid())
  filename             String
  fileUrl              String
  mimeType             String
  fileSize             Int
  assetType            String
  width                Int?
  height               Int?
  altText              String?
  tags                 String[]
  uploadedBy           String
  createdAt            DateTime  @default(now())
  deletedAt            DateTime?
}

model CmsActivityLog {
  id                   String    @id @default(uuid())
  userId               String
  action               String
  entityType           String
  entityId             String
  changes              Json?
  ipAddress            String?
  createdAt            DateTime  @default(now())
}
```

### Relationships

```
CmsPage ──┬─→ CmsTemplate (many-to-one)
          ├─→ CmsPageSection (one-to-many)
          ├─→ CmsPageVersion (one-to-many)
          └─→ CmsWorkflow (one-to-many)

CmsTemplate ─→ CmsPage (one-to-many)

CmsMediaAsset ─→ (no direct relations, referenced via URLs)
```

### Indexes

```prisma
@@index([pageKey])
@@index([slug])
@@index([status])
@@index([pageType])
@@index([authorId])
@@index([createdAt])
@@index([deletedAt])
```

---

## Adding Features

### 1. Add New API Endpoint

**Example: Add "Clone Page" endpoint**

```typescript
// app/api/cms/pages/[id]/clone/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/cms/authorization';
import { prisma } from '@/lib/prisma';
import { invalidatePageCache } from '@/lib/cache/invalidation';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check permissions
    const user = await requirePermission('cms.pages.create');

    // Get original page
    const originalPage = await prisma.cmsPage.findUnique({
      where: { id: params.id },
      include: { sections: true }
    });

    if (!originalPage) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    // Clone page
    const clonedPage = await prisma.cmsPage.create({
      data: {
        pageKey: `${originalPage.pageKey}-copy`,
        pageTitle: `${originalPage.pageTitle} (Copy)`,
        slug: `${originalPage.slug}-copy`,
        pageType: originalPage.pageType,
        templateId: originalPage.templateId,
        // ... other fields
        authorId: user.id,
        status: 'draft',
      },
    });

    // Clone sections
    for (const section of originalPage.sections) {
      await prisma.cmsPageSection.create({
        data: {
          pageId: clonedPage.id,
          name: section.name,
          sectionType: section.sectionType,
          content: section.content,
          order: section.order,
        },
      });
    }

    // Log activity
    await prisma.cmsActivityLog.create({
      data: {
        userId: user.id,
        action: 'clone_page',
        entityType: 'page',
        entityId: clonedPage.id,
        changes: { originalPageId: params.id },
      },
    });

    // Invalidate cache
    await invalidatePageCache(clonedPage.id);

    return NextResponse.json({
      success: true,
      message: 'Page cloned successfully',
      data: clonedPage,
    });

  } catch (error) {
    console.error('Clone page error:', error);
    return NextResponse.json(
      { error: 'Failed to clone page' },
      { status: 500 }
    );
  }
}
```

### 2. Add New Permission

```typescript
// lib/auth/permissions.ts

export const CMS_PERMISSIONS = {
  // ... existing permissions
  'cms.pages.clone': 'Clone existing pages',
} as const;

// Add to role
ROLE_PERMISSIONS.content_editor.push('cms.pages.clone');
```

### 3. Add UI Component

```typescript
// components/cms/clone-page-button.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ClonePageButton({ pageId }: { pageId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClone = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/cms/pages/${pageId}/clone`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        router.push(`/super-admin/cms/pages/${data.data.id}/edit`);
      }
    } catch (error) {
      console.error('Clone failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleClone} disabled={loading}>
      <Copy className="mr-2 h-4 w-4" />
      Clone Page
    </Button>
  );
}
```

### 4. Update Documentation

- Add endpoint to `API_DOCUMENTATION.md`
- Add feature to `CMS_DOCUMENTATION.md`
- Update changelog

---

## Testing

### Unit Tests

```typescript
// __tests__/lib/cms/filter-builder.test.ts
import { buildPageFilters } from '@/lib/cms/filter-builder';

describe('buildPageFilters', () => {
  it('should build basic filter', () => {
    const result = buildPageFilters({
      status: 'published'
    });
    
    expect(result.where).toEqual({
      status: 'published',
      deletedAt: null
    });
  });
});
```

### Integration Tests

```typescript
// __tests__/api/cms/pages.test.ts
import { GET } from '@/app/api/cms/pages/route';

describe('GET /api/cms/pages', () => {
  it('should return pages list', async () => {
    const request = new Request('http://localhost:3000/api/cms/pages');
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test pages.test.ts

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

---

## Best Practices

### 1. **API Route Structure**

```typescript
export async function GET(request: NextRequest) {
  try {
    // 1. Authentication & Authorization
    const user = await requirePermission('permission.name');
    
    // 2. Input Validation
    const params = validateParams(request.nextUrl.searchParams);
    
    // 3. Cache Check (if applicable)
    const cached = await getCache(cacheKey);
    if (cached) return NextResponse.json(cached);
    
    // 4. Business Logic
    const data = await fetchData(params);
    
    // 5. Cache Store (if applicable)
    await setCache(cacheKey, data);
    
    // 6. Return Response
    return NextResponse.json({ success: true, data });
    
  } catch (error) {
    // 7. Error Handling
    return handleError(error);
  }
}
```

### 2. **Component Structure**

```typescript
'use client'; // Only if needed

import { useState } from 'react';
import { Button } from '@/components/ui/button';

// Types first
interface MyComponentProps {
  id: string;
  onAction?: () => void;
}

// Main component
export function MyComponent({ id, onAction }: MyComponentProps) {
  // Hooks
  const [state, setState] = useState(false);
  
  // Handlers
  const handleClick = () => {
    // ...
  };
  
  // Render
  return (
    <div>
      {/* ... */}
    </div>
  );
}

// Helper components (if small)
function HelperComponent() {
  return <div />;
}
```

### 3. **Database Queries**

```typescript
// ✅ Good: Include necessary relations
const page = await prisma.cmsPage.findUnique({
  where: { id },
  include: {
    template: true,
    sections: {
      where: { isVisible: true },
      orderBy: { order: 'asc' }
    }
  }
});

// ✅ Good: Use transactions for multiple operations
await prisma.$transaction([
  prisma.cmsPage.create({ ... }),
  prisma.cmsPageVersion.create({ ... }),
  prisma.cmsActivityLog.create({ ... })
]);

// ❌ Bad: N+1 query problem
const pages = await prisma.cmsPage.findMany();
for (const page of pages) {
  page.template = await prisma.cmsTemplate.findUnique({ ... });
}
```

### 4. **Error Handling**

```typescript
// Custom error class
export class CmsApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'CmsApiError';
  }
}

// Usage
if (!page) {
  throw new CmsApiError('Page not found', 404);
}

// Catch and handle
catch (error) {
  if (error instanceof CmsApiError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }
  // Log unexpected errors
  console.error('Unexpected error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

### 5. **Caching Strategy**

```typescript
// Always invalidate on mutations
export async function PATCH(request, { params }) {
  // ... update logic ...
  
  // Invalidate caches
  await invalidatePageCache(params.id);
  
  return NextResponse.json({ ... });
}

// Use appropriate TTLs
const TTL = {
  short: 5 * 60,      // 5 minutes - search, lists
  medium: 30 * 60,    // 30 minutes - templates, media
  long: 60 * 60,      // 1 hour - individual pages
};
```

---

## Troubleshooting

### Common Issues

#### Prisma Client Out of Sync
```bash
# Regenerate Prisma Client
npx prisma generate
```

#### Migration Conflicts
```bash
# Reset database (DEV ONLY!)
npx prisma migrate reset

# Or create new migration
npx prisma migrate dev --name fix_conflict
```

#### Cache Issues
```bash
# Clear Redis cache
redis-cli FLUSHDB

# Or use admin UI
# Navigate to /super-admin/cache → Invalidate All
```

#### Type Errors After Schema Change
```bash
# Regenerate types
npx prisma generate
npm run type-check
```

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [API Documentation](./API_DOCUMENTATION.md)
- [CMS Documentation](./CMS_DOCUMENTATION.md)

---

**Questions?** Contact the development team or create a GitHub issue.

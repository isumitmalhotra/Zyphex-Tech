# CMS Documentation

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Features](#features)
4. [User Guides](#user-guides)
5. [API Reference](#api-reference)
6. [Developer Guide](#developer-guide)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The Zyphex Tech CMS is a comprehensive content management system built with Next.js 14, TypeScript, Prisma, and PostgreSQL. It provides a powerful, scalable platform for managing dynamic content, media assets, and page templates.

### Key Features

- 📄 **Dynamic Page Management** - Create, edit, and publish pages with flexible templates
- 🖼️ **Media Library** - Upload, organize, and manage images, videos, and documents
- 🎨 **Template System** - Reusable page templates with custom layouts
- 🔍 **Advanced Search** - Full-text search across all content types
- 🔐 **Role-Based Access Control** - Granular permissions system
- 📊 **Activity Logging** - Comprehensive audit trail
- ⚡ **Redis Caching** - High-performance caching layer
- 📱 **Responsive Design** - Mobile-first UI components
- 🔄 **Bulk Operations** - Efficient batch processing
- 📅 **Scheduled Publishing** - Content scheduling and automation

### Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis
- **Authentication**: NextAuth.js
- **UI**: Tailwind CSS + shadcn/ui
- **State Management**: React Server Components
- **File Storage**: Local/S3 (configurable)

---

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Redis 6+ (optional, for caching)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/zyphex-tech.git
   cd zyphex-tech
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Configure the following:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/zyphex"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   REDIS_URL="redis://localhost:6379" # Optional
   ```

4. **Set up the database**
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Access the CMS**
   - Frontend: http://localhost:3000
   - Admin Dashboard: http://localhost:3000/super-admin
   - Default credentials: See seeded data

---

## Features

### 1. Page Management

Create and manage dynamic pages with:
- Multiple page types (standard, landing, blog, custom)
- SEO metadata (title, description, keywords, OG tags)
- Status workflow (draft → review → published)
- Version history with rollback
- Scheduled publishing
- Template association

**Permissions Required:**
- `cms.pages.view` - View pages
- `cms.pages.create` - Create new pages
- `cms.pages.edit` - Edit existing pages
- `cms.pages.delete` - Delete pages
- `cms.pages.publish` - Publish pages

### 2. Media Library

Comprehensive asset management:
- Upload images, videos, documents
- Automatic thumbnail generation
- Image optimization
- Folder organization
- Tag and category system
- Usage tracking
- Alt text and captions

**Supported Formats:**
- Images: JPG, PNG, GIF, WebP, SVG
- Videos: MP4, WebM, MOV
- Documents: PDF, DOC, DOCX, XLS, XLSX

**Permissions Required:**
- `cms.media.view` - View media
- `cms.media.upload` - Upload files
- `cms.media.edit` - Edit metadata
- `cms.media.delete` - Delete files

### 3. Template System

Reusable page templates:
- Template categories (landing, blog, marketing, etc.)
- JSON-based structure
- Default content
- Template preview
- Usage analytics

**Permissions Required:**
- `cms.templates.view` - View templates
- `cms.templates.create` - Create templates
- `cms.templates.edit` - Edit templates
- `cms.templates.delete` - Delete templates

### 4. Search Engine

Advanced search capabilities:
- Full-text search across entities
- Multi-entity search (pages, templates, media, sections)
- Advanced filters:
  - Status, type, category
  - Date ranges
  - Author, template
  - Tags
- Result highlighting
- **Performance**: Results cached for 5 minutes

### 5. Bulk Operations

Efficient batch processing:
- Bulk publish/unpublish pages
- Bulk delete/archive
- Bulk status updates
- Bulk media operations
- Progress tracking
- Error handling
- Automatic cache invalidation

### 6. Activity Log

Comprehensive audit trail:
- All CRUD operations logged
- User tracking
- IP address and user agent
- Change details
- Filterable by:
  - User
  - Action type
  - Entity type
  - Date range
- Export capabilities

### 7. Caching System

High-performance Redis caching:
- **Page Lists**: 5-minute TTL
- **Individual Pages**: 1-hour TTL
- **Templates**: 30-minute TTL
- **Media**: 30-minute TTL
- **Search Results**: 5-minute TTL
- Automatic invalidation on mutations
- Manual cache management UI
- Cache statistics dashboard

### 8. Responsive Design

Mobile-first UI:
- Responsive tables (auto card layout on mobile)
- Touch-friendly forms (44px touch targets)
- Mobile drawer navigation
- Full-screen modals on mobile
- Bottom sheets
- Collapsible sections

---

## User Guides

### For Content Editors

#### Creating a New Page

1. Navigate to **CMS → Pages**
2. Click **"Create New Page"**
3. Fill in required fields:
   - Page Key (unique identifier)
   - Page Title
   - Slug (URL path)
   - Page Type
4. Optionally select a template
5. Add SEO metadata
6. Click **"Save Draft"**
7. Add sections and content
8. Click **"Publish"** when ready

#### Managing Media

1. Navigate to **CMS → Media Library**
2. Click **"Upload"** or drag-and-drop files
3. Fill in metadata:
   - Alt text (for accessibility)
   - Caption
   - Description
   - Tags and categories
4. Use folders to organize assets
5. Click on media to view usage locations

#### Using Bulk Operations

1. Select multiple items using checkboxes
2. Click **"Bulk Actions"** button
3. Choose action (publish, delete, etc.)
4. Confirm in dialog
5. Monitor progress bar
6. Review results

### For Project Managers

#### Reviewing Content

1. Navigate to **CMS → Pages**
2. Filter by **Status: "Review"**
3. Click on page to open
4. Review content and metadata
5. Choose action:
   - **Approve** → Changes status to "Published"
   - **Request Changes** → Add comment and send back to draft
   - **Schedule** → Set publish date/time

#### Managing Workflows

1. Navigate to **CMS → Workflows**
2. View active workflows
3. Track content through approval stages
4. Assign reviewers
5. Set deadlines

### For Administrators

#### Managing Permissions

1. Navigate to **Admin → Users**
2. Select user
3. Click **"Edit Permissions"**
4. Toggle CMS permissions:
   - Pages (view, create, edit, delete, publish)
   - Media (view, upload, edit, delete)
   - Templates (view, create, edit, delete)
   - Settings (view, edit)
5. Save changes

#### Cache Management

1. Navigate to **Super Admin → Cache**
2. View cache statistics:
   - Connection status
   - Keys count
   - Memory usage
   - Hit rate
3. Invalidate cache:
   - Select scope (all, pages, templates, media, search)
   - Click **"Invalidate Cache"**
   - Confirm action

#### Activity Monitoring

1. Navigate to **CMS → Activity Log**
2. Apply filters:
   - User
   - Action type
   - Date range
3. Review actions
4. Export logs for auditing

---

## API Reference

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

### Quick Reference

#### Pages API
```typescript
GET    /api/cms/pages          // List pages
POST   /api/cms/pages          // Create page
GET    /api/cms/pages/[id]     // Get single page
PATCH  /api/cms/pages/[id]     // Update page
DELETE /api/cms/pages/[id]     // Delete page
POST   /api/cms/pages/bulk     // Bulk operations
```

#### Templates API
```typescript
GET    /api/cms/templates      // List templates
POST   /api/cms/templates      // Create template
GET    /api/cms/templates/[id] // Get template
PATCH  /api/cms/templates/[id] // Update template
DELETE /api/cms/templates/[id] // Delete template
```

#### Media API
```typescript
GET    /api/cms/media          // List media
POST   /api/cms/media          // Upload media
PATCH  /api/cms/media?id=...   // Update media
DELETE /api/cms/media?id=...   // Delete media
```

#### Search API
```typescript
GET    /api/cms/search?q=...   // Search all entities
```

#### Cache API
```typescript
GET    /api/cms/cache          // Get cache stats
POST   /api/cms/cache          // Invalidate cache
```

---

## Developer Guide

See [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) for detailed development documentation.

### Architecture Overview

```
┌─────────────────────────────────────────────┐
│           Next.js App Router                │
├─────────────────────────────────────────────┤
│  App Routes  │  API Routes  │  Components   │
├──────────────┼──────────────┼───────────────┤
│              │              │               │
│  Pages       │  /api/cms/*  │  CMS UI       │
│  Layouts     │  Auth        │  Responsive   │
│  Metadata    │  Middleware  │  Forms        │
│              │              │               │
├──────────────┴──────────────┴───────────────┤
│         Business Logic Layer                │
├─────────────────────────────────────────────┤
│  Authorization │  Search     │  Cache       │
│  Filter Builder│  File Ops   │  Validation  │
├─────────────────────────────────────────────┤
│           Data Access Layer                 │
├─────────────────────────────────────────────┤
│  Prisma ORM  │  Redis Client│  File Storage│
├─────────────────────────────────────────────┤
│         Infrastructure Layer                │
├─────────────────────────────────────────────┤
│  PostgreSQL  │  Redis       │  File System │
└─────────────────────────────────────────────┘
```

### Key Directories

```
app/
├── api/cms/          # CMS API routes
├── super-admin/      # Admin dashboard
└── (public)/         # Public pages

components/
├── cms/              # CMS-specific components
├── ui/               # Reusable UI components
└── admin/            # Admin components

lib/
├── cms/              # CMS business logic
├── cache/            # Caching utilities
├── auth/             # Authentication
└── prisma.ts         # Database client

prisma/
├── schema.prisma     # Database schema
└── migrations/       # Database migrations
```

### Adding a New Feature

1. **Define the schema** in `prisma/schema.prisma`
2. **Create migration**: `npx prisma migrate dev`
3. **Add API routes** in `app/api/cms/`
4. **Create components** in `components/cms/`
5. **Add permissions** in `lib/auth/permissions.ts`
6. **Update documentation**

---

## Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

### Quick Deploy

#### Vercel
```bash
vercel --prod
```

#### Docker
```bash
docker-compose up -d
```

#### Manual
```bash
npm run build
npm run start
```

### Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Authentication secret
- `NEXTAUTH_URL` - Application URL

Optional:
- `REDIS_URL` - Redis connection string (for caching)
- `S3_BUCKET` - S3 bucket name (for file storage)
- `AWS_ACCESS_KEY_ID` - AWS credentials
- `AWS_SECRET_ACCESS_KEY` - AWS credentials

---

## Troubleshooting

### Common Issues

#### Cache Not Working
- Check Redis connection: `redis-cli ping`
- Verify `REDIS_URL` environment variable
- Check cache statistics in admin panel

#### Permission Denied
- Verify user has required permissions
- Check role assignments
- Review activity log for access attempts

#### Search Not Returning Results
- Rebuild search index
- Check database indexes
- Clear search cache

#### Upload Failures
- Check file size limits
- Verify file type is allowed
- Check disk space/S3 permissions

### Getting Help

- **Documentation**: Check this guide and linked docs
- **Logs**: Check application logs and activity log
- **GitHub Issues**: Report bugs and request features
- **Support**: Contact the development team

---

## Additional Resources

- [API Documentation](./API_DOCUMENTATION.md)
- [Developer Guide](./DEVELOPER_GUIDE.md)
- [Component Library](./COMPONENT_LIBRARY.md)
- [Responsive Design Guide](./RESPONSIVE_DESIGN_GUIDE.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)

---

**Version**: 1.0.0  
**Last Updated**: October 29, 2025  
**Maintainers**: Zyphex Tech Development Team

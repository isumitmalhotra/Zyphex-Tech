# CMS API Documentation

Complete reference for all CMS API endpoints.

## Base URL

```
Development: http://localhost:3000/api/cms
Production:  https://yourdomain.com/api/cms
```

## Authentication

All CMS API endpoints require authentication via NextAuth.js session.

**Headers Required:**
```http
Cookie: next-auth.session-token=<session-token>
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized",
  "message": "You must be logged in"
}
```

---

## Pages API

### List Pages

```http
GET /api/cms/pages
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20, max: 100) |
| `search` | string | Search query |
| `status` | string | Filter by status (draft, review, published, archived) |
| `pageType` | string | Filter by page type |
| `authorId` | string | Filter by author |
| `templateId` | string | Filter by template |
| `sortBy` | string | Sort field (createdAt, updatedAt, pageTitle) |
| `sortOrder` | string | Sort direction (asc, desc) |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "pageKey": "homepage",
      "pageTitle": "Home Page",
      "slug": "/",
      "pageType": "landing",
      "status": "published",
      "templateId": "uuid",
      "template": {
        "id": "uuid",
        "name": "Landing Template",
        "category": "landing"
      },
      "metaTitle": "Welcome to Zyphex Tech",
      "metaDescription": "...",
      "isPublic": true,
      "requiresAuth": false,
      "publishedAt": "2025-10-29T10:00:00Z",
      "createdAt": "2025-10-29T09:00:00Z",
      "updatedAt": "2025-10-29T10:00:00Z",
      "_count": {
        "sections": 5,
        "versions": 3
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 45,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "filters": { ... }
}
```

**Permissions**: `cms.pages.view`

---

### Create Page

```http
POST /api/cms/pages
```

**Request Body:**
```json
{
  "pageKey": "about-us",
  "pageTitle": "About Us",
  "slug": "/about",
  "pageType": "standard",
  "templateId": "uuid",
  "metaTitle": "About Zyphex Tech",
  "metaDescription": "Learn more about our company",
  "metaKeywords": "about, company, team",
  "ogImage": "https://example.com/og-image.jpg",
  "isPublic": true,
  "requiresAuth": false,
  "allowComments": false
}
```

**Validation Rules:**
- `pageKey`: 1-100 chars, lowercase alphanumeric and hyphens only
- `pageTitle`: 1-255 chars, required
- `slug`: 1-255 chars, must start with /, alphanumeric and hyphens
- `pageType`: enum (standard, landing, blog, custom)
- `metaTitle`: max 60 chars (SEO best practice)
- `metaDescription`: max 160 chars (SEO best practice)

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Page created successfully",
  "data": { ... }
}
```

**Error Response (409 Conflict):**
```json
{
  "error": "Page with key 'about-us' already exists"
}
```

**Permissions**: `cms.pages.create`

---

### Get Single Page

```http
GET /api/cms/pages/[id]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "pageKey": "about-us",
    "pageTitle": "About Us",
    "slug": "/about",
    "status": "published",
    "template": { ... },
    "sections": [
      {
        "id": "uuid",
        "name": "Hero Section",
        "sectionType": "hero",
        "order": 1,
        "isVisible": true,
        "content": { ... }
      }
    ],
    "versions": [
      {
        "id": "uuid",
        "versionNumber": 2,
        "changeDescription": "Updated hero text",
        "createdBy": "uuid",
        "createdAt": "2025-10-29T10:00:00Z",
        "isPublished": true
      }
    ],
    "_count": {
      "sections": 5,
      "versions": 3,
      "workflows": 0,
      "schedules": 1
    }
  }
}
```

**Cache**: 1-hour TTL

**Permissions**: `cms.pages.view`

---

### Update Page

```http
PATCH /api/cms/pages/[id]
```

**Request Body (all fields optional):**
```json
{
  "pageTitle": "Updated Title",
  "status": "published",
  "scheduledPublishAt": "2025-10-30T12:00:00Z",
  "metaTitle": "New Meta Title"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Page updated successfully",
  "data": { ... }
}
```

**Side Effects:**
- Creates new version
- Invalidates page cache
- Logs activity

**Permissions**: `cms.pages.edit` OR owner of draft

---

### Delete Page

```http
DELETE /api/cms/pages/[id]
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Page deleted successfully"
}
```

**Note**: Soft delete (sets `deletedAt` timestamp)

**Permissions**: `cms.pages.delete`

---

### Bulk Operations

```http
POST /api/cms/pages/bulk
```

**Request Body:**
```json
{
  "action": "publish",
  "pageIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Supported Actions:**
- `publish` - Publish multiple pages
- `unpublish` - Unpublish multiple pages
- `archive` - Archive multiple pages
- `delete` - Delete multiple pages

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Bulk operation completed",
  "data": {
    "successful": 8,
    "failed": 2,
    "results": [
      {
        "id": "uuid1",
        "success": true
      },
      {
        "id": "uuid2",
        "success": false,
        "error": "Permission denied"
      }
    ]
  }
}
```

**Permissions**: Varies by action (e.g., `cms.pages.publish` for publish action)

---

## Templates API

### List Templates

```http
GET /api/cms/templates
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page |
| `category` | string | Filter by category |
| `search` | string | Search query |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Landing Page Template",
      "description": "Modern landing page with hero and features",
      "category": "landing",
      "thumbnailUrl": "https://...",
      "createdAt": "2025-10-29T10:00:00Z",
      "_count": {
        "pages": 12
      }
    }
  ],
  "pagination": { ... }
}
```

**Cache**: 30-minute TTL

**Permissions**: `cms.templates.view`

---

### Create Template

```http
POST /api/cms/templates
```

**Request Body:**
```json
{
  "name": "Blog Post Template",
  "description": "Template for blog posts",
  "category": "blog",
  "thumbnailUrl": "https://...",
  "templateStructure": {
    "sections": [
      {
        "type": "header",
        "config": { ... }
      }
    ]
  },
  "defaultContent": { ... }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Template created successfully",
  "data": { ... }
}
```

**Permissions**: `cms.templates.create`

---

### Get Single Template

```http
GET /api/cms/templates/[id]
```

**Cache**: 30-minute TTL

**Permissions**: `cms.templates.view`

---

### Update Template

```http
PATCH /api/cms/templates/[id]
```

**Side Effects:**
- Invalidates template cache
- Invalidates all pages using this template
- Logs activity

**Permissions**: `cms.templates.edit`

---

### Delete Template

```http
DELETE /api/cms/templates/[id]
```

**Note**: Hard delete (cannot be recovered)

**Permissions**: `cms.templates.delete`

---

## Media API

### List Media

```http
GET /api/cms/media
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page |
| `assetType` | string | Filter by type (image, video, document, other) |
| `folderId` | string | Filter by folder |
| `tags` | string | Comma-separated tags |
| `search` | string | Search filename, alt text, caption |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "filename": "hero-image.jpg",
      "originalName": "hero image.jpg",
      "fileUrl": "https://...",
      "mimeType": "image/jpeg",
      "fileSize": 245678,
      "assetType": "image",
      "width": 1920,
      "height": 1080,
      "thumbnailUrl": "https://...",
      "altText": "Hero image",
      "caption": "Main hero image",
      "tags": ["hero", "landing"],
      "uploadedBy": "uuid",
      "createdAt": "2025-10-29T10:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

**Cache**: 30-minute TTL

**Permissions**: `cms.media.view`

---

### Upload Media

```http
POST /api/cms/media
Content-Type: multipart/form-data
```

**Form Data:**
```
file: <binary>
altText: "Description"
caption: "Image caption"
folderId: "uuid"
tags: ["tag1", "tag2"]
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "id": "uuid",
    "filename": "hero-image-1234.jpg",
    "fileUrl": "https://...",
    "thumbnailUrl": "https://...",
    "width": 1920,
    "height": 1080
  }
}
```

**File Limits:**
- Max size: 10MB (images), 50MB (videos), 5MB (documents)
- Allowed types: See CMS_DOCUMENTATION.md

**Permissions**: `cms.media.upload`

---

### Update Media

```http
PATCH /api/cms/media?id={id}
```

**Request Body:**
```json
{
  "altText": "Updated description",
  "caption": "New caption",
  "tags": ["new", "tags"]
}
```

**Permissions**: `cms.media.edit` OR owner

---

### Delete Media

```http
DELETE /api/cms/media?id={id}
```

**Side Effects:**
- Deletes physical file
- Checks for usage in pages
- Soft delete in database

**Permissions**: `cms.media.delete` OR owner (if not in use)

---

## Search API

### Global Search

```http
GET /api/cms/search
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search query |
| `types` | string | No | Comma-separated types (page,template,media,section) |
| `status` | string | No | Filter by status |
| `category` | string | No | Filter by category |
| `tags` | string | No | Filter by tags |
| `limit` | number | No | Results per page (default: 20) |
| `offset` | number | No | Pagination offset |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "pages": [
      {
        "id": "uuid",
        "pageTitle": "About Us",
        "slug": "/about",
        "snippet": "...highlighted text...",
        "relevance": 0.95
      }
    ],
    "templates": [ ... ],
    "media": [ ... ],
    "sections": [ ... ],
    "total": 15
  },
  "meta": {
    "query": "about",
    "searchTime": "42ms",
    "total": 15,
    "page": 1,
    "limit": 20
  }
}
```

**Cache**: 5-minute TTL

**Permissions**: Authenticated user

---

## Cache API

### Get Cache Statistics

```http
GET /api/cms/cache
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "keysCount": 1247,
    "memoryUsage": "12.5 MB",
    "hitRate": 87.3
  }
}
```

**Permissions**: `cms.settings.edit`

---

### Invalidate Cache

```http
POST /api/cms/cache
```

**Request Body:**
```json
{
  "scope": "pages"
}
```

**Scopes:**
- `all` - All CMS cache
- `pages` - All page cache
- `templates` - All template cache
- `media` - All media cache
- `search` - All search cache
- `sections` - All section cache

**Alternative (pattern-based):**
```json
{
  "pattern": "cms:page:uuid-123*"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "pages cache invalidated successfully",
  "data": {
    "pattern": "pages"
  }
}
```

**Permissions**: `cms.settings.edit`

---

## Error Responses

### Standard Error Format

```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "details": { ... }
}
```

### HTTP Status Codes

| Code | Meaning | When It Occurs |
|------|---------|----------------|
| 200 | OK | Successful GET, PATCH, DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Validation error, malformed request |
| 401 | Unauthorized | Not logged in |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate key, constraint violation |
| 500 | Server Error | Unexpected server error |

---

## Rate Limiting

**Current Limits:** None (to be implemented)

**Planned:**
- 100 requests/minute per user
- 1000 requests/hour per user
- Bulk operations: 10/minute

---

## Changelog

### Version 1.0.0 (2025-10-29)
- Initial API release
- Pages, Templates, Media, Search, Cache endpoints
- Bulk operations support
- Redis caching integration

---

**Need Help?** See [CMS_DOCUMENTATION.md](./CMS_DOCUMENTATION.md) or contact support.

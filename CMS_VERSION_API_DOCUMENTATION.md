# 📡 CMS Version Control API Documentation

Complete API reference for the CMS Version Control system.

---

## Base URL

```
/api/cms/pages/[pageId]/versions
```

All endpoints require authentication via Next-Auth session.

---

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/versions` | List all versions for a page |
| POST | `/versions` | Create new version manually |
| GET | `/versions/[versionId]` | Get specific version details |
| GET | `/versions/compare` | Compare two versions |
| GET | `/versions/stats` | Get version statistics |
| POST | `/versions/[versionId]/restore` | Restore to specific version |
| DELETE | `/versions/cleanup` | Delete old versions |

---

## 1. List All Versions

Get all versions for a page with statistics.

### Request

```http
GET /api/cms/pages/{pageId}/versions
```

### Response

```json
{
  "success": true,
  "data": {
    "versions": [
      {
        "id": "uuid",
        "pageId": "uuid",
        "versionNumber": 5,
        "changeDescription": "Updated hero section",
        "createdBy": "user-uuid",
        "createdAt": "2024-12-10T10:30:00Z",
        "isPublished": true,
        "publishedAt": "2024-12-10T10:30:00Z",
        "tags": ["auto-save", "published"]
      }
    ],
    "stats": {
      "totalVersions": 5,
      "latestVersionNumber": 5,
      "publishedVersions": 2,
      "latestVersion": {
        "versionNumber": 5,
        "createdAt": "2024-12-10T10:30:00Z",
        "createdBy": "user-uuid"
      }
    }
  }
}
```

### Example

```javascript
const response = await fetch('/api/cms/pages/page-id-123/versions', {
  headers: { 'Content-Type': 'application/json' }
});
const { data } = await response.json();
console.log(`Total versions: ${data.stats.totalVersions}`);
```

---

## 2. Create New Version

Manually create a new version (useful for "Save Point" feature).

### Request

```http
POST /api/cms/pages/{pageId}/versions
Content-Type: application/json

{
  "changeDescription": "Before major redesign",
  "tags": ["manual", "backup", "redesign-checkpoint"]
}
```

### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `changeDescription` | string | No | Description of what changed |
| `tags` | string[] | No | Custom tags for organization |

### Response

```json
{
  "success": true,
  "message": "Version created successfully",
  "data": {
    "id": "uuid",
    "pageId": "uuid",
    "versionNumber": 6,
    "changeDescription": "Before major redesign",
    "createdBy": "user-uuid",
    "createdAt": "2024-12-10T11:00:00Z",
    "tags": ["manual", "backup", "redesign-checkpoint"]
  }
}
```

### Example

```javascript
const response = await fetch('/api/cms/pages/page-id-123/versions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    changeDescription: 'Checkpoint before redesign',
    tags: ['manual', 'checkpoint']
  })
});
```

---

## 3. Get Specific Version

Get complete details of a specific version including full snapshots.

### Request

```http
GET /api/cms/pages/{pageId}/versions/{versionId}
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "pageId": "uuid",
    "versionNumber": 3,
    "pageSnapshot": {
      "id": "uuid",
      "pageTitle": "Homepage",
      "slug": "/",
      "metaTitle": "Welcome to Our Site",
      "status": "published",
      // ... all page fields
    },
    "sectionsSnapshot": [
      {
        "id": "uuid",
        "sectionKey": "hero",
        "sectionType": "hero",
        "content": { /* ... */ },
        "order": 1
      }
    ],
    "changeDescription": "Updated hero content",
    "createdBy": "user-uuid",
    "createdAt": "2024-12-09T15:20:00Z",
    "tags": ["auto-save"]
  }
}
```

### Use Cases
- Preview what page looked like at a specific version
- Inspect changes before restoring
- Audit trail investigation

---

## 4. Compare Versions

Compare two versions to see what changed.

### Request

```http
GET /api/cms/pages/{pageId}/versions/compare?v1={versionId1}&v2={versionId2}
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `v1` | string (UUID) | Yes | First version ID (older) |
| `v2` | string (UUID) | Yes | Second version ID (newer) |

### Response

```json
{
  "success": true,
  "data": {
    "version1": {
      "versionNumber": 3,
      "createdAt": "2024-12-09T10:00:00Z",
      "createdBy": "user-1"
    },
    "version2": {
      "versionNumber": 5,
      "createdAt": "2024-12-10T14:00:00Z",
      "createdBy": "user-2"
    },
    "pageChanges": {
      "metaTitle": {
        "old": "Old Title",
        "new": "New Title"
      },
      "metaDescription": {
        "old": "Old description",
        "new": "New description"
      }
    },
    "sectionChanges": [
      {
        "type": "modified",
        "sectionKey": "hero",
        "changes": {
          "content.title": {
            "old": "Old Hero Title",
            "new": "New Hero Title"
          }
        }
      },
      {
        "type": "added",
        "sectionKey": "testimonials",
        "section": { /* full section data */ }
      },
      {
        "type": "removed",
        "sectionKey": "old-banner",
        "section": { /* full section data */ }
      }
    ]
  }
}
```

### Section Change Types
- `added` - New section added in v2
- `removed` - Section existed in v1 but removed in v2
- `modified` - Section exists in both but content changed

### Example

```javascript
const compare = await fetch(
  `/api/cms/pages/page-id/versions/compare?v1=${oldId}&v2=${newId}`
);
const { data } = await compare.json();

// Check if title changed
if (data.pageChanges.metaTitle) {
  console.log(`Title changed from "${data.pageChanges.metaTitle.old}" to "${data.pageChanges.metaTitle.new}"`);
}

// Count section changes
const added = data.sectionChanges.filter(c => c.type === 'added').length;
const removed = data.sectionChanges.filter(c => c.type === 'removed').length;
const modified = data.sectionChanges.filter(c => c.type === 'modified').length;
console.log(`Sections: +${added} -${removed} ~${modified}`);
```

---

## 5. Get Version Statistics

Get aggregated statistics for a page's versions.

### Request

```http
GET /api/cms/pages/{pageId}/versions/stats
```

### Response

```json
{
  "success": true,
  "data": {
    "totalVersions": 15,
    "latestVersionNumber": 15,
    "publishedVersions": 3,
    "latestVersion": {
      "versionNumber": 15,
      "createdAt": "2024-12-10T16:45:00Z",
      "createdBy": "admin-user-id"
    }
  }
}
```

### Use Cases
- Dashboard widgets
- Version count badges
- Analytics

---

## 6. Restore Version

Restore page to a specific version (one-click rollback).

### Request

```http
POST /api/cms/pages/{pageId}/versions/{versionId}/restore
```

### Response

```json
{
  "success": true,
  "message": "Successfully restored to version 3",
  "data": {
    "newVersion": {
      "id": "new-uuid",
      "versionNumber": 16,
      "changeDescription": "Restored to version 3",
      "tags": ["restore", "from-v3"]
    }
  }
}
```

### How It Works
1. Retrieves the target version's snapshots
2. Updates current page with snapshot data
3. Recreates all sections from snapshot
4. **Creates a new version** (preserves history)
5. Logs restore action to activity log

### Important Notes
- ⚠️ This creates a NEW version, doesn't delete history
- ⚠️ Current page is overwritten with snapshot
- ⚠️ All sections are replaced
- ✅ Can be undone by restoring to a different version

### Example

```javascript
// Restore to version 3
const response = await fetch(
  '/api/cms/pages/page-id/versions/version-3-id/restore',
  { method: 'POST' }
);

const { data } = await response.json();
console.log(`Restored! New version number: ${data.newVersion.versionNumber}`);
```

---

## 7. Cleanup Old Versions

Delete old versions beyond retention limit.

### Request

```http
DELETE /api/cms/pages/{pageId}/versions/cleanup?keep=50
```

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `keep` | number | No | 50 | Number of recent versions to keep |

### Response

```json
{
  "success": true,
  "message": "Cleaned up 15 old version(s)",
  "data": {
    "count": 15
  }
}
```

### Protection Rules
- ✅ Always keeps most recent versions (based on `keep` parameter)
- ✅ **Never deletes published versions** (safety)
- ✅ Deletes oldest unpublished versions first

### Use Cases
- Scheduled maintenance jobs
- Storage optimization
- Database housekeeping

### Example

```javascript
// Keep only last 30 versions
const response = await fetch(
  '/api/cms/pages/page-id/versions/cleanup?keep=30',
  { method: 'DELETE' }
);

const { data } = await response.json();
console.log(`Cleaned up ${data.count} versions`);
```

---

## Auto-Versioning on Page Update

When you update a page via `PATCH /api/cms/pages/{pageId}`, a version is **automatically created**.

### Request

```http
PATCH /api/cms/pages/{pageId}
Content-Type: application/json

{
  "metaTitle": "Updated Title",
  "metaDescription": "Updated description",
  "changeDescription": "SEO improvements"
}
```

### Auto-Version Behavior
- ✅ Version created **after** successful page update
- ✅ Uses `changeDescription` from request body
- ✅ Tags: `["auto-save"]` + `["published"]` if status is published
- ✅ Captures full page + sections snapshot

---

## Error Responses

All endpoints return standard error responses:

### 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "You must be logged in"
}
```

### 404 Not Found

```json
{
  "error": "Not Found",
  "message": "Page not found"
}
```

### 400 Bad Request

```json
{
  "error": "Bad Request",
  "message": "Both v1 and v2 query parameters are required"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal Server Error",
  "message": "Failed to fetch page versions"
}
```

---

## Authentication

All endpoints require authentication via **Next-Auth session**.

### Browser/Frontend

Cookies are sent automatically:

```javascript
// No special headers needed - session cookie sent automatically
const response = await fetch('/api/cms/pages/page-id/versions');
```

### API Client (Postman, etc.)

Include session token in Cookie header:

```http
GET /api/cms/pages/page-id/versions
Cookie: next-auth.session-token=your-session-token-here
```

---

## Complete Usage Example

```javascript
// 1. Get all versions
const { data: { versions, stats } } = await fetch('/api/cms/pages/page-id/versions')
  .then(r => r.json());

console.log(`Total: ${stats.totalVersions} versions`);

// 2. Compare two versions
const comparison = await fetch(
  `/api/cms/pages/page-id/versions/compare?v1=${versions[1].id}&v2=${versions[0].id}`
).then(r => r.json());

console.log('Changes:', comparison.data.pageChanges);

// 3. Create manual checkpoint
const checkpoint = await fetch('/api/cms/pages/page-id/versions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    changeDescription: 'Before redesign',
    tags: ['checkpoint', 'redesign']
  })
}).then(r => r.json());

console.log(`Checkpoint created: v${checkpoint.data.versionNumber}`);

// 4. Update page (auto-version created)
await fetch('/api/cms/pages/page-id', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    metaTitle: 'New Title',
    changeDescription: 'Updated meta title'
  })
});

// 5. Restore if needed
await fetch(`/api/cms/pages/page-id/versions/${checkpoint.data.id}/restore`, {
  method: 'POST'
});

// 6. Cleanup old versions
await fetch('/api/cms/pages/page-id/versions/cleanup?keep=50', {
  method: 'DELETE'
});
```

---

## Best Practices

### 1. Use Meaningful Descriptions

```javascript
// ❌ Bad
{ changeDescription: "update" }

// ✅ Good
{ changeDescription: "Updated hero CTA copy for A/B test variant B" }
```

### 2. Tag Strategically

```javascript
// Useful tags
tags: [
  'manual',           // Manual save point
  'auto-save',        // Auto-created
  'published',        // Published version
  'checkpoint',       // Major milestone
  'before-redesign',  // Before major change
  'approved',         // Approved by client
  'rollback'          // After rollback
]
```

### 3. Compare Before Restore

```javascript
// Always compare first to see what will change
const comparison = await compareVersions(currentId, targetId);
if (confirm(`This will change ${Object.keys(comparison.pageChanges).length} fields. Continue?`)) {
  await restoreVersion(targetId);
}
```

### 4. Schedule Cleanup

```javascript
// Weekly cleanup in cron job
cron.schedule('0 2 * * 0', async () => {
  const pages = await getAllPages();
  for (const page of pages) {
    await fetch(`/api/cms/pages/${page.id}/versions/cleanup?keep=50`, {
      method: 'DELETE'
    });
  }
});
```

---

## Rate Limits

- **Version creation:** Max 1 per second per page
- **Comparison:** Max 10 per minute per user
- **Restore:** Max 5 per minute per user
- **Cleanup:** Max 1 per minute per page

---

## Storage Considerations

Each version stores:
- Full page data (~5-10KB)
- All sections data (~20-50KB per section)
- Metadata (~1KB)

**Example:** Page with 10 sections = ~250KB per version

**Recommendation:** Keep 30-50 recent versions, cleanup regularly.

---

## Next Steps

See also:
- [CMS Production Implementation Plan](../CMS_PRODUCTION_IMPLEMENTATION_PLAN.md)
- [Version Service Documentation](../lib/cms/version-service.ts)
- [Testing Guide](./test-version-apis.js)

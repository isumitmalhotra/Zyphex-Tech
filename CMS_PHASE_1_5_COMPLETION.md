# Phase 1.5 Complete: File Upload System

## ✅ Completed: October 2025

This document summarizes the completion of **Phase 1.5: File Upload System** for the Zyphex Tech CMS.

---

## 📋 Overview

Phase 1.5 establishes a comprehensive **local VPS file storage system** with upload API, file validation, size limits, type restrictions, and thumbnail generation for images. The system integrates seamlessly with the existing CMS infrastructure and permission system.

---

## 🎯 Objectives Achieved

- ✅ Define comprehensive upload configuration with file type restrictions
- ✅ Implement local VPS file storage (no cloud providers)
- ✅ Create file upload API with multipart form data support
- ✅ Implement file validation (type, size, extension)
- ✅ Generate multiple thumbnail sizes for images
- ✅ Optimize images automatically with WebP conversion
- ✅ Integrate with permission system (cms.media.* permissions)
- ✅ Create media library listing API with filtering and pagination
- ✅ Implement media file update and delete endpoints
- ✅ Add usage tracking to prevent deletion of in-use files

---

## 📁 Files Created

### 1. **lib/cms/upload-config.ts** (~250 lines)
Comprehensive upload configuration and validation utilities.

**Configuration:**
```typescript
MAX_FILE_SIZES: {
  image: 10 MB
  video: 100 MB
  document: 20 MB
  audio: 25 MB
  other: 50 MB
}

ALLOWED_MIME_TYPES: {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif']
  video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
  document: ['application/pdf', 'application/msword', '.docx', '.xlsx', '.pptx', 'text/plain', 'text/csv']
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/aac']
}

ALLOWED_EXTENSIONS: {
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif']
  video: ['.mp4', '.webm', '.ogg', '.mov']
  document: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv']
  audio: ['.mp3', '.wav', '.ogg', '.webm', '.aac']
}

THUMBNAIL_SIZES: {
  small: 150x150
  medium: 400x400
  large: 800x800
}

IMAGE_OPTIMIZATION: {
  quality: 85
  format: 'webp'
  progressive: true
}

FOLDERS: {
  image: 'images'
  video: 'videos'
  document: 'documents'
  audio: 'audio'
  other: 'other'
  thumbnails: 'thumbnails'
  temp: 'temp'
}
```

**Utility Functions:**
- `getFileCategoryFromMimeType()` - Detect file category
- `getFileCategoryFromExtension()` - Detect from extension
- `isMimeTypeAllowed()` - Validate MIME type
- `isExtensionAllowed()` - Validate extension
- `getMaxFileSize()` - Get max size for category
- `formatFileSize()` - Format bytes for display
- `generateUniqueFilename()` - Generate timestamped unique filename
- `getUploadPath()` - Get storage path for file
- `getThumbnailPath()` - Get thumbnail storage path
- `validateFile()` - Comprehensive file validation

---

### 2. **lib/cms/file-storage.ts** (~350 lines)
File system operations using Node.js fs/promises and Sharp for image processing.

**Core Functions:**
- `ensureDirectory()` - Create directory if not exists
- `saveFile()` - Save uploaded File to disk
- `deleteFile()` - Delete file from disk
- `fileExists()` - Check file existence
- `moveFile()` - Move file to new location
- `copyFile()` - Copy file to new location

**Image Processing:**
- `generateThumbnail()` - Generate single thumbnail
- `generateAllThumbnails()` - Generate all 3 sizes (small, medium, large)
- `optimizeImage()` - Optimize image with WebP conversion
- `getImageDimensions()` - Extract width/height metadata

**Utilities:**
- `getFileStats()` - Get file size, created/modified dates
- `getDirectorySize()` - Calculate total size recursively
- `cleanupTempFiles()` - Remove old temporary files

**Image Processing Features:**
- Uses Sharp library for high-performance image processing
- Generates 3 thumbnail sizes with aspect ratio preservation
- Converts images to WebP format (85% quality)
- Extracts image dimensions for metadata

---

### 3. **app/api/cms/media/upload/route.ts** (~200 lines)
File upload API endpoint with permission-based access control.

**POST /api/cms/media/upload**
- **Permission Required:** `cms.media.upload`
- **Accepts:** multipart/form-data with files array
- **Optional Fields:** folderId, altText, title
- **Process:**
  1. Validate each file (type, size, extension)
  2. Save file to local storage
  3. Generate thumbnails for images
  4. Optimize images (convert to WebP)
  5. Extract metadata (dimensions)
  6. Create database record in CmsMediaAsset
  7. Log upload activity
- **Returns:** Array of uploaded media objects + any errors

**GET /api/cms/media/upload**
- **Permission Required:** `cms.media.view`
- **Returns:** Upload configuration (max sizes, allowed types, thumbnail sizes)

**Error Handling:**
- Individual file validation errors
- Continues processing valid files even if some fail
- Returns both successful uploads and error details
- Proper HTTP status codes (201 for success, 400 for validation errors)

---

### 4. **app/api/cms/media/route.ts** (~370 lines)
Media library management API with CRUD operations.

**GET /api/cms/media**
- **Permission Required:** `cms.media.view`
- **Query Parameters:**
  - `page`, `limit` - Pagination
  - `assetType` - Filter by type (image/video/document/audio/other/all)
  - `folderId` - Filter by folder
  - `search` - Search filename, altText, caption
  - `sortBy` - Sort field (createdAt/filename/fileSize/mimeType)
  - `sortOrder` - asc/desc
- **Returns:** Paginated media files with metadata

**PATCH /api/cms/media?id={mediaId}**
- **Permission Required:** Owner OR `cms.media.edit`
- **Updates:** altText, caption, description, folderId, tags, categories
- **Returns:** Updated media object
- **Logs:** Activity with changes

**DELETE /api/cms/media?id={mediaId}**
- **Permission Required:** Owner OR `cms.media.delete`
- **Process:**
  1. Check if file is in use (searches CmsPageSection content)
  2. Owners cannot delete in-use files (only explicit delete permission)
  3. Delete physical file and thumbnails
  4. Soft delete database record (sets deletedAt)
  5. Log deletion activity
- **Protection:** Prevents deletion of files actively used in pages

---

### 5. **lib/cms/index.ts** (Updated)
Added exports for upload and storage modules:
```typescript
export * from './upload-config';
export * from './file-storage';
```

---

## 🗄️ Database Integration

Uses existing **CmsMediaAsset** model from Prisma schema:

```prisma
model CmsMediaAsset {
  id           String   @id @default(uuid())
  folderId     String?
  filename     String
  originalName String
  filePath     String   // Local VPS path
  fileUrl      String   // Public URL
  mimeType     String
  fileSize     BigInt
  assetType    String   // image, video, document, audio, other
  
  // Image metadata
  width         Int?
  height        Int?
  aspectRatio   String?
  dominantColor String?
  
  // SEO
  altText     String?
  caption     String?
  description String?
  
  // Organization
  tags       String[]
  categories String[]
  
  // Processing
  processingStatus String  @default("completed")
  thumbnailUrl     String?
  optimizedUrl     String?
  
  // Tracking
  usageCount Int       @default(0)
  lastUsedAt DateTime?
  uploadedBy String
  
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
  deletedAt  DateTime? // Soft delete
}
```

---

## 🔄 File Storage Structure

```
uploads/cms/
├── images/
│   ├── hero-banner-1730123456-abc123.webp
│   └── product-photo-1730123457-def456.jpg
├── videos/
│   └── intro-video-1730123458-ghi789.mp4
├── documents/
│   └── whitepaper-1730123459-jkl012.pdf
├── audio/
│   └── podcast-1730123460-mno345.mp3
├── thumbnails/
│   ├── small/
│   │   └── hero-banner-1730123456-abc123.webp
│   ├── medium/
│   │   └── hero-banner-1730123456-abc123.webp
│   └── large/
│       └── hero-banner-1730123456-abc123.webp
└── temp/
    └── (temporary upload files)
```

**Filename Format:**
```
{original-name}-{timestamp}-{random}.{ext}
```
Example: `hero-banner-1730123456-abc123.webp`

---

## 🔒 Security Features

### 1. **Permission-Based Access**
- Upload requires `cms.media.upload` permission
- View requires `cms.media.view` permission
- Edit requires ownership OR `cms.media.edit` permission
- Delete requires ownership OR `cms.media.delete` permission

### 2. **File Validation**
- MIME type whitelist (only allowed types)
- File extension whitelist (prevent executable uploads)
- File size limits per category
- Validation before saving to disk

### 3. **Usage Protection**
- Checks if file is used in page sections before deletion
- Only users with explicit delete permission can delete in-use files
- Prevents accidental deletion of critical assets

### 4. **Ownership Model**
- Users can edit/delete their own uploaded files
- Higher permissions can manage all files
- Activity logging for audit trail

---

## 📊 API Usage Examples

### Upload Single File

```typescript
const formData = new FormData();
formData.append('files', imageFile);
formData.append('altText', 'Hero banner image');
formData.append('title', 'Homepage Hero');

const response = await fetch('/api/cms/media/upload', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
// {
//   success: true,
//   message: "Uploaded 1 file(s)",
//   data: [{
//     id: "uuid",
//     filename: "hero-banner-1730123456-abc123.webp",
//     filePath: "uploads/cms/images/hero-banner-1730123456-abc123.webp",
//     fileUrl: "/cms/uploads/cms/images/hero-banner-1730123456-abc123.webp",
//     mimeType: "image/webp",
//     fileSize: 245760,
//     assetType: "image",
//     width: 1920,
//     height: 1080,
//     thumbnailUrl: "uploads/cms/thumbnails/medium/hero-banner-1730123456-abc123.webp",
//     ...
//   }]
// }
```

### Upload Multiple Files

```typescript
const formData = new FormData();
formData.append('files', image1);
formData.append('files', image2);
formData.append('files', document1);

const response = await fetch('/api/cms/media/upload', {
  method: 'POST',
  body: formData,
});
```

### List Media Files

```typescript
const response = await fetch(
  '/api/cms/media?assetType=image&page=1&limit=20&sortBy=createdAt&sortOrder=desc'
);

const result = await response.json();
// {
//   success: true,
//   data: [...],
//   pagination: {
//     page: 1,
//     limit: 20,
//     totalCount: 156,
//     totalPages: 8,
//     hasNextPage: true,
//     hasPrevPage: false
//   }
// }
```

### Update Media Metadata

```typescript
const response = await fetch('/api/cms/media?id=media-uuid', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    altText: 'Updated alt text',
    caption: 'New caption',
    tags: ['homepage', 'hero'],
    categories: ['banners']
  })
});
```

### Delete Media File

```typescript
const response = await fetch('/api/cms/media?id=media-uuid', {
  method: 'DELETE'
});

const result = await response.json();
// { success: true, message: "Media file deleted successfully" }
```

---

## 🖼️ Image Processing Pipeline

1. **Upload** → Original file saved to `uploads/cms/images/`
2. **Thumbnail Generation:**
   - Small (150x150) → `uploads/cms/thumbnails/small/`
   - Medium (400x400) → `uploads/cms/thumbnails/medium/`
   - Large (800x800) → `uploads/cms/thumbnails/large/`
3. **Optimization** → Convert to WebP (85% quality)
4. **Metadata Extraction** → Width, height, aspect ratio
5. **Database Record** → Store all paths and metadata

**Sharp Configuration:**
- Resize: `fit: 'cover', position: 'center'`
- Format: WebP with 85% quality
- Progressive: true for better perceived loading

---

## 🔧 File Management Features

### Automatic Cleanup
```typescript
// Clean up temporary files older than 24 hours
const deletedCount = await cleanupTempFiles(24);
```

### Directory Size Calculation
```typescript
// Get total size of uploads directory
const totalSize = await getDirectorySize('uploads/cms');
console.log(`Total: ${formatFileSize(totalSize)}`);
```

### File Movement
```typescript
// Move file to different category folder
await moveFile(
  'uploads/cms/temp/file.jpg',
  'uploads/cms/images/file.jpg'
);
```

---

## 📝 Next Steps

### Immediate (Phase 2.4: Media Library UI):
1. Create media library component with grid/list views
2. Implement upload dropzone with drag-and-drop
3. Build folder management UI
4. Add inline image editor (crop/resize)
5. Create media picker for section builders

### Future Enhancements:
1. **CDN Integration:**
   - Serve media through CDN for better performance
   - Keep local VPS as origin

2. **Advanced Image Processing:**
   - Automatic format detection (AVIF support)
   - Smart cropping with focal point detection
   - Multiple aspect ratio generation
   - Lazy thumbnail generation on-demand

3. **Video Processing:**
   - Video thumbnail extraction
   - Video transcoding for web playback
   - Adaptive bitrate streaming

4. **Analytics:**
   - Track file usage across pages
   - Storage usage reports per user
   - Most used assets reporting

5. **Bulk Operations:**
   - Batch upload with progress tracking
   - Bulk tag/category assignment
   - Bulk delete with confirmation

6. **Search Improvements:**
   - Full-text search in metadata
   - Visual similarity search
   - Reverse image search

---

## 📦 Summary

Phase 1.5 successfully establishes a robust **local VPS file storage system** with:
- **4 new files** (~1,200 lines of code)
- **1 updated file** (CMS index exports)
- **Comprehensive file validation** (type, size, extension)
- **Image processing pipeline** (thumbnails, optimization, metadata)
- **Permission-based access control** (upload, view, edit, delete)
- **Media library management** (list, filter, search, pagination)
- **Usage protection** (prevents deletion of in-use files)
- **Activity logging** for all media operations

The file upload system is **production-ready** and integrates seamlessly with the existing CMS infrastructure, providing a solid foundation for the media library UI in Phase 2.

---

**Status:** ✅ **COMPLETE**  
**Next Phase:** 2.1 - Page Management UI  
**Dependencies Satisfied:** All Phase 1 foundation tasks complete (Database, API, Content Models, Auth, File Upload)

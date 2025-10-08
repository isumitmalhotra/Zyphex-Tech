# Media API Documentation

## Overview
The Media API provides comprehensive file upload, management, and cloud storage integration for the ZyphexTech platform. It supports multiple storage providers and includes image optimization features.

## Features
- ✅ Multiple storage provider support (Local, AWS S3, Cloudinary)
- ✅ File type and size validation
- ✅ Image optimization with Sharp
- ✅ Authentication and authorization
- ✅ Database integration with MediaAsset model
- ✅ CRUD operations for media assets
- ✅ Pagination support
- ✅ Category-based filtering

## API Endpoints

### 1. List Media Assets
```
GET /api/admin/content/media
```

**Query Parameters:**
- `category` (optional): Filter by category
- `mimeType` (optional): Filter by MIME type
- `limit` (optional): Number of items to return (default: 50)
- `offset` (optional): Number of items to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

### 2. Upload Media Asset
```
POST /api/admin/content/media
```

**Request:** FormData
- `file` (required): The file to upload
- `alt` (optional): Alt text for the asset
- `category` (optional): Category for organization

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "filename": "generated-filename.jpg",
    "originalName": "original-file.jpg",
    "mimeType": "image/jpeg",
    "size": 1024000,
    "url": "/uploads/generated-filename.jpg",
    "alt": "Alt text",
    "category": "portfolio",
    "uploadedBy": "user-id",
    "createdAt": "2025-09-08T...",
    "updatedAt": "2025-09-08T..."
  },
  "message": "Media asset uploaded successfully"
}
```

### 3. Get Media Asset
```
GET /api/admin/content/media/{id}
```

### 4. Update Media Asset
```
PUT /api/admin/content/media/{id}
```

**Request Body:**
```json
{
  "alt": "Updated alt text",
  "category": "updated-category"
}
```

### 5. Delete Media Asset
```
DELETE /api/admin/content/media/{id}
```

## Storage Providers

### Local Storage (Default)
Files are stored in the local file system.

**Environment Variables:**
```env
STORAGE_PROVIDER=local
UPLOAD_DIR=./public/uploads
PUBLIC_PATH=/uploads
MAX_FILE_SIZE=10485760
```

### AWS S3
Files are stored in Amazon S3.

**Environment Variables:**
```env
STORAGE_PROVIDER=s3
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
MAX_FILE_SIZE=10485760
```

**Setup Steps:**
1. Create an S3 bucket
2. Create IAM user with S3 permissions
3. Set the environment variables
4. Restart the application

### Cloudinary
Files are stored and optimized with Cloudinary.

**Environment Variables:**
```env
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
MAX_FILE_SIZE=10485760
```

**Setup Steps:**
1. Create a Cloudinary account
2. Get your cloud name and API credentials
3. Set the environment variables
4. Restart the application

## Supported File Types
- Images: JPEG, PNG, GIF, WebP
- Videos: MP4, WebM
- Documents: PDF, ZIP

## File Size Limits
- Default: 10MB (configurable via `MAX_FILE_SIZE`)
- Can be adjusted per storage provider limits

## Image Optimization
Images are automatically optimized using Sharp:
- Resized to max 2000x2000 pixels
- Compressed to 85% quality for JPEG
- Maintains aspect ratio

## Security Features
- Authentication required (Admin/Manager roles)
- File type validation
- File size limits
- Filename sanitization
- Buffer validation

## Error Handling
The API provides detailed error responses:
- `401` - Unauthorized
- `413` - File too large
- `415` - Unsupported file type
- `404` - Asset not found
- `409` - Conflict (duplicate)
- `500` - Server error

## Usage Examples

### Upload a file with JavaScript
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('alt', 'Description of image');
formData.append('category', 'portfolio');

const response = await fetch('/api/admin/content/media', {
  method: 'POST',
  body: formData,
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

const result = await response.json();
```

### Get media assets with filtering
```javascript
const response = await fetch('/api/admin/content/media?category=portfolio&limit=20');
const { data, pagination } = await response.json();
```

## Database Schema
The MediaAsset model includes:
- `id`: Unique identifier
- `filename`: Storage filename
- `originalName`: Original filename
- `mimeType`: File MIME type
- `size`: File size in bytes
- `url`: Public URL
- `alt`: Alt text for accessibility
- `category`: Organization category
- `uploadedBy`: User who uploaded
- `createdAt/updatedAt`: Timestamps

## Migration and Backup
When switching storage providers:
1. Update environment variables
2. Migrate existing files (manual process)
3. Update database URLs if needed
4. Test file access

## Performance Considerations
- Use CDN for better performance
- Enable caching headers
- Consider image lazy loading
- Implement progressive image loading

## Monitoring and Logging
- Upload success/failure rates
- Storage usage metrics
- File access patterns
- Error tracking

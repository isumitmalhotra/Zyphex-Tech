# Media Library Documentation

## Overview

The Media Library is a comprehensive central media management system for the Zyphex Tech CMS. It provides a unified interface for uploading, organizing, and managing all media assets including images, videos, documents, and other files.

## Features

### 🖼️ Media Management
- **Grid and List Views**: Toggle between visual grid and detailed list views
- **File Upload**: Drag-and-drop or click-to-upload interface
- **File Categories**: Organize media by categories (Images, Videos, Portfolio, Blog, etc.)
- **Search & Filter**: Find assets quickly with search and category filters
- **Asset Preview**: Visual previews for images and file type icons for other media

### 🔧 Technical Features
- **Multiple File Types**: Support for images, videos, audio, documents
- **File Size Display**: Human-readable file size information
- **URL Management**: Easy copy-to-clipboard functionality
- **Integration**: Seamless integration with dynamic form fields

## Usage

### Accessing the Media Library
1. Navigate to the Admin Panel
2. Go to "Content Management" → "Media Library"
3. The library opens with all your media assets displayed

### Uploading Media
1. Click the "Upload Media" button
2. Select the appropriate category
3. Choose your files (supports multiple file selection)
4. Files are automatically processed and added to the library

### Using Media in Content
When editing content with image fields:
1. Click on the image field in your content form
2. The media selector dialog opens
3. Browse existing media or upload new files
4. Select an image to insert it into your content

### Managing Media
- **Select Mode**: When called from content editing, the library operates in selection mode
- **Delete Assets**: Remove unwanted media files (with confirmation)
- **Copy URLs**: Quickly copy media URLs for external use
- **Search**: Use the search bar to find specific assets by filename or alt text
- **Filter**: Use category filters to narrow down your media collection

## API Endpoints

### GET `/api/admin/media`
Retrieves all media assets in the system.

**Response:**
```json
{
  "success": true,
  "assets": [
    {
      "id": "uuid",
      "filename": "unique-filename.jpg",
      "originalName": "my-image.jpg",
      "mimeType": "image/jpeg",
      "size": 1024000,
      "url": "/uploads/unique-filename.jpg",
      "alt": "Alt text",
      "category": "image",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### POST `/api/admin/media/upload`
Uploads a new media file.

**Request:** FormData with:
- `file`: The file to upload
- `category`: Optional category (defaults to 'content')

**Response:**
```json
{
  "success": true,
  "asset": {
    "id": "uuid",
    "filename": "unique-filename.jpg",
    "originalName": "my-image.jpg",
    "mimeType": "image/jpeg",
    "size": 1024000,
    "url": "/uploads/unique-filename.jpg",
    "alt": "Alt text",
    "category": "image",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
}
```

### DELETE `/api/admin/media/[id]`
Deletes a media asset by ID.

**Response:**
```json
{
  "success": true,
  "message": "Asset deleted successfully"
}
```

## File Structure

```
app/admin/content/media/
├── page.tsx                    # Main media library interface

components/admin/
├── media-selector.tsx          # Reusable media selection component

app/api/admin/media/
├── route.ts                    # GET all media assets
├── upload/
│   └── route.ts               # POST upload new media
└── [id]/
    └── route.ts               # DELETE media asset
```

## Integration with Dynamic Forms

The media library integrates seamlessly with the dynamic form system:

```tsx
// In your content type definition
{
  name: 'heroImage',
  type: 'image',
  label: 'Hero Image',
  config: {
    allowedTypes: ['image/*']
  }
}
```

When this field is rendered in a form, it automatically uses the `MediaSelectorTrigger` component which opens the media library for asset selection.

## Database Schema

The media assets are stored in the `MediaAsset` table:

```prisma
model MediaAsset {
  id           String   @id @default(cuid())
  filename     String   @unique
  originalName String
  mimeType     String
  size         Int
  url          String
  alt          String?
  category     String?
  uploadedBy   String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

## Categories

Default categories include:
- **All Media**: Shows all assets
- **Images**: Image files (JPEG, PNG, WebP, etc.)
- **Videos**: Video files
- **Audio**: Audio files
- **Documents**: PDFs, Word docs, etc.
- **Portfolio**: Portfolio-specific media
- **Blog**: Blog-related media
- **Content**: General content media
- **Other**: Miscellaneous files

## Best Practices

1. **Organize by Category**: Use appropriate categories to keep media organized
2. **Descriptive Filenames**: Use clear, descriptive original filenames
3. **Alt Text**: Provide meaningful alt text for accessibility
4. **File Sizes**: Consider optimizing large images before upload
5. **Regular Cleanup**: Periodically review and remove unused media assets

## Troubleshooting

### Upload Issues
- Check file size limits in your server configuration
- Ensure the `/uploads` directory has write permissions
- Verify supported file types

### Display Issues
- Check that the media URLs are accessible
- Verify the upload directory is publicly accessible
- Check for correct MIME type detection

### Performance
- Consider implementing image optimization for large files
- Use CDN for better media delivery
- Implement lazy loading for large media libraries

## Security Considerations

1. **File Validation**: Server-side validation of file types and sizes
2. **Unique Filenames**: UUIDs prevent filename conflicts and enhance security
3. **Access Control**: Media management requires admin authentication
4. **File Scanning**: Consider implementing virus scanning for uploaded files

## Future Enhancements

- [ ] Image editing capabilities
- [ ] Bulk operations (delete, move, categorize)
- [ ] Advanced metadata management
- [ ] Integration with external storage (AWS S3, etc.)
- [ ] Image optimization and multiple sizes
- [ ] Media usage tracking
- [ ] Advanced search with tags and metadata
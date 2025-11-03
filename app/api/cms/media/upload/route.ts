/**
 * CMS Media Upload API Route
 * Handles file uploads for CMS media library with comprehensive processing
 * 
 * @route /api/cms/media/upload
 * @access Protected - Requires cms.media.upload permission
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/cms/authorization';
import { CmsApiError } from '@/lib/cms/error-handler';
import { uploadMultipleFiles, type UploadFile, UPLOAD_CONFIG } from '@/lib/cms/media-upload-service';
import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const uploadMetadataSchema = z.object({
  folderId: z.string().uuid().optional(),
  altText: z.string().max(255).optional(),
  caption: z.string().max(500).optional(),
  description: z.string().max(2000).optional(),
  tags: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  overwrite: z.boolean().optional(),
});

// ============================================================================
// POST - Upload file(s) with comprehensive processing
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Require upload permission
    const user = await requirePermission('cms.media.upload');

    // Parse multipart form data
    const formData = await request.formData();
    
    // Extract files
    const files: UploadFile[] = [];
    const fileEntries = formData.getAll('files');
    
    if (fileEntries.length === 0) {
      throw new CmsApiError('No files provided', 400);
    }

    // Process each file
    for (const entry of fileEntries) {
      if (entry instanceof File) {
        const buffer = Buffer.from(await entry.arrayBuffer());
        
        files.push({
          filename: entry.name,
          originalName: entry.name,
          mimeType: entry.type,
          size: entry.size,
          buffer,
        });
      }
    }

    // Extract metadata (can be JSON or individual form fields)
    let metadata: z.infer<typeof uploadMetadataSchema> = {};
    
    const metadataJson = formData.get('metadata');
    if (metadataJson) {
      try {
        const parsed = JSON.parse(metadataJson.toString());
        metadata = uploadMetadataSchema.parse(parsed);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { 
              error: 'Validation Error',
              message: 'Invalid metadata format',
              details: error.errors,
            },
            { status: 400 }
          );
        }
      }
    } else {
      // Extract individual fields
      const folderId = formData.get('folderId');
      const altText = formData.get('altText');
      const caption = formData.get('caption');
      const description = formData.get('description');
      const tagsStr = formData.get('tags');
      const categoriesStr = formData.get('categories');
      
      metadata = {
        folderId: folderId ? folderId.toString() : undefined,
        altText: altText ? altText.toString() : undefined,
        caption: caption ? caption.toString() : undefined,
        description: description ? description.toString() : undefined,
        tags: tagsStr ? tagsStr.toString().split(',').map(t => t.trim()) : undefined,
        categories: categoriesStr ? categoriesStr.toString().split(',').map(c => c.trim()) : undefined,
      };
    }

    // Upload files using comprehensive service
    const { results, errors } = await uploadMultipleFiles(files, {
      userId: user.id,
      ...metadata,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Uploaded ${results.length} file(s)${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
        data: {
          uploaded: results,
          failed: errors,
        },
        stats: {
          total: files.length,
          succeeded: results.length,
          failed: errors.length,
        },
      },
      { status: errors.length === files.length ? 400 : 201 }
    );

  } catch (error) {
    console.error('CMS Media Upload Error:', error);
    
    if (error instanceof CmsApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to upload file(s)',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Get upload configuration
// ============================================================================

export async function GET() {
  try {
    // Require view permission
    await requirePermission('cms.media.view');

    return NextResponse.json({
      success: true,
      data: {
        allowedTypes: {
          images: UPLOAD_CONFIG.allowedImageTypes,
          videos: UPLOAD_CONFIG.allowedVideoTypes,
          documents: UPLOAD_CONFIG.allowedDocumentTypes,
          audio: UPLOAD_CONFIG.allowedAudioTypes,
        },
        maxFileSizes: {
          image: UPLOAD_CONFIG.maxImageSize,
          video: UPLOAD_CONFIG.maxVideoSize,
          document: UPLOAD_CONFIG.maxDocumentSize,
          audio: UPLOAD_CONFIG.maxAudioSize,
        },
        thumbnailSizes: UPLOAD_CONFIG.thumbnailSizes,
        optimization: UPLOAD_CONFIG.optimization,
        imageQuality: UPLOAD_CONFIG.imageQuality,
      },
    });

  } catch (error) {
    console.error('CMS Media Config Error:', error);
    
    if (error instanceof CmsApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to get upload configuration',
      },
      { status: 500 }
    );
  }
}

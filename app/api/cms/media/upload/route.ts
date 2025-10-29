/**
 * CMS Media Upload API Route
 * Handles file uploads for CMS media library
 * 
 * @route /api/cms/media/upload
 * @access Protected - Requires cms.media.upload permission
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/cms/authorization';
import { CmsApiError } from '@/lib/cms/error-handler';
import {
  validateFile,
  formatFileSize,
} from '@/lib/cms/upload-config';
import {
  saveFile,
  generateAllThumbnails,
  getImageDimensions,
  optimizeImage,
} from '@/lib/cms/file-storage';

/**
 * POST - Upload file(s)
 */
export async function POST(request: NextRequest) {
  try {
    // Require upload permission
    const user = await requirePermission('cms.media.upload');

    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      throw new CmsApiError('No files provided', 400);
    }

    // Get optional metadata
    const folderId = formData.get('folderId') as string | null;
    const altText = formData.get('altText') as string;
    const title = formData.get('title') as string;

    const uploadedFiles = [];
    const errors = [];

    // Process each file
    for (const file of files) {
      try {
        // Validate file
        const validation = validateFile(
          file.name,
          file.type,
          file.size
        );

        if (!validation.valid) {
          errors.push({
            filename: file.name,
            errors: validation.errors,
          });
          continue;
        }

        const category = validation.category || 'other';

        // Save file
        const { filename, filepath, size } = await saveFile(file, category);

        // Initialize metadata
        let dimensions: { width: number; height: number } | null = null;
        const thumbnails: Record<string, string> = {};

        // Process images
        if (category === 'image') {
          try {
            // Get dimensions
            dimensions = await getImageDimensions(filepath);

            // Generate thumbnails
            const thumbs = await generateAllThumbnails(filepath);
            Object.assign(thumbnails, thumbs);

            // Optimize image (optional, don't fail if it errors)
            await optimizeImage(filepath).catch((err) => {
              console.warn('Image optimization failed:', err);
            });
          } catch (error) {
            console.error('Error processing image:', error);
          }
        }

        // Create database record
        const mediaFile = await prisma.cmsMediaAsset.create({
          data: {
            filename,
            originalName: file.name,
            filePath: filepath,
            fileUrl: `/cms/${filepath}`, // Public URL path
            mimeType: file.type,
            fileSize: size,
            assetType: category,
            uploadedBy: user.id,
            folderId: folderId || undefined,
            altText: altText || file.name,
            caption: title || file.name,
            width: dimensions?.width,
            height: dimensions?.height,
            thumbnailUrl: thumbnails.medium || thumbnails.small || null,
            optimizedUrl: thumbnails.large || null,
          },
        });

        uploadedFiles.push(mediaFile);

        // Log activity
        await prisma.cmsActivityLog.create({
          data: {
            userId: user.id,
            action: 'upload_media',
            entityType: 'media',
            entityId: mediaFile.id,
            changes: {
              filename: file.name,
              fileType: file.type,
              fileSize: formatFileSize(size),
              category,
            },
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            userAgent: request.headers.get('user-agent'),
          },
        });

      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        errors.push({
          filename: file.name,
          errors: [error instanceof Error ? error.message : 'Upload failed'],
        });
      }
    }

    // Return results
    return NextResponse.json(
      {
        success: true,
        message: `Uploaded ${uploadedFiles.length} file(s)`,
        data: uploadedFiles,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: errors.length > 0 && uploadedFiles.length === 0 ? 400 : 201 }
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
        message: 'Failed to upload file(s)',
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Get upload configuration
 */
export async function GET() {
  try {
    // Require view permission
    await requirePermission('cms.media.view');

    const { UPLOAD_CONFIG } = await import('@/lib/cms/upload-config');

    return NextResponse.json({
      success: true,
      data: {
        maxFileSizes: UPLOAD_CONFIG.MAX_FILE_SIZES,
        allowedExtensions: UPLOAD_CONFIG.ALLOWED_EXTENSIONS,
        allowedMimeTypes: UPLOAD_CONFIG.ALLOWED_MIME_TYPES,
        thumbnailSizes: UPLOAD_CONFIG.THUMBNAIL_SIZES,
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

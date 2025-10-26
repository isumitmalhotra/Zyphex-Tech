import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// GET - Fetch all media files with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const category = searchParams.get('category') || '';

    const mediaFiles = await prisma.mediaAsset.findMany({
      where: {
        ...(search && {
          OR: [
            { filename: { contains: search, mode: 'insensitive' } },
            { originalName: { contains: search, mode: 'insensitive' } },
            { alt: { contains: search, mode: 'insensitive' } }
          ]
        }),
        ...(category && { category }),
        ...(type && {
          mimeType: {
            startsWith: type === 'image' ? 'image/' : 
                       type === 'video' ? 'video/' :
                       type === 'document' ? 'application/' : ''
          }
        })
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform media files to match frontend interface
    const transformedFiles = mediaFiles.map(file => {
      const mimeType = file.mimeType.toLowerCase();
      let mediaType: 'image' | 'video' | 'document' | 'archive' = 'document';
      
      if (mimeType.startsWith('image/')) {
        mediaType = 'image';
      } else if (mimeType.startsWith('video/')) {
        mediaType = 'video';
      } else if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) {
        mediaType = 'archive';
      }

      return {
        id: file.id,
        name: file.originalName,
        type: mediaType,
        size: file.size,
        dimensions: file.alt || undefined,
        url: file.url,
        thumbnail: file.url, // Could generate thumbnails
        uploadedBy: file.uploadedBy || 'Unknown',
        uploadedDate: file.createdAt.toISOString().split('T')[0],
        lastModified: file.updatedAt.toISOString().split('T')[0],
        tags: [], // Could add tags field to MediaAsset model
        folder: 'root',
        usageCount: 0, // Could track with separate table
        starred: false, // Could add starred field to MediaAsset model
        mimeType: file.mimeType,
        alt: file.alt,
        category: file.category
      };
    });

    // Calculate statistics
    const totalSize = mediaFiles.reduce((sum, file) => sum + file.size, 0);
    const stats = {
      total: mediaFiles.length,
      totalSize,
      images: mediaFiles.filter(f => f.mimeType.startsWith('image/')).length,
      videos: mediaFiles.filter(f => f.mimeType.startsWith('video/')).length,
      documents: mediaFiles.filter(f => 
        f.mimeType.startsWith('application/') && 
        !f.mimeType.includes('zip') && 
        !f.mimeType.includes('rar')
      ).length,
      unused: 0 // Could track with usage table
    };

    return NextResponse.json({
      success: true,
      mediaFiles: transformedFiles,
      stats
    });

  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media files' },
      { status: 500 }
    );
  }
}

// POST - Upload new media file
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string || 'general';
    const alt = formData.get('alt') as string || '';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${sanitizedName}`;

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'media');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Save file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filepath = join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    // Create database record
    const mediaAsset = await prisma.mediaAsset.create({
      data: {
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        url: `/uploads/media/${filename}`,
        alt,
        category,
        uploadedBy: session.user.name || session.user.email
      }
    });

    return NextResponse.json({
      success: true,
      mediaAsset,
      message: 'File uploaded successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// PUT - Update media metadata
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, alt, category } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Media ID is required' },
        { status: 400 }
      );
    }

    const updateData: {
      alt?: string;
      category?: string;
    } = {};
    if (alt !== undefined) updateData.alt = alt;
    if (category !== undefined) updateData.category = category;

    const mediaAsset = await prisma.mediaAsset.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      mediaAsset,
      message: 'Media updated successfully'
    });

  } catch (error) {
    console.error('Error updating media:', error);
    return NextResponse.json(
      { error: 'Failed to update media' },
      { status: 500 }
    );
  }
}

// DELETE - Delete media file
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Media ID is required' },
        { status: 400 }
      );
    }

    // Note: In production, you should also delete the physical file
    // For now, just delete the database record
    await prisma.mediaAsset.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Media file deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting media:', error);
    return NextResponse.json(
      { error: 'Failed to delete media file' },
      { status: 500 }
    );
  }
}

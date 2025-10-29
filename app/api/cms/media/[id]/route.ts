/**
 * CMS Media File API Route
 * Get, update, or delete individual media file
 * 
 * @route /api/cms/media/[id]
 * @access Protected - Requires CMS permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateMediaSchema = z.object({
  fileName: z.string().optional(),
  altText: z.string().max(255).optional(),
  caption: z.string().max(500).optional(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    const { id } = params;

    const mediaFile = await prisma.cmsMediaAsset.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            path: true,
          },
        },
      },
    });

    if (!mediaFile) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Media file not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: mediaFile,
    });

  } catch (error) {
    console.error('CMS Media GET Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to fetch media file',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    const { id } = params;

    const mediaFile = await prisma.cmsMediaAsset.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!mediaFile) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Media file not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateMediaSchema.parse(body);

    const updatedMedia = await prisma.cmsMediaAsset.update({
      where: { id },
      data: validatedData,
    });

    // Log activity
    await prisma.cmsActivityLog.create({
      data: {
        userId: session.user.id,
        action: 'update_media',
        entityType: 'media',
        entityId: id,
        changes: validatedData,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Media file updated successfully',
      data: updatedMedia,
    });

  } catch (error) {
    console.error('CMS Media PATCH Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation Error',
          message: 'Invalid media data',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to update media file',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    const { id } = params;

    const mediaFile = await prisma.cmsMediaAsset.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!mediaFile) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Media file not found' },
        { status: 404 }
      );
    }

    // Soft delete
    await prisma.cmsMediaAsset.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    // Log activity
    await prisma.cmsActivityLog.create({
      data: {
        userId: session.user.id,
        action: 'delete_media',
        entityType: 'media',
        entityId: id,
        changes: {
          fileName: mediaFile.filename,
          fileUrl: mediaFile.fileUrl,
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Media file deleted successfully',
    });

  } catch (error) {
    console.error('CMS Media DELETE Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to delete media file',
      },
      { status: 500 }
    );
  }
}

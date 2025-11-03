/**
 * CMS Media Folder API Route
 * Get, update, move, or delete a specific folder
 * 
 * @route /api/cms/media/folders/[id]
 * @access Protected - Requires media folder permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/cms/authorization';
import { CmsApiError } from '@/lib/cms/error-handler';
import { 
  getFolder, 
  updateFolder, 
  moveFolder, 
  deleteFolder,
  getFolderBreadcrumb,
  type UpdateFolderOptions,
} from '@/lib/cms/media-folder-service';
import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const updateFolderSchema = z.object({
  name: z.string().min(1).max(100).regex(/^[a-zA-Z0-9-_ ]+$/).optional(),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  icon: z.string().max(50).optional(),
  
  // For moving folder
  parentId: z.string().uuid().nullable().optional(),
});

// ============================================================================
// GET - Get a specific folder
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require view permission
    await requirePermission('cms.media.view');

    const { id } = params;

    // Validate UUID
    if (!z.string().uuid().safeParse(id).success) {
      throw new CmsApiError('Invalid folder ID format', 400);
    }

    // Get folder with stats
    const folder = await getFolder(id);

    if (!folder) {
      throw new CmsApiError('Folder not found', 404);
    }

    // Get breadcrumb path
    const breadcrumb = await getFolderBreadcrumb(id);

    return NextResponse.json({
      success: true,
      data: {
        ...folder,
        breadcrumb,
      },
    });

  } catch (error) {
    console.error('Media Folder GET Error:', error);
    
    if (error instanceof CmsApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to fetch folder',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update folder or move folder
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require folder management permission
    await requirePermission('cms.media.manage_folders');

    const { id } = params;

    // Validate UUID
    if (!z.string().uuid().safeParse(id).success) {
      throw new CmsApiError('Invalid folder ID format', 400);
    }

    // Check if folder exists
    const folder = await getFolder(id);
    if (!folder) {
      throw new CmsApiError('Folder not found', 404);
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = updateFolderSchema.parse(body);

    // Check if this is a move operation
    if ('parentId' in validated && validated.parentId !== undefined) {
      // Move folder to new parent
      const updatedFolder = await moveFolder(id, validated.parentId);
      
      return NextResponse.json({
        success: true,
        message: 'Folder moved successfully',
        data: updatedFolder,
      });
    } else {
      // Update folder metadata
      const updates: UpdateFolderOptions = {
        name: validated.name,
        description: validated.description,
        color: validated.color,
        icon: validated.icon,
      };

      const updatedFolder = await updateFolder(id, updates);

      return NextResponse.json({
        success: true,
        message: 'Folder updated successfully',
        data: updatedFolder,
      });
    }

  } catch (error) {
    console.error('Media Folder PATCH Error:', error);
    
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { error: 'Conflict', message: error.message },
        { status: 409 }
      );
    }

    if (error instanceof Error && error.message.includes('subtree')) {
      return NextResponse.json(
        { error: 'Bad Request', message: error.message },
        { status: 400 }
      );
    }

    if (error instanceof CmsApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation Error',
          message: 'Invalid folder data',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to update folder',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete folder
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require folder management permission
    await requirePermission('cms.media.manage_folders');

    const { id } = params;

    // Validate UUID
    if (!z.string().uuid().safeParse(id).success) {
      throw new CmsApiError('Invalid folder ID format', 400);
    }

    // Check if folder exists
    const folder = await getFolder(id);
    if (!folder) {
      throw new CmsApiError('Folder not found', 404);
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const cascade = searchParams.get('cascade') === 'true';
    const moveAssetsToParent = searchParams.get('moveAssets') === 'true';

    // Delete folder
    await deleteFolder(id, { cascade, moveAssetsToParent });

    return NextResponse.json({
      success: true,
      message: 'Folder deleted successfully',
    });

  } catch (error) {
    console.error('Media Folder DELETE Error:', error);
    
    if (error instanceof Error && (
      error.message.includes('subfolders') || 
      error.message.includes('contains files')
    )) {
      return NextResponse.json(
        { 
          error: 'Conflict', 
          message: error.message,
          hint: 'Use cascade=true to delete all contents, or moveAssets=true to move files to parent',
        },
        { status: 409 }
      );
    }

    if (error instanceof CmsApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to delete folder',
      },
      { status: 500 }
    );
  }
}

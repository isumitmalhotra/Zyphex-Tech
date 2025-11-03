/**
 * CMS Media Folders API Route
 * List and create media folders
 * 
 * @route /api/cms/media/folders
 * @access Protected - Requires media permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/cms/authorization';
import { CmsApiError } from '@/lib/cms/error-handler';
import { 
  getAllFolders, 
  getRootFolders, 
  getChildFolders,
  getFolderTree,
  createFolder,
  type CreateFolderOptions,
} from '@/lib/cms/media-folder-service';
import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createFolderSchema = z.object({
  name: z.string().min(1).max(100).regex(/^[a-zA-Z0-9-_ ]+$/),
  parentId: z.string().uuid().optional(),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  icon: z.string().max(50).optional(),
});

const querySchema = z.object({
  parentId: z.string().uuid().optional(),
  view: z.enum(['flat', 'tree', 'root']).optional(),
});

// ============================================================================
// GET - List folders
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Require view permission
    await requirePermission('cms.media.view');

    const searchParams = request.nextUrl.searchParams;
    const rawParams = Object.fromEntries(searchParams.entries());
    
    const validated = querySchema.parse(rawParams);

    let folders;

    if (validated.view === 'tree') {
      // Get hierarchical tree structure
      folders = await getFolderTree();
    } else if (validated.view === 'root') {
      // Get only root folders
      folders = await getRootFolders();
    } else if (validated.parentId) {
      // Get children of specific parent
      folders = await getChildFolders(validated.parentId);
    } else {
      // Get all folders (flat list)
      folders = await getAllFolders();
    }

    return NextResponse.json({
      success: true,
      data: folders,
      view: validated.view || 'flat',
    });

  } catch (error) {
    console.error('Media Folders GET Error:', error);
    
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
          message: 'Invalid query parameters',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to fetch folders',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create folder
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Require folder management permission
    const user = await requirePermission('cms.media.manage_folders');

    const body = await request.json();
    const validated = createFolderSchema.parse(body);

    const options: CreateFolderOptions = {
      name: validated.name,
      parentId: validated.parentId,
      description: validated.description,
      color: validated.color,
      icon: validated.icon,
      userId: user.id,
    };

    const folder = await createFolder(options);

    return NextResponse.json(
      {
        success: true,
        message: 'Folder created successfully',
        data: folder,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Media Folder POST Error:', error);
    
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { error: 'Conflict', message: error.message },
        { status: 409 }
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
        message: error instanceof Error ? error.message : 'Failed to create folder',
      },
      { status: 500 }
    );
  }
}

/**
 * CMS Media Folder Management Service
 * Hierarchical folder organization for media library
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface CreateFolderOptions {
  name: string;
  parentId?: string;
  description?: string;
  color?: string;
  icon?: string;
  userId: string;
}

export interface UpdateFolderOptions {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface FolderWithStats {
  id: string;
  name: string;
  parentId: string | null;
  path: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    assets: number;
    children: number;
  };
}

// ============================================================================
// Folder CRUD Operations
// ============================================================================

/**
 * Create a new folder
 */
export async function createFolder(options: CreateFolderOptions): Promise<FolderWithStats> {
  // Build folder path
  let folderPath = `/${options.name}`;
  
  if (options.parentId) {
    const parent = await prisma.cmsMediaFolder.findUnique({
      where: { id: options.parentId },
    });
    
    if (!parent) {
      throw new Error('Parent folder not found');
    }
    
    folderPath = `${parent.path}/${options.name}`;
  }
  
  // Check if folder with same name exists in parent
  const existing = await prisma.cmsMediaFolder.findFirst({
    where: {
      name: options.name,
      parentId: options.parentId || null,
    },
  });
  
  if (existing) {
    throw new Error(`Folder "${options.name}" already exists in this location`);
  }
  
  // Create folder
  const folder = await prisma.cmsMediaFolder.create({
    data: {
      name: options.name,
      parentId: options.parentId,
      path: folderPath,
      description: options.description,
      color: options.color,
      icon: options.icon,
      createdBy: options.userId,
    },
    include: {
      _count: {
        select: {
          assets: true,
          children: true,
        },
      },
    },
  });
  
  console.log(`📁 Created folder: ${folderPath}`);
  
  return folder;
}

/**
 * Get folder by ID with stats
 */
export async function getFolder(folderId: string): Promise<FolderWithStats | null> {
  return await prisma.cmsMediaFolder.findUnique({
    where: { id: folderId },
    include: {
      _count: {
        select: {
          assets: true,
          children: true,
        },
      },
    },
  });
}

/**
 * Get all folders (flat list)
 */
export async function getAllFolders(): Promise<FolderWithStats[]> {
  return await prisma.cmsMediaFolder.findMany({
    include: {
      _count: {
        select: {
          assets: true,
          children: true,
        },
      },
    },
    orderBy: {
      path: 'asc',
    },
  });
}

/**
 * Get root folders (no parent)
 */
export async function getRootFolders(): Promise<FolderWithStats[]> {
  return await prisma.cmsMediaFolder.findMany({
    where: {
      parentId: null,
    },
    include: {
      _count: {
        select: {
          assets: true,
          children: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });
}

/**
 * Get child folders of a parent
 */
export async function getChildFolders(parentId: string): Promise<FolderWithStats[]> {
  return await prisma.cmsMediaFolder.findMany({
    where: {
      parentId,
    },
    include: {
      _count: {
        select: {
          assets: true,
          children: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });
}

/**
 * Get folder tree (hierarchical structure)
 */
export async function getFolderTree(): Promise<FolderTreeNode[]> {
  const allFolders = await getAllFolders();
  
  // Build tree structure
  const folderMap = new Map<string, FolderTreeNode>();
  const rootFolders: FolderTreeNode[] = [];
  
  // First pass: create all nodes
  allFolders.forEach(folder => {
    folderMap.set(folder.id, {
      ...folder,
      children: [],
    });
  });
  
  // Second pass: build hierarchy
  allFolders.forEach(folder => {
    const node = folderMap.get(folder.id)!;
    
    if (folder.parentId) {
      const parent = folderMap.get(folder.parentId);
      if (parent) {
        parent.children.push(node);
      }
    } else {
      rootFolders.push(node);
    }
  });
  
  return rootFolders;
}

export interface FolderTreeNode extends FolderWithStats {
  children: FolderTreeNode[];
}

/**
 * Update folder
 */
export async function updateFolder(
  folderId: string,
  updates: UpdateFolderOptions
): Promise<FolderWithStats> {
  const folder = await prisma.cmsMediaFolder.findUnique({
    where: { id: folderId },
  });
  
  if (!folder) {
    throw new Error('Folder not found');
  }
  
  // If name is changing, update path and all descendant paths
  if (updates.name && updates.name !== folder.name) {
    const newPath = folder.path.replace(new RegExp(`/${folder.name}$`), `/${updates.name}`);
    
    // Update this folder
    await prisma.cmsMediaFolder.update({
      where: { id: folderId },
      data: {
        name: updates.name,
        path: newPath,
        description: updates.description,
        color: updates.color,
        icon: updates.icon,
      },
    });
    
    // Update all descendant paths
    const descendants = await prisma.cmsMediaFolder.findMany({
      where: {
        path: {
          startsWith: folder.path + '/',
        },
      },
    });
    
    for (const descendant of descendants) {
      const updatedPath = descendant.path.replace(folder.path, newPath);
      await prisma.cmsMediaFolder.update({
        where: { id: descendant.id },
        data: { path: updatedPath },
      });
    }
  } else {
    // Just update metadata
    await prisma.cmsMediaFolder.update({
      where: { id: folderId },
      data: {
        description: updates.description,
        color: updates.color,
        icon: updates.icon,
      },
    });
  }
  
  return await getFolder(folderId) as FolderWithStats;
}

/**
 * Move folder to new parent
 */
export async function moveFolder(
  folderId: string,
  newParentId: string | null
): Promise<FolderWithStats> {
  const folder = await prisma.cmsMediaFolder.findUnique({
    where: { id: folderId },
  });
  
  if (!folder) {
    throw new Error('Folder not found');
  }
  
  // Prevent moving folder into its own subtree
  if (newParentId) {
    const newParent = await prisma.cmsMediaFolder.findUnique({
      where: { id: newParentId },
    });
    
    if (!newParent) {
      throw new Error('New parent folder not found');
    }
    
    if (newParent.path.startsWith(folder.path)) {
      throw new Error('Cannot move folder into its own subtree');
    }
    
    // Build new path
    const newPath = `${newParent.path}/${folder.name}`;
    
    // Update folder and all descendants
    await updateFolderPath(folderId, folder.path, newPath);
    
    await prisma.cmsMediaFolder.update({
      where: { id: folderId },
      data: {
        parentId: newParentId,
        path: newPath,
      },
    });
  } else {
    // Move to root
    const newPath = `/${folder.name}`;
    await updateFolderPath(folderId, folder.path, newPath);
    
    await prisma.cmsMediaFolder.update({
      where: { id: folderId },
      data: {
        parentId: null,
        path: newPath,
      },
    });
  }
  
  return await getFolder(folderId) as FolderWithStats;
}

/**
 * Update folder path and all descendants
 */
async function updateFolderPath(folderId: string, oldPath: string, newPath: string): Promise<void> {
  // Update all descendant paths
  const descendants = await prisma.cmsMediaFolder.findMany({
    where: {
      path: {
        startsWith: oldPath + '/',
      },
    },
  });
  
  for (const descendant of descendants) {
    const updatedPath = descendant.path.replace(oldPath, newPath);
    await prisma.cmsMediaFolder.update({
      where: { id: descendant.id },
      data: { path: updatedPath },
    });
  }
}

/**
 * Delete folder (with cascade or protection)
 */
export async function deleteFolder(
  folderId: string,
  options: { cascade?: boolean; moveAssetsToParent?: boolean } = {}
): Promise<void> {
  const folder = await prisma.cmsMediaFolder.findUnique({
    where: { id: folderId },
    include: {
      _count: {
        select: {
          assets: true,
          children: true,
        },
      },
    },
  });
  
  if (!folder) {
    throw new Error('Folder not found');
  }
  
  // Check for child folders
  if (folder._count.children > 0 && !options.cascade) {
    throw new Error('Folder has subfolders. Use cascade option to delete all.');
  }
  
  // Handle assets
  if (folder._count.assets > 0) {
    if (options.moveAssetsToParent) {
      // Move assets to parent folder
      await prisma.cmsMediaAsset.updateMany({
        where: { folderId },
        data: { folderId: folder.parentId },
      });
    } else if (!options.cascade) {
      throw new Error('Folder contains files. Move files first or use cascade option.');
    }
  }
  
  // Delete folder (cascade will handle children via database constraints)
  await prisma.cmsMediaFolder.delete({
    where: { id: folderId },
  });
  
  console.log(`🗑️  Deleted folder: ${folder.path}`);
}

/**
 * Get folder breadcrumb path
 */
export async function getFolderBreadcrumb(folderId: string): Promise<Array<{ id: string; name: string; path: string }>> {
  const folder = await prisma.cmsMediaFolder.findUnique({
    where: { id: folderId },
  });
  
  if (!folder) {
    return [];
  }
  
  const breadcrumb: Array<{ id: string; name: string; path: string }> = [];
  const pathParts = folder.path.split('/').filter(Boolean);
  
  let currentPath = '';
  for (const part of pathParts) {
    currentPath += `/${part}`;
    const folderAtPath = await prisma.cmsMediaFolder.findFirst({
      where: { path: currentPath },
    });
    
    if (folderAtPath) {
      breadcrumb.push({
        id: folderAtPath.id,
        name: folderAtPath.name,
        path: folderAtPath.path,
      });
    }
  }
  
  return breadcrumb;
}

// ============================================================================
// Export Service
// ============================================================================

const mediaFolderService = {
  createFolder,
  getFolder,
  getAllFolders,
  getRootFolders,
  getChildFolders,
  getFolderTree,
  updateFolder,
  moveFolder,
  deleteFolder,
  getFolderBreadcrumb,
};

export default mediaFolderService;

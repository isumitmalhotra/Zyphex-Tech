/**
 * CMS File Storage Utilities
 * Handle file system operations for uploads
 */

import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import sharp from 'sharp';
import {
  UPLOAD_CONFIG,
  type FileCategory,
  type ThumbnailSize,
  generateUniqueFilename,
  getUploadPath,
  getThumbnailPath,
} from './upload-config';

/**
 * Ensure directory exists, create if not
 */
export async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    console.error('Error creating directory:', error);
    throw new Error(`Failed to create directory: ${dirPath}`);
  }
}

/**
 * Save uploaded file to disk
 */
export async function saveFile(
  file: File,
  category: FileCategory
): Promise<{ filename: string; filepath: string; size: number }> {
  try {
    // Generate unique filename
    const filename = generateUniqueFilename(file.name);
    const filepath = getUploadPath(category, filename);
    const fullPath = path.join(process.cwd(), filepath);

    // Ensure directory exists
    await ensureDirectory(path.dirname(fullPath));

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save file
    await fs.writeFile(fullPath, buffer);

    return {
      filename,
      filepath,
      size: buffer.length,
    };
  } catch (error) {
    console.error('Error saving file:', error);
    throw new Error('Failed to save file');
  }
}

/**
 * Delete file from disk
 */
export async function deleteFile(filepath: string): Promise<void> {
  try {
    const fullPath = path.join(process.cwd(), filepath);
    
    if (existsSync(fullPath)) {
      await fs.unlink(fullPath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('Failed to delete file');
  }
}

/**
 * Generate thumbnail for image
 */
export async function generateThumbnail(
  sourceFilepath: string,
  size: ThumbnailSize = 'medium'
): Promise<string> {
  try {
    const sourcePath = path.join(process.cwd(), sourceFilepath);
    const filename = path.basename(sourceFilepath);
    const thumbnailPath = getThumbnailPath(filename, size);
    const fullThumbnailPath = path.join(process.cwd(), thumbnailPath);

    // Ensure thumbnail directory exists
    await ensureDirectory(path.dirname(fullThumbnailPath));

    // Get dimensions
    const { width, height } = UPLOAD_CONFIG.THUMBNAIL_SIZES[size];

    // Generate thumbnail
    await sharp(sourcePath)
      .resize(width, height, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: UPLOAD_CONFIG.IMAGE_OPTIMIZATION.quality })
      .toFile(fullThumbnailPath);

    return thumbnailPath;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    throw new Error('Failed to generate thumbnail');
  }
}

/**
 * Generate all thumbnail sizes for an image
 */
export async function generateAllThumbnails(
  sourceFilepath: string
): Promise<Record<ThumbnailSize, string>> {
  const sizes: ThumbnailSize[] = ['small', 'medium', 'large'];
  const thumbnails: Record<string, string> = {};

  await Promise.all(
    sizes.map(async (size) => {
      try {
        thumbnails[size] = await generateThumbnail(sourceFilepath, size);
      } catch (error) {
        console.error(`Error generating ${size} thumbnail:`, error);
      }
    })
  );

  return thumbnails as Record<ThumbnailSize, string>;
}

/**
 * Optimize image
 */
export async function optimizeImage(filepath: string): Promise<void> {
  try {
    const fullPath = path.join(process.cwd(), filepath);
    const tempPath = `${fullPath}.tmp`;

    // Optimize image
    await sharp(fullPath)
      .webp({
        quality: UPLOAD_CONFIG.IMAGE_OPTIMIZATION.quality,
        effort: 4,
      })
      .toFile(tempPath);

    // Replace original with optimized
    await fs.rename(tempPath, fullPath);
  } catch (error) {
    console.error('Error optimizing image:', error);
    // Don't throw - optimization is optional
  }
}

/**
 * Get image dimensions
 */
export async function getImageDimensions(
  filepath: string
): Promise<{ width: number; height: number } | null> {
  try {
    const fullPath = path.join(process.cwd(), filepath);
    const metadata = await sharp(fullPath).metadata();
    
    if (metadata.width && metadata.height) {
      return {
        width: metadata.width,
        height: metadata.height,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting image dimensions:', error);
    return null;
  }
}

/**
 * Get file stats
 */
export async function getFileStats(filepath: string): Promise<{
  size: number;
  createdAt: Date;
  modifiedAt: Date;
} | null> {
  try {
    const fullPath = path.join(process.cwd(), filepath);
    const stats = await fs.stat(fullPath);
    
    return {
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
    };
  } catch (error) {
    console.error('Error getting file stats:', error);
    return null;
  }
}

/**
 * Check if file exists
 */
export async function fileExists(filepath: string): Promise<boolean> {
  try {
    const fullPath = path.join(process.cwd(), filepath);
    await fs.access(fullPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Move file to new location
 */
export async function moveFile(
  oldPath: string,
  newPath: string
): Promise<void> {
  try {
    const oldFullPath = path.join(process.cwd(), oldPath);
    const newFullPath = path.join(process.cwd(), newPath);
    
    // Ensure new directory exists
    await ensureDirectory(path.dirname(newFullPath));
    
    // Move file
    await fs.rename(oldFullPath, newFullPath);
  } catch (error) {
    console.error('Error moving file:', error);
    throw new Error('Failed to move file');
  }
}

/**
 * Copy file to new location
 */
export async function copyFile(
  sourcePath: string,
  destPath: string
): Promise<void> {
  try {
    const sourceFullPath = path.join(process.cwd(), sourcePath);
    const destFullPath = path.join(process.cwd(), destPath);
    
    // Ensure destination directory exists
    await ensureDirectory(path.dirname(destFullPath));
    
    // Copy file
    await fs.copyFile(sourceFullPath, destFullPath);
  } catch (error) {
    console.error('Error copying file:', error);
    throw new Error('Failed to copy file');
  }
}

/**
 * Get directory size (recursive)
 */
export async function getDirectorySize(dirPath: string): Promise<number> {
  try {
    const fullPath = path.join(process.cwd(), dirPath);
    let totalSize = 0;
    
    const files = await fs.readdir(fullPath, { withFileTypes: true });
    
    for (const file of files) {
      const filePath = path.join(fullPath, file.name);
      
      if (file.isDirectory()) {
        totalSize += await getDirectorySize(path.relative(process.cwd(), filePath));
      } else {
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }
    }
    
    return totalSize;
  } catch (error) {
    console.error('Error calculating directory size:', error);
    return 0;
  }
}

/**
 * Clean up old temporary files
 */
export async function cleanupTempFiles(olderThanHours: number = 24): Promise<number> {
  try {
    const tempDir = path.join(
      process.cwd(),
      UPLOAD_CONFIG.BASE_UPLOAD_DIR,
      UPLOAD_CONFIG.FOLDERS.temp
    );
    
    if (!existsSync(tempDir)) {
      return 0;
    }
    
    const files = await fs.readdir(tempDir);
    const now = Date.now();
    const maxAge = olderThanHours * 60 * 60 * 1000;
    let deletedCount = 0;
    
    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = await fs.stat(filePath);
      
      if (now - stats.mtimeMs > maxAge) {
        await fs.unlink(filePath);
        deletedCount++;
      }
    }
    
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up temp files:', error);
    return 0;
  }
}

/**
 * CMS File Upload Configuration
 * Defines allowed file types, size limits, and storage paths
 */

export const UPLOAD_CONFIG = {
  /**
   * Base upload directory (relative to project root)
   */
  BASE_UPLOAD_DIR: 'uploads/cms',

  /**
   * Maximum file sizes (in bytes)
   */
  MAX_FILE_SIZES: {
    image: 10 * 1024 * 1024, // 10 MB
    video: 100 * 1024 * 1024, // 100 MB
    document: 20 * 1024 * 1024, // 20 MB
    audio: 25 * 1024 * 1024, // 25 MB
    other: 50 * 1024 * 1024, // 50 MB
  },

  /**
   * Allowed MIME types by category
   */
  ALLOWED_MIME_TYPES: {
    image: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/avif',
    ] as string[],
    video: [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime', // .mov
    ] as string[],
    document: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'text/plain',
      'text/csv',
    ] as string[],
    audio: [
      'audio/mpeg', // .mp3
      'audio/wav',
      'audio/ogg',
      'audio/webm',
      'audio/aac',
    ] as string[],
  },

  /**
   * File extensions by category
   */
  ALLOWED_EXTENSIONS: {
    image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif'] as string[],
    video: ['.mp4', '.webm', '.ogg', '.mov'] as string[],
    document: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv'] as string[],
    audio: ['.mp3', '.wav', '.ogg', '.webm', '.aac'] as string[],
  },

  /**
   * Thumbnail generation settings
   */
  THUMBNAIL_SIZES: {
    small: { width: 150, height: 150 },
    medium: { width: 400, height: 400 },
    large: { width: 800, height: 800 },
  },

  /**
   * Image optimization settings
   */
  IMAGE_OPTIMIZATION: {
    quality: 85,
    format: 'webp' as const,
    progressive: true,
  },

  /**
   * Folder structure
   */
  FOLDERS: {
    image: 'images',
    video: 'videos',
    document: 'documents',
    audio: 'audio',
    other: 'other',
    thumbnails: 'thumbnails',
    temp: 'temp',
  },
};

/**
 * File categories
 */
export type FileCategory = 'image' | 'video' | 'document' | 'audio' | 'other';

/**
 * Thumbnail size types
 */
export type ThumbnailSize = keyof typeof UPLOAD_CONFIG.THUMBNAIL_SIZES;

/**
 * Get file category from MIME type
 */
export function getFileCategoryFromMimeType(mimeType: string): FileCategory {
  if (UPLOAD_CONFIG.ALLOWED_MIME_TYPES.image.includes(mimeType)) {
    return 'image';
  }
  if (UPLOAD_CONFIG.ALLOWED_MIME_TYPES.video.includes(mimeType)) {
    return 'video';
  }
  if (UPLOAD_CONFIG.ALLOWED_MIME_TYPES.document.includes(mimeType)) {
    return 'document';
  }
  if (UPLOAD_CONFIG.ALLOWED_MIME_TYPES.audio.includes(mimeType)) {
    return 'audio';
  }
  return 'other';
}

/**
 * Get file category from file extension
 */
export function getFileCategoryFromExtension(extension: string): FileCategory {
  const ext = extension.toLowerCase();
  
  if (UPLOAD_CONFIG.ALLOWED_EXTENSIONS.image.includes(ext)) {
    return 'image';
  }
  if (UPLOAD_CONFIG.ALLOWED_EXTENSIONS.video.includes(ext)) {
    return 'video';
  }
  if (UPLOAD_CONFIG.ALLOWED_EXTENSIONS.document.includes(ext)) {
    return 'document';
  }
  if (UPLOAD_CONFIG.ALLOWED_EXTENSIONS.audio.includes(ext)) {
    return 'audio';
  }
  return 'other';
}

/**
 * Check if MIME type is allowed
 */
export function isMimeTypeAllowed(mimeType: string): boolean {
  return Object.values(UPLOAD_CONFIG.ALLOWED_MIME_TYPES)
    .flat()
    .includes(mimeType);
}

/**
 * Check if file extension is allowed
 */
export function isExtensionAllowed(extension: string): boolean {
  const ext = extension.toLowerCase();
  return Object.values(UPLOAD_CONFIG.ALLOWED_EXTENSIONS)
    .flat()
    .includes(ext);
}

/**
 * Get max file size for category
 */
export function getMaxFileSize(category: FileCategory): number {
  return UPLOAD_CONFIG.MAX_FILE_SIZES[category] || UPLOAD_CONFIG.MAX_FILE_SIZES.other;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Generate unique filename
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = originalName.substring(originalName.lastIndexOf('.'));
  const nameWithoutExt = originalName
    .substring(0, originalName.lastIndexOf('.'))
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .toLowerCase();
  
  return `${nameWithoutExt}-${timestamp}-${random}${extension}`;
}

/**
 * Get upload path for file
 */
export function getUploadPath(category: FileCategory, filename: string): string {
  const folder = UPLOAD_CONFIG.FOLDERS[category] || 'other';
  return `${UPLOAD_CONFIG.BASE_UPLOAD_DIR}/${folder}/${filename}`;
}

/**
 * Get thumbnail path
 */
export function getThumbnailPath(
  filename: string,
  size: ThumbnailSize = 'medium'
): string {
  return `${UPLOAD_CONFIG.BASE_UPLOAD_DIR}/${UPLOAD_CONFIG.FOLDERS.thumbnails}/${size}/${filename}`;
}

/**
 * Validate file
 */
export interface FileValidationResult {
  valid: boolean;
  errors: string[];
  category?: FileCategory;
  maxSize?: number;
}

export function validateFile(
  filename: string,
  mimeType: string,
  fileSize: number
): FileValidationResult {
  const errors: string[] = [];
  
  // Get file extension
  const extension = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  
  // Check extension
  if (!isExtensionAllowed(extension)) {
    errors.push(`File extension "${extension}" is not allowed`);
  }
  
  // Check MIME type
  if (!isMimeTypeAllowed(mimeType)) {
    errors.push(`File type "${mimeType}" is not allowed`);
  }
  
  // Get category
  const category = getFileCategoryFromMimeType(mimeType);
  const maxSize = getMaxFileSize(category);
  
  // Check file size
  if (fileSize > maxSize) {
    errors.push(
      `File size ${formatFileSize(fileSize)} exceeds maximum allowed size of ${formatFileSize(maxSize)}`
    );
  }
  
  return {
    valid: errors.length === 0,
    errors,
    category,
    maxSize,
  };
}

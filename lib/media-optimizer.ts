// Media optimization utilities
import sharp from 'sharp'
import { join } from 'path'
import { writeFile, mkdir } from 'fs/promises'

export interface ImageOptimizationOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp' | 'avif'
  progressive?: boolean
}

export interface ThumbnailOptions {
  sizes: Array<{ width: number; height: number; suffix: string }>
  quality?: number
  format?: 'jpeg' | 'png' | 'webp' | 'avif'
}

export interface OptimizedImage {
  originalPath: string
  optimizedPath: string
  thumbnails: Array<{
    path: string
    width: number
    height: number
    size: number
  }>
  metadata: {
    width: number
    height: number
    format: string
    size: number
    hasAlpha: boolean
  }
}

export class MediaOptimizer {
  private uploadDir: string

  constructor(uploadDir: string = 'public/uploads') {
    this.uploadDir = uploadDir
  }

  /**
   * Optimize an image with various options
   */
  async optimizeImage(
    buffer: Buffer,
    filename: string,
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizedImage> {
    const {
      width,
      height,
      quality = 85,
      format = 'webp',
      progressive = true
    } = options

    // Ensure upload directory exists
    await mkdir(this.uploadDir, { recursive: true })

    // Get original image metadata
    const image = sharp(buffer)
    const metadata = await image.metadata()

    // Create optimized image
    let optimizedImage = image

    if (width || height) {
      optimizedImage = optimizedImage.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      })
    }

    // Apply format-specific optimizations
    switch (format) {
      case 'jpeg':
        optimizedImage = optimizedImage.jpeg({
          quality,
          progressive,
          mozjpeg: true
        })
        break
      case 'png':
        optimizedImage = optimizedImage.png({
          quality,
          progressive,
          compressionLevel: 9
        })
        break
      case 'webp':
        optimizedImage = optimizedImage.webp({
          quality
        })
        break
      case 'avif':
        optimizedImage = optimizedImage.avif({
          quality
        })
        break
    }

    // Generate filename with format extension
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '')
    const optimizedFilename = `${nameWithoutExt}.${format}`
    const optimizedPath = join(this.uploadDir, optimizedFilename)

    // Save optimized image
    const optimizedBuffer = await optimizedImage.toBuffer()
    await writeFile(optimizedPath, optimizedBuffer)

    // Generate thumbnails
    const thumbnails = await this.generateThumbnails(
      buffer,
      nameWithoutExt,
      {
        sizes: [
          { width: 150, height: 150, suffix: 'thumb' },
          { width: 300, height: 300, suffix: 'small' },
          { width: 600, height: 600, suffix: 'medium' },
          { width: 1200, height: 1200, suffix: 'large' }
        ],
        quality,
        format
      }
    )

    return {
      originalPath: join(this.uploadDir, filename),
      optimizedPath,
      thumbnails,
      metadata: {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        size: optimizedBuffer.length,
        hasAlpha: metadata.hasAlpha || false
      }
    }
  }

  /**
   * Generate multiple thumbnail sizes
   */
  async generateThumbnails(
    buffer: Buffer,
    baseName: string,
    options: ThumbnailOptions
  ): Promise<Array<{ path: string; width: number; height: number; size: number }>> {
    const { sizes, quality = 85, format = 'webp' } = options
    const thumbnails = []

    for (const size of sizes) {
      const filename = `${baseName}_${size.suffix}.${format}`
      const filepath = join(this.uploadDir, filename)

      let thumbnail = sharp(buffer).resize(size.width, size.height, {
        fit: 'cover',
        position: 'center'
      })

      // Apply format-specific settings
      switch (format) {
        case 'jpeg':
          thumbnail = thumbnail.jpeg({ quality, progressive: true })
          break
        case 'png':
          thumbnail = thumbnail.png({ quality, compressionLevel: 9 })
          break
        case 'webp':
          thumbnail = thumbnail.webp({ quality })
          break
      }

      const thumbnailBuffer = await thumbnail.toBuffer()
      await writeFile(filepath, thumbnailBuffer)

      thumbnails.push({
        path: filepath,
        width: size.width,
        height: size.height,
        size: thumbnailBuffer.length
      })
    }

    return thumbnails
  }

  /**
   * Get image metadata without processing
   */
  async getImageMetadata(buffer: Buffer) {
    const image = sharp(buffer)
    const metadata = await image.metadata()

    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      size: buffer.length,
      hasAlpha: metadata.hasAlpha || false,
      colorSpace: metadata.space || 'unknown',
      channels: metadata.channels || 0,
      density: metadata.density || 0
    }
  }

  /**
   * Validate image file
   */
  async validateImage(buffer: Buffer): Promise<{
    isValid: boolean
    error?: string
    metadata?: Record<string, unknown>
  }> {
    try {
      const metadata = await this.getImageMetadata(buffer)
      
      // Check if image dimensions are reasonable
      if (metadata.width > 10000 || metadata.height > 10000) {
        return {
          isValid: false,
          error: 'Image dimensions too large (max 10000x10000)'
        }
      }

      // Check file size (max 50MB)
      if (metadata.size > 50 * 1024 * 1024) {
        return {
          isValid: false,
          error: 'File size too large (max 50MB)'
        }
      }

      return {
        isValid: true,
        metadata
      }
    } catch (error) {
      return {
        isValid: false,
        error: `Invalid image file: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
}

// Export default instance
export const mediaOptimizer = new MediaOptimizer()

// Utility functions
export function getImageUrl(path: string): string {
  return path.replace('public/', '/')
}

export function getMimeType(format: string): string {
  const mimeTypes: Record<string, string> = {
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    avif: 'image/avif',
    gif: 'image/gif',
    svg: 'image/svg+xml'
  }

  return mimeTypes[format.toLowerCase()] || 'application/octet-stream'
}

export function isImageFile(filename: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg']
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'))
  return imageExtensions.includes(extension)
}

export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const extension = originalName.substring(originalName.lastIndexOf('.'))
  const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'))
  
  return `${nameWithoutExt}_${timestamp}_${random}${extension}`
}
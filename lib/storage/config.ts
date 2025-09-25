// Storage configuration and providers
export type StorageProvider = 'local' | 's3' | 'cloudinary' | 'vercel-blob'

export interface StorageConfig {
  provider: StorageProvider
  maxFileSize: number // in bytes
  allowedTypes: string[]
  local?: {
    uploadDir: string
    publicPath: string
  }
  s3?: {
    region: string
    bucket: string
    accessKeyId: string
    secretAccessKey: string
  }
  cloudinary?: {
    cloudName: string
    apiKey: string
    apiSecret: string
  }
}

export interface UploadResult {
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  publicId?: string // for cloudinary
}

export interface StorageAdapter {
  upload(file: Buffer, metadata: {
    originalName: string
    mimeType: string
    size: number
  }): Promise<UploadResult>
  delete(filename: string): Promise<boolean>
  getUrl(filename: string): string
}

// Default configuration
export const getStorageConfig = (): StorageConfig => {
  return {
    provider: (process.env.STORAGE_PROVIDER as StorageProvider) || 'local',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
    allowedTypes: [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'application/pdf',
      'application/zip'
    ],
    local: {
      uploadDir: process.env.UPLOAD_DIR || './public/uploads',
      publicPath: process.env.PUBLIC_PATH || '/uploads'
    },
    s3: {
      region: process.env.AWS_REGION || '',
      bucket: process.env.AWS_S3_BUCKET_NAME || '',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    },
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
      apiKey: process.env.CLOUDINARY_API_KEY || '',
      apiSecret: process.env.CLOUDINARY_API_SECRET || ''
    }
  }
}

import { StorageAdapter, StorageConfig, getStorageConfig } from './config'
import { LocalStorageAdapter } from './local'
import { S3StorageAdapter } from './s3'
import { CloudinaryStorageAdapter } from './cloudinary'

export function createStorageAdapter(config?: StorageConfig): StorageAdapter {
  const storageConfig = config || getStorageConfig()

  switch (storageConfig.provider) {
    case 'local':
      if (!storageConfig.local) {
        throw new Error('Local storage configuration is missing')
      }
      return new LocalStorageAdapter(
        storageConfig.local.uploadDir,
        storageConfig.local.publicPath
      )

    case 's3':
      if (!storageConfig.s3) {
        throw new Error('S3 storage configuration is missing')
      }
      if (!storageConfig.s3.region || !storageConfig.s3.bucket || 
          !storageConfig.s3.accessKeyId || !storageConfig.s3.secretAccessKey) {
        throw new Error('S3 configuration is incomplete. Please check AWS_REGION, AWS_S3_BUCKET_NAME, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY environment variables.')
      }
      return new S3StorageAdapter(storageConfig.s3)

    case 'cloudinary':
      if (!storageConfig.cloudinary) {
        throw new Error('Cloudinary storage configuration is missing')
      }
      if (!storageConfig.cloudinary.cloudName || !storageConfig.cloudinary.apiKey || 
          !storageConfig.cloudinary.apiSecret) {
        throw new Error('Cloudinary configuration is incomplete. Please check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.')
      }
      return new CloudinaryStorageAdapter(storageConfig.cloudinary)

    default:
      throw new Error(`Unsupported storage provider: ${storageConfig.provider}`)
  }
}

// Export storage utilities
export * from './config'
export { LocalStorageAdapter } from './local'
export { S3StorageAdapter } from './s3'
export { CloudinaryStorageAdapter } from './cloudinary'

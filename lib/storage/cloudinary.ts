import { v2 as cloudinary } from 'cloudinary'
import { StorageAdapter, UploadResult } from './config'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'

export class CloudinaryStorageAdapter implements StorageAdapter {
  constructor(config: {
    cloudName: string
    apiKey: string
    apiSecret: string
  }) {
    cloudinary.config({
      cloud_name: config.cloudName,
      api_key: config.apiKey,
      api_secret: config.apiSecret,
    })
  }

  async upload(file: Buffer, metadata: {
    originalName: string
    mimeType: string
    size: number
  }): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      // Generate unique public ID
      const ext = path.extname(metadata.originalName)
      const publicId = `${uuidv4()}${ext}`

      cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: 'auto', // auto-detect file type
          folder: 'uploads',
        },
        (error, result) => {
          if (error) {
            reject(error)
            return
          }

          if (!result) {
            reject(new Error('Upload failed - no result'))
            return
          }

          resolve({
            filename: result.public_id,
            originalName: metadata.originalName,
            mimeType: metadata.mimeType,
            size: metadata.size,
            url: result.secure_url,
            publicId: result.public_id,
          })
        }
      ).end(file)
    })
  }

  async delete(filename: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(filename)
      return result.result === 'ok'
    } catch (error) {
      console.error('Error deleting file from Cloudinary:', error)
      return false
    }
  }

  getUrl(filename: string): string {
    // For Cloudinary, we typically store the full URL
    // But we can also construct it from the public_id
    return cloudinary.url(filename, { secure: true })
  }
}

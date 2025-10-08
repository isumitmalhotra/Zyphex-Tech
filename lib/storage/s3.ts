import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { StorageAdapter, UploadResult } from './config'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'

export class S3StorageAdapter implements StorageAdapter {
  private s3: S3Client
  private bucket: string

  constructor(config: {
    region: string
    bucket: string
    accessKeyId: string
    secretAccessKey: string
  }) {
    this.s3 = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    })
    this.bucket = config.bucket
  }

  async upload(file: Buffer, metadata: {
    originalName: string
    mimeType: string
    size: number
  }): Promise<UploadResult> {
    // Generate unique filename
    const ext = path.extname(metadata.originalName)
    const filename = `${uuidv4()}${ext}`
    const key = `uploads/${filename}`

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file,
      ContentType: metadata.mimeType,
      ContentLength: metadata.size,
    })

    await this.s3.send(command)

    // Return result
    return {
      filename: key,
      originalName: metadata.originalName,
      mimeType: metadata.mimeType,
      size: metadata.size,
      url: `https://${this.bucket}.s3.amazonaws.com/${key}`
    }
  }

  async delete(filename: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: filename,
      })
      
      await this.s3.send(command)
      return true
    } catch (error) {
      return false
    }
  }

  getUrl(filename: string): string {
    return `https://${this.bucket}.s3.amazonaws.com/${filename}`
  }
}

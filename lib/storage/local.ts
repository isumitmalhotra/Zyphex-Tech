import { StorageAdapter, UploadResult } from './config'
import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export class LocalStorageAdapter implements StorageAdapter {
  private uploadDir: string
  private publicPath: string

  constructor(uploadDir: string, publicPath: string) {
    this.uploadDir = uploadDir
    this.publicPath = publicPath
  }

  async upload(file: Buffer, metadata: {
    originalName: string
    mimeType: string
    size: number
  }): Promise<UploadResult> {
    // Ensure upload directory exists
    await fs.mkdir(this.uploadDir, { recursive: true })

    // Generate unique filename
    const ext = path.extname(metadata.originalName)
    const filename = `${uuidv4()}${ext}`
    const filePath = path.join(this.uploadDir, filename)

    // Write file to disk
    await fs.writeFile(filePath, file)

    // Return result
    return {
      filename,
      originalName: metadata.originalName,
      mimeType: metadata.mimeType,
      size: metadata.size,
      url: `${this.publicPath}/${filename}`
    }
  }

  async delete(filename: string): Promise<boolean> {
    try {
      const filePath = path.join(this.uploadDir, filename)
      await fs.unlink(filePath)
      return true
    } catch (error) {
      console.error('Error deleting file:', error)
      return false
    }
  }

  getUrl(filename: string): string {
    return `${this.publicPath}/${filename}`
  }
}

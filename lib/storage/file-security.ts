import crypto from 'crypto'
import path from 'path'
import fs from 'fs/promises'
import { z } from 'zod'

// File upload security configuration
export const FILE_SECURITY_CONFIG = {
  // Allowed MIME types (whitelist approach)
  allowedMimeTypes: [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // Archives
    'application/zip',
    'application/x-zip-compressed',
  ],
  
  // File size limits (bytes)
  maxFileSize: {
    image: 10 * 1024 * 1024, // 10MB
    document: 25 * 1024 * 1024, // 25MB
    video: 100 * 1024 * 1024, // 100MB
    default: 10 * 1024 * 1024, // 10MB
  },
  
  // Allowed file extensions
  allowedExtensions: [
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx',
    '.zip'
  ],
  
  // Dangerous file extensions to block
  blockedExtensions: [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr',
    '.vbs', '.js', '.jar', '.sh', '.ps1', '.msi'
  ],
}

// Validation schema
export const fileUploadSchema = z.object({
  file: z.any(),
  category: z.enum(['avatar', 'document', 'image', 'attachment']).optional(),
  projectId: z.string().optional(),
})

// File validation result
export interface FileValidationResult {
  valid: boolean
  errors: string[]
  sanitizedFilename?: string
  fileType?: string
  fileSize?: number
}

// Validate file extension
export function validateExtension(filename: string): { valid: boolean; error?: string } {
  const ext = path.extname(filename).toLowerCase()
  
  // Check blocked extensions
  if (FILE_SECURITY_CONFIG.blockedExtensions.includes(ext)) {
    return {
      valid: false,
      error: `File type ${ext} is not allowed for security reasons`
    }
  }
  
  // Check allowed extensions
  if (!FILE_SECURITY_CONFIG.allowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: `File type ${ext} is not supported`
    }
  }
  
  return { valid: true }
}

// Validate MIME type
export function validateMimeType(mimeType: string): { valid: boolean; error?: string } {
  if (!FILE_SECURITY_CONFIG.allowedMimeTypes.includes(mimeType)) {
    return {
      valid: false,
      error: `File type ${mimeType} is not allowed`
    }
  }
  
  return { valid: true }
}

// Validate file size
export function validateFileSize(
  size: number, 
  category: 'image' | 'document' | 'video' | 'default' = 'default'
): { valid: boolean; error?: string } {
  const maxSize = FILE_SECURITY_CONFIG.maxFileSize[category]
  
  if (size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed (${(maxSize / 1024 / 1024).toFixed(1)}MB)`
    }
  }
  
  return { valid: true }
}

// Sanitize filename
export function sanitizeFilename(filename: string): string {
  // Remove directory traversal attempts
  let sanitized = filename.replace(/\.\./g, '')
  
  // Remove special characters except .-_
  sanitized = sanitized.replace(/[^a-zA-Z0-9.-_]/g, '_')
  
  // Get extension
  const ext = path.extname(sanitized)
  const nameWithoutExt = path.basename(sanitized, ext)
  
  // Generate unique filename with timestamp and random string
  const timestamp = Date.now()
  const randomString = crypto.randomBytes(8).toString('hex')
  
  return `${nameWithoutExt}_${timestamp}_${randomString}${ext}`
}

// Verify MIME type matches extension
export function verifyMimeExtensionMatch(
  mimeType: string, 
  filename: string
): { valid: boolean; error?: string } {
  const ext = path.extname(filename).toLowerCase()
  
  // MIME type to extension mapping
  const mimeToExt: Record<string, string[]> = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/jpg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'image/svg+xml': ['.svg'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/zip': ['.zip'],
    'application/x-zip-compressed': ['.zip'],
  }
  
  const expectedExtensions = mimeToExt[mimeType]
  
  if (!expectedExtensions) {
    return {
      valid: false,
      error: 'Unsupported MIME type'
    }
  }
  
  if (!expectedExtensions.includes(ext)) {
    return {
      valid: false,
      error: `File extension ${ext} does not match MIME type ${mimeType}`
    }
  }
  
  return { valid: true }
}

// Comprehensive file validation
export async function validateFile(
  file: File | Buffer,
  filename: string,
  mimeType: string,
  category: 'image' | 'document' | 'video' | 'default' = 'default'
): Promise<FileValidationResult> {
  const errors: string[] = []
  
  // 1. Validate extension
  const extValidation = validateExtension(filename)
  if (!extValidation.valid) {
    errors.push(extValidation.error!)
  }
  
  // 2. Validate MIME type
  const mimeValidation = validateMimeType(mimeType)
  if (!mimeValidation.valid) {
    errors.push(mimeValidation.error!)
  }
  
  // 3. Verify MIME type matches extension
  const matchValidation = verifyMimeExtensionMatch(mimeType, filename)
  if (!matchValidation.valid) {
    errors.push(matchValidation.error!)
  }
  
  // 4. Validate file size
  const size = file instanceof Buffer ? file.length : (file as File).size
  const sizeValidation = validateFileSize(size, category)
  if (!sizeValidation.valid) {
    errors.push(sizeValidation.error!)
  }
  
  // 5. Check file content (magic numbers) for images
  if (mimeType.startsWith('image/')) {
    const contentValidation = await validateImageContent(file, mimeType)
    if (!contentValidation.valid) {
      errors.push(contentValidation.error!)
    }
  }
  
  if (errors.length > 0) {
    return {
      valid: false,
      errors
    }
  }
  
  return {
    valid: true,
    errors: [],
    sanitizedFilename: sanitizeFilename(filename),
    fileType: mimeType,
    fileSize: size
  }
}

// Validate image content by checking magic numbers
async function validateImageContent(
  file: File | Buffer,
  mimeType: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Get first bytes of file
    let buffer: Buffer
    
    if (file instanceof Buffer) {
      buffer = file
    } else {
      const arrayBuffer = await (file as File).arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
    }
    
    // Check magic numbers
    const magicNumbers: Record<string, number[][]> = {
      'image/jpeg': [[0xFF, 0xD8, 0xFF]],
      'image/jpg': [[0xFF, 0xD8, 0xFF]],
      'image/png': [[0x89, 0x50, 0x4E, 0x47]],
      'image/gif': [[0x47, 0x49, 0x46, 0x38]],
      'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF
    }
    
    const expectedMagic = magicNumbers[mimeType]
    
    if (expectedMagic) {
      const matches = expectedMagic.some(magic => {
        return magic.every((byte, index) => buffer[index] === byte)
      })
      
      if (!matches) {
        return {
          valid: false,
          error: 'File content does not match declared MIME type (possible malicious file)'
        }
      }
    }
    
    return { valid: true }
  } catch (_error) {
    return {
      valid: false,
      error: 'Failed to validate file content'
    }
  }
}

// Scan file for malicious content (basic implementation)
// In production, integrate with ClamAV or similar
export async function scanFileForMalware(
  filePath: string
): Promise<{ safe: boolean; threat?: string }> {
  try {
    // TODO: Integrate with ClamAV or similar antivirus
    // For now, perform basic checks
    
    const content = await fs.readFile(filePath)
    
    // Check for common malicious patterns
    const maliciousPatterns = [
      /<script[\s\S]*?>/gi, // Script tags
      /javascript:/gi, // JavaScript protocol
      /on\w+\s*=/gi, // Event handlers
      /eval\(/gi, // Eval function
      /document\.cookie/gi, // Cookie access
    ]
    
    const contentString = content.toString()
    
    for (const pattern of maliciousPatterns) {
      if (pattern.test(contentString)) {
        return {
          safe: false,
          threat: 'Potentially malicious content detected'
        }
      }
    }
    
    return { safe: true }
  } catch (_error) {
    return {
      safe: false,
      threat: 'Failed to scan file'
    }
  }
}

// Generate secure file URL with expiration
export function generateSecureFileUrl(
  filename: string,
  expirationMinutes: number = 60
): { url: string; expiresAt: Date } {
  const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000)
  const token = crypto
    .createHash('sha256')
    .update(`${filename}:${expiresAt.getTime()}:${process.env.FILE_ACCESS_SECRET || 'secret'}`)
    .digest('hex')
  
  return {
    url: `/api/files/${filename}?token=${token}&expires=${expiresAt.getTime()}`,
    expiresAt
  }
}

// Verify secure file URL token
export function verifySecureFileUrl(
  filename: string,
  token: string,
  expires: string
): boolean {
  const expiresTimestamp = parseInt(expires)
  
  // Check expiration
  if (Date.now() > expiresTimestamp) {
    return false
  }
  
  // Verify token
  const expectedToken = crypto
    .createHash('sha256')
    .update(`${filename}:${expiresTimestamp}:${process.env.FILE_ACCESS_SECRET || 'secret'}`)
    .digest('hex')
  
  return token === expectedToken
}

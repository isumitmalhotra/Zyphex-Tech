import crypto from 'crypto'

/**
 * Data Encryption Library
 * Phase 3: Database Security & Encryption
 * 
 * Features:
 * - AES-256-GCM encryption for sensitive data
 * - Authenticated encryption with integrity checking
 * - Secure key management
 * - Data masking for logs
 * - One-way hashing for non-reversible data
 */

const ALGORITHM = 'aes-256-gcm'
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY

// Ensure encryption key is properly set
if (!ENCRYPTION_KEY) {
  console.warn('⚠️  ENCRYPTION_KEY not set in environment variables.')
  console.warn('⚠️  Encryption will not work properly. Please set ENCRYPTION_KEY in .env')
}

/**
 * Main encryption class
 * Uses AES-256-GCM for authenticated encryption
 */
export class DataEncryption {
  /**
   * Get encryption key as Buffer
   * Key must be 32 bytes (64 hex characters) for AES-256
   */
  private static getKey(): Buffer {
    if (!ENCRYPTION_KEY) {
      throw new Error('ENCRYPTION_KEY environment variable not set')
    }

    if (ENCRYPTION_KEY.length !== 64) {
      throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)')
    }

    return Buffer.from(ENCRYPTION_KEY, 'hex')
  }

  /**
   * Encrypt data using AES-256-GCM
   * Returns format: iv:authTag:encryptedData
   */
  static encrypt(text: string): string {
    try {
      if (!text) {
        return text
      }

      // Generate random IV (Initialization Vector)
      const iv = crypto.randomBytes(16)
      
      // Create cipher
      const cipher = crypto.createCipheriv(ALGORITHM, this.getKey(), iv)
      
      // Encrypt data
      let encrypted = cipher.update(text, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      
      // Get authentication tag
      const authTag = cipher.getAuthTag()
      
      // Return format: iv:authTag:encrypted
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
    } catch (error) {
      console.error('[Encryption] Encryption failed:', error)
      throw new Error('Data encryption failed')
    }
  }

  /**
   * Decrypt data encrypted with AES-256-GCM
   * Expects format: iv:authTag:encryptedData
   */
  static decrypt(encryptedData: string): string {
    try {
      if (!encryptedData) {
        return encryptedData
      }

      // Parse encrypted data format
      const parts = encryptedData.split(':')
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format')
      }

      const [ivHex, authTagHex, encrypted] = parts
      
      // Convert from hex
      const iv = Buffer.from(ivHex, 'hex')
      const authTag = Buffer.from(authTagHex, 'hex')
      
      // Create decipher
      const decipher = crypto.createDecipheriv(ALGORITHM, this.getKey(), iv)
      decipher.setAuthTag(authTag)
      
      // Decrypt data
      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      return decrypted
    } catch (error) {
      console.error('[Encryption] Decryption failed:', error)
      throw new Error('Data decryption failed')
    }
  }

  /**
   * One-way hash using SHA-256
   * For non-reversible data like checksums
   */
  static hash(text: string): string {
    return crypto
      .createHash('sha256')
      .update(text)
      .digest('hex')
  }

  /**
   * HMAC for message authentication
   * Useful for API signatures and data integrity
   */
  static hmac(text: string, secret?: string): string {
    const key = secret || ENCRYPTION_KEY || 'fallback-secret'
    return crypto
      .createHmac('sha256', key)
      .update(text)
      .digest('hex')
  }

  /**
   * Mask sensitive data for logs
   * Shows first and last N characters, hides the rest
   */
  static mask(text: string, visibleChars: number = 4): string {
    if (!text || text.length <= visibleChars * 2) {
      return '*'.repeat(text.length || 8)
    }
    
    const start = text.slice(0, visibleChars)
    const end = text.slice(-visibleChars)
    const masked = '*'.repeat(text.length - visibleChars * 2)
    
    return `${start}${masked}${end}`
  }

  /**
   * Mask email address
   * Shows first character and domain, hides rest
   */
  static maskEmail(email: string): string {
    if (!email || !email.includes('@')) {
      return '***@***.***'
    }

    const [localPart, domain] = email.split('@')
    
    if (localPart.length <= 2) {
      return `${localPart[0]}*@${domain}`
    }

    return `${localPart[0]}${'*'.repeat(localPart.length - 1)}@${domain}`
  }

  /**
   * Mask phone number
   * Shows last 4 digits only
   */
  static maskPhone(phone: string): string {
    if (!phone || phone.length < 4) {
      return '***-***-****'
    }

    const visible = phone.slice(-4)
    const masked = '*'.repeat(phone.length - 4)
    
    return `${masked}${visible}`
  }

  /**
   * Mask credit card number
   * Shows last 4 digits only
   */
  static maskCard(cardNumber: string): string {
    if (!cardNumber || cardNumber.length < 4) {
      return '**** **** **** ****'
    }

    const last4 = cardNumber.slice(-4)
    return `**** **** **** ${last4}`
  }

  /**
   * Check if string is encrypted (has our format)
   */
  static isEncrypted(data: string): boolean {
    if (!data) return false
    const parts = data.split(':')
    return parts.length === 3 && 
           parts[0].length === 32 && // IV is 16 bytes = 32 hex chars
           parts[1].length === 32    // Auth tag is 16 bytes = 32 hex chars
  }

  /**
   * Safely encrypt if not already encrypted
   */
  static encryptIfNeeded(data: string): string {
    if (!data) return data
    if (this.isEncrypted(data)) return data
    return this.encrypt(data)
  }

  /**
   * Safely decrypt if encrypted
   */
  static decryptIfNeeded(data: string): string {
    if (!data) return data
    if (!this.isEncrypted(data)) return data
    return this.decrypt(data)
  }
}

/**
 * Encrypt multiple PII fields in an object
 * Used before saving to database
 */
export function encryptPII(
  data: Record<string, unknown>, 
  fields: string[]
): Record<string, unknown> {
  const encrypted = { ...data }
  
  for (const field of fields) {
    if (encrypted[field] && typeof encrypted[field] === 'string') {
      try {
        encrypted[field] = DataEncryption.encryptIfNeeded(encrypted[field] as string)
      } catch (error) {
        console.error(`[Encryption] Failed to encrypt field ${field}:`, error)
        // Don't throw - continue with other fields
      }
    }
  }
  
  return encrypted
}

/**
 * Decrypt multiple PII fields in an object
 * Used after reading from database
 */
export function decryptPII(
  data: Record<string, unknown>, 
  fields: string[]
): Record<string, unknown> {
  const decrypted = { ...data }
  
  for (const field of fields) {
    if (decrypted[field] && typeof decrypted[field] === 'string') {
      try {
        decrypted[field] = DataEncryption.decryptIfNeeded(decrypted[field] as string)
      } catch (error) {
        console.error(`[Encryption] Failed to decrypt field ${field}:`, error)
        // Set to null on decryption failure
        decrypted[field] = null
      }
    }
  }
  
  return decrypted
}

/**
 * Mask multiple sensitive fields in an object for logging
 */
export function maskSensitiveData(
  data: Record<string, unknown>,
  fields: string[]
): Record<string, unknown> {
  const masked = { ...data }
  
  for (const field of fields) {
    if (masked[field] && typeof masked[field] === 'string') {
      const value = masked[field] as string
      
      // Apply specific masking based on field name
      if (field.toLowerCase().includes('email')) {
        masked[field] = DataEncryption.maskEmail(value)
      } else if (field.toLowerCase().includes('phone')) {
        masked[field] = DataEncryption.maskPhone(value)
      } else if (field.toLowerCase().includes('card')) {
        masked[field] = DataEncryption.maskCard(value)
      } else {
        masked[field] = DataEncryption.mask(value)
      }
    }
  }
  
  return masked
}

/**
 * Generate encryption key (for initial setup)
 * Returns 32-byte key as 64-character hex string
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Validate encryption key format
 */
export function validateEncryptionKey(key: string): {
  valid: boolean
  error?: string
} {
  if (!key) {
    return { valid: false, error: 'Encryption key is required' }
  }

  if (key.length !== 64) {
    return { 
      valid: false, 
      error: 'Encryption key must be 32 bytes (64 hex characters)' 
    }
  }

  // Check if valid hex
  if (!/^[0-9a-f]{64}$/i.test(key)) {
    return { 
      valid: false, 
      error: 'Encryption key must be valid hexadecimal' 
    }
  }

  return { valid: true }
}

/**
 * Encrypt sensitive fields in array of objects
 */
export function encryptArrayPII<T extends Record<string, unknown>>(
  data: T[],
  fields: string[]
): T[] {
  return data.map(item => encryptPII(item, fields) as T)
}

/**
 * Decrypt sensitive fields in array of objects
 */
export function decryptArrayPII<T extends Record<string, unknown>>(
  data: T[],
  fields: string[]
): T[] {
  return data.map(item => decryptPII(item, fields) as T)
}

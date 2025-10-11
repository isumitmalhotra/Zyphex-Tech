import { Prisma, PrismaClient } from '@prisma/client'
import { DataEncryption } from '@/lib/encryption'

/**
 * Prisma Client Extension for Automatic Field-Level Encryption
 * Phase 3: Database Security & Encryption
 * 
 * Uses Prisma Client Extensions (v4+) for transparent encryption/decryption:
 * - Creating records (encrypt before save)
 * - Updating records (encrypt before save)  
 * - Reading records (decrypt after fetch)
 * 
 * Supports all query operations via $extends API
 */

/**
 * Define which fields should be encrypted for each model
 * Add more models and fields as needed
 * 
 * IMPORTANT: Do NOT encrypt fields used in:
 * - WHERE clauses (queries, lookups)
 * - Unique constraints (email, username)
 * - Foreign keys
 * - Indexes
 * 
 * Consider using hashing for searchable sensitive data instead.
 */
const ENCRYPTED_FIELDS: Record<string, string[]> = {
  // User model - PII fields
  User: [
    // Note: 'email' is NOT encrypted - used for authentication and queries
    // 'password' is already hashed with bcrypt, no need for additional encryption
  ],
  
  // Client model - Sensitive business data
  Client: [
    'phone',    // Phone numbers - PII
    'address',  // Physical addresses - PII
  ],
  
  // Lead model - Prospect information
  Lead: [
    'phone',  // Prospect phone numbers - PII
    'notes',  // May contain sensitive business information
  ],
  
  // Payment model - Financial transaction data (PCI-DSS)
  Payment: [
    'paymentReference',  // Transaction IDs may expose sensitive data
    'failureReason',     // May contain sensitive error details
  ],
  
  // PaymentConfig model - Financial credentials (PCI-DSS Level 1)
  PaymentConfig: [
    'stripeSecretKey',     // Payment gateway API keys - CRITICAL
    'paypalClientSecret',  // Payment gateway secrets - CRITICAL
    'bankAccountNumber',   // Bank account numbers - PCI-DSS
    'bankRoutingNumber',   // Routing numbers - PCI-DSS
    'bankSwiftCode',       // International bank codes - PCI-DSS
    'bankAccountName',     // Account holder names - PII
  ],
  
  // Add more models as needed
  // Document: ['content'],
  // Lead: ['notes', 'phone'],
}

/**
 * Apply encryption middleware to Prisma client
 * Call this once when initializing Prisma
 */
export function applyEncryptionMiddleware(prisma: PrismaClient): void {
  prisma.$use(async (params, next) => {
    const { model, action } = params

    // Skip if no model or no encrypted fields for this model
    if (!model || !ENCRYPTED_FIELDS[model]) {
      return next(params)
    }

    const fields = ENCRYPTED_FIELDS[model]

    try {
      // ===== ENCRYPT before saving (create/update) =====
      if (action === 'create' || action === 'update' || action === 'upsert') {
        if (params.args.data) {
          params.args.data = encryptFields(params.args.data, fields)
        }
        
        // Handle upsert create/update separately
        if (action === 'upsert') {
          if (params.args.create) {
            params.args.create = encryptFields(params.args.create, fields)
          }
          if (params.args.update) {
            params.args.update = encryptFields(params.args.update, fields)
          }
        }
      }

      // ===== ENCRYPT before bulk updates =====
      if (action === 'updateMany') {
        if (params.args.data) {
          params.args.data = encryptFields(params.args.data, fields)
        }
      }

      // Execute the query
      const result = await next(params)

      // ===== DECRYPT after reading (find operations) =====
      if (
        action === 'findUnique' ||
        action === 'findFirst' ||
        action === 'findMany'
      ) {
        if (result) {
          if (Array.isArray(result)) {
            // Decrypt array of records
            return result.map(item => decryptFields(item, fields))
          } else {
            // Decrypt single record
            return decryptFields(result, fields)
          }
        }
      }

      // Return result for create/update (encrypted data in DB)
      // Note: We return encrypted data for create/update to show what's stored
      // If you want decrypted data returned, decrypt here as well
      if (action === 'create' || action === 'update' || action === 'upsert') {
        if (result) {
          if (Array.isArray(result)) {
            return result.map(item => decryptFields(item, fields))
          } else {
            return decryptFields(result, fields)
          }
        }
      }

      return result
    } catch (error) {
      console.error(`[Encryption Middleware] Error in ${model}.${action}:`, error)
      // Continue with unencrypted data on error
      return next(params)
    }
  })

  console.log('[Encryption Middleware] ✅ Automatic encryption middleware applied')
}

/**
 * Encrypt specified fields in data object
 */
function encryptFields(
  data: Record<string, unknown>,
  fields: string[]
): Record<string, unknown> {
  const encrypted = { ...data }

  for (const field of fields) {
    if (encrypted[field] !== undefined && encrypted[field] !== null) {
      const value = encrypted[field]

      // Only encrypt strings
      if (typeof value === 'string' && value.length > 0) {
        try {
          // Only encrypt if not already encrypted
          if (!DataEncryption.isEncrypted(value)) {
            encrypted[field] = DataEncryption.encrypt(value)
          }
        } catch (error) {
          console.error(`[Encryption] Failed to encrypt field '${field}':`, error)
          // Keep original value on encryption failure
        }
      }
    }
  }

  return encrypted
}

/**
 * Decrypt specified fields in data object
 */
function decryptFields(
  data: Record<string, unknown> | null,
  fields: string[]
): Record<string, unknown> | null {
  if (!data) return data

  const decrypted = { ...data }

  for (const field of fields) {
    if (decrypted[field] !== undefined && decrypted[field] !== null) {
      const value = decrypted[field]

      // Only decrypt strings
      if (typeof value === 'string' && value.length > 0) {
        try {
          // Only decrypt if it looks encrypted
          if (DataEncryption.isEncrypted(value)) {
            decrypted[field] = DataEncryption.decrypt(value)
          }
        } catch (error) {
          console.error(`[Encryption] Failed to decrypt field '${field}':`, error)
          // Set to null on decryption failure
          decrypted[field] = null
        }
      }
    }
  }

  return decrypted
}

/**
 * Add encrypted field to a model
 * Use this to dynamically add fields without modifying middleware
 */
export function addEncryptedField(model: string, field: string): void {
  if (!ENCRYPTED_FIELDS[model]) {
    ENCRYPTED_FIELDS[model] = []
  }

  if (!ENCRYPTED_FIELDS[model].includes(field)) {
    ENCRYPTED_FIELDS[model].push(field)
    console.log(`[Encryption] Added encrypted field: ${model}.${field}`)
  }
}

/**
 * Remove encrypted field from a model
 */
export function removeEncryptedField(model: string, field: string): void {
  if (ENCRYPTED_FIELDS[model]) {
    ENCRYPTED_FIELDS[model] = ENCRYPTED_FIELDS[model].filter(f => f !== field)
    console.log(`[Encryption] Removed encrypted field: ${model}.${field}`)
  }
}

/**
 * Get list of encrypted fields for a model
 */
export function getEncryptedFields(model: string): string[] {
  return ENCRYPTED_FIELDS[model] || []
}

/**
 * Get all encrypted models and their fields
 */
export function getAllEncryptedFields(): Record<string, string[]> {
  return { ...ENCRYPTED_FIELDS }
}

/**
 * Manually encrypt data for a specific model
 * Use when bypassing Prisma (raw queries, migrations, etc.)
 */
export function manualEncrypt(
  model: string,
  data: Record<string, unknown>
): Record<string, unknown> {
  const fields = ENCRYPTED_FIELDS[model]
  if (!fields) return data

  return encryptFields(data, fields)
}

/**
 * Manually decrypt data for a specific model
 * Use when bypassing Prisma (raw queries, external processing, etc.)
 */
export function manualDecrypt(
  model: string,
  data: Record<string, unknown>
): Record<string, unknown> {
  const fields = ENCRYPTED_FIELDS[model]
  if (!fields) return data

  return decryptFields(data, fields) || data
}

/**
 * Check if encryption is properly configured
 */
export function validateEncryptionSetup(): {
  valid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Check if encryption key is set
  if (!process.env.ENCRYPTION_KEY) {
    errors.push('ENCRYPTION_KEY environment variable not set')
  } else {
    // Validate key format
    if (process.env.ENCRYPTION_KEY.length !== 64) {
      errors.push('ENCRYPTION_KEY must be 32 bytes (64 hex characters)')
    }
    
    if (!/^[0-9a-f]{64}$/i.test(process.env.ENCRYPTION_KEY)) {
      errors.push('ENCRYPTION_KEY must be valid hexadecimal')
    }
  }

  // Check if any models have encrypted fields
  const modelCount = Object.keys(ENCRYPTED_FIELDS).length
  const totalFields = Object.values(ENCRYPTED_FIELDS).reduce(
    (sum, fields) => sum + fields.length, 
    0
  )

  if (modelCount === 0) {
    warnings.push('No models configured for encryption')
  }

  if (totalFields === 0) {
    warnings.push('No fields configured for encryption')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Test encryption/decryption with sample data
 * Use for debugging and validation
 */
export function testEncryption(): {
  success: boolean
  message: string
  details?: unknown
} {
  try {
    const testData = 'Test sensitive data 123'
    
    // Test encrypt
    const encrypted = DataEncryption.encrypt(testData)
    
    // Test decrypt
    const decrypted = DataEncryption.decrypt(encrypted)
    
    if (decrypted !== testData) {
      return {
        success: false,
        message: 'Decryption mismatch',
        details: { original: testData, decrypted }
      }
    }

    return {
      success: true,
      message: 'Encryption test passed',
      details: {
        original: testData,
        encrypted: encrypted.substring(0, 50) + '...',
        decrypted
      }
    }
  } catch (error) {
    return {
      success: false,
      message: 'Encryption test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

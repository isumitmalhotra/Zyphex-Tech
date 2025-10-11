import { Prisma } from '@prisma/client'
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
 * Supports all query operations via $extends query interceptors
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
  // Message: ['content'], // Encrypt message content for privacy
}

/**
 * Encrypt specified fields in an object
 */
function encryptFields<T extends Record<string, unknown>>(
  data: T,
  fields: string[]
): T {
  const encrypted: Record<string, unknown> = { ...data }

  for (const field of fields) {
    if (encrypted[field] !== undefined && encrypted[field] !== null) {
      const value = encrypted[field]
      
      // Handle JSON fields
      if (typeof value === 'object') {
        encrypted[field] = DataEncryption.encrypt(JSON.stringify(value))
      } else if (typeof value === 'string') {
        // Only encrypt if not already encrypted
        if (!DataEncryption.isEncrypted(value)) {
          encrypted[field] = DataEncryption.encrypt(value)
        }
      }
    }
  }

  return encrypted as T
}

/**
 * Decrypt specified fields in an object
 */
function decryptFields<T extends Record<string, unknown>>(
  data: T,
  fields: string[]
): T {
  const decrypted: Record<string, unknown> = { ...data }

  for (const field of fields) {
    if (decrypted[field] !== undefined && decrypted[field] !== null) {
      const value = decrypted[field]
      
      if (typeof value === 'string' && DataEncryption.isEncrypted(value)) {
        try {
          const decryptedValue = DataEncryption.decrypt(value)
          
          // Try to parse as JSON if it looks like JSON
          if (decryptedValue.startsWith('{') || decryptedValue.startsWith('[')) {
            try {
              decrypted[field] = JSON.parse(decryptedValue)
            } catch {
              decrypted[field] = decryptedValue
            }
          } else {
            decrypted[field] = decryptedValue
          }
        } catch (error) {
          console.error(`[Encryption] Failed to decrypt ${field}:`, error)
          // Leave encrypted on error
        }
      }
    }
  }

  return decrypted as T
}

/**
 * Process nested update operations (e.g., { set: value, increment: 1 })
 */
function processUpdateData<T extends Record<string, unknown>>(
  data: T,
  fields: string[]
): T {
  const processed: Record<string, unknown> = { ...data }

  for (const field of fields) {
    if (processed[field] !== undefined) {
      const value = processed[field]
      
      // Handle Prisma update operators
      if (typeof value === 'object' && value !== null) {
        if ('set' in value) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (value as any).set = encryptFields({ value: (value as any).set }, ['value']).value
        }
      } else {
        // Direct field update
        processed[field] = encryptFields({ [field]: value }, [field])[field]
      }
    }
  }

  return processed as T
}

/**
 * Create Prisma Client Extension for automatic encryption
 * 
 * Usage:
 * ```typescript
 * import { encryptionExtension } from '@/lib/db/encryption-extension'
 * const prisma = new PrismaClient().$extends(encryptionExtension)
 * ```
 */
export const encryptionExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    name: 'encryption',
    
    query: {
      // Apply to all models dynamically
      $allModels: {
        // Intercept create operations
        async create({ args, query, model }) {
          const fields = ENCRYPTED_FIELDS[model]
          
          if (fields && args.data) {
            args.data = encryptFields(args.data, fields)
          }
          
          const result = await query(args)
          
          // Decrypt result before returning
          if (fields && result) {
            return decryptFields(result, fields)
          }
          
          return result
        },

        // Intercept createMany operations
        async createMany({ args, query, model }) {
          const fields = ENCRYPTED_FIELDS[model]
          
          if (fields && args.data) {
            if (Array.isArray(args.data)) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              args.data = args.data.map(item => encryptFields(item as any, fields)) as any
            } else {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              args.data = encryptFields(args.data as any, fields)
            }
          }
          
          return query(args)
        },

        // Intercept update operations
        async update({ args, query, model }) {
          const fields = ENCRYPTED_FIELDS[model]
          
          if (fields && args.data) {
            args.data = processUpdateData(args.data, fields)
          }
          
          const result = await query(args)
          
          // Decrypt result before returning
          if (fields && result) {
            return decryptFields(result, fields)
          }
          
          return result
        },

        // Intercept updateMany operations
        async updateMany({ args, query, model }) {
          const fields = ENCRYPTED_FIELDS[model]
          
          if (fields && args.data) {
            args.data = processUpdateData(args.data, fields)
          }
          
          return query(args)
        },

        // Intercept upsert operations
        async upsert({ args, query, model }) {
          const fields = ENCRYPTED_FIELDS[model]
          
          if (fields) {
            if (args.create) {
              args.create = encryptFields(args.create, fields)
            }
            if (args.update) {
              args.update = processUpdateData(args.update, fields)
            }
          }
          
          const result = await query(args)
          
          // Decrypt result before returning
          if (fields && result) {
            return decryptFields(result, fields)
          }
          
          return result
        },

        // Intercept findUnique operations
        async findUnique({ args, query, model }) {
          const result = await query(args)
          const fields = ENCRYPTED_FIELDS[model]
          
          if (fields && result) {
            return decryptFields(result, fields)
          }
          
          return result
        },

        // Intercept findUniqueOrThrow operations
        async findUniqueOrThrow({ args, query, model }) {
          const result = await query(args)
          const fields = ENCRYPTED_FIELDS[model]
          
          if (fields && result) {
            return decryptFields(result, fields)
          }
          
          return result
        },

        // Intercept findFirst operations
        async findFirst({ args, query, model }) {
          const result = await query(args)
          const fields = ENCRYPTED_FIELDS[model]
          
          if (fields && result) {
            return decryptFields(result, fields)
          }
          
          return result
        },

        // Intercept findFirstOrThrow operations
        async findFirstOrThrow({ args, query, model }) {
          const result = await query(args)
          const fields = ENCRYPTED_FIELDS[model]
          
          if (fields && result) {
            return decryptFields(result, fields)
          }
          
          return result
        },

        // Intercept findMany operations
        async findMany({ args, query, model }) {
          const result = await query(args)
          const fields = ENCRYPTED_FIELDS[model]
          
          if (fields && result && Array.isArray(result)) {
            return result.map(item => decryptFields(item, fields))
          }
          
          return result
        },
      },
    },
  })
})

console.log('[Encryption Extension] ✅ Field-level encryption extension defined')

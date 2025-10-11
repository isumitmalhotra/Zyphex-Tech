import { PrismaClient } from '@prisma/client'
import { encryptionExtension } from '@/lib/db/encryption-extension'

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined
}

/**
 * Create Prisma Client with encryption extension
 */
function createPrismaClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
  
  // Apply encryption extension for automatic field-level encryption
  return client.$extends(encryptionExtension)
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
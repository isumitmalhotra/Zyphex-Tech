import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Creating test users...')

  // Create test user for email login
  const hashedPassword = await hash('password123', 10)
  
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      password: hashedPassword,
      role: 'USER',
      emailVerified: new Date(),
    },
  })

  // Create admin user
  const adminPassword = await hash('admin123', 10)
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@zyphextech.com' },
    update: {},
    create: {
      email: 'admin@zyphextech.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'SUPER_ADMIN',
      emailVerified: new Date(),
    },
  })

  console.log('✅ Test users created:')
  console.log('📧 Email: test@example.com | Password: password123 | Role: USER')
  console.log('📧 Email: admin@zyphextech.com | Password: admin123 | Role: SUPER_ADMIN')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
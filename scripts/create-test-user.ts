import { prisma } from '../lib/prisma'
import { hash } from 'bcryptjs'

async function createTestUser() {
  try {
    // Check if test user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    })

    if (existingUser) {
      console.log('Test user already exists')
      return
    }

    // Create test user
    const hashedPassword = await hash('password123', 10)
    
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword,
        role: 'USER'
      }
    })

    console.log('Test user created:', user.email)
  } catch (error) {
    console.error('Error creating test user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser()

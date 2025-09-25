import { prisma } from '../lib/prisma'
import { hash } from 'bcryptjs'

async function testAuth() {
  try {
    console.log('Testing database connection...')

    // Test database connection
    const result = await prisma.$queryRaw`SELECT 1+1 as result`
    console.log('Database connection successful:', result)

    // Check if test user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    })

    if (!existingUser) {
      console.log('Creating test user...')
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
    } else {
      console.log('Test user already exists:', existingUser.email)
    }

    console.log('Authentication setup test completed successfully!')
  } catch (error) {
    console.error('Error during auth test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAuth()

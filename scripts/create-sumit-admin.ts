import { prisma } from '../lib/prisma'
import { hash } from 'bcryptjs'

async function createSumitAdmin() {
  try {
    console.log('=== Creating Sumit Admin User ===')
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'sumitmalhotra@zyphextech.com' }
    })

    if (existingUser) {
      console.log('⚠️ User already exists, deleting first...')
      await prisma.user.delete({
        where: { email: 'sumitmalhotra@zyphextech.com' }
      })
      console.log('✅ Deleted existing user')
    }

    // Create new admin user
    const password = 'Sumit@001'
    const hashedPassword = await hash(password, 12)

    const admin = await prisma.user.create({
      data: {
        email: 'sumitmalhotra@zyphextech.com',
        name: 'Sumit Malhotra',
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: new Date()
      }
    })

    console.log('✅ Admin user created successfully!')
    console.log('📧 Email:', admin.email)
    console.log('🔑 Password:', password)
    console.log('👤 Name:', admin.name)
    console.log('🛡️ Role:', admin.role)
    console.log('🆔 ID:', admin.id)
    
    console.log('\n=== Login Instructions ===')
    console.log('1. Go to: http://localhost:3001/login (dev server running on 3001)')
    console.log('2. Use credentials login (not social login)')
    console.log('3. Email: sumitmalhotra@zyphextech.com')
    console.log('4. Password: Sumit@001')
    console.log('5. Access admin panel at: http://localhost:3001/admin')
    
    // List all admin users
    console.log('\n=== All Admin Users ===')
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    })
    
    adminUsers.forEach(user => {
      console.log(`- ${user.email} (${user.name}) - Created: ${user.createdAt.toLocaleDateString()}`)
    })
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSumitAdmin()
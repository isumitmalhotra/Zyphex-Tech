import { prisma } from '../lib/prisma'
import { hash } from 'bcryptjs'

async function createNewAdmin() {
  try {
    // List all existing users first
    console.log('=== Existing Users ===')
    const existingUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    })
    
    console.log('Found', existingUsers.length, 'users:')
    existingUsers.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - ${user.name}`)
    })
    
    // Delete existing admin if exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@zyphex.com' }
    })

    if (existingAdmin) {
      console.log('\n=== Deleting existing admin ===')
      await prisma.user.delete({
        where: { email: 'admin@zyphex.com' }
      })
      console.log('Deleted existing admin user')
    }

    // Create new admin user with fresh credentials
    console.log('\n=== Creating New Admin ===')
    const newPassword = 'ZyphexAdmin2024!'
    const hashedPassword = await hash(newPassword, 12)

    const admin = await prisma.user.create({
      data: {
        email: 'admin@zyphex.com',
        name: 'Zyphex Admin',
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: new Date()
      }
    })

    console.log('✅ Admin user created successfully!')
    console.log('📧 Email:', admin.email)
    console.log('🔑 Password:', newPassword)
    console.log('👤 Name:', admin.name)
    console.log('🛡️ Role:', admin.role)
    console.log('🆔 ID:', admin.id)
    
    console.log('\n=== Login Instructions ===')
    console.log('1. Go to: http://localhost:3000/login')
    console.log('2. Use credentials login (not social login)')
    console.log('3. Email: admin@zyphex.com')
    console.log('4. Password: ZyphexAdmin2024!')
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createNewAdmin()
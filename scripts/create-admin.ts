/**
 * Script to create an admin user
 * Usage: npx tsx scripts/create-admin.ts
 */

import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth/password'

const prisma = new PrismaClient()

async function createAdminUser() {
  try {
    const email = 'sumitmalhotra@zyphextech.com'
    const password = 'Sumit@001'
    const name = 'Sumit Malhotra'
    const role = 'ADMIN'

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      console.log('❌ User already exists with email:', email)
      console.log('Updating existing user to ADMIN role...')
      
      const hashedPassword = await hashPassword(password)
      
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          role: role,
          emailVerified: new Date() // Verify email automatically
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
          createdAt: true
        }
      })

      console.log('✅ User updated successfully!')
      console.log('User details:', updatedUser)
      return
    }

    // Hash the password
    console.log('🔐 Hashing password...')
    const hashedPassword = await hashPassword(password)

    // Create the admin user
    console.log('👤 Creating admin user...')
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        emailVerified: new Date() // Automatically verify admin email
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true
      }
    })

    console.log('✅ Admin user created successfully!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('User Details:')
    console.log('  ID:', user.id)
    console.log('  Name:', user.name)
    console.log('  Email:', user.email)
    console.log('  Role:', user.role)
    console.log('  Email Verified:', user.emailVerified)
    console.log('  Created At:', user.createdAt)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n🎉 You can now login with:')
    console.log('  Email:', email)
    console.log('  Password:', password)
    console.log('\n🔗 Login URL: https://www.zyphextech.com/login')

  } catch (error) {
    console.error('❌ Error creating admin user:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
createAdminUser()
  .then(() => {
    console.log('\n✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })

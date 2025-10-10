/**
 * Production User Creation Script
 * Creates all production users for Zyphex Tech platform
 * 
 * Usage: npx ts-node scripts/create-production-users.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Creating production users for Zyphex Tech...\n')

  const password = 'Haryana@272002'
  const hashedPassword = await bcrypt.hash(password, 12)

  // Super Admins
  const superAdmins = [
    {
      email: 'sumitmalhotra@zyphextech.com',
      name: 'Sumit Malhotra',
      role: 'SUPER_ADMIN' as const,
    },
    {
      email: 'ishaangarg@zyphextech.com',
      name: 'Ishaan Garg',
      role: 'SUPER_ADMIN' as const,
    },
  ]

  // Admin
  const admins = [
    {
      email: 'support@zyphextech.com',
      name: 'Support Team',
      role: 'ADMIN' as const,
    },
  ]

  // Project Manager
  const projectManagers = [
    {
      email: 'prabudhpandey@zyphextech.com',
      name: 'Prabudh Pandey',
      role: 'PROJECT_MANAGER' as const,
      hourlyRate: 125.0,
    },
  ]

  // Developers
  const developers = [
    {
      email: 'arihantjain@zyphextech.com',
      name: 'Arihant Jain',
      role: 'TEAM_MEMBER' as const,
      hourlyRate: 85.0,
    },
    {
      email: 'abhilashatoriye@zyphextech.com',
      name: 'Abhilash Atoriye',
      role: 'TEAM_MEMBER' as const,
      hourlyRate: 85.0,
    },
    {
      email: 'abhinavsharma@zyphextech.com',
      name: 'Abhinav Sharma',
      role: 'TEAM_MEMBER' as const,
      hourlyRate: 85.0,
    },
    {
      email: 'japleenkaur@zyphextech.com',
      name: 'Japleen Kaur',
      role: 'TEAM_MEMBER' as const,
      hourlyRate: 85.0,
    },
    {
      email: 'ishitajain@zyphextech.com',
      name: 'Ishita Jain',
      role: 'TEAM_MEMBER' as const,
      hourlyRate: 85.0,
    },
    {
      email: 'rohittanwar@zyphextech.com',
      name: 'Rohit Tanwar',
      role: 'TEAM_MEMBER' as const,
      hourlyRate: 85.0,
    },
  ]

  const allUsers = [...superAdmins, ...admins, ...projectManagers, ...developers]

  console.log('📝 Creating users...\n')

  for (const userData of allUsers) {
    try {
      const hourlyRate = 'hourlyRate' in userData ? userData.hourlyRate : undefined
      
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {
          name: userData.name,
          role: userData.role,
          password: hashedPassword,
          emailVerified: new Date(),
          ...(hourlyRate && { hourlyRate }),
        },
        create: {
          email: userData.email,
          name: userData.name,
          role: userData.role,
          password: hashedPassword,
          emailVerified: new Date(),
          ...(hourlyRate && { hourlyRate }),
        },
      })

      console.log(`✅ ${userData.role.padEnd(18)} | ${user.name?.padEnd(20)} | ${user.email}`)
    } catch (error) {
      console.error(`❌ Failed to create ${userData.email}:`, error)
    }
  }

  console.log('\n✨ User creation complete!\n')
  console.log('📋 Summary:')
  console.log(`   Super Admins: ${superAdmins.length}`)
  console.log(`   Admins: ${admins.length}`)
  console.log(`   Project Managers: ${projectManagers.length}`)
  console.log(`   Developers: ${developers.length}`)
  console.log(`   Total: ${allUsers.length} users`)
  console.log('\n🔐 All users have the password: Haryana@272002')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

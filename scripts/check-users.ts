/**
 * Check Production Users Script
 * Verifies all production users exist and displays their details
 * 
 * Usage: npx ts-node scripts/check-users.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking production users...\n')

  const users = await prisma.user.findMany({
    where: {
      email: {
        endsWith: '@zyphextech.com',
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      emailVerified: true,
      hourlyRate: true,
      createdAt: true,
    },
    orderBy: [
      { role: 'asc' },
      { name: 'asc' },
    ],
  })

  if (users.length === 0) {
    console.log('❌ No Zyphex Tech users found!\n')
    console.log('Run: npx ts-node scripts/create-production-users.ts')
    return
  }

  console.log('📊 User Summary:\n')

  const roleGroups: Record<string, typeof users> = {}
  users.forEach((user) => {
    if (!roleGroups[user.role]) {
      roleGroups[user.role] = []
    }
    roleGroups[user.role].push(user)
  })

  Object.keys(roleGroups).forEach((role) => {
    console.log(`\n🎯 ${role.replace('_', ' ')} (${roleGroups[role].length})`)
    console.log('─'.repeat(80))

    roleGroups[role].forEach((user) => {
      const verified = user.emailVerified ? '✅' : '❌'
      const rate = user.hourlyRate ? `$${user.hourlyRate}/hr` : 'N/A'
      console.log(`${verified} ${user.name?.padEnd(25)} | ${user.email.padEnd(40)} | ${rate}`)
    })
  })

  console.log('\n' + '─'.repeat(80))
  console.log(`📋 Total Users: ${users.length}`)
  console.log('─'.repeat(80))
  console.log('')

  // Check for missing expected users
  const expectedEmails = [
    'sumitmalhotra@zyphextech.com',
    'ishaangarg@zyphextech.com',
    'support@zyphextech.com',
    'prabudhpandey@zyphextech.com',
    'arihantjain@zyphextech.com',
    'abhilashatoriye@zyphextech.com',
    'abhinavsharma@zyphextech.com',
    'japleenkaur@zyphextech.com',
    'ishitajain@zyphextech.com',
    'rohittanwar@zyphextech.com',
  ]

  const existingEmails = users.map((u) => u.email)
  const missingUsers = expectedEmails.filter((email) => !existingEmails.includes(email))

  if (missingUsers.length > 0) {
    console.log('⚠️  Missing Users:')
    missingUsers.forEach((email) => {
      console.log(`   ❌ ${email}`)
    })
    console.log('')
  } else {
    console.log('✅ All expected users are present!\n')
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

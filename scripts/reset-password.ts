/**
 * Reset User Password Script
 * Allows resetting password for any user
 * 
 * Usage: npx ts-node scripts/reset-password.ts <email> <new-password>
 * Example: npx ts-node scripts/reset-password.ts sumitmalhotra@zyphextech.com NewPassword123
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const args = process.argv.slice(2)

  if (args.length < 2) {
    console.log('❌ Usage: npx ts-node scripts/reset-password.ts <email> <new-password>')
    console.log('Example: npx ts-node scripts/reset-password.ts sumitmalhotra@zyphextech.com NewPassword123')
    process.exit(1)
  }

  const [email, newPassword] = args

  console.log(`🔐 Resetting password for: ${email}`)

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, role: true },
  })

  if (!user) {
    console.log(`❌ User not found: ${email}`)
    process.exit(1)
  }

  console.log(`\n📋 User Details:`)
  console.log(`   Name: ${user.name}`)
  console.log(`   Email: ${user.email}`)
  console.log(`   Role: ${user.role}`)

  // Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 12)

  // Update password
  await prisma.user.update({
    where: { email },
    data: {
      password: hashedPassword,
      emailVerified: new Date(), // Ensure email is verified
    },
  })

  console.log(`\n✅ Password reset successfully!`)
  console.log(`\n🔑 New Credentials:`)
  console.log(`   Email: ${email}`)
  console.log(`   Password: ${newPassword}`)
  console.log(`\n⚠️  Please share these credentials securely and ask the user to change their password after first login.\n`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

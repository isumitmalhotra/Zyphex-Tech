import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding messaging system...')

  try {
    // First, ensure we have a system user
    let systemUser = await prisma.user.findFirst({
      where: { email: 'system@zyphextech.com' }
    })

    if (!systemUser) {
      systemUser = await prisma.user.create({
        data: {
          id: 'system-user',
          email: 'system@zyphextech.com',
          name: 'System',
          role: 'ADMIN',
          emailVerified: new Date()
        }
      })
      console.log('✅ Created system user')
    }

    // Create general team channel
    const generalChannel = await prisma.channel.upsert({
      where: { id: 'general-team-channel' },
      update: {},
      create: {
        id: 'general-team-channel',
        name: 'General',
        description: 'General team discussions and announcements',
        type: 'TEAM',
        isPrivate: false,
        createdById: systemUser.id
      }
    })

    // Create development team channel
    const devChannel = await prisma.channel.upsert({
      where: { id: 'dev-team-channel' },
      update: {},
      create: {
        id: 'dev-team-channel',
        name: 'Development',
        description: 'Development team discussions and technical updates',
        type: 'TEAM',
        isPrivate: false,
        createdById: systemUser.id
      }
    })

    console.log('✅ Created channels:', {
      general: generalChannel.name,
      development: devChannel.name
    })

    // Create a welcome message in general channel
    await prisma.message.create({
      data: {
        content: 'Welcome to the ZyphexTech messaging system! 🎉 This is the general team channel for discussions and announcements.',
        channelId: generalChannel.id,
        senderId: systemUser.id,
        messageType: 'SYSTEM'
      }
    })

    // Create a welcome message in dev channel
    await prisma.message.create({
      data: {
        content: 'Welcome to the Development channel! 💻 This is where our development team collaborates on technical discussions.',
        channelId: devChannel.id,
        senderId: systemUser.id,
        messageType: 'SYSTEM'
      }
    })

    console.log('✅ Created welcome messages')
    console.log('🎉 Messaging system seeding completed successfully!')

  } catch (error) {
    console.error('❌ Error seeding messaging system:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
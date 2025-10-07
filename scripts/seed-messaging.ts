import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedMessagingChannels() {
  try {
    console.log('🌱 Seeding messaging channels...')

    // Get the first admin user to be the creator
    const adminUser = await prisma.user.findFirst({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN'] }
      }
    })

    if (!adminUser) {
      console.log('❌ No admin user found. Please create an admin user first.')
      return
    }

    // Get all team members and admins for team channels
    const teamMembers = await prisma.user.findMany({
      where: {
        role: { in: ['TEAM_MEMBER', 'PROJECT_MANAGER', 'ADMIN', 'SUPER_ADMIN'] }
      }
    })

    // Create general team channel
    const generalChannel = await prisma.channel.upsert({
      where: {
        id: 'general-team-channel' // Use a fixed ID for general channel
      },
      create: {
        id: 'general-team-channel',
        name: 'general',
        description: 'General team discussions',
        type: 'TEAM',
        isPrivate: false,
        createdById: adminUser.id,
        members: {
          connect: teamMembers.map(user => ({ id: user.id }))
        }
      },
      update: {},
      include: {
        members: true
      }
    })

    console.log(`✅ Created general team channel with ${generalChannel.members.length} members`)

    // Create development team channel
    const devChannel = await prisma.channel.upsert({
      where: {
        name_projectId: {
          name: 'development',
          projectId: ''
        }
      },
      create: {
        name: 'development',
        description: 'Development team discussions and updates',
        type: 'TEAM',
        isPrivate: false,
        createdById: adminUser.id,
        members: {
          connect: teamMembers.filter(user => 
            ['TEAM_MEMBER', 'PROJECT_MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)
          ).map(user => ({ id: user.id }))
        }
      },
      update: {},
      include: {
        members: true
      }
    })

    console.log(`✅ Created development team channel with ${devChannel.members?.length || 0} members`)

    // Create project-specific channels for existing projects
    const projects = await prisma.project.findMany({
      include: {
        users: true,
        manager: true,
        client: true
      }
    })

    for (const project of projects) {
      // Get all project members (team + client)
      const projectMembers = [
        ...project.users,
        ...(project.manager ? [project.manager] : [])
      ]

      // Create project channel
      const projectChannel = await prisma.channel.upsert({
        where: {
          name_projectId: {
            name: `project-${project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            projectId: project.id
          }
        },
        create: {
          name: `project-${project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          description: `Project discussions for ${project.name}`,
          type: 'PROJECT',
          isPrivate: false,
          projectId: project.id,
          createdById: adminUser.id,
          members: {
            connect: projectMembers.map(user => ({ id: user.id }))
          }
        },
        update: {},
        include: {
          members: true
        }
      })

      console.log(`✅ Created project channel for "${project.name}" with ${projectChannel.members.length} members`)
    }

    // Create welcome messages for channels
    const welcomeMessages = [
      {
        channelId: generalChannel.id,
        content: "Welcome to the ZyphexTech team! This is our general discussion channel. Feel free to share updates, ask questions, or just chat with the team."
      },
      {
        channelId: devChannel.id,
        content: "Welcome to the development team channel! This is where we discuss technical topics, share code updates, and coordinate development work."
      }
    ]

    for (const msgData of welcomeMessages) {
      await prisma.message.create({
        data: {
          content: msgData.content,
          messageType: 'SYSTEM',
          senderId: adminUser.id,
          channelId: msgData.channelId
        }
      })
    }

    console.log('✅ Created welcome messages')

    console.log('🎉 Messaging channels seeded successfully!')

  } catch (error) {
    console.error('❌ Error seeding messaging channels:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed function
seedMessagingChannels()
  .catch(console.error)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSampleProjects() {
  try {
    console.log('🔍 Finding users...')
    
    // Get all users to add projects to
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      }
    })

    if (users.length === 0) {
      console.log('❌ No users found. Please create a user first.')
      return
    }

    console.log(`📋 Found ${users.length} users`)

    // Create sample clients first
    console.log('🏢 Creating sample clients...')
    
    const clients = await Promise.all([
      prisma.client.upsert({
        where: { email: 'contact@techcorp.com' },
        update: {},
        create: {
          name: 'TechCorp Solutions',
          email: 'contact@techcorp.com',
          phone: '+1-555-0123',
          address: '123 Business Ave, Tech City, TC 12345'
        }
      }),
      prisma.client.upsert({
        where: { email: 'info@startupventures.com' },
        update: {},
        create: {
          name: 'Startup Ventures LLC',
          email: 'info@startupventures.com',
          phone: '+1-555-0456',
          address: '456 Innovation St, Startup Valley, SV 67890'
        }
      }),
      prisma.client.upsert({
        where: { email: 'projects@globalenterprises.com' },
        update: {},
        create: {
          name: 'Global Enterprises Inc',
          email: 'projects@globalenterprises.com',
          phone: '+1-555-0789',
          address: '789 Corporate Blvd, Metro City, MC 54321'
        }
      })
    ])

    console.log(`✅ Created ${clients.length} clients`)

    // Create sample projects for each user
    for (const user of users) {
      console.log(`📝 Creating projects for ${user.name} (${user.email})...`)

      const projects = [
        {
          name: 'E-commerce Platform Development',
          description: 'Complete e-commerce solution with payment integration, inventory management, and customer portal.',
          status: 'IN_PROGRESS' as const,
          budget: 15000,
          startDate: new Date('2024-10-01'),
          endDate: new Date('2024-12-31'),
          clientId: clients[0].id,
          users: {
            connect: [{ id: user.id }]
          }
        },
        {
          name: 'Mobile App Development',
          description: 'Cross-platform mobile application for iOS and Android with real-time features.',
          status: 'REVIEW' as const,
          budget: 25000,
          startDate: new Date('2024-09-15'),
          endDate: new Date('2025-01-15'),
          clientId: clients[1].id,
          users: {
            connect: [{ id: user.id }]
          }
        },
        {
          name: 'Corporate Website Redesign',
          description: 'Modern, responsive website redesign with CMS integration and SEO optimization.',
          status: 'PLANNING' as const,
          budget: 8000,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-03-31'),
          clientId: clients[2].id,
          users: {
            connect: [{ id: user.id }]
          }
        },
        {
          name: 'API Integration Project',
          description: 'Integration of third-party APIs and development of custom REST endpoints.',
          status: 'COMPLETED' as const,
          budget: 5000,
          startDate: new Date('2024-08-01'),
          endDate: new Date('2024-09-30'),
          clientId: clients[0].id,
          users: {
            connect: [{ id: user.id }]
          }
        }
      ]

      for (const projectData of projects) {
        try {
          const project = await prisma.project.create({
            data: projectData,
            include: {
              client: true,
              users: true
            }
          })
          
          console.log(`  ✅ Created project: ${project.name}`)
        } catch (error) {
          console.log(`  ❌ Error creating project ${projectData.name}:`, error)
        }
      }
    }

    console.log('🎉 Sample projects created successfully!')
    
    // Show summary
    const totalProjects = await prisma.project.count()
    const totalClients = await prisma.client.count()
    
    console.log(`\n📊 Database Summary:`)
    console.log(`  👥 Users: ${users.length}`)
    console.log(`  🏢 Clients: ${totalClients}`)
    console.log(`  📋 Projects: ${totalProjects}`)

  } catch (error) {
    console.error('❌ Error creating sample projects:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSampleProjects()
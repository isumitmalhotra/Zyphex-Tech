import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createSampleData() {
  try {
    // First, let's get a user to work with
    const user = await prisma.user.findFirst()
    if (!user) {
      console.log('No users found. Please create a user first.')
      return
    }

    console.log('Found user:', user.email)

    // Find or create a client
    let client = await prisma.client.findFirst()
    if (!client) {
      client = await prisma.client.create({
        data: {
          name: 'Sample Client',
          email: 'client@example.com',
          company: 'Sample Company Inc.'
        }
      })
      console.log('Created client:', client.name)
    }

    // Find or create a project
    let project = await prisma.project.findFirst({
      where: {
        users: {
          some: { id: user.id }
        }
      }
    })

    if (!project) {
      project = await prisma.project.create({
        data: {
          name: 'Sample E-commerce Platform',
          description: 'Building a modern e-commerce platform with React and Node.js',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          clientId: client.id,
          budget: 25000.00,
          estimatedHours: 200,
          users: {
            connect: [{ id: user.id }]
          }
        }
      })
      console.log('Created project:', project.name)
    }

    // Create some sample tasks
    const taskExists = await prisma.task.findFirst({
      where: { projectId: project.id }
    })

    if (!taskExists) {
      const tasks = await prisma.task.createMany({
        data: [
          {
            title: 'Setup Project Architecture',
            description: 'Initialize the project structure with Next.js and set up the basic architecture',
            status: 'DONE' as const,
            priority: 'HIGH' as const,
            projectId: project.id,
            assigneeId: user.id,
            createdBy: user.id,
            estimatedHours: 8,
            actualHours: 6,
            completedAt: new Date('2024-09-20'),
            tags: '["setup", "architecture"]'
          },
          {
            title: 'Design Database Schema',
            description: 'Create comprehensive database schema for the e-commerce platform',
            status: 'DONE' as const,
            priority: 'HIGH' as const,
            projectId: project.id,
            assigneeId: user.id,
            createdBy: user.id,
            estimatedHours: 12,
            actualHours: 10,
            completedAt: new Date('2024-09-22'),
            tags: '["database", "design"]'
          },
          {
            title: 'Implement User Authentication',
            description: 'Set up user authentication system with NextAuth.js and social login',
            status: 'IN_PROGRESS',
            priority: 'HIGH',
            projectId: project.id,
            assigneeId: user.id,
            createdBy: user.id,
            estimatedHours: 16,
            actualHours: 8,
            dueDate: new Date('2024-10-05'),
            tags: '["auth", "security"]'
          },
          {
            title: 'Build Product Catalog API',
            description: 'Create REST API endpoints for product management and catalog browsing',
            status: 'TODO',
            priority: 'MEDIUM',
            projectId: project.id,
            assigneeId: user.id,
            createdBy: user.id,
            estimatedHours: 20,
            dueDate: new Date('2024-10-15'),
            tags: '["api", "products"]'
          },
          {
            title: 'Design Shopping Cart System',
            description: 'Implement shopping cart functionality with Redis for session management',
            status: 'TODO',
            priority: 'MEDIUM',
            projectId: project.id,
            assigneeId: user.id,
            createdBy: user.id,
            estimatedHours: 14,
            dueDate: new Date('2024-10-20'),
            tags: '["cart", "redis"]'
          }
        ]
      })
      console.log('Created', tasks.count, 'sample tasks')
    }

    // Create a sample invoice
    const invoiceExists = await prisma.invoice.findFirst({
      where: { projectId: project.id }
    })

    if (!invoiceExists) {
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: 'INV-2024-001',
          amount: 5000.00,
          total: 5000.00,
          status: 'SENT',
          dueDate: new Date('2024-10-30'),
          lineItems: '[{"description": "Development Phase 1", "quantity": 1, "rate": 5000.00, "amount": 5000.00}]',
          clientId: client.id,
          projectId: project.id
        }
      })
      console.log('Created invoice:', invoice.invoiceNumber)
    }

    // Create a sample message
    const messageExists = await prisma.message.findFirst({
      where: { receiverId: user.id }
    })

    if (!messageExists) {
      const message = await prisma.message.create({
        data: {
          subject: 'Project Milestone Update',
          content: 'Great progress on the authentication system! The user login and registration are working perfectly. Next up is the product catalog API.',
          senderId: user.id,
          receiverId: user.id,
          projectId: project.id,
          readAt: null
        }
      })
      console.log('Created message:', message.subject)
    }

    // Create a sample document
    const documentExists = await prisma.document.findFirst({
      where: { projectId: project.id }
    })

    if (!documentExists) {
      const document = await prisma.document.create({
        data: {
          filename: 'project-requirements.pdf',
          originalName: 'Project Requirements Specification.pdf',
          filePath: '/documents/project-requirements.pdf',
          mimeType: 'application/pdf',
          fileSize: 2456789,
          description: 'Detailed requirements specification for the e-commerce platform',
          category: 'requirements',
          projectId: project.id,
          userId: user.id
        }
      })
      console.log('Created document:', document.originalName)
    }

    console.log('Sample data creation completed!')

  } catch (error) {
    console.error('Error creating sample data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSampleData()
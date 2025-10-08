import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/**
 * Test Data Factory - Create test data for various entities
 */

export const testDataFactory = {
  /**
   * Create a test user
   */
  async createUser(overrides: Partial<any> = {}) {
    const hashedPassword = await bcrypt.hash('testpassword123', 12)
    
    return prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        password: hashedPassword,
        role: 'USER',
        emailVerified: new Date(),
        ...overrides,
      },
    })
  },

  /**
   * Create a test admin user
   */
  async createAdmin(overrides: Partial<any> = {}) {
    return this.createUser({
      role: 'ADMIN',
      name: 'Test Admin',
      ...overrides,
    })
  },

  /**
   * Create a test project manager
   */
  async createProjectManager(overrides: Partial<any> = {}) {
    return this.createUser({
      role: 'PROJECT_MANAGER',
      name: 'Test Manager',
      ...overrides,
    })
  },

  /**
   * Create a test client
   */
  async createClient(overrides: Partial<any> = {}) {
    return prisma.client.create({
      data: {
        name: `Test Client ${Date.now()}`,
        email: `client-${Date.now()}@example.com`,
        phone: '+1234567890',
        company: 'Test Company',
        website: 'https://test.com',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        country: 'USA',
        postalCode: '12345',
        ...overrides,
      },
    })
  },

  /**
   * Create a test project
   */
  async createProject(clientId: string, managerId: string, overrides: Partial<any> = {}) {
    return prisma.project.create({
      data: {
        name: `Test Project ${Date.now()}`,
        description: 'Test project description',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        clientId,
        managerId,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        budget: 50000,
        spent: 10000,
        progress: 25,
        ...overrides,
      },
    })
  },

  /**
   * Create a test task
   */
  async createTask(projectId: string, createdById: string, overrides: Partial<any> = {}) {
    return prisma.task.create({
      data: {
        title: `Test Task ${Date.now()}`,
        description: 'Test task description',
        status: 'TODO',
        priority: 'MEDIUM',
        projectId,
        createdBy: createdById,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        estimatedHours: 8,
        ...overrides,
      },
    })
  },

  /**
   * Create a test invoice
   */
  async createInvoice(clientId: string, projectId: string, overrides: Partial<any> = {}) {
    const invoiceNumber = `INV-${Date.now()}`
    
    return prisma.invoice.create({
      data: {
        invoiceNumber,
        clientId,
        projectId,
        status: 'DRAFT',
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        subtotal: 5000,
        tax: 500,
        total: 5500,
        items: [
          {
            description: 'Development Services',
            quantity: 40,
            rate: 125,
            amount: 5000,
          },
        ],
        ...overrides,
      },
    })
  },

  /**
   * Create a test team
   */
  async createTeam(overrides: Partial<any> = {}) {
    return prisma.team.create({
      data: {
        name: `Test Team ${Date.now()}`,
        description: 'Test team description',
        ...overrides,
      },
    })
  },

  /**
   * Create a test time entry
   */
  async createTimeEntry(userId: string, projectId: string, overrides: Partial<any> = {}) {
    return prisma.timeEntry.create({
      data: {
        userId,
        projectId,
        date: new Date(),
        hours: 8,
        description: 'Test time entry',
        billable: true,
        status: 'APPROVED',
        ...overrides,
      },
    })
  },

  /**
   * Create a test lead
   */
  async createLead(overrides: Partial<any> = {}) {
    return prisma.lead.create({
      data: {
        name: `Test Lead ${Date.now()}`,
        email: `lead-${Date.now()}@example.com`,
        phone: '+1234567890',
        company: 'Test Company',
        status: 'NEW',
        source: 'WEBSITE',
        qualificationScore: 50,
        ...overrides,
      },
    })
  },

  /**
   * Create a test report template
   */
  async createReportTemplate(createdById: string, overrides: Partial<any> = {}) {
    return prisma.reportTemplate.create({
      data: {
        name: `Test Report Template ${Date.now()}`,
        description: 'Test report template',
        category: 'PROJECTS',
        type: 'PROJECT_STATUS',
        isBuiltIn: false,
        isActive: true,
        config: {},
        layout: {},
        createdBy: createdById,
        ...overrides,
      },
    })
  },
}

/**
 * Clean up test data
 */
export const cleanupTestData = async () => {
  // Delete in reverse order of dependencies
  await prisma.timeEntry.deleteMany({})
  await prisma.taskDependency.deleteMany({})
  await prisma.task.deleteMany({})
  await prisma.payment.deleteMany({})
  await prisma.lateFee.deleteMany({})
  await prisma.invoice.deleteMany({})
  await prisma.expense.deleteMany({})
  await prisma.projectDocument.deleteMany({})
  await prisma.projectMilestone.deleteMany({})
  await prisma.projectRisk.deleteMany({})
  await prisma.projectCommunication.deleteMany({})
  await prisma.projectBudgetItem.deleteMany({})
  await prisma.changeRequest.deleteMany({})
  await prisma.resourceAllocation.deleteMany({})
  await prisma.teamMember.deleteMany({})
  await prisma.report.deleteMany({})
  await prisma.reportSchedule.deleteMany({})
  await prisma.reportCache.deleteMany({})
  await prisma.reportTemplate.deleteMany({ where: { isBuiltIn: false } })
  await prisma.project.deleteMany({})
  await prisma.team.deleteMany({})
  await prisma.contactLog.deleteMany({})
  await prisma.leadActivity.deleteMany({})
  await prisma.deal.deleteMany({})
  await prisma.lead.deleteMany({})
  await prisma.client.deleteMany({})
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: 'test-',
      },
    },
  })
}

/**
 * Disconnect Prisma client
 */
export const disconnectPrisma = async () => {
  await prisma.$disconnect()
}

export { prisma }

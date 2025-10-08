/**
 * API Route Tests - Report Generation
 */
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/reports/generate/route'
import { prisma, testDataFactory, cleanupTestData } from '@/lib/test-utils/factory'
import { mockAuthenticatedSession, mockUnauthenticatedSession } from '@/lib/test-utils/auth-helpers'

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

describe('/api/reports/generate', () => {
  let testManager: any
  let testClient: any
  let testProject: any

  beforeAll(async () => {
    // Create test data
    testManager = await testDataFactory.createProjectManager()
    testClient = await testDataFactory.createClient()
    testProject = await testDataFactory.createProject(testClient.id, testManager.id)
  })

  afterAll(async () => {
    await cleanupTestData()
    await prisma.$disconnect()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/reports/generate', () => {
    it('requires authentication', async () => {
      mockUnauthenticatedSession()

      const request = new NextRequest('http://localhost:3000/api/reports/generate', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Report',
          type: 'PROJECT_STATUS',
          category: 'PROJECTS',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('requires PROJECT_MANAGER or ADMIN role', async () => {
      mockAuthenticatedSession('USER')

      const request = new NextRequest('http://localhost:3000/api/reports/generate', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Report',
          type: 'PROJECT_STATUS',
          category: 'PROJECTS',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(403)
    })

    it('validates required fields', async () => {
      mockAuthenticatedSession('PROJECT_MANAGER')

      const request = new NextRequest('http://localhost:3000/api/reports/generate', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBeDefined()
    })

    it('generates project status report successfully', async () => {
      mockAuthenticatedSession('PROJECT_MANAGER')

      const reportData = {
        name: 'Monthly Project Status',
        description: 'Test project status report',
        type: 'PROJECT_STATUS',
        category: 'PROJECTS',
        config: {
          filters: [],
          dateRange: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            end: new Date().toISOString(),
          },
        },
      }

      const request = new NextRequest('http://localhost:3000/api/reports/generate', {
        method: 'POST',
        body: JSON.stringify(reportData),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.report).toBeDefined()
      expect(data.report.name).toBe(reportData.name)
      expect(data.report.type).toBe(reportData.type)
      expect(data.report.status).toBeDefined()
    }, 10000) // Increase timeout for report generation

    it('caches report data', async () => {
      mockAuthenticatedSession('PROJECT_MANAGER')

      const reportConfig = {
        name: 'Cached Report Test',
        type: 'PROJECT_STATUS',
        category: 'PROJECTS',
        config: {
          filters: [],
        },
      }

      // First generation
      const request1 = new NextRequest('http://localhost:3000/api/reports/generate', {
        method: 'POST',
        body: JSON.stringify(reportConfig),
      })
      const response1 = await POST(request1)
      const data1 = await response1.json()

      // Second generation (should use cache)
      const request2 = new NextRequest('http://localhost:3000/api/reports/generate', {
        method: 'POST',
        body: JSON.stringify(reportConfig),
      })
      const response2 = await POST(request2)
      const data2 = await response2.json()

      expect(data2.cached).toBe(true)
    }, 15000)

    it('validates report type is valid', async () => {
      mockAuthenticatedSession('PROJECT_MANAGER')

      const request = new NextRequest('http://localhost:3000/api/reports/generate', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Invalid Report',
          type: 'INVALID_TYPE',
          category: 'PROJECTS',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toMatch(/type/i)
    })

    it('validates date range format', async () => {
      mockAuthenticatedSession('PROJECT_MANAGER')

      const request = new NextRequest('http://localhost:3000/api/reports/generate', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Report',
          type: 'PROJECT_STATUS',
          category: 'PROJECTS',
          config: {
            dateRange: {
              start: 'invalid-date',
              end: new Date().toISOString(),
            },
          },
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('generates revenue report with financial data', async () => {
      mockAuthenticatedSession('PROJECT_MANAGER')

      // Create test invoice
      const invoice = await testDataFactory.createInvoice(testClient.id, testProject.id, {
        status: 'PAID',
      })

      const request = new NextRequest('http://localhost:3000/api/reports/generate', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Revenue Report',
          type: 'REVENUE_BY_PROJECT',
          category: 'FINANCIAL',
          config: {},
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.report).toBeDefined()
      expect(data.report.type).toBe('REVENUE_BY_PROJECT')

      // Clean up
      await prisma.invoice.delete({ where: { id: invoice.id } })
    }, 10000)

    it('handles errors gracefully', async () => {
      mockAuthenticatedSession('PROJECT_MANAGER')

      // Mock database error
      jest.spyOn(prisma.project, 'findMany').mockRejectedValueOnce(
        new Error('Database connection failed')
      )

      const request = new NextRequest('http://localhost:3000/api/reports/generate', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Error Test Report',
          type: 'PROJECT_STATUS',
          category: 'PROJECTS',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBeDefined()
    })
  })
})

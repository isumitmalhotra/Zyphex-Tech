/**
 * API Route Tests - Projects
 */
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/projects/route'
import { prisma, testDataFactory, cleanupTestData } from '@/lib/test-utils/factory'
import { mockAuthenticatedSession, mockUnauthenticatedSession } from '@/lib/test-utils/auth-helpers'

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

describe('/api/projects', () => {
  let testUser: any
  let testClient: any
  let testManager: any

  beforeAll(async () => {
    // Create test data
    testManager = await testDataFactory.createProjectManager()
    testUser = await testDataFactory.createUser()
    testClient = await testDataFactory.createClient()
  })

  afterAll(async () => {
    await cleanupTestData()
    await prisma.$disconnect()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/projects', () => {
    it('requires authentication', async () => {
      mockUnauthenticatedSession()

      const request = new NextRequest('http://localhost:3000/api/projects')
      const response = await GET(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBeDefined()
    })

    it('returns list of projects for authenticated user', async () => {
      mockAuthenticatedSession('PROJECT_MANAGER')

      // Create test projects
      const project1 = await testDataFactory.createProject(
        testClient.id,
        testManager.id,
        { name: 'Project Alpha' }
      )
      const project2 = await testDataFactory.createProject(
        testClient.id,
        testManager.id,
        { name: 'Project Beta' }
      )

      const request = new NextRequest('http://localhost:3000/api/projects')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.projects).toBeDefined()
      expect(Array.isArray(data.projects)).toBe(true)
      expect(data.projects.length).toBeGreaterThanOrEqual(2)

      // Clean up
      await prisma.project.delete({ where: { id: project1.id } })
      await prisma.project.delete({ where: { id: project2.id } })
    })

    it('filters projects by status', async () => {
      mockAuthenticatedSession('PROJECT_MANAGER')

      const activeProject = await testDataFactory.createProject(
        testClient.id,
        testManager.id,
        { name: 'Active Project', status: 'IN_PROGRESS' }
      )
      const completedProject = await testDataFactory.createProject(
        testClient.id,
        testManager.id,
        { name: 'Completed Project', status: 'COMPLETED' }
      )

      const request = new NextRequest(
        'http://localhost:3000/api/projects?status=IN_PROGRESS'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.projects.every((p: any) => p.status === 'IN_PROGRESS')).toBe(true)

      // Clean up
      await prisma.project.delete({ where: { id: activeProject.id } })
      await prisma.project.delete({ where: { id: completedProject.id } })
    })

    it('searches projects by name', async () => {
      mockAuthenticatedSession('PROJECT_MANAGER')

      const project = await testDataFactory.createProject(
        testClient.id,
        testManager.id,
        { name: 'Unique Search Term Project' }
      )

      const request = new NextRequest(
        'http://localhost:3000/api/projects?search=Unique+Search+Term'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.projects.some((p: any) => p.name.includes('Unique Search Term'))).toBe(true)

      // Clean up
      await prisma.project.delete({ where: { id: project.id } })
    })

    it('paginates results', async () => {
      mockAuthenticatedSession('PROJECT_MANAGER')

      const request = new NextRequest(
        'http://localhost:3000/api/projects?page=1&pageSize=10'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.projects.length).toBeLessThanOrEqual(10)
      expect(data.pagination).toBeDefined()
      expect(data.pagination.page).toBe(1)
      expect(data.pagination.pageSize).toBe(10)
    })
  })

  describe('POST /api/projects', () => {
    it('requires authentication', async () => {
      mockUnauthenticatedSession()

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Project',
          clientId: testClient.id,
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('requires PROJECT_MANAGER or ADMIN role', async () => {
      mockAuthenticatedSession('USER')

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Project',
          clientId: testClient.id,
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toMatch(/permission/i)
    })

    it('validates required fields', async () => {
      mockAuthenticatedSession('PROJECT_MANAGER')

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBeDefined()
    })

    it('creates a new project successfully', async () => {
      mockAuthenticatedSession('PROJECT_MANAGER')

      const projectData = {
        name: 'Test API Project',
        description: 'Created via API test',
        clientId: testClient.id,
        status: 'PLANNING',
        priority: 'HIGH',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        budget: 75000,
      }

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify(projectData),
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.project).toBeDefined()
      expect(data.project.name).toBe(projectData.name)
      expect(data.project.clientId).toBe(testClient.id)

      // Clean up
      if (data.project?.id) {
        await prisma.project.delete({ where: { id: data.project.id } })
      }
    })

    it('validates budget is positive', async () => {
      mockAuthenticatedSession('PROJECT_MANAGER')

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Project',
          clientId: testClient.id,
          budget: -1000,
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toMatch(/budget/i)
    })

    it('validates end date is after start date', async () => {
      mockAuthenticatedSession('PROJECT_MANAGER')

      const startDate = new Date()
      const endDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Project',
          clientId: testClient.id,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toMatch(/end date/i)
    })

    it('validates client exists', async () => {
      mockAuthenticatedSession('PROJECT_MANAGER')

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Project',
          clientId: 'non-existent-id',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toMatch(/client/i)
    })
  })
})

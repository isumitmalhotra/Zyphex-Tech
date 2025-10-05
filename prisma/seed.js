const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')
  
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  // Create Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@zyphextech.com' },
    update: {},
    create: {
      email: 'admin@zyphextech.com',
      name: 'System Administrator',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      emailVerified: new Date()
    }
  })
  
  // Create Project Manager
  const projectManager = await prisma.user.upsert({
    where: { email: 'manager@zyphextech.com' },
    update: {},
    create: {
      email: 'manager@zyphextech.com',
      name: 'Sarah Johnson',
      password: hashedPassword,
      role: 'PROJECT_MANAGER',
      emailVerified: new Date(),
      hourlyRate: 125.0
    }
  })
  
  // Create Developer
  const developer = await prisma.user.upsert({
    where: { email: 'developer@zyphextech.com' },
    update: {},
    create: {
      email: 'developer@zyphextech.com',
      name: 'Michael Chen',
      password: hashedPassword,
      role: 'TEAM_MEMBER',
      emailVerified: new Date(),
      hourlyRate: 95.0
    }
  })
  
  // Create Test Client
  const testClient = await prisma.client.upsert({
    where: { email: 'client@testcorp.com' },
    update: {},
    create: {
      name: 'Test Corporation',
      email: 'client@testcorp.com',
      phone: '+1-555-0123',
      company: 'Test Corp Inc.'
    }
  })
  
  // Create Test Project (use create since no unique field)
  const testProject = await prisma.project.create({
    data: {
      name: 'Test Project',
      description: 'A test project for development',
      clientId: testClient.id,
      managerId: projectManager.id,
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      methodology: 'AGILE',
      budget: 50000,
      budgetUsed: 15000,
      hourlyRate: 100,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      estimatedHours: 500,
      actualHours: 150,
      completionRate: 30,
      users: {
        connect: [{ id: developer.id }]
      }
    }
  })
  
  console.log('✅ Database seeded successfully!')
  console.log('🔑 Login: admin@zyphextech.com / admin123')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
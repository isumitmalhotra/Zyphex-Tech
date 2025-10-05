import { PrismaClient } from '@prisma/client'import { PrismaClient } from '@prisma/client'import { PrismaClient } from '@prisma/client'import { PrismaClient } from "@prisma/client"

import { hash } from 'bcryptjs'

import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

const DEFAULT_PASSWORD = 'admin123'import bcrypt from 'bcryptjs'import { Permission, DefaultRolePermissions, PermissionDescriptions } from "../lib/auth/permissions"



async function main() {const prisma = new PrismaClient()

  console.log('🌱 Starting database seeding...')

  import { hash } from "bcryptjs"

  // Hash password for all users

  const hashedPassword = await hash(DEFAULT_PASSWORD, 12)const DEFAULT_PASSWORD = 'admin123'

  

  console.log('👥 Creating users...')const prisma = new PrismaClient()

  

  // Create Super Adminasync function main() {

  const superAdmin = await prisma.user.upsert({

    where: { email: 'admin@zyphextech.com' },  console.log('🌱 Starting database seeding...')const prisma = new PrismaClient()

    update: {},

    create: {

      email: 'admin@zyphextech.com',

      name: 'System Administrator',  // Hash password for all usersasync function main() {

      password: hashedPassword,

      role: 'SUPER_ADMIN',  const hashedPassword = await hash(DEFAULT_PASSWORD, 12)

      emailVerified: new Date(),

      isActive: true,  console.log('🌱 Starting database seeding...')// Default password for all test users

      phone: '+1-555-0001',

      timezone: 'America/New_York',  console.log('👥 Creating users...')

      experienceLevel: 'SENIOR'

    }const DEFAULT_PASSWORD = "password123"

  })

    // Create Super Admin

  // Create Project Manager

  const projectManager = await prisma.user.upsert({  const superAdmin = await prisma.user.upsert({  // Create super admin user

    where: { email: 'manager@zyphextech.com' },

    update: {},    where: { email: 'admin@zyphextech.com' },

    create: {

      email: 'manager@zyphextech.com',    update: {},  const hashedPassword = await bcrypt.hash('admin123', 12)async function main() {

      name: 'Sarah Johnson',

      password: hashedPassword,    create: {

      role: 'PROJECT_MANAGER',

      emailVerified: new Date(),      email: 'admin@zyphextech.com',    console.log("🌱 Starting RBAC seed...")

      isActive: true,

      phone: '+1-555-0002',      name: 'System Administrator',

      skills: JSON.stringify(['Project Management', 'Agile', 'Scrum', 'Team Leadership']),

      hourlyRate: 125.0,      password: hashedPassword,  const superAdmin = await prisma.user.upsert({  

      timezone: 'America/New_York',

      experienceLevel: 'SENIOR'      role: 'SUPER_ADMIN',

    }

  })      emailVerified: new Date(),    where: { email: 'admin@zyphextech.com' },  // Create all permissions in the database

  

  // Create Team Members      isActive: true,

  const developer1 = await prisma.user.upsert({

    where: { email: 'developer1@zyphextech.com' },      phone: '+1-555-0001',    update: {},  console.log("📝 Creating permissions...")

    update: {},

    create: {      timezone: 'America/New_York',

      email: 'developer1@zyphextech.com',

      name: 'Michael Chen',      experienceLevel: 'SENIOR'    create: {  const permissionPromises = Object.values(Permission).map(async (permission) => {

      password: hashedPassword,

      role: 'TEAM_MEMBER',    }

      emailVerified: new Date(),

      isActive: true,  })      email: 'admin@zyphextech.com',    return prisma.permission.upsert({

      skills: JSON.stringify(['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS']),

      hourlyRate: 95.0,

      timezone: 'America/Los_Angeles',

      phone: '+1-555-0003',  // Create Project Manager      name: 'System Administrator',      where: { name: permission },

      availability: 'FULL_TIME',

      experienceLevel: 'SENIOR'  const projectManager = await prisma.user.upsert({

    }

  })    where: { email: 'manager@zyphextech.com' },      password: hashedPassword,      update: {},

  

  const developer2 = await prisma.user.upsert({    update: {},

    where: { email: 'developer2@zyphextech.com' },

    update: {},    create: {      role: 'SUPER_ADMIN',      create: {

    create: {

      email: 'developer2@zyphextech.com',      email: 'manager@zyphextech.com',

      name: 'Emily Rodriguez',

      password: hashedPassword,      name: 'Sarah Johnson',      skills: JSON.stringify(['System Administration', 'Project Management', 'Database Design']),        name: permission,

      role: 'TEAM_MEMBER',

      emailVerified: new Date(),      password: hashedPassword,

      isActive: true,

      skills: JSON.stringify(['Vue.js', 'Python', 'Django', 'MongoDB', 'Docker']),      role: 'PROJECT_MANAGER',      hourlyRate: 150.0,        description: PermissionDescriptions[permission] || `Permission: ${permission}`,

      hourlyRate: 85.0,

      timezone: 'America/Chicago',      emailVerified: new Date(),

      phone: '+1-555-0004',

      availability: 'FULL_TIME',      isActive: true,      timezone: 'America/New_York',        category: getPermissionCategory(permission)

      experienceLevel: 'INTERMEDIATE'

    }      phone: '+1-555-0002',

  })

        skills: JSON.stringify(['Project Management', 'Agile', 'Scrum', 'Team Leadership']),      phone: '+1-555-0001',      }

  const designer = await prisma.user.upsert({

    where: { email: 'designer@zyphextech.com' },      hourlyRate: 125.0,

    update: {},

    create: {      timezone: 'America/New_York',      availability: 'FULL_TIME',    })

      email: 'designer@zyphextech.com',

      name: 'Alex Morgan',      experienceLevel: 'SENIOR'

      password: hashedPassword,

      role: 'TEAM_MEMBER',    }      experienceLevel: 'SENIOR'  })

      emailVerified: new Date(),

      isActive: true,  })

      skills: JSON.stringify(['UI/UX Design', 'Figma', 'Adobe Creative Suite', 'Prototyping']),

      hourlyRate: 75.0,    }  

      timezone: 'America/New_York',

      phone: '+1-555-0005',  // Create Team Members

      availability: 'FULL_TIME',

      experienceLevel: 'INTERMEDIATE'  const developer1 = await prisma.user.upsert({  })  const createdPermissions = await Promise.all(permissionPromises)

    }

  })    where: { email: 'developer1@zyphextech.com' },

  

  console.log('✅ Created users')    update: {},  console.log(`✅ Created ${createdPermissions.length} permissions`)

  

  console.log('🏢 Creating clients...')    create: {

  

  // Create Clients      email: 'developer1@zyphextech.com',  // Create team members  

  const techCorp = await prisma.client.upsert({

    where: { email: 'contact@techcorp.com' },      name: 'Michael Chen',

    update: {},

    create: {      password: hashedPassword,  const projectManager = await prisma.user.upsert({  // Create role-permission mappings

      name: 'TechCorp Solutions',

      email: 'contact@techcorp.com',      role: 'TEAM_MEMBER',

      phone: '+1-555-0123',

      address: '123 Tech Street, Silicon Valley, CA 94000',      emailVerified: new Date(),    where: { email: 'manager@zyphextech.com' },  console.log("🔐 Creating role-permission mappings...")

      company: 'TechCorp Solutions Inc.',

      website: 'https://techcorp.com',      isActive: true,

      timezone: 'America/New_York',

      industry: 'Technology'      skills: JSON.stringify(['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS']),    update: {},  for (const [role, permissions] of Object.entries(DefaultRolePermissions)) {

    }

  })      hourlyRate: 95.0,

  

  const retailPlus = await prisma.client.upsert({      timezone: 'America/Los_Angeles',    create: {    const rolePermissionPromises = permissions.map(async (permission) => {

    where: { email: 'info@retailplus.com' },

    update: {},      phone: '+1-555-0003',

    create: {

      name: 'RetailPlus Inc',      availability: 'FULL_TIME',      email: 'manager@zyphextech.com',      const permissionRecord = await prisma.permission.findUnique({

      email: 'info@retailplus.com',

      phone: '+1-555-0456',      experienceLevel: 'SENIOR'

      address: '456 Commerce Ave, Business District, NY 10001',

      company: 'RetailPlus Corporation',    }      name: 'Sarah Johnson',        where: { name: permission }

      website: 'https://retailplus.com',

      timezone: 'America/Los_Angeles',  })

      industry: 'Retail'

    }      password: hashedPassword,      })

  })

    const developer2 = await prisma.user.upsert({

  const healthFirst = await prisma.client.upsert({

    where: { email: 'contact@healthfirst.com' },    where: { email: 'developer2@zyphextech.com' },      role: 'PROJECT_MANAGER',      

    update: {},

    create: {    update: {},

      name: 'HealthFirst Medical',

      email: 'contact@healthfirst.com',    create: {      skills: JSON.stringify(['Project Management', 'Agile', 'Scrum', 'Team Leadership']),      if (permissionRecord) {

      phone: '+1-555-0789',

      address: '789 Medical Center Dr, Healthcare City, TX 73301',      email: 'developer2@zyphextech.com',

      company: 'HealthFirst Medical Group',

      website: 'https://healthfirst.com',      name: 'Emily Rodriguez',      hourlyRate: 125.0,        return prisma.rolePermission.upsert({

      timezone: 'America/Chicago',

      industry: 'Healthcare'      password: hashedPassword,

    }

  })      role: 'TEAM_MEMBER',      timezone: 'America/New_York',          where: {

  

  const eduTech = await prisma.client.upsert({      emailVerified: new Date(),

    where: { email: 'hello@edutech.com' },

    update: {},      isActive: true,      phone: '+1-555-0002',            role_permissionId: {

    create: {

      name: 'EduTech Innovations',      skills: JSON.stringify(['Vue.js', 'Python', 'Django', 'MongoDB', 'Docker']),

      email: 'hello@edutech.com',

      phone: '+1-555-0321',      hourlyRate: 85.0,      availability: 'FULL_TIME',              role: role as "SUPER_ADMIN" | "ADMIN" | "PROJECT_MANAGER" | "TEAM_MEMBER" | "CLIENT" | "USER",

      address: '321 Education Blvd, Learning District, CO 80202',

      company: 'EduTech Innovations LLC',      timezone: 'America/Chicago',

      website: 'https://edutech.com',

      timezone: 'America/Denver',      phone: '+1-555-0004',      experienceLevel: 'SENIOR'              permissionId: permissionRecord.id

      industry: 'Education'

    }      availability: 'FULL_TIME',

  })

        experienceLevel: 'INTERMEDIATE'    }            }

  console.log('✅ Created clients')

      }

  console.log('🚀 Creating projects...')

    })  })          },

  // Create Projects with realistic data

  const ecommerceProject = await prisma.project.upsert({

    where: { name: 'E-commerce Platform Development' },

    update: {},  const designer = await prisma.user.upsert({          update: {},

    create: {

      name: 'E-commerce Platform Development',    where: { email: 'designer@zyphextech.com' },

      description: 'Full-stack e-commerce solution with React, Node.js, and PostgreSQL. Features include user authentication, product catalog, shopping cart, payment processing, and admin dashboard.',

      clientId: techCorp.id,    update: {},  const teamMember1 = await prisma.user.upsert({          create: {

      managerId: projectManager.id,

      status: 'IN_PROGRESS',    create: {

      priority: 'HIGH',

      methodology: 'AGILE',      email: 'designer@zyphextech.com',    where: { email: 'developer1@zyphextech.com' },            role: role as "SUPER_ADMIN" | "ADMIN" | "PROJECT_MANAGER" | "TEAM_MEMBER" | "CLIENT" | "USER",

      budget: 85000,

      budgetUsed: 32000,      name: 'Alex Morgan',

      hourlyRate: 125,

      startDate: new Date('2024-09-01'),      password: hashedPassword,    update: {},            permissionId: permissionRecord.id

      endDate: new Date('2025-02-28'),

      estimatedHours: 680,      role: 'TEAM_MEMBER',

      actualHours: 256,

      completionRate: 38,      emailVerified: new Date(),    create: {          }

      users: {

        connect: [      isActive: true,

          { id: developer1.id },

          { id: developer2.id },      skills: JSON.stringify(['UI/UX Design', 'Figma', 'Adobe Creative Suite', 'Prototyping']),      email: 'developer1@zyphextech.com',        })

          { id: designer.id }

        ]      hourlyRate: 75.0,

      }

    }      timezone: 'America/New_York',      name: 'Michael Chen',      }

  })

        phone: '+1-555-0005',

  const mobileAppProject = await prisma.project.upsert({

    where: { name: 'Mobile App for Retail Management' },      availability: 'FULL_TIME',      password: hashedPassword,    })

    update: {},

    create: {      experienceLevel: 'INTERMEDIATE'

      name: 'Mobile App for Retail Management',

      description: 'Cross-platform mobile application for inventory management, sales tracking, and customer analytics.',    }      role: 'TEAM_MEMBER',    

      clientId: retailPlus.id,

      managerId: projectManager.id,  })

      status: 'PLANNING',

      priority: 'MEDIUM',      skills: JSON.stringify(['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS']),    await Promise.all(rolePermissionPromises)

      methodology: 'SCRUM',

      budget: 45000,  console.log('✅ Created users')

      budgetUsed: 8500,

      hourlyRate: 110,      hourlyRate: 95.0,    console.log(`✅ Assigned ${permissions.length} permissions to ${role}`)

      startDate: new Date('2024-11-01'),

      endDate: new Date('2025-04-30'),  console.log('🏢 Creating clients...')

      estimatedHours: 520,

      actualHours: 72,      timezone: 'America/Los_Angeles',  }

      completionRate: 14,

      users: {  // Create Clients

        connect: [

          { id: developer1.id },  const techCorp = await prisma.client.upsert({      phone: '+1-555-0003',  

          { id: designer.id }

        ]    where: { email: 'contact@techcorp.com' },

      }

    }    update: {},      availability: 'FULL_TIME',  // Create comprehensive test users for all roles

  })

      create: {

  const healthPortalProject = await prisma.project.upsert({

    where: { name: 'Patient Portal System' },      name: 'TechCorp Solutions',      experienceLevel: 'SENIOR'  console.log("� Creating test users for all roles...")

    update: {},

    create: {      email: 'contact@techcorp.com',

      name: 'Patient Portal System',

      description: 'HIPAA-compliant patient portal with appointment scheduling, medical records access, prescription management, and telemedicine capabilities.',      phone: '+1-555-0123',    }  

      clientId: healthFirst.id,

      managerId: projectManager.id,      address: '123 Tech Street, Silicon Valley, CA 94000',

      status: 'COMPLETED',

      priority: 'HIGH',      company: 'TechCorp Solutions Inc.',  })  // Super Admin Users

      methodology: 'WATERFALL',

      budget: 120000,      website: 'https://techcorp.com',

      budgetUsed: 118500,

      hourlyRate: 140,      timezone: 'America/New_York',  const superAdminUsers = [

      startDate: new Date('2024-03-01'),

      endDate: new Date('2024-09-15'),      industry: 'Technology'

      estimatedHours: 850,

      actualHours: 846,    }  const teamMember2 = await prisma.user.upsert({    {

      completionRate: 100,

      users: {  })

        connect: [

          { id: developer2.id }    where: { email: 'developer2@zyphextech.com' },      email: "superadmin@zyphextech.com",

        ]

      }  const retailPlus = await prisma.client.upsert({

    }

  })    where: { email: 'info@retailplus.com' },    update: {},      name: "Alex Thompson",

  

  const lmsProject = await prisma.project.upsert({    update: {},

    where: { name: 'Learning Management System' },

    update: {},    create: {    create: {      role: "SUPER_ADMIN" as const

    create: {

      name: 'Learning Management System',      name: 'RetailPlus Inc',

      description: 'Comprehensive LMS with course creation, student enrollment, progress tracking, assessments, and analytics dashboard.',

      clientId: eduTech.id,      email: 'info@retailplus.com',      email: 'developer2@zyphextech.com',    },

      managerId: projectManager.id,

      status: 'ON_HOLD',      phone: '+1-555-0456',

      priority: 'LOW',

      methodology: 'AGILE',      address: '456 Commerce Ave, Business District, NY 10001',      name: 'Emily Rodriguez',    {

      budget: 65000,

      budgetUsed: 15000,      company: 'RetailPlus Corporation',

      hourlyRate: 100,

      startDate: new Date('2024-12-01'),      website: 'https://retailplus.com',      password: hashedPassword,      email: "admin@zyphextech.com",

      endDate: new Date('2025-08-31'),

      estimatedHours: 650,      timezone: 'America/Los_Angeles',

      actualHours: 150,

      completionRate: 23,      industry: 'Retail'      role: 'TEAM_MEMBER',      name: "System Administrator", 

      users: {

        connect: [    }

          { id: developer2.id },

          { id: designer.id }  })      skills: JSON.stringify(['Vue.js', 'Python', 'Django', 'Docker', 'GraphQL']),      role: "SUPER_ADMIN" as const

        ]

      }

    }

  })  const healthFirst = await prisma.client.upsert({      hourlyRate: 85.0,    }

  

  console.log('✅ Created projects')    where: { email: 'contact@healthfirst.com' },

  

  // Print summary    update: {},      timezone: 'America/Chicago',  ]

  const counts = {

    users: await prisma.user.count(),    create: {

    clients: await prisma.client.count(),

    projects: await prisma.project.count()      name: 'HealthFirst Medical',      phone: '+1-555-0004',

  }

        email: 'contact@healthfirst.com',

  console.log('\n📊 Database Seed Summary:')

  console.log(`   👥 Users: ${counts.users}`)      phone: '+1-555-0789',      availability: 'FULL_TIME',  // Admin Users  

  console.log(`   🏢 Clients: ${counts.clients}`)

  console.log(`   🚀 Projects: ${counts.projects}`)      address: '789 Medical Center Dr, Healthcare City, TX 73301',

  

  console.log('\n🔐 Login Credentials for Testing:')      company: 'HealthFirst Medical Group',      experienceLevel: 'INTERMEDIATE'  const adminUsers = [

  console.log('   🔑 Super Admin: admin@zyphextech.com / admin123')

  console.log('   🔑 Project Manager: manager@zyphextech.com / admin123')      website: 'https://healthfirst.com',

  console.log('   🔑 Developer 1: developer1@zyphextech.com / admin123')

  console.log('   🔑 Developer 2: developer2@zyphextech.com / admin123')      timezone: 'America/Chicago',    }    {

  console.log('   🔑 Designer: designer@zyphextech.com / admin123')

        industry: 'Healthcare'

  console.log('\n🎉 Database seeding completed successfully!')

}    }  })      email: "sarah.admin@zyphextech.com",



main()  })

  .catch((e) => {

    console.error('❌ Error during seeding:', e)      name: "Sarah Wilson",

    process.exit(1)

  })  const eduTech = await prisma.client.upsert({

  .finally(async () => {

    await prisma.$disconnect()    where: { email: 'hello@edutech.com' },  const designer = await prisma.user.upsert({      role: "ADMIN" as const

  })
    update: {},

    create: {    where: { email: 'designer@zyphextech.com' },    },

      name: 'EduTech Innovations',

      email: 'hello@edutech.com',    update: {},    {

      phone: '+1-555-0321',

      address: '321 Education Blvd, Learning District, CO 80202',    create: {      email: "mike.admin@zyphextech.com", 

      company: 'EduTech Innovations LLC',

      website: 'https://edutech.com',      email: 'designer@zyphextech.com',      name: "Mike Rodriguez",

      timezone: 'America/Denver',

      industry: 'Education'      name: 'Alex Morgan',      role: "ADMIN" as const

    }

  })      password: hashedPassword,    }



  console.log('✅ Created clients')      role: 'TEAM_MEMBER',  ]



  console.log('🚀 Creating projects...')      skills: JSON.stringify(['UI/UX Design', 'Figma', 'Adobe Creative Suite', 'Prototyping']),



  // Create Projects with realistic data      hourlyRate: 75.0,  // Project Manager Users

  const ecommerceProject = await prisma.project.upsert({

    where: { name: 'E-commerce Platform Development' },      timezone: 'America/New_York',  const projectManagers = [

    update: {},

    create: {      phone: '+1-555-0005',    {

      name: 'E-commerce Platform Development',

      description: 'Full-stack e-commerce solution with React, Node.js, and PostgreSQL. Features include user authentication, product catalog, shopping cart, payment processing, and admin dashboard.',      availability: 'PART_TIME',      email: "pm.john@zyphextech.com",

      clientId: techCorp.id,

      managerId: projectManager.id,      experienceLevel: 'INTERMEDIATE'      name: "John Mitchell",

      status: 'IN_PROGRESS',

      priority: 'HIGH',    }      role: "PROJECT_MANAGER" as const

      methodology: 'AGILE',

      budget: 85000,  })    },

      budgetUsed: 32000,

      hourlyRate: 125,    {

      startDate: new Date('2024-09-01'),

      endDate: new Date('2025-02-28'),  console.log('✅ Created team members')      email: "pm.emily@zyphextech.com",

      estimatedHours: 680,

      actualHours: 256,      name: "Emily Chen",

      completionRate: 38,

      users: {  // Create sample clients with real business data      role: "PROJECT_MANAGER" as const

        connect: [

          { id: developer1.id },  const techCorp = await prisma.client.upsert({    },

          { id: developer2.id },

          { id: designer.id }    where: { email: 'contact@techcorp.com' },    {

        ]

      }    update: {},      email: "pm.david@zyphextech.com",

    }

  })    create: {      name: "David Park",



  const mobileAppProject = await prisma.project.upsert({      name: 'TechCorp Solutions',      role: "PROJECT_MANAGER" as const

    where: { name: 'Mobile App for Retail Management' },

    update: {},      email: 'contact@techcorp.com',    }

    create: {

      name: 'Mobile App for Retail Management',      phone: '+1-555-0123',  ]

      description: 'Cross-platform mobile application for inventory management, sales tracking, and customer analytics.',

      clientId: retailPlus.id,      address: '123 Business Ave, Tech City, TC 12345',

      managerId: projectManager.id,

      status: 'PLANNING',      company: 'TechCorp Solutions Inc.',  // Team Member Users

      priority: 'MEDIUM',

      methodology: 'SCRUM',      website: 'https://techcorp.com',  const teamMembers = [

      budget: 45000,

      budgetUsed: 8500,      timezone: 'America/New_York',    {

      hourlyRate: 110,

      startDate: new Date('2024-11-01'),      industry: 'Technology'      email: "dev.alice@zyphextech.com",

      endDate: new Date('2025-04-30'),

      estimatedHours: 520,    }      name: "Alice Johnson",

      actualHours: 72,

      completionRate: 14,  })      role: "TEAM_MEMBER" as const

      users: {

        connect: [    },

          { id: developer1.id },

          { id: designer.id }  const retailPlus = await prisma.client.upsert({    {

        ]

      }    where: { email: 'info@retailplus.com' },      email: "dev.bob@zyphextech.com",

    }

  })    update: {},      name: "Bob Smith",



  const healthPortalProject = await prisma.project.upsert({    create: {      role: "TEAM_MEMBER" as const

    where: { name: 'Patient Portal System' },

    update: {},      name: 'RetailPlus Inc',    },

    create: {

      name: 'Patient Portal System',      email: 'info@retailplus.com',    {

      description: 'HIPAA-compliant patient portal with appointment scheduling, medical records access, prescription management, and telemedicine capabilities.',

      clientId: healthFirst.id,      phone: '+1-555-0124',      email: "dev.carol@zyphextech.com",

      managerId: projectManager.id,

      status: 'COMPLETED',      address: '456 Commerce St, Retail City, RC 67890',      name: "Carol Davis",

      priority: 'HIGH',

      methodology: 'WATERFALL',      company: 'RetailPlus Incorporated',      role: "TEAM_MEMBER" as const

      budget: 120000,

      budgetUsed: 118500,      website: 'https://retailplus.com',    },

      hourlyRate: 140,

      startDate: new Date('2024-03-01'),      timezone: 'America/Los_Angeles',    {

      endDate: new Date('2024-09-15'),

      estimatedHours: 850,      industry: 'Retail'      email: "designer.lisa@zyphextech.com",

      actualHours: 846,

      completionRate: 100,    }      name: "Lisa Brown",

      users: {

        connect: [  })      role: "TEAM_MEMBER" as const

          { id: developer2.id }

        ]    },

      }

    }  const healthFirst = await prisma.client.upsert({    {

  })

    where: { email: 'contact@healthfirst.com' },      email: "qa.tom@zyphextech.com",

  const lmsProject = await prisma.project.upsert({

    where: { name: 'Learning Management System' },    update: {},      name: "Tom Wilson",

    update: {},

    create: {    create: {      role: "TEAM_MEMBER" as const

      name: 'Learning Management System',

      description: 'Comprehensive LMS with course creation, student enrollment, progress tracking, assessments, and analytics dashboard.',      name: 'HealthFirst Medical',    }

      clientId: eduTech.id,

      managerId: projectManager.id,      email: 'contact@healthfirst.com',  ]

      status: 'ON_HOLD',

      priority: 'LOW',      phone: '+1-555-0125',

      methodology: 'AGILE',

      budget: 65000,      address: '789 Medical Plaza, Health City, HC 54321',  // Client Users

      budgetUsed: 15000,

      hourlyRate: 100,      company: 'HealthFirst Medical Group',  const clientUsers = [

      startDate: new Date('2024-12-01'),

      endDate: new Date('2025-08-31'),      website: 'https://healthfirst.com',    {

      estimatedHours: 650,

      actualHours: 150,      timezone: 'America/Chicago',      email: "client.acme@zyphextech.com",

      completionRate: 23,

      users: {      industry: 'Healthcare'      name: "Rachel Green",

        connect: [

          { id: developer2.id },    }      role: "CLIENT" as const

          { id: designer.id }

        ]  })    },

      }

    }    {

  })

  const eduTech = await prisma.client.upsert({      email: "client.techcorp@zyphextech.com",

  console.log('✅ Created projects')

    where: { email: 'hello@edutech.com' },      name: "James Morrison",

  // Print summary

  const counts = {    update: {},      role: "CLIENT" as const

    users: await prisma.user.count(),

    clients: await prisma.client.count(),    create: {    },

    projects: await prisma.project.count()

  }      name: 'EduTech Innovations',    {



  console.log('\n📊 Database Seed Summary:')      email: 'hello@edutech.com',      email: "client.startup@zyphextech.com",

  console.log(`   👥 Users: ${counts.users}`)

  console.log(`   🏢 Clients: ${counts.clients}`)      phone: '+1-555-0126',      name: "Maria Garcia",

  console.log(`   🚀 Projects: ${counts.projects}`)

      address: '321 Learning Blvd, Education City, EC 98765',      role: "CLIENT" as const

  console.log('\n🔐 Login Credentials for Testing:')

  console.log('   🔑 Super Admin: admin@zyphextech.com / admin123')      company: 'EduTech Innovations LLC',    }

  console.log('   🔑 Project Manager: manager@zyphextech.com / admin123')

  console.log('   🔑 Developer 1: developer1@zyphextech.com / admin123')      website: 'https://edutech.com',  ]

  console.log('   🔑 Developer 2: developer2@zyphextech.com / admin123')

  console.log('   🔑 Designer: designer@zyphextech.com / admin123')      timezone: 'America/Denver',



  console.log('\n🎉 Database seeding completed successfully!')      industry: 'Education'  // Regular Users

}

    }  const regularUsers = [

main()

  .catch((e) => {  })    {

    console.error('❌ Error during seeding:', e)

    process.exit(1)      email: "user.demo@zyphextech.com",

  })

  .finally(async () => {  console.log('✅ Created clients')      name: "Demo User",

    await prisma.$disconnect()

  })      role: "USER" as const

  // Create sample projects with proper relationships    },

  const ecommerceProject = await prisma.project.upsert({    {

    where: { name: 'E-commerce Platform Development' },      email: "user.guest@zyphextech.com",

    update: {},      name: "Guest User",

    create: {      role: "USER" as const

      name: 'E-commerce Platform Development',    }

      description: 'Full-stack e-commerce solution with React, Node.js, and PostgreSQL. Features include user authentication, product catalog, shopping cart, payment processing, and admin dashboard.',  ]

      clientId: techCorp.id,

      managerId: projectManager.id,  // Create all user types with passwords

      status: 'IN_PROGRESS',  const allUsers = [

      priority: 'HIGH',    ...superAdminUsers,

      methodology: 'AGILE',    ...adminUsers, 

      budget: 85000,    ...projectManagers,

      budgetUsed: 32000,    ...teamMembers,

      hourlyRate: 125,    ...clientUsers,

      startDate: new Date('2024-09-01'),    ...regularUsers

      endDate: new Date('2025-02-28'),  ]

      estimatedHours: 680,

      actualHours: 256,  console.log("🔐 Hashing passwords for test users...")

      completionRate: 38,  const hashedPassword = await hash(DEFAULT_PASSWORD, 12)

      users: {

        connect: [  for (const userData of allUsers) {

          { id: teamMember1.id },    const user = await prisma.user.upsert({

          { id: teamMember2.id },      where: { email: userData.email },

          { id: designer.id }      update: {},

        ]      create: {

      }        email: userData.email,

    }        name: userData.name,

  })        role: userData.role,

        password: hashedPassword, // Add password for testing

  const mobileAppProject = await prisma.project.upsert({        emailVerified: new Date() // Mark as verified for testing

    where: { name: 'Mobile App for Retail Management' },      }

    update: {},    })

    create: {    console.log(`✅ Created ${userData.role} user: ${user.email}`)

      name: 'Mobile App for Retail Management',  }

      description: 'React Native mobile application for inventory management, sales tracking, and customer engagement. Includes barcode scanning, real-time sync, and offline capabilities.',  

      clientId: retailPlus.id,  // Create sample clients with more detail

      managerId: projectManager.id,  console.log("📊 Creating sample clients...")

      status: 'PLANNING',  const sampleClients = [

      priority: 'MEDIUM',    {

      methodology: 'SCRUM',      name: "Acme Corporation",

      budget: 65000,      email: "client.acme@zyphextech.com",

      budgetUsed: 8500,      phone: "+1-555-0123",

      hourlyRate: 110,      address: "123 Business Ave, Tech City, TC 12345",

      startDate: new Date('2024-11-01'),      company: "Acme Corp",

      endDate: new Date('2025-04-30'),      website: "https://acme-corp.com"

      estimatedHours: 520,    },

      actualHours: 72,    {

      completionRate: 15,      name: "TechCorp Solutions", 

      users: {      email: "client.techcorp@zyphextech.com",

        connect: [      phone: "+1-555-0456",

          { id: teamMember1.id },      address: "456 Innovation Blvd, Startup Valley, SV 67890",

          { id: designer.id }      company: "TechCorp Inc",

        ]      website: "https://techcorp-solutions.com"

      }    },

    }    {

  })      name: "StartupXYZ",

      email: "client.startup@zyphextech.com", 

  const healthPortalProject = await prisma.project.upsert({      phone: "+1-555-0789",

    where: { name: 'Patient Portal System' },      address: "789 Venture St, Enterprise Park, EP 54321",

    update: {},      company: "StartupXYZ Ltd",

    create: {      website: "https://startupxyz.io"

      name: 'Patient Portal System',    }

      description: 'HIPAA-compliant patient portal with appointment scheduling, medical records access, prescription management, and telemedicine capabilities.',  ]

      clientId: healthFirst.id,

      managerId: projectManager.id,  const createdClients = []

      status: 'COMPLETED',  for (const clientData of sampleClients) {

      priority: 'HIGH',    const client = await prisma.client.upsert({

      methodology: 'WATERFALL',      where: { email: clientData.email },

      budget: 120000,      update: {},

      budgetUsed: 118500,      create: clientData

      hourlyRate: 140,    })

      startDate: new Date('2024-03-01'),    createdClients.push(client)

      endDate: new Date('2024-08-31'),    console.log(`✅ Created client: ${client.name}`)

      estimatedHours: 850,  }

      actualHours: 846,

      completionRate: 100,  // Create sample projects

      users: {  console.log("🚀 Creating sample projects...")

        connect: [  const sampleProjects = [

          { id: teamMember1.id },    {

          { id: teamMember2.id }      name: "E-commerce Platform Redesign",

        ]      description: "Complete redesign of Acme's e-commerce platform with modern UI/UX",

      }      status: "IN_PROGRESS" as const,

    }      budget: 50000,

  })      hourlyRate: 85.0,

      startDate: new Date('2024-01-15'),

  const lmsProject = await prisma.project.upsert({      endDate: new Date('2024-06-15'),

    where: { name: 'Learning Management System' },      clientId: createdClients[0].id

    update: {},    },

    create: {    {

      name: 'Learning Management System',      name: "Mobile App Development",

      description: 'Modern LMS with course creation tools, student progress tracking, interactive assessments, video streaming, and analytics dashboard.',      description: "Native iOS and Android app for TechCorp's business platform",

      clientId: eduTech.id,      status: "PLANNING" as const,

      managerId: projectManager.id,      budget: 75000,

      status: 'REVIEW',      hourlyRate: 95.0,

      priority: 'MEDIUM',      startDate: new Date('2024-02-01'),

      methodology: 'AGILE',      endDate: new Date('2024-08-01'),

      budget: 95000,      clientId: createdClients[1].id

      budgetUsed: 87200,    },

      hourlyRate: 115,    {

      startDate: new Date('2024-06-01'),      name: "Data Analytics Dashboard",

      endDate: new Date('2024-12-15'),      description: "Real-time analytics dashboard for StartupXYZ's financial platform",

      estimatedHours: 760,      status: "IN_PROGRESS" as const,

      actualHours: 720,      budget: 35000,

      completionRate: 92,      hourlyRate: 75.0,

      users: {      startDate: new Date('2024-01-01'),

        connect: [      endDate: new Date('2024-05-01'),

          { id: teamMember2.id },      clientId: createdClients[2].id

          { id: designer.id }    },

        ]    {

      }      name: "Website Optimization",

    }      description: "Performance optimization and SEO improvements for Acme website",

  })      status: "COMPLETED" as const,

      budget: 15000,

  console.log('✅ Created projects')      hourlyRate: 65.0,

      startDate: new Date('2023-10-01'),

  // Summary      endDate: new Date('2023-12-15'),

  const counts = {      clientId: createdClients[0].id

    users: await prisma.user.count(),    }

    clients: await prisma.client.count(),  ]

    projects: await prisma.project.count()

  }  const createdProjects = []

  for (const projectData of sampleProjects) {

  console.log('\n🎉 Database seeding completed successfully!')    // Check if project already exists

  console.log('📊 Summary:')    const existingProject = await prisma.project.findFirst({

  console.log(`   Users: ${counts.users}`)      where: { name: projectData.name }

  console.log(`   Clients: ${counts.clients}`)    })

  console.log(`   Projects: ${counts.projects}`)    

      if (!existingProject) {

  console.log('\n🔐 Login Credentials:')      const project = await prisma.project.create({

  console.log('   Super Admin: admin@zyphextech.com / admin123')        data: projectData

  console.log('   Project Manager: manager@zyphextech.com / admin123')      })

  console.log('   Developer 1: developer1@zyphextech.com / admin123')      createdProjects.push(project)

  console.log('   Developer 2: developer2@zyphextech.com / admin123')      console.log(`✅ Created project: ${project.name}`)

  console.log('   Designer: designer@zyphextech.com / admin123')    } else {

}      createdProjects.push(existingProject)

      console.log(`ℹ️ Project already exists: ${existingProject.name}`)

main()    }

  .catch((e) => {  }

    console.error('❌ Error during seeding:', e)  console.log("🎉 Seed completed successfully!")

    process.exit(1)}

  })

  .finally(async () => {function getPermissionCategory(permission: Permission): string {

    await prisma.$disconnect()  if (permission.includes('system') || permission.includes('audit') || permission.includes('backup')) {

  })    return 'system'
  }
  if (permission.includes('user')) {
    return 'users'
  }
  if (permission.includes('client')) {
    return 'clients'
  }
  if (permission.includes('project')) {
    return 'projects'
  }
  if (permission.includes('task')) {
    return 'tasks'
  }
  if (permission.includes('time')) {
    return 'time'
  }
  if (permission.includes('financial') || permission.includes('invoice') || permission.includes('revenue') || permission.includes('billing')) {
    return 'financial'
  }
  if (permission.includes('team')) {
    return 'teams'
  }
  if (permission.includes('document')) {
    return 'documents'
  }
  if (permission.includes('report') || permission.includes('analytics') || permission.includes('dashboard')) {
    return 'reports'
  }
  if (permission.includes('message')) {
    return 'communication'
  }
  if (permission.includes('settings') || permission.includes('company') || permission.includes('integration')) {
    return 'settings'
  }
  return 'other'
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

import { PrismaClient } from "@prisma/client"
import { Permission, DefaultRolePermissions, PermissionDescriptions } from "../lib/auth/permissions"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

// Default password for all test users
const DEFAULT_PASSWORD = "password123"

async function main() {
  console.log("🌱 Starting RBAC seed...")
  
  // Create all permissions in the database
  console.log("📝 Creating permissions...")
  const permissionPromises = Object.values(Permission).map(async (permission) => {
    return prisma.permission.upsert({
      where: { name: permission },
      update: {},
      create: {
        name: permission,
        description: PermissionDescriptions[permission] || `Permission: ${permission}`,
        category: getPermissionCategory(permission)
      }
    })
  })
  
  const createdPermissions = await Promise.all(permissionPromises)
  console.log(`✅ Created ${createdPermissions.length} permissions`)
  
  // Create role-permission mappings
  console.log("🔐 Creating role-permission mappings...")
  for (const [role, permissions] of Object.entries(DefaultRolePermissions)) {
    const rolePermissionPromises = permissions.map(async (permission) => {
      const permissionRecord = await prisma.permission.findUnique({
        where: { name: permission }
      })
      
      if (permissionRecord) {
        return prisma.rolePermission.upsert({
          where: {
            role_permissionId: {
              role: role as "SUPER_ADMIN" | "ADMIN" | "PROJECT_MANAGER" | "TEAM_MEMBER" | "CLIENT" | "USER",
              permissionId: permissionRecord.id
            }
          },
          update: {},
          create: {
            role: role as "SUPER_ADMIN" | "ADMIN" | "PROJECT_MANAGER" | "TEAM_MEMBER" | "CLIENT" | "USER",
            permissionId: permissionRecord.id
          }
        })
      }
    })
    
    await Promise.all(rolePermissionPromises)
    console.log(`✅ Assigned ${permissions.length} permissions to ${role}`)
  }
  
  // Create comprehensive test users for all roles
  console.log("� Creating test users for all roles...")
  
  // Super Admin Users
  const superAdminUsers = [
    {
      email: "superadmin@zyphextech.com",
      name: "Alex Thompson",
      role: "SUPER_ADMIN" as const
    },
    {
      email: "admin@zyphextech.com",
      name: "System Administrator", 
      role: "SUPER_ADMIN" as const
    }
  ]

  // Admin Users  
  const adminUsers = [
    {
      email: "sarah.admin@zyphextech.com",
      name: "Sarah Wilson",
      role: "ADMIN" as const
    },
    {
      email: "mike.admin@zyphextech.com", 
      name: "Mike Rodriguez",
      role: "ADMIN" as const
    }
  ]

  // Project Manager Users
  const projectManagers = [
    {
      email: "pm.john@zyphextech.com",
      name: "John Mitchell",
      role: "PROJECT_MANAGER" as const
    },
    {
      email: "pm.emily@zyphextech.com",
      name: "Emily Chen",
      role: "PROJECT_MANAGER" as const
    },
    {
      email: "pm.david@zyphextech.com",
      name: "David Park",
      role: "PROJECT_MANAGER" as const
    }
  ]

  // Team Member Users
  const teamMembers = [
    {
      email: "dev.alice@zyphextech.com",
      name: "Alice Johnson",
      role: "TEAM_MEMBER" as const
    },
    {
      email: "dev.bob@zyphextech.com",
      name: "Bob Smith",
      role: "TEAM_MEMBER" as const
    },
    {
      email: "dev.carol@zyphextech.com",
      name: "Carol Davis",
      role: "TEAM_MEMBER" as const
    },
    {
      email: "designer.lisa@zyphextech.com",
      name: "Lisa Brown",
      role: "TEAM_MEMBER" as const
    },
    {
      email: "qa.tom@zyphextech.com",
      name: "Tom Wilson",
      role: "TEAM_MEMBER" as const
    }
  ]

  // Client Users
  const clientUsers = [
    {
      email: "client.acme@zyphextech.com",
      name: "Rachel Green",
      role: "CLIENT" as const
    },
    {
      email: "client.techcorp@zyphextech.com",
      name: "James Morrison",
      role: "CLIENT" as const
    },
    {
      email: "client.startup@zyphextech.com",
      name: "Maria Garcia",
      role: "CLIENT" as const
    }
  ]

  // Regular Users
  const regularUsers = [
    {
      email: "user.demo@zyphextech.com",
      name: "Demo User",
      role: "USER" as const
    },
    {
      email: "user.guest@zyphextech.com",
      name: "Guest User",
      role: "USER" as const
    }
  ]

  // Create all user types with passwords
  const allUsers = [
    ...superAdminUsers,
    ...adminUsers, 
    ...projectManagers,
    ...teamMembers,
    ...clientUsers,
    ...regularUsers
  ]

  console.log("🔐 Hashing passwords for test users...")
  const hashedPassword = await hash(DEFAULT_PASSWORD, 12)

  for (const userData of allUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        name: userData.name,
        role: userData.role,
        password: hashedPassword, // Add password for testing
        emailVerified: new Date() // Mark as verified for testing
      }
    })
    console.log(`✅ Created ${userData.role} user: ${user.email}`)
  }
  
  // Create sample clients with more detail
  console.log("📊 Creating sample clients...")
  const sampleClients = [
    {
      name: "Acme Corporation",
      email: "client.acme@zyphextech.com",
      phone: "+1-555-0123",
      address: "123 Business Ave, Tech City, TC 12345",
      company: "Acme Corp",
      website: "https://acme-corp.com"
    },
    {
      name: "TechCorp Solutions", 
      email: "client.techcorp@zyphextech.com",
      phone: "+1-555-0456",
      address: "456 Innovation Blvd, Startup Valley, SV 67890",
      company: "TechCorp Inc",
      website: "https://techcorp-solutions.com"
    },
    {
      name: "StartupXYZ",
      email: "client.startup@zyphextech.com", 
      phone: "+1-555-0789",
      address: "789 Venture St, Enterprise Park, EP 54321",
      company: "StartupXYZ Ltd",
      website: "https://startupxyz.io"
    }
  ]

  const createdClients = []
  for (const clientData of sampleClients) {
    const client = await prisma.client.upsert({
      where: { email: clientData.email },
      update: {},
      create: clientData
    })
    createdClients.push(client)
    console.log(`✅ Created client: ${client.name}`)
  }

  // Create sample projects
  console.log("🚀 Creating sample projects...")
  const sampleProjects = [
    {
      name: "E-commerce Platform Redesign",
      description: "Complete redesign of Acme's e-commerce platform with modern UI/UX",
      status: "IN_PROGRESS" as const,
      budget: 50000,
      hourlyRate: 85.0,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-06-15'),
      clientId: createdClients[0].id
    },
    {
      name: "Mobile App Development",
      description: "Native iOS and Android app for TechCorp's business platform",
      status: "PLANNING" as const,
      budget: 75000,
      hourlyRate: 95.0,
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-08-01'),
      clientId: createdClients[1].id
    },
    {
      name: "Data Analytics Dashboard",
      description: "Real-time analytics dashboard for StartupXYZ's financial platform",
      status: "IN_PROGRESS" as const,
      budget: 35000,
      hourlyRate: 75.0,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-05-01'),
      clientId: createdClients[2].id
    },
    {
      name: "Website Optimization",
      description: "Performance optimization and SEO improvements for Acme website",
      status: "COMPLETED" as const,
      budget: 15000,
      hourlyRate: 65.0,
      startDate: new Date('2023-10-01'),
      endDate: new Date('2023-12-15'),
      clientId: createdClients[0].id
    }
  ]

  const createdProjects = []
  for (const projectData of sampleProjects) {
    // Check if project already exists
    const existingProject = await prisma.project.findFirst({
      where: { name: projectData.name }
    })
    
    if (!existingProject) {
      const project = await prisma.project.create({
        data: projectData
      })
      createdProjects.push(project)
      console.log(`✅ Created project: ${project.name}`)
    } else {
      createdProjects.push(existingProject)
      console.log(`ℹ️ Project already exists: ${existingProject.name}`)
    }
  }
  console.log("🎉 Seed completed successfully!")
}

function getPermissionCategory(permission: Permission): string {
  if (permission.includes('system') || permission.includes('audit') || permission.includes('backup')) {
    return 'system'
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

import { PrismaClient, Role } from "@prisma/client"
import { Permission, DefaultRolePermissions, PermissionDescriptions } from "../lib/auth/permissions"

const prisma = new PrismaClient()

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
              role: role as Role,
              permissionId: permissionRecord.id
            }
          },
          update: {},
          create: {
            role: role as Role,
            permissionId: permissionRecord.id
          }
        })
      }
    })
    
    await Promise.all(rolePermissionPromises)
    console.log(`✅ Assigned ${permissions.length} permissions to ${role}`)
  }
  
  // Create default admin user
  console.log("👤 Creating default admin user...")
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@zyphextech.com" },
    update: {},
    create: {
      email: "admin@zyphextech.com",
      name: "System Administrator",
      role: Role.SUPER_ADMIN
    }
  })
  
  console.log(`✅ Created admin user: ${adminUser.email} with role: ${adminUser.role}`)
  
  // Create sample client
  console.log("📊 Creating sample client...")
  const client = await prisma.client.upsert({
    where: { email: "client@example.com" },
    update: {},
    create: {
      name: "Sample Client", 
      email: "client@example.com",
      phone: "+1-555-0123"
    }
  })
  
  console.log(`✅ Created sample client: ${client.name}`)
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

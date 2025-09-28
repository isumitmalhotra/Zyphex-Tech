import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Starting seed...")
  
  const user = await prisma.user.create({
    data: {
      email: "admin@zyphextech.com",
      name: "Admin User",
      role: "ADMIN"
    }
  })
  
  console.log("Created user:", user.email)
}

main().catch(console.error).finally(() => prisma.$disconnect())

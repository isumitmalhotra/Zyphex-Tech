import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkServiceData() {
  const service = await prisma.dynamicContentItem.findFirst({
    where: { contentType: { name: 'services' } },
    include: { contentType: true }
  })
  
  if (service) {
    const data = JSON.parse(service.data)
    console.log('Sample service data:', JSON.stringify(data, null, 2))
  } else {
    console.log('No services found')
  }
  
  await prisma.$disconnect()
}

checkServiceData()

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkContentType() {
  // Check the ContentType table
  const contentTypes = await prisma.contentType.findMany({
    where: {
      name: {
        contains: 'team'
      }
    }
  })
  
  console.log('Content types with "team":', contentTypes.length)
  contentTypes.forEach(ct => {
    console.log(`- ${ct.name} (ID: ${ct.id})`)
  })
  
  console.log('\n---\n')
  
  // Check team members directly
  const teamMembers = await prisma.dynamicContentItem.findMany({
    where: {
      contentType: {
        name: 'team_member'
      },
      status: 'PUBLISHED'
    },
    include: {
      contentType: true
    }
  })
  
  console.log(`Team members with status=PUBLISHED: ${teamMembers.length}`)
  teamMembers.forEach(tm => {
    console.log(`- ${tm.title} (ContentType: ${tm.contentType.name})`)
  })
  
  await prisma.$disconnect()
}

checkContentType()

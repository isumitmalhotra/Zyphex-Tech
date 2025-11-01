import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkTeamStatus() {
  const members = await prisma.dynamicContentItem.findMany({
    where: { contentType: { name: 'team_member' } },
    include: { contentType: true }
  })
  
  console.log(`Found ${members.length} team members:\n`)
  
  members.forEach((member) => {
    console.log(`${member.title}`)
    console.log(`  - Featured: ${member.featured}`)
    console.log(`  - Status: ${member.status}`)
    console.log(`  - Published: ${member.publishedAt ? 'Yes' : 'No'}`)
    console.log('')
  })
  
  await prisma.$disconnect()
}

checkTeamStatus()

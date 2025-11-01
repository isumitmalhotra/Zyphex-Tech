import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkTeamMembers() {
  const members = await prisma.dynamicContentItem.findMany({
    where: { contentType: { name: 'team_member' } },
    include: { contentType: true }
  })
  
  console.log(`Found ${members.length} team members:\n`)
  
  members.forEach((member, index) => {
    const data = JSON.parse(member.data)
    console.log(`${index + 1}. ${member.title}`)
    console.log(`   Role: ${data.role}`)
    console.log(`   Image: ${data.imageUrl}`)
    console.log(`   Bio: ${data.bio?.substring(0, 50)}...`)
    console.log('')
  })
  
  await prisma.$disconnect()
}

checkTeamMembers()

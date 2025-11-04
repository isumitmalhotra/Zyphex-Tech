import { prisma } from '../lib/prisma'

async function main() {
  const type = await prisma.contentType.findFirst({ 
    where: { name: 'team_member' } 
  })
  
  if (!type) {
    console.log('No team_member type found')
    return
  }
  
  const members = await prisma.dynamicContentItem.findMany({ 
    where: { contentTypeId: type.id } 
  })
  
  console.log('Members:', members.length)
  members.forEach(m => {
    console.log(`- ${m.title}: status='${m.status}', featured=${m.featured}`)
  })
}

main()

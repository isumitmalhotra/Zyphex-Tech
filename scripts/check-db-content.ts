import { prisma } from '../lib/prisma'

async function checkDatabaseContent() {
  console.log('Checking database content...\n')
  
  const pages = await prisma.pageContent.findMany({
    include: {
      sections: true
    }
  })

  for (const page of pages) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`Page: ${page.name} (${page.pageKey})`)
    console.log(`${'='.repeat(60)}`)
    console.log(`Sections: ${page.sections.length}`)
    
    for (const section of page.sections) {
      console.log(`\n  Section: ${section.sectionKey} (${section.sectionType})`)
      console.log(`  Title: ${section.title}`)
      console.log(`  Visible: ${section.isVisible}`)
      console.log(`  ContentData type: ${typeof section.contentData}`)
      console.log(`  ContentData:`, JSON.stringify(section.contentData, null, 2).substring(0, 300))
    }
  }
}

checkDatabaseContent()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

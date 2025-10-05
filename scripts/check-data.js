const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkData() {
  try {
    console.log('🔍 Checking database content...')
    
    // Check content types
    const contentTypes = await prisma.contentType.findMany()
    console.log(`\n📋 Content Types (${contentTypes.length}):`)
    contentTypes.forEach(ct => {
      console.log(`  - ${ct.name} (${ct.label})`)
    })
    
    // Check sections
    const sections = await prisma.dynamicContentSection.findMany({
      include: { contentType: true }
    })
    console.log(`\n📑 Sections (${sections.length}):`)
    sections.forEach(section => {
      console.log(`  - ${section.sectionKey} (${section.title}) - Type: ${section.contentType.name}`)
    })
    
    // Check items
    const items = await prisma.dynamicContentItem.findMany({
      include: { contentType: true }
    })
    console.log(`\n📄 Items (${items.length}):`)
    items.forEach(item => {
      console.log(`  - ${item.slug} (${item.title}) - Type: ${item.contentType.name}`)
    })
    
    // Check hero section specifically
    const heroSection = await prisma.dynamicContentSection.findUnique({
      where: { sectionKey: 'home-hero' },
      include: { contentType: true }
    })
    
    if (heroSection) {
      console.log(`\n🦸 Hero Section Details:`)
      console.log(`  - Section Key: ${heroSection.sectionKey}`)
      console.log(`  - Title: ${heroSection.title}`)
      console.log(`  - Content Type: ${heroSection.contentType.name}`)
      console.log(`  - Content Data: ${heroSection.contentData?.substring(0, 100)}...`)
    }
    
  } catch (error) {
    console.error('❌ Error checking data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkData()
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testPageContent() {
  console.log('🧪 Testing Page Content Retrieval...\n')

  try {
    // Test 1: Check if home page exists
    console.log('📄 Test 1: Fetching home page...')
    const homePage = await prisma.page.findFirst({
      where: { slug: 'home' }
    })
    console.log(homePage ? `✅ Home page found: ${homePage.title}` : '❌ Home page not found')

    // Test 2: Check CMS pages
    console.log('\n📄 Test 2: Fetching CMS pages...')
    const cmsPages = await prisma.cmsPage.findMany({
      include: {
        sections: true
      }
    })
    console.log(`✅ Found ${cmsPages.length} CMS pages`)
    cmsPages.forEach(page => {
      console.log(`  - ${page.pageKey} (${page.slug}) - ${page.sections.length} sections`)
    })

    // Test 3: Check services
    console.log('\n📄 Test 3: Fetching services...')
    const servicesType = await prisma.contentType.findFirst({
      where: { name: 'services' }
    })
    
    if (servicesType) {
      const services = await prisma.dynamicContentItem.findMany({
        where: { 
          contentTypeId: servicesType.id,
          status: 'PUBLISHED'
        },
        orderBy: { order: 'asc' }
      })
      console.log(`✅ Found ${services.length} published services`)
      services.slice(0, 3).forEach(service => {
        console.log(`  - ${service.title}`)
      })
    }

    // Test 4: Check portfolio projects
    console.log('\n📄 Test 4: Fetching portfolio projects...')
    const portfolioType = await prisma.contentType.findFirst({
      where: { name: 'portfolio' }
    })
    
    if (portfolioType) {
      const projects = await prisma.dynamicContentItem.findMany({
        where: { 
          contentTypeId: portfolioType.id,
          status: 'PUBLISHED'
        },
        orderBy: { order: 'asc' }
      })
      console.log(`✅ Found ${projects.length} published portfolio projects`)
      projects.slice(0, 3).forEach(project => {
        console.log(`  - ${project.title}`)
      })
    }

    // Test 5: Check dynamic content sections
    console.log('\n📄 Test 5: Fetching dynamic content sections...')
    const sections = await prisma.dynamicContentSection.findMany({
      include: {
        contentType: true
      }
    })
    console.log(`${sections.length > 0 ? '✅' : '⚠️'} Found ${sections.length} dynamic content sections`)
    if (sections.length > 0) {
      sections.slice(0, 5).forEach(section => {
        console.log(`  - ${section.title} (${section.contentType?.name || 'No type'})`)
      })
    } else {
      console.log('  ℹ️ No dynamic sections found - pages may use CmsPage sections instead')
    }

    console.log('\n═══════════════════════════════════')
    console.log('✅ Content retrieval test completed!')
    console.log('═══════════════════════════════════')

  } catch (error) {
    console.error('❌ Error testing page content:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testPageContent()

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDatabase() {
  try {
    console.log('📊 Checking Database Records...\n')

    // Count records in each table
    const sectionCount = await prisma.dynamicContentSection.count()
    const itemCount = await prisma.dynamicContentItem.count()
    const contentTypeCount = await prisma.contentType.count()
    const pageCount = await prisma.page.count()
    const contentSectionCount = await prisma.contentSection.count()
    const cmsPageCount = await prisma.cmsPage.count()

    console.log('Results:')
    console.log('═══════════════════════════════════')
    console.log(`Page:                  ${pageCount} records`)
    console.log(`ContentSection:        ${contentSectionCount} records`)
    console.log(`DynamicContentSection: ${sectionCount} records`)
    console.log(`DynamicContentItem:    ${itemCount} records`)
    console.log(`ContentType:           ${contentTypeCount} records`)
    console.log(`CmsPage:               ${cmsPageCount} records`)
    console.log('═══════════════════════════════════\n')

    const totalRecords = sectionCount + itemCount + contentSectionCount

    if (totalRecords === 0) {
      console.log('⚠️  DATABASE IS EMPTY! Need to run seed script.')
      console.log('\n💡 Run: npm run seed')
      console.log('   OR: npx tsx scripts/seed-cms-pages.ts')
    } else {
      console.log('✅ Database has content!')
      
      // Get sample data
      if (pageCount > 0) {
        console.log('\n📄 Pages:')
        const pages = await prisma.page.findMany({ take: 10 })
        pages.forEach(p => console.log(`  - ${p.title} (${p.slug}) - Active: ${p.isActive}`))
      }

      if (contentTypeCount > 0) {
        console.log('\n📝 Content Types:')
        const types = await prisma.contentType.findMany({ take: 10 })
        types.forEach(t => console.log(`  - ${t.name} (${t.label})`))
      }

      if (sectionCount > 0) {
        console.log('\n📦 Dynamic Content Sections:')
        const sections = await prisma.dynamicContentSection.findMany({ 
          take: 10,
          include: { contentType: true }
        })
        sections.forEach(s => console.log(`  - ${s.sectionKey} (${s.contentType.name}) - Active: ${s.isActive}`))
      }

      if (itemCount > 0) {
        console.log('\n📝 Dynamic Content Items:')
        const items = await prisma.dynamicContentItem.findMany({ 
          take: 10,
          include: { contentType: true }
        })
        items.forEach(i => console.log(`  - ${i.title || i.slug} (${i.contentType.name}) - Status: ${i.status}`))
      }

      if (cmsPageCount > 0) {
        console.log('\n📄 CMS Pages:')
        const cmsPages = await prisma.cmsPage.findMany({ take: 5 })
        cmsPages.forEach(p => console.log(`  - ${p.pageKey} (${p.slug})`))
      }
    }

  } catch (error) {
    console.error('❌ Error checking database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function preDeploymentCheck() {
  console.log('🔍 PRE-DEPLOYMENT VERIFICATION CHECKLIST\n')
  console.log('='.repeat(80))
  
  try {
    // Check content counts
    console.log('\n📊 CONTENT VERIFICATION:\n')
    
    const teamCount = await prisma.dynamicContentItem.count({
      where: { contentType: { name: 'team_member' }, status: 'PUBLISHED' }
    })
    console.log(`✅ Team Members: ${teamCount} ${teamCount === 6 ? '(Expected: 6)' : '⚠️  EXPECTED 6!'}`)
    
    const blogCount = await prisma.dynamicContentItem.count({
      where: { contentType: { name: 'blog' }, status: 'PUBLISHED' }
    })
    console.log(`✅ Blog Posts: ${blogCount} ${blogCount === 6 ? '(Expected: 6)' : '⚠️  EXPECTED 6!'}`)
    
    const servicesCount = await prisma.dynamicContentItem.count({
      where: { contentType: { name: 'services' }, status: 'PUBLISHED' }
    })
    console.log(`✅ Services: ${servicesCount} ${servicesCount === 6 ? '(Expected: 6)' : '⚠️  EXPECTED 6!'}`)
    
    const portfolioCount = await prisma.dynamicContentItem.count({
      where: { contentType: { name: 'portfolio' }, status: 'PUBLISHED' }
    })
    console.log(`✅ Portfolio: ${portfolioCount} ${portfolioCount === 8 ? '(Expected: 8)' : '⚠️  EXPECTED 8!'}`)
    
    const testimonialsCount = await prisma.dynamicContentItem.count({
      where: { contentType: { name: 'testimonials' }, status: 'PUBLISHED' }
    })
    console.log(`✅ Testimonials: ${testimonialsCount} ${testimonialsCount === 6 ? '(Expected: 6)' : '⚠️  EXPECTED 6!'}`)
    
    // Check for placeholder images
    console.log('\n🖼️  IMAGE VERIFICATION:\n')
    
    const itemsWithPlaceholder = await prisma.dynamicContentItem.findMany({
      where: {
        status: 'PUBLISHED',
        data: {
          contains: 'placeholder.svg'
        }
      },
      select: {
        title: true,
        contentType: {
          select: { name: true }
        }
      }
    })
    
    if (itemsWithPlaceholder.length > 0) {
      console.log('⚠️  WARNING: Found items with placeholder images:')
      itemsWithPlaceholder.forEach(item => {
        console.log(`   - ${item.title} (${item.contentType.name})`)
      })
    } else {
      console.log('✅ No placeholder images found in database!')
    }
    
    // Check image URLs
    console.log('\n📸 CHECKING IMAGE URLS:\n')
    
    const teamMembers = await prisma.dynamicContentItem.findMany({
      where: { contentType: { name: 'team_member' }, status: 'PUBLISHED' },
      select: { title: true, data: true }
    })
    
    let missingImages = 0
    teamMembers.forEach(member => {
      const data = JSON.parse(member.data)
      if (!data.imageUrl || data.imageUrl.includes('placeholder')) {
        console.log(`⚠️  ${member.title}: Missing or placeholder image`)
        missingImages++
      } else {
        console.log(`✅ ${member.title}: Has image`)
      }
    })
    
    // Summary
    console.log('\n' + '='.repeat(80))
    console.log('📋 SUMMARY:\n')
    
    const totalContent = teamCount + blogCount + servicesCount + portfolioCount + testimonialsCount
    console.log(`Total Published Content: ${totalContent}/32`)
    console.log(`Placeholder Images: ${itemsWithPlaceholder.length}`)
    console.log(`Missing Team Images: ${missingImages}`)
    
    console.log('\n' + '='.repeat(80))
    
    if (totalContent === 32 && itemsWithPlaceholder.length === 0 && missingImages === 0) {
      console.log('\n✅ ✅ ✅  ALL CHECKS PASSED! READY FOR PRODUCTION! ✅ ✅ ✅\n')
    } else {
      console.log('\n⚠️  SOME ISSUES FOUND - REVIEW ABOVE BEFORE DEPLOYING\n')
    }
    
    console.log('='.repeat(80))
    
    // Next steps
    console.log('\n📝 NEXT STEPS:\n')
    console.log('1. Run performance test: npx tsx scripts/performance-test.ts')
    console.log('2. Test all pages manually in browser')
    console.log('3. Check browser console for errors (F12)')
    console.log('4. Run build: npm run build')
    console.log('5. Test production build: npm run start')
    console.log('6. Commit changes: git add . && git commit -m "Ready for production"')
    console.log('7. Push to main: git push origin main')
    console.log('\n')
    
  } catch (error) {
    console.error('❌ Error during verification:', error)
  } finally {
    await prisma.$disconnect()
  }
}

preDeploymentCheck()

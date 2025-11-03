import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyContent() {
  console.log('🔍 Verifying content and image URLs...\n')

  try {
    // Check blog posts
    console.log('📝 BLOG POSTS:')
    console.log('=' .repeat(80))
    const blogType = await prisma.contentType.findFirst({
      where: { name: 'blog' }
    })
    
    if (blogType) {
      const blogPosts = await prisma.dynamicContentItem.findMany({
        where: { contentTypeId: blogType.id },
        orderBy: { order: 'asc' }
      })
      
      console.log(`Found ${blogPosts.length} blog posts:\n`)
      
      blogPosts.forEach((post, index) => {
        const data = typeof post.data === 'string' ? JSON.parse(post.data) : post.data
        console.log(`${index + 1}. ${post.title}`)
        console.log(`   Slug: ${post.slug}`)
        console.log(`   Image: ${data.imageUrl || 'NO IMAGE'}`)
        console.log(`   Status: ${post.status}`)
        console.log(`   Featured: ${post.featured ? 'YES' : 'NO'}`)
        console.log('')
      })
    } else {
      console.log('❌ Blog content type not found!\n')
    }

    // Check team members
    console.log('\n👥 TEAM MEMBERS:')
    console.log('=' .repeat(80))
    const teamMemberType = await prisma.contentType.findFirst({
      where: { name: 'team_member' }
    })
    
    if (teamMemberType) {
      const teamMembers = await prisma.dynamicContentItem.findMany({
        where: { contentTypeId: teamMemberType.id },
        orderBy: { order: 'asc' }
      })
      
      console.log(`Found ${teamMembers.length} team members:\n`)
      
      teamMembers.forEach((member, index) => {
        const data = typeof member.data === 'string' ? JSON.parse(member.data) : member.data
        console.log(`${index + 1}. ${member.title}`)
        console.log(`   Role: ${data.role || 'NO ROLE'}`)
        console.log(`   Image: ${data.imageUrl || 'NO IMAGE'}`)
        console.log(`   Status: ${member.status}`)
        console.log(`   Featured: ${member.featured ? 'YES' : 'NO'}`)
        console.log('')
      })
    } else {
      console.log('❌ Team member content type not found!\n')
    }

    // Summary
    console.log('\n✅ VERIFICATION SUMMARY:')
    console.log('=' .repeat(80))
    
    const totalBlogs = blogType ? await prisma.dynamicContentItem.count({
      where: { contentTypeId: blogType.id }
    }) : 0
    
    const totalTeamMembers = teamMemberType ? await prisma.dynamicContentItem.count({
      where: { contentTypeId: teamMemberType.id }
    }) : 0
    
    console.log(`Blog Posts: ${totalBlogs}`)
    console.log(`Team Members: ${totalTeamMembers}`)
    console.log('')
    
    if (totalBlogs === 6 && totalTeamMembers === 6) {
      console.log('🎉 All content verified successfully!')
      console.log('✅ Ready for production deployment')
    } else {
      console.log('⚠️  Warning: Expected 6 blog posts and 6 team members')
      console.log('   Please run the seed scripts if content is missing.')
    }

  } catch (error) {
    console.error('❌ Error verifying content:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

verifyContent()

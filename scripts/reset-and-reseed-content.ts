import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resetAndReseed() {
  console.log('🔄 Resetting and reseeding content with updated image URLs...\n')

  try {
    // Step 1: Delete existing blog posts
    console.log('🗑️  Deleting existing blog posts...')
    const blogType = await prisma.contentType.findFirst({
      where: { name: 'blog' }
    })
    
    if (blogType) {
      const deletedBlogs = await prisma.dynamicContentItem.deleteMany({
        where: { contentTypeId: blogType.id }
      })
      console.log(`✅ Deleted ${deletedBlogs.count} blog posts\n`)
    }

    // Step 2: Delete existing team members
    console.log('🗑️  Deleting existing team members...')
    const teamMemberType = await prisma.contentType.findFirst({
      where: { name: 'team_member' }
    })
    
    if (teamMemberType) {
      const deletedTeamMembers = await prisma.dynamicContentItem.deleteMany({
        where: { contentTypeId: teamMemberType.id }
      })
      console.log(`✅ Deleted ${deletedTeamMembers.count} team members\n`)
    }

    console.log('🎉 Reset completed! Now run the seed scripts:\n')
    console.log('  npx tsx scripts/seed-blog-posts.ts')
    console.log('  npx tsx scripts/seed-team-members.ts')

  } catch (error) {
    console.error('❌ Error resetting content:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

resetAndReseed()

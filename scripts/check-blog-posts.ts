import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkBlogPosts() {
  const posts = await prisma.dynamicContentItem.findMany({
    where: { contentType: { name: 'blog' } },
    include: { contentType: true }
  })
  
  console.log(`Found ${posts.length} blog posts:\n`)
  
  posts.forEach((post) => {
    console.log(`${post.title}`)
    console.log(`  - Status: ${post.status}`)
    console.log(`  - Featured: ${post.featured}`)
    console.log('')
  })
  
  await prisma.$disconnect()
}

checkBlogPosts()

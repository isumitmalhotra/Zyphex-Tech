import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBlogPosts() {
  console.log('📝 Checking BlogPost table...\n');

  try {
    const posts = await prisma.blogPost.findMany({
      orderBy: { publishedAt: 'desc' }
    });

    console.log(`Found ${posts.length} blog posts:\n`);

    posts.forEach((post, index) => {
      console.log(`${index + 1}. ${post.title}`);
      console.log(`   Slug: ${post.slug}`);
      console.log(`   Author: ${post.author}`);
      console.log(`   Published: ${post.published}`);
      console.log(`   Created: ${post.createdAt}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBlogPosts();

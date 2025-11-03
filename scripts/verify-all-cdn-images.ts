import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyAllImages() {
  try {
    // Check Services
    console.log('\n=== SERVICES IMAGES ===');
    const servicesType = await prisma.contentType.findUnique({
      where: { name: 'services' }
    });
    
    if (servicesType) {
      const services = await prisma.dynamicContentItem.findMany({
        where: { contentTypeId: servicesType.id },
        select: { title: true, data: true }
      });
      
      services.forEach(service => {
        const data = typeof service.data === 'string' ? JSON.parse(service.data) : service.data;
        const imageUrl = data?.imageUrl || 'NO IMAGE';
        const isCDN = imageUrl.includes('unsplash.com');
        console.log(`${isCDN ? '✅' : '❌'} ${service.title}`);
        console.log(`   ${imageUrl.substring(0, 80)}...`);
      });
    }

    // Check Team Members
    console.log('\n=== TEAM MEMBERS IMAGES ===');
    const teamType = await prisma.contentType.findUnique({
      where: { name: 'team_member' }
    });
    
    if (teamType) {
      const members = await prisma.dynamicContentItem.findMany({
        where: { contentTypeId: teamType.id },
        select: { title: true, data: true }
      });
      
      members.forEach(member => {
        const data = typeof member.data === 'string' ? JSON.parse(member.data) : member.data;
        const imageUrl = data?.imageUrl || 'NO IMAGE';
        const isCDN = imageUrl.includes('ui-avatars.com');
        console.log(`${isCDN ? '✅' : '❌'} ${member.title}`);
        console.log(`   ${imageUrl.substring(0, 80)}...`);
      });
    }

    // Check Blog Posts
    console.log('\n=== BLOG POSTS IMAGES ===');
    const blogType = await prisma.contentType.findUnique({
      where: { name: 'blog' }
    });
    
    if (blogType) {
      const blogs = await prisma.dynamicContentItem.findMany({
        where: { contentTypeId: blogType.id },
        select: { title: true, data: true },
        take: 3
      });
      
      blogs.forEach(blog => {
        const data = typeof blog.data === 'string' ? JSON.parse(blog.data) : blog.data;
        const imageUrl = data?.imageUrl || 'NO IMAGE';
        const isCDN = imageUrl.includes('unsplash.com');
        console.log(`${isCDN ? '✅' : '❌'} ${blog.title}`);
        console.log(`   ${imageUrl.substring(0, 80)}...`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAllImages();

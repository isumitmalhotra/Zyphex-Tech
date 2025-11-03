import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkServices() {
  try {
    const servicesType = await prisma.contentType.findUnique({
      where: { name: 'services' }
    });

    if (!servicesType) {
      console.log('Services content type not found!');
      return;
    }

    const services = await prisma.dynamicContentItem.findMany({
      where: { contentTypeId: servicesType.id },
      select: {
        title: true,
        metadata: true
      }
    });

    console.log('\n=== CURRENT SERVICES IN DATABASE ===\n');
    services.forEach((service, index) => {
      const metadata = typeof service.metadata === 'string' 
        ? JSON.parse(service.metadata) 
        : service.metadata;
      
      console.log(`${index + 1}. ${service.title}`);
      console.log(`   Image: ${metadata.imageUrl || 'NO IMAGE'}`);
      console.log('');
    });

    console.log(`Total services: ${services.length}\n`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkServices();

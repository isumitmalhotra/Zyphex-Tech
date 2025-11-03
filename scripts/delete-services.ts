import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteServices() {
  try {
    console.log('Finding services content type...');
    const servicesType = await prisma.contentType.findUnique({
      where: { name: 'services' }
    });

    if (!servicesType) {
      console.log('Services content type not found - nothing to delete');
      return;
    }

    console.log(`Found services content type ID: ${servicesType.id}`);
    
    const deleteResult = await prisma.dynamicContentItem.deleteMany({
      where: { contentTypeId: servicesType.id }
    });

    console.log(`✅ Deleted ${deleteResult.count} service records`);

  } catch (error) {
    console.error('Error deleting services:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteServices();

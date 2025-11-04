import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDataStructure() {
  try {
    const contentType = await prisma.contentType.findFirst({
      where: { name: 'team_member' }
    });

    if (!contentType) {
      console.log('❌ team_member ContentType not found');
      return;
    }

    const members = await prisma.dynamicContentItem.findMany({
      where: { contentTypeId: contentType.id },
      orderBy: { order: 'asc' }
    });

    console.log(`\n📋 Raw data structure:\n`);

    for (const member of members) {
      console.log(`👤 ${member.title}`);
      console.log(`   Full data object:`, JSON.stringify(member.data, null, 2));
      console.log('');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDataStructure();

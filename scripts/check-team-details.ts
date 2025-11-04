import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTeamDetails() {
  try {
    // Get team_member ContentType
    const contentType = await prisma.contentType.findFirst({
      where: { name: 'team_member' }
    });

    if (!contentType) {
      console.log('❌ team_member ContentType not found');
      return;
    }

    // Get all team members
    const members = await prisma.dynamicContentItem.findMany({
      where: { contentTypeId: contentType.id },
      orderBy: { order: 'asc' }
    });

    console.log(`\n📋 Found ${members.length} team members:\n`);

    for (const member of members) {
      const data = member.data as any;
      console.log(`👤 ${member.title}`);
      console.log(`   Slug: ${member.slug}`);
      console.log(`   Image URL: ${data.imageUrl || 'NOT SET'}`);
      console.log(`   Role: ${data.role || 'NOT SET'}`);
      console.log(`   Status: ${member.status}`);
      console.log(`   Featured: ${member.featured}`);
      console.log('');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTeamDetails();

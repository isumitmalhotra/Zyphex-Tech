import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTeamMembers() {
  try {
    const teamType = await prisma.contentType.findUnique({
      where: { name: 'team_member' }
    });

    if (!teamType) {
      console.log('❌ team_member content type NOT FOUND');
      return;
    }

    console.log(`✅ Team Member Type ID: ${teamType.id}\n`);

    const members = await prisma.dynamicContentItem.findMany({
      where: { contentTypeId: teamType.id },
      select: {
        title: true,
        status: true,
        featured: true,
        data: true
      }
    });

    console.log(`Found ${members.length} team members:\n`);

    members.forEach((member, index) => {
      const data = typeof member.data === 'string' ? JSON.parse(member.data) : member.data;
      const imageUrl = data?.imageUrl || 'NO IMAGE';
      
      console.log(`${index + 1}. ${member.title}`);
      console.log(`   Status: ${member.status}`);
      console.log(`   Featured: ${member.featured}`);
      console.log(`   Image: ${imageUrl.substring(0, 70)}...`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTeamMembers();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteTeamMembers() {
  try {
    console.log('Finding team_member content type...');
    const teamType = await prisma.contentType.findUnique({
      where: { name: 'team_member' }
    });

    if (!teamType) {
      console.log('team_member content type not found - nothing to delete');
      return;
    }

    console.log(`Found team_member content type ID: ${teamType.id}`);
    
    const deleteResult = await prisma.dynamicContentItem.deleteMany({
      where: { contentTypeId: teamType.id }
    });

    console.log(`✅ Deleted ${deleteResult.count} team member records`);

  } catch (error) {
    console.error('Error deleting team members:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteTeamMembers();

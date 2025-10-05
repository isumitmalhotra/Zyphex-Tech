const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listAllProjects() {
  try {
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        managerId: true,
        manager: { select: { name: true, email: true } },
        client: { select: { name: true, email: true } }
      }
    });

    console.log('=== ALL PROJECTS IN DATABASE ===');
    projects.forEach((project, index) => {
      console.log(`${index + 1}. Project: "${project.name}"`);
      console.log(`   ID: ${project.id}`);
      console.log(`   Manager: ${project.manager?.name || 'None'} (${project.manager?.email || 'None'})`);
      console.log(`   Client: ${project.client?.name || 'None'}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

listAllProjects();
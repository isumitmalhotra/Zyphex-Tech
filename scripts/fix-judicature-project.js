const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixJudicatureProject() {
  try {
    console.log('Looking for Judicature project...');

    // Find the Judicature project
    const judicatureProject = await prisma.project.findFirst({
      where: { name: 'Judicature' }
    });

    if (!judicatureProject) {
      console.log('❌ Judicature project not found');
      return;
    }

    console.log('✅ Found Judicature project:', judicatureProject.id);

    // Find a project manager to assign
    const projectManager = await prisma.user.findFirst({
      where: { 
        role: { in: ['PROJECT_MANAGER', 'ADMIN', 'SUPER_ADMIN'] }
      }
    });

    if (!projectManager) {
      console.log('❌ No project manager found');
      return;
    }

    console.log('✅ Found project manager:', projectManager.name, projectManager.email);

    // Update the project to assign the manager
    const updatedProject = await prisma.project.update({
      where: { id: judicatureProject.id },
      data: { managerId: projectManager.id },
      include: {
        client: { select: { name: true, email: true } },
        manager: { select: { name: true, email: true } },
        users: { select: { name: true, email: true } }
      }
    });

    console.log('✅ Successfully updated Judicature project!');
    console.log('Project Details:');
    console.log('- Name:', updatedProject.name);
    console.log('- Manager:', updatedProject.manager?.name);
    console.log('- Client:', updatedProject.client?.name);
    console.log('- Status:', updatedProject.status);
    console.log('- Priority:', updatedProject.priority);
    console.log('');
    console.log('🎯 The Judicature project should now be visible in the Project Manager dashboard!');

  } catch (error) {
    console.error('❌ Error fixing Judicature project:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixJudicatureProject();
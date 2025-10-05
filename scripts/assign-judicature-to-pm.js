const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function assignJudicatureToProjectManager() {
  try {
    // Get Sarah Johnson (Project Manager)
    const projectManager = await prisma.user.findUnique({
      where: { email: 'manager@zyphextech.com' },
      select: { id: true, name: true, email: true, role: true }
    });

    if (!projectManager) {
      console.log('❌ Project Manager not found');
      return;
    }

    console.log(`📋 Found Project Manager: ${projectManager.name} (${projectManager.email})`);

    // Get the Judicature project (handle potential trailing spaces)
    const judicatureProject = await prisma.project.findFirst({
      where: { 
        name: {
          contains: 'Judicature'
        }
      },
      select: { id: true, name: true, managerId: true }
    });

    if (!judicatureProject) {
      console.log('❌ Judicature project not found');
      return;
    }

    console.log(`📋 Found Judicature project: ${judicatureProject.name}`);
    console.log(`📋 Current manager ID: ${judicatureProject.managerId}`);

    // Update the project to assign Sarah Johnson as manager
    const updatedProject = await prisma.project.update({
      where: { id: judicatureProject.id },
      data: { managerId: projectManager.id },
      include: {
        manager: { select: { name: true, email: true } },
        client: { select: { name: true, email: true } }
      }
    });

    console.log('✅ Successfully updated Judicature project');
    console.log(`📋 New manager: ${updatedProject.manager?.name} (${updatedProject.manager?.email})`);
    console.log(`📋 Client: ${updatedProject.client?.name} (${updatedProject.client?.email})`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

assignJudicatureToProjectManager();
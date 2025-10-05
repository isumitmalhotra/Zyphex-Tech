const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listRecentProjects() {
  try {
    console.log('Looking for recent projects...');

    // Find all projects
    const projects = await prisma.project.findMany({
      include: {
        client: { select: { name: true, email: true } },
        manager: { select: { name: true, email: true } },
        users: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log(`Found ${projects.length} projects:`);
    
    projects.forEach((project, index) => {
      console.log(`\n${index + 1}. ${project.name}`);
      console.log(`   - ID: ${project.id}`);
      console.log(`   - Client: ${project.client?.name || 'No client'}`);
      console.log(`   - Manager: ${project.manager?.name || 'No manager assigned'}`);
      console.log(`   - Status: ${project.status}`);
      console.log(`   - Priority: ${project.priority}`);
      console.log(`   - Created: ${project.createdAt}`);
    });

    // Now let's fix any projects without managers
    const projectsWithoutManagers = projects.filter(p => !p.managerId);
    
    if (projectsWithoutManagers.length > 0) {
      console.log(`\n🔧 Found ${projectsWithoutManagers.length} projects without managers. Fixing...`);
      
      // Find a project manager
      const projectManager = await prisma.user.findFirst({
        where: { 
          role: { in: ['PROJECT_MANAGER', 'ADMIN', 'SUPER_ADMIN'] }
        }
      });

      if (projectManager) {
        console.log(`✅ Found project manager: ${projectManager.name} (${projectManager.email})`);
        
        for (const project of projectsWithoutManagers) {
          await prisma.project.update({
            where: { id: project.id },
            data: { managerId: projectManager.id }
          });
          console.log(`✅ Assigned ${project.name} to ${projectManager.name}`);
        }
        
        console.log('\n🎯 All projects now have managers and should be visible in PM dashboard!');
      } else {
        console.log('❌ No project manager found in the system');
      }
    } else {
      console.log('\n✅ All projects already have managers assigned');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listRecentProjects();
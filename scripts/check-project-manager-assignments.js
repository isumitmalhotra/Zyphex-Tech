const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProjectAssignments() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        client: { select: { name: true, email: true } },
        manager: { select: { name: true, email: true } },
        users: { select: { name: true, email: true, role: true } }
      }
    });
    
    console.log('=== PROJECT ASSIGNMENTS ===');
    projects.forEach(project => {
      console.log(`Project: ${project.name}`);
      console.log(`  Manager ID: ${project.managerId}`);
      console.log(`  Manager: ${project.manager?.name || 'None'} (${project.manager?.email || 'None'})`);
      console.log(`  Client: ${project.client?.name || 'None'} (${project.client?.email || 'None'})`);
      console.log(`  Team Members: ${project.users.map(u => `${u.name} (${u.role})`).join(', ')}`);
      console.log('---');
    });
    
    const managers = await prisma.user.findMany({
      where: { role: 'PROJECT_MANAGER' },
      select: { id: true, name: true, email: true }
    });
    
    console.log('\n=== PROJECT MANAGERS ===');
    managers.forEach(manager => {
      console.log(`${manager.name} (${manager.email}) - ID: ${manager.id}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkProjectAssignments();
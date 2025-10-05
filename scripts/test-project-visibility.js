const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testProjectVisibility() {
  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true }
    });
    
    console.log('=== PROJECT VISIBILITY TEST ===\n');
    
    for (const user of users) {
      console.log(`Testing for: ${user.name} (${user.role})`);
      console.log(`Email: ${user.email}`);
      console.log(`ID: ${user.id}`);
      
      // Simulate the API logic for each user type
      let projects;
      
      if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'PROJECT_MANAGER') {
        // Regular users - only projects they're assigned to
        projects = await prisma.project.findMany({
          where: {
            users: {
              some: {
                id: user.id
              }
            }
          },
          select: { id: true, name: true, managerId: true }
        });
      } else if (user.role === 'PROJECT_MANAGER') {
        // Project managers - projects they manage OR are assigned to
        projects = await prisma.project.findMany({
          where: {
            OR: [
              { managerId: user.id },
              { 
                users: {
                  some: {
                    id: user.id
                  }
                }
              }
            ]
          },
          select: { id: true, name: true, managerId: true }
        });
      } else {
        // Admins/Super admins - all projects
        projects = await prisma.project.findMany({
          select: { id: true, name: true, managerId: true }
        });
      }
      
      console.log(`  Can see ${projects.length} projects:`);
      projects.forEach(project => {
        const isManager = project.managerId === user.id;
        console.log(`    - ${project.name} ${isManager ? '(MANAGER)' : '(TEAM MEMBER)'}`);
      });
      console.log('---\n');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testProjectVisibility();
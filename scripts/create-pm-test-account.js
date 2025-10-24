const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createPMTestAccount() {
  try {
    console.log('Creating Project Manager test account...');

    // Check if account already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'pm.test@zyphex.tech' }
    });

    if (existingUser) {
      console.log('❌ Project Manager test account already exists with email: pm.test@zyphex.tech');
      console.log('User details:', {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role
      });
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('PMTest123!', 12);

    // Create the Project Manager test account
    const pmTestUser = await prisma.user.create({
      data: {
        email: 'pm.test@zyphex.tech',
        name: 'PM Test Account',
        password: hashedPassword,
        role: 'PROJECT_MANAGER',
        hourlyRate: 75.00,
        timezone: 'America/New_York',
        skills: [
          'Project Management',
          'Agile/Scrum',
          'Team Leadership',
          'Budget Management',
          'Risk Management',
          'Stakeholder Communication'
        ],
        availability: {
          monday: { start: '09:00', end: '17:00', available: true },
          tuesday: { start: '09:00', end: '17:00', available: true },
          wednesday: { start: '09:00', end: '17:00', available: true },
          thursday: { start: '09:00', end: '17:00', available: true },
          friday: { start: '09:00', end: '17:00', available: true },
          saturday: { start: null, end: null, available: false },
          sunday: { start: null, end: null, available: false }
        }
      }
    });

    // Create a ResourceProfile for the PM
    const resourceProfile = await prisma.resourceProfile.create({
      data: {
        userId: pmTestUser.id,
        skills: JSON.stringify([
          'Project Management',
          'Agile/Scrum',
          'Team Leadership',
          'Budget Management',
          'Risk Management'
        ]),
        hourlyRate: 75.00,
        currency: 'USD',
        capacity: 40, // 40 hours per week
        availability: JSON.stringify({
          monday: { start: '09:00', end: '17:00', available: true },
          tuesday: { start: '09:00', end: '17:00', available: true },
          wednesday: { start: '09:00', end: '17:00', available: true },
          thursday: { start: '09:00', end: '17:00', available: true },
          friday: { start: '09:00', end: '17:00', available: true },
          saturday: { start: null, end: null, available: false },
          sunday: { start: null, end: null, available: false }
        }),
        timezone: 'America/New_York',
        bio: 'Experienced Project Manager with 10+ years in software development projects',
        certifications: JSON.stringify([
          'PMP (Project Management Professional)',
          'Certified ScrumMaster (CSM)',
          'Agile Project Management'
        ]),
        languages: JSON.stringify(['English', 'Spanish']),
        yearsExperience: 10,
        isAvailable: true
      }
    });

    console.log('✅ Project Manager test account created successfully!');
    console.log('');
    console.log('📋 Account Details:');
    console.log('Email: pm.test@zyphex.tech');
    console.log('Password: PMTest123!');
    console.log('Role: PROJECT_MANAGER');
    console.log('Name: PM Test Account');
    console.log('Hourly Rate: $75.00');
    console.log('User ID:', pmTestUser.id);
    console.log('Resource Profile ID:', resourceProfile.id);
    console.log('');
    console.log('🔐 Login Instructions:');
    console.log('1. Go to the login page');
    console.log('2. Use email: pm.test@zyphex.tech');
    console.log('3. Use password: PMTest123!');
    console.log('4. You should be logged in as a Project Manager');
    console.log('');
    console.log('🚀 The account has full PROJECT_MANAGER permissions including:');
    console.log('   - Project creation and management');
    console.log('   - Team member assignment');
    console.log('   - Time tracking oversight');
    console.log('   - Financial reporting access');
    console.log('   - Client communication');

  } catch (error) {
    console.error('❌ Error creating Project Manager test account:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createPMTestAccount();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createResourceProfile() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'pm.test@zyphex.tech' }
    });

    if (!user) {
      console.log('❌ PM Test Account not found');
      return;
    }

    // Check if profile already exists
    const existingProfile = await prisma.resourceProfile.findUnique({
      where: { userId: user.id }
    });

    if (existingProfile) {
      console.log('✅ Resource Profile already exists');
      console.log('Profile ID:', existingProfile.id);
      return;
    }

    // Create ResourceProfile
    const profile = await prisma.resourceProfile.create({
      data: {
        userId: user.id,
        skills: JSON.stringify([
          'Project Management',
          'Agile/Scrum',
          'Team Leadership',
          'Budget Management',
          'Risk Management',
          'Stakeholder Communication'
        ]),
        hourlyRate: 75.00,
        currency: 'USD',
        capacity: 40,
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
        bio: 'Experienced Project Manager with 10+ years in software development projects. Specialized in Agile methodologies and team leadership.',
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

    console.log('✅ Resource Profile created successfully!');
    console.log('Profile ID:', profile.id);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createResourceProfile();

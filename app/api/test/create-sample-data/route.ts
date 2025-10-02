import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const existingProjects = await prisma.project.count();
    if (existingProjects > 0) {
      return NextResponse.json({ message: 'Test data already exists', count: existingProjects });
    }

    let client = await prisma.client.findFirst();
    if (!client) {
      client = await prisma.client.create({
        data: {
          name: 'Demo Client Company',
          email: 'client@democompany.com',
          phone: '+1-555-0123',
          address: '123 Business St, Demo City, DC 12345',
          company: 'Demo Company Inc.',
          website: 'https://democompany.com'
        }
      });
    }

    const projectManager = await prisma.user.findFirst({
      where: { email: 'pm.john@zyphextech.com' }
    });

    if (!projectManager) {
      return NextResponse.json({ error: 'Project manager user not found' }, { status: 404 });
    }

    const sampleProjects = [
      {
        name: 'E-commerce Platform Development',
        description: 'Complete e-commerce platform with React and Node.js',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        methodology: 'AGILE',
        budget: 75000,
        budgetUsed: 35000,
        hourlyRate: 100,
        startDate: new Date('2024-09-01'),
        endDate: new Date('2024-12-31'),
        estimatedHours: 750,
        actualHours: 350,
        completionRate: 47,
        clientId: client.id,
        managerId: projectManager.id
      }
    ];

    const createdProjects = await Promise.all(
      sampleProjects.map(project => 
        prisma.project.create({ data: project })
      )
    );

    return NextResponse.json({ 
      message: 'Test data created successfully',
      projects: createdProjects.length,
      client: client.name 
    });

  } catch (error) {
    console.error('Error creating test data:', error);
    return NextResponse.json(
      { error: 'Failed to create test data' },
      { status: 500 }
    );
  }
}

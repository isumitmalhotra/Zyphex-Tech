import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withPermissions } from '@/lib/auth/middleware';
import { Permission } from '@/lib/auth/permissions';

export const GET = withPermissions([Permission.VIEW_PROJECTS])(async (_request) => {
  try {

    const projects = await prisma.project.findMany({
      where: { deletedAt: null },
      include: {
        client: { select: { id: true, name: true, email: true } },
        users: { select: { id: true, name: true, email: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({ projects });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
})

export const POST = withPermissions([Permission.CREATE_PROJECT])(async (request) => {
  try {
    const body = await request.json();
    const {
      name,
      description,
      clientId,
      managerId,
      status = 'PLANNING',
      priority = 'MEDIUM',
      budget,
      hourlyRate,
      startDate,
      endDate,
      estimatedHours,
    } = body;

    // Validate required fields
    if (!name || !clientId || !budget || !hourlyRate) {
      return NextResponse.json(
        { error: 'Project name, client, budget, and hourly rate are required' },
        { status: 400 }
      );
    }

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Invalid client selected' },
        { status: 400 }
      );
    }

    // Create the project
    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        clientId,
        managerId: managerId || null,
        status,
        priority,
        budget: parseFloat(budget),
        hourlyRate: parseFloat(hourlyRate),
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        estimatedHours: estimatedHours ? parseInt(estimatedHours) : null,
      },
      include: {
        client: { select: { id: true, name: true, email: true } },
        users: { select: { id: true, name: true, email: true } }
      }
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
})

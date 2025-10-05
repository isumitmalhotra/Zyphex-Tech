import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Prisma, ProjectStatus } from '@prisma/client';

// GET /api/projects - Get all projects
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const clientId = searchParams.get('clientId');
    
    // Build filter conditions
    const where: Prisma.ProjectWhereInput = {};
    
    // Handle multiple status values (comma-separated)
    if (statusParam) {
      if (statusParam.includes(',')) {
        // Multiple statuses
        const statusArray = statusParam.split(',').map(s => s.trim()) as ProjectStatus[];
        where.status = { in: statusArray };
      } else {
        // Single status
        where.status = statusParam as ProjectStatus;
      }
    }
    
    if (clientId) where.clientId = clientId;

    // Get projects based on user role
    const userRole = session.user.role;
    const userId = session.user.id;

    // If user is not an admin, super admin, or project manager, only show projects they are part of
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && userRole !== 'PROJECT_MANAGER') {
      const projects = await prisma.project.findMany({
        where: {
          ...where,
          users: {
            some: {
              id: userId
            }
          }
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          teams: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      
      return NextResponse.json({ projects });
    }

    // For PROJECT_MANAGER, show projects they manage OR are assigned to
    if (userRole === 'PROJECT_MANAGER') {
      const projects = await prisma.project.findMany({
        where: {
          ...where,
          OR: [
            { managerId: userId }, // Projects they manage
            { 
              users: {
                some: {
                  id: userId
                }
              }
            } // Projects they are assigned to as team members
          ]
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          teams: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      
      return NextResponse.json({ projects });
    }
    
    // For admin and super admin, show all projects
    const projects = await prisma.project.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        teams: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin and manager can create projects
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const body = await request.json();
    const { name, description, status, budget, startDate, endDate, clientId, userIds, teamIds } = body;
    
    // Validate required fields
    if (!name || !clientId) {
      return NextResponse.json(
        { error: 'Name and client ID are required' },
        { status: 400 }
      );
    }
    
    // Check if client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });
    
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }
    
    // Create project with relationships
    const project = await prisma.project.create({
      data: {
        name,
        description,
        status: status || 'PLANNING',
        budget: budget ? parseFloat(budget) : 0,
        hourlyRate: 100, // Default hourly rate
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        client: {
          connect: { id: clientId },
        },
        users: userIds && userIds.length > 0 ? {
          connect: userIds.map((id: string) => ({ id })),
        } : undefined,
        teams: teamIds && teamIds.length > 0 ? {
          connect: teamIds.map((id: string) => ({ id })),
        } : undefined,
      },
      include: {
        client: true,
        users: true,
        teams: true,
      },
    });
    
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
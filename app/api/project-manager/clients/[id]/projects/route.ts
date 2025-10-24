import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/project-manager/clients/[id]/projects - Get all projects for a client
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');

    const where: { 
      clientId: string; 
      deletedAt: null; 
      status?: unknown;
    } = {
      clientId: params.id,
      deletedAt: null,
    };

    if (statusParam && statusParam !== 'all') {
      where.status = statusParam;
    }

    const projects = await prisma.project.findMany({
      // @ts-expect-error - Dynamic where clause
      where,
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        tasks: {
          where: { deletedAt: null },
          select: {
            id: true,
            status: true,
          },
        },
        teamMembers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            tasks: {
              where: { deletedAt: null },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Add calculated fields
    const projectsWithStats = projects.map((project) => {
      const tasks = 'tasks' in project ? (project.tasks as Array<{ status: string }>) : [];
      const completedTasks = tasks.filter((t) => t.status === 'DONE').length;
      const totalTasks = tasks.length;
      const taskCompletionRate =
        totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      return {
        ...project,
        taskCompletionRate: Math.round(taskCompletionRate),
        totalTasks,
        completedTasks,
        budgetUtilization:
          project.budget > 0
            ? Math.round((project.budgetUsed / project.budget) * 100)
            : 0,
      };
    });

    return NextResponse.json(projectsWithStats);
  } catch (error) {
    console.error('Error fetching client projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/project-manager/clients/[id]/projects - Create project for client
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      description,
      budget,
      hourlyRate,
      startDate,
      endDate,
      managerId,
      priority,
      methodology,
    } = body;

    // Validation
    if (!name || !budget || !hourlyRate) {
      return NextResponse.json(
        { error: 'Name, budget, and hourly rate are required' },
        { status: 400 }
      );
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        name,
        description,
        budget: parseFloat(budget),
        hourlyRate: parseFloat(hourlyRate),
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        priority: priority || 'MEDIUM',
        methodology: methodology || 'AGILE',
        clientId: params.id,
        managerId: managerId || session.user.id,
        status: 'PLANNING',
      },
      include: {
        client: true,
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
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

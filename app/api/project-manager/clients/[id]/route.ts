import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/project-manager/clients/[id] - Get client details
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        projects: {
          where: { deletedAt: null },
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
            _count: {
              select: {
                tasks: {
                  where: { deletedAt: null },
                },
              },
            },
          },
        },
        contactLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!client || client.deletedAt) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Calculate project stats
    const projectStats = (client.projects || []).map((project: {
      tasks: Array<{ id: string; status: string }>;
      [key: string]: unknown;
    }) => {
      const completedTasks = project.tasks.filter(
        (t: { status: string }) => t.status === 'DONE'
      ).length;
      const totalTasks = project.tasks.length;
      const taskCompletionRate =
        totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      return {
        ...project,
        taskCompletionRate: Math.round(taskCompletionRate),
        totalTasks,
        completedTasks,
      };
    });

    return NextResponse.json({
      ...client,
      projects: projectStats,
    });
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client' },
      { status: 500 }
    );
  }
}

// PATCH /api/project-manager/clients/[id] - Update client
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, phone, company, address, notes, website, timezone } = body;

    const client = await prisma.client.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone !== undefined && { phone }),
        ...(company !== undefined && { company }),
        ...(address !== undefined && { address }),
        ...(website !== undefined && { website }),
        ...(timezone !== undefined && { timezone }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    );
  }
}

// DELETE /api/project-manager/clients/[id] - Soft delete client
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Soft delete
    const client = await prisma.client.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true, client });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    );
  }
}

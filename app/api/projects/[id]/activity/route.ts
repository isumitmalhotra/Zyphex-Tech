import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = params.id;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has access to this project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { managerId: user.id },
          { clientId: user.id },
          { users: { some: { id: user.id } } }
        ]
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }

    // Generate activity feed from recent project data
    const activities = [];

    // Recent task updates
    const recentTasks = await prisma.task.findMany({
      where: {
        projectId: projectId,
        updatedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      include: {
        assignee: { select: { id: true, name: true, email: true, image: true } },
        creator: { select: { id: true, name: true, email: true, image: true } }
      },
      orderBy: { updatedAt: 'desc' },
      take: 10
    });

    for (const task of recentTasks) {
      const isNewTask = task.createdAt.getTime() === task.updatedAt.getTime();
      
      activities.push({
        id: `task_${task.id}_${task.updatedAt.getTime()}`,
        type: isNewTask ? 'task_created' : 
              task.status === 'DONE' ? 'task_completed' : 'task_updated',
        title: isNewTask ? 'New Task Created' : 
               task.status === 'DONE' ? 'Task Completed' : 'Task Updated',
        description: `${(task.assignee || task.creator)?.name || 'Someone'} ${
          isNewTask ? 'created' :
          task.status === 'DONE' ? 'completed' : 'updated'
        } "${task.title}"`,
        timestamp: task.updatedAt.toISOString(),
        user: task.assignee || task.creator || {
          id: 'unknown',
          name: 'Unknown User',
          email: '',
          image: null
        },
        data: { task, isNewTask },
        projectId
      });
    }

    // Recent milestones
    const recentMilestones = await prisma.projectMilestone.findMany({
      where: {
        projectId: projectId,
        updatedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
    });

    for (const milestone of recentMilestones) {
      const isNewMilestone = milestone.createdAt.getTime() === milestone.updatedAt.getTime();
      
      activities.push({
        id: `milestone_${milestone.id}_${milestone.updatedAt.getTime()}`,
        type: isNewMilestone ? 'milestone_created' : 'milestone_updated',
        title: isNewMilestone ? 'New Milestone Created' : 'Milestone Updated',
        description: `Someone ${
          isNewMilestone ? 'created' : 'updated'
        } milestone "${milestone.title}"`,
        timestamp: milestone.updatedAt.toISOString(),
        user: {
          id: 'system',
          name: 'System',
          email: '',
          image: null
        },
        data: { milestone, isNewMilestone },
        projectId
      });
    }

    // Recent messages
    const recentMessages = await prisma.message.findMany({
      where: {
        projectId: projectId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        sender: { select: { id: true, name: true, email: true, image: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    for (const message of recentMessages) {
      activities.push({
        id: `message_${message.id}_${message.createdAt.getTime()}`,
        type: 'message_sent',
        title: 'New Message',
        description: `${message.sender?.name || 'Someone'} sent a message: "${
          message.content.length > 50 ? message.content.substring(0, 50) + '...' : message.content
        }"`,
        timestamp: message.createdAt.toISOString(),
        user: message.sender || {
          id: 'unknown',
          name: 'Unknown User',
          email: '',
          image: null
        },
        data: { message },
        projectId
      });
    }

    // Sort all activities by timestamp (newest first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      activities: activities.slice(0, 20), // Return latest 20 activities
      success: true
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
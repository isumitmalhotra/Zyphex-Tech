import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { triggerProjectWorkflows } from '@/lib/workflow/trigger-helper';
import { TriggerType } from '@/types/workflow';

// GET /api/projects/[id] - Get project by ID
// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        users: true,
        teams: true,
      },
    });
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(project);
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, description, status, budget, startDate, endDate, clientId, userIds, teamIds } = body;
    
    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id },
      include: {
        users: true,
        teams: true,
      },
    });
    
    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Prepare update data
    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;
    if (budget !== undefined && budget) updateData.budget = parseFloat(budget);
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (clientId) {
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
      
      updateData.client = {
        connect: { id: clientId },
      };
    }
    
    // Handle user connections/disconnections
    if (userIds) {
      // Get current user IDs
      const currentUserIds = existingProject.users.map((user: { id: string }) => user.id);
      
      // Disconnect users not in the new list
      const usersToDisconnect = currentUserIds.filter((id: string) => !userIds.includes(id));
      
      // Connect new users
      const usersToConnect = userIds.filter((id: string) => !currentUserIds.includes(id));
      
      if (usersToDisconnect.length > 0) {
        updateData.users = {
          disconnect: usersToDisconnect.map((id: string) => ({ id })),
          ...(updateData.users || {}),
        };
      }
      
      if (usersToConnect.length > 0) {
        updateData.users = {
          connect: usersToConnect.map((id: string) => ({ id })),
          ...(updateData.users || {}),
        };
      }
    }
    
    // Handle team connections/disconnections
    if (teamIds) {
      // Get current team IDs
      const currentTeamIds = existingProject.teams.map((team: { id: string }) => team.id);
      
      // Disconnect teams not in the new list
      const teamsToDisconnect = currentTeamIds.filter((id: string) => !teamIds.includes(id));
      
      // Connect new teams
      const teamsToConnect = teamIds.filter((id: string) => !currentTeamIds.includes(id));
      
      if (teamsToDisconnect.length > 0) {
        updateData.teams = {
          disconnect: teamsToDisconnect.map((id: string) => ({ id })),
          ...(updateData.teams || {}),
        };
      }
      
      if (teamsToConnect.length > 0) {
        updateData.teams = {
          connect: teamsToConnect.map((id: string) => ({ id })),
          ...(updateData.teams || {}),
        };
      }
    }
    
    // Update project
    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        users: true,
        teams: true,
      },
    });
    
    // Get session for user ID
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || 'system';
    
    // Track what changed for workflows
    const changes: Record<string, unknown> = {}
    if (status && status !== existingProject.status) {
      changes.status = { from: existingProject.status, to: status }
      
      // Trigger PROJECT_STATUS_CHANGED workflow
      triggerProjectWorkflows(
        TriggerType.PROJECT_STATUS_CHANGED,
        updatedProject.id,
        {
          name: updatedProject.name,
          status: updatedProject.status,
          previousStatus: existingProject.status,
          clientId: updatedProject.clientId,
          clientName: updatedProject.client.name,
          clientEmail: updatedProject.client.email,
        },
        userId,
        changes
      ).catch((error) => {
        console.error('Failed to trigger status change workflow:', error)
      })
    }
    
    // Check budget threshold trigger
    if (budget && budget !== existingProject.budget) {
      changes.budget = { from: existingProject.budget, to: budget }
      
      // Could trigger PROJECT_BUDGET_THRESHOLD here based on spent/total ratio
      // This would require additional budget tracking logic
    }
    
    return NextResponse.json(updatedProject);
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id },
    });
    
    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Delete project
    await prisma.project.delete({
      where: { id },
    });
    
    return NextResponse.json(
      { message: 'Project deleted successfully' },
      { status: 200 }
    );
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
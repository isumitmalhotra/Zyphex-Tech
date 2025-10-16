import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
  } catch (error) {
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
    const updateData: any = {};
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
      const currentUserIds = existingProject.users.map((user: any) => user.id);
      
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
      const currentTeamIds = existingProject.teams.map((team: any) => team.id);
      
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
    
    return NextResponse.json(updatedProject);
  } catch (error) {
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
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
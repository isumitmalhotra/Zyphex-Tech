import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/teams/[id] - Get team by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        users: true,
        projects: true,
      },
    });
    
    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(team);
  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team' },
      { status: 500 }
    );
  }
}

// PUT /api/teams/[id] - Update team
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, description, userIds, projectIds } = body;
    
    // Check if team exists
    const existingTeam = await prisma.team.findUnique({
      where: { id },
      include: {
        users: true,
        projects: true,
      },
    });
    
    if (!existingTeam) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }
    
    // Prepare update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    
    // Handle user connections/disconnections
    if (userIds) {
      // Get current user IDs
      const currentUserIds = existingTeam.users.map((user: any) => user.id);
      
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
    
    // Handle project connections/disconnections
    if (projectIds) {
      // Get current project IDs
      const currentProjectIds = existingTeam.projects.map((project: any) => project.id);
      
      // Disconnect projects not in the new list
      const projectsToDisconnect = currentProjectIds.filter((id: string) => !projectIds.includes(id));
      
      // Connect new projects
      const projectsToConnect = projectIds.filter((id: string) => !currentProjectIds.includes(id));
      
      if (projectsToDisconnect.length > 0) {
        updateData.projects = {
          disconnect: projectsToDisconnect.map((id: string) => ({ id })),
          ...(updateData.projects || {}),
        };
      }
      
      if (projectsToConnect.length > 0) {
        updateData.projects = {
          connect: projectsToConnect.map((id: string) => ({ id })),
          ...(updateData.projects || {}),
        };
      }
    }
    
    // Update team
    const updatedTeam = await prisma.team.update({
      where: { id },
      data: updateData,
      include: {
        users: true,
        projects: true,
      },
    });
    
    return NextResponse.json(updatedTeam);
  } catch (error) {
    console.error('Error updating team:', error);
    return NextResponse.json(
      { error: 'Failed to update team' },
      { status: 500 }
    );
  }
}

// DELETE /api/teams/[id] - Delete team
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Check if team exists
    const existingTeam = await prisma.team.findUnique({
      where: { id },
    });
    
    if (!existingTeam) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }
    
    // Delete team
    await prisma.team.delete({
      where: { id },
    });
    
    return NextResponse.json(
      { message: 'Team deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json(
      { error: 'Failed to delete team' },
      { status: 500 }
    );
  }
}
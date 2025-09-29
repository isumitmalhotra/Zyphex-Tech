import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withPermissions } from '@/lib/auth/middleware';
import { Permission } from '@/lib/auth/permissions';

export const GET = withPermissions([Permission.VIEW_TEAMS])(async (_request) => {
  try {

    const teamMembers = await prisma.user.findMany({
      where: {
        deletedAt: null,
        role: { in: ['TEAM_MEMBER', 'PROJECT_MANAGER', 'ADMIN', 'SUPER_ADMIN'] }
      },
      include: {
        teamMemberships: {
          include: {
            project: { select: { id: true, name: true, status: true } }
          }
        },
        _count: {
          select: { 
            timeEntries: true,
            assignedTasks: true 
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ teamMembers });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
  }
})

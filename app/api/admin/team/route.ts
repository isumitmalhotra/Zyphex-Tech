import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamMembers = await prisma.user.findMany({
      where: {
        deletedAt: null,
        role: { in: ['DEVELOPER', 'MANAGER', 'ADMIN'] }
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
}

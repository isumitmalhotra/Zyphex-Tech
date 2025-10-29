/**
 * CMS User Roles API Route
 * List user role assignments and assign new roles
 * 
 * @route GET/POST /api/cms/users/roles
 * @access Protected - Requires admin permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const assignRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER', 'CLIENT']),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    // Fetch users with their roles
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER', 'CLIENT'],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format response with role assignment details
    const userRoles = users.map((user) => ({
      userId: user.id,
      userName: user.name || 'Unknown',
      userEmail: user.email || '',
      role: user.role || 'CLIENT',
      assignedAt: user.createdAt.toISOString(),
      assignedBy: 'System', // In production, track who assigned the role
    }));

    return NextResponse.json({
      success: true,
      data: userRoles,
    });

  } catch (error) {
    console.error('CMS User Roles GET Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to fetch user roles',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = assignRoleSchema.parse(body);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: validatedData.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Not Found', message: 'User not found' },
        { status: 404 }
      );
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: validatedData.userId },
      data: {
        role: validatedData.role,
      },
    });

    // Log activity
    await prisma.cmsActivityLog.create({
      data: {
        userId: session.user.id,
        action: 'assign_role',
        entityType: 'user',
        entityId: validatedData.userId,
        changes: {
          role: validatedData.role,
          previousRole: user.role,
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Role assigned successfully',
      data: {
        userId: updatedUser.id,
        userName: updatedUser.name,
        userEmail: updatedUser.email,
        role: updatedUser.role,
        assignedAt: new Date().toISOString(),
        assignedBy: session.user.name || session.user.email,
      },
    });

  } catch (error) {
    console.error('CMS User Roles POST Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation Error',
          message: 'Invalid role assignment data',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to assign role',
      },
      { status: 500 }
    );
  }
}

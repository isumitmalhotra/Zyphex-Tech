/**
 * CMS User Role Revoke API Route
 * Revoke a user's role assignment
 * 
 * @route DELETE /api/cms/users/[userId]/roles
 * @access Protected - Requires admin permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    userId: string;
  };
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    const { userId } = params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Not Found', message: 'User not found' },
        { status: 404 }
      );
    }

    // Reset to default role (client)
    const previousRole = user.role;
    await prisma.user.update({
      where: { id: userId },
      data: {
        role: 'CLIENT',
      },
    });

    // Log activity
    await prisma.cmsActivityLog.create({
      data: {
        userId: session.user.id,
        action: 'revoke_role',
        entityType: 'user',
        entityId: userId,
        changes: {
          previousRole,
          newRole: 'CLIENT',
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Role revoked successfully',
    });

  } catch (error) {
    console.error('CMS User Role DELETE Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to revoke role',
      },
      { status: 500 }
    );
  }
}

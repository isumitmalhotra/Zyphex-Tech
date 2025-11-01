import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withPermissions, AuthenticatedRequest } from '@/lib/auth/middleware';
import { Permission } from '@/lib/auth/permissions';

interface RouteContext {
  params: {
    id: string;
  };
}

// PATCH - Toggle user active status
export const PATCH = withPermissions([Permission.UPDATE_USER])(
  async (request: AuthenticatedRequest, context?: RouteContext) => {
    try {
      const { id } = context!.params;
      const body = await request.json();
      const { active } = body;

      if (!id) {
        return NextResponse.json(
          { success: false, error: 'User ID is required' },
          { status: 400 }
        );
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      // Prevent self-deactivation
      if (id === request.user.id && !active) {
        return NextResponse.json(
          { success: false, error: 'You cannot deactivate your own account' },
          { status: 400 }
        );
      }

      // Update user status
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          deletedAt: active ? null : new Date(),
        },
        select: {
          id: true,
          name: true,
          email: true,
          deletedAt: true,
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: request.user.id,
          action: 'UPDATE',
          entityType: 'USER',
          entityId: id,
          changes: JSON.stringify({
            statusChange: active ? 'activated' : 'deactivated',
          }),
        },
      });

      return NextResponse.json({
        success: true,
        data: updatedUser,
        message: `User ${active ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update user status' },
        { status: 500 }
      );
    }
  }
);

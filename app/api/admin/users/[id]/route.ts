import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withPermissions, AuthenticatedRequest } from '@/lib/auth/middleware';
import { Permission } from '@/lib/auth/permissions';
import { hash } from 'bcryptjs';

interface RouteContext {
  params: {
    id: string;
  };
}

// GET - Fetch single user by ID
export const GET = withPermissions([Permission.VIEW_USERS])(
  async (request: AuthenticatedRequest, context?: RouteContext) => {
    try {
      const { id } = context!.params;

      if (!id) {
        return NextResponse.json(
          { success: false, error: 'User ID is required' },
          { status: 400 }
        );
      }

      // Fetch user with related data
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
          skills: true,
          hourlyRate: true,
          timezone: true,
          createdAt: true,
          updatedAt: true,
          emailVerified: true,
          deletedAt: true,
          _count: {
            select: {
              projects: true,
              assignedTasks: true,
              timeEntries: true,
            },
          },
        },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      // Get additional stats
      const [completedTasks, activeProjects, totalHours, recentActivity] = await Promise.all([
        prisma.task.count({
          where: {
            assigneeId: user.id,
            status: 'DONE',
          },
        }),
        prisma.project.count({
          where: {
            users: { some: { id: user.id } },
            status: { in: ['PLANNING', 'IN_PROGRESS', 'REVIEW'] },
          },
        }),
        prisma.timeEntry.aggregate({
          where: {
            userId: user.id,
            date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
          _sum: { hours: true },
        }),
        prisma.activityLog.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            action: true,
            entityType: true,
            entityId: true,
            createdAt: true,
          },
        }),
      ]);

      // Combine user data with stats
      const userData = {
        ...user,
        stats: {
          totalProjects: user._count.projects,
          totalTasks: user._count.assignedTasks,
          completedTasks,
          activeProjects,
          totalHoursLastMonth: Number(totalHours._sum?.hours || 0),
          taskCompletionRate:
            user._count.assignedTasks > 0
              ? Math.round((completedTasks / user._count.assignedTasks) * 100)
              : 0,
        },
        recentActivity,
      };

      return NextResponse.json(userData);
    } catch (error) {
      console.error('Error fetching user:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user' },
        { status: 500 }
      );
    }
  }
);

// PATCH - Update single user
export const PATCH = withPermissions([Permission.UPDATE_USER])(
  async (request: AuthenticatedRequest, context?: RouteContext) => {
    try {
      const { id } = context!.params;
      const body = await request.json();
      const { name, email, role, skills, hourlyRate, timezone, image, password } = body;

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

      // Check if email is being changed and already exists
      if (email && email !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({
          where: { email },
        });

        if (emailExists) {
          return NextResponse.json(
            { success: false, error: 'Email already in use' },
            { status: 400 }
          );
        }
      }

      // Prepare update data
      const updateData: {
        name?: string;
        email?: string;
        role?: 'SUPER_ADMIN' | 'ADMIN' | 'PROJECT_MANAGER' | 'TEAM_MEMBER' | 'CLIENT';
        skills?: string[] | null;
        hourlyRate?: number | null;
        timezone?: string | null;
        image?: string | null;
        password?: string;
      } = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (role !== undefined) updateData.role = role as 'SUPER_ADMIN' | 'ADMIN' | 'PROJECT_MANAGER' | 'TEAM_MEMBER' | 'CLIENT';
      if (skills !== undefined) updateData.skills = skills; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate ? parseFloat(hourlyRate) : null;
      if (timezone !== undefined) updateData.timezone = timezone;
      if (image !== undefined) updateData.image = image;
      
      // Hash password if provided
      if (password) {
        updateData.password = await hash(password, 12);
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData as Record<string, unknown>,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
          skills: true,
          hourlyRate: true,
          timezone: true,
          updatedAt: true,
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: request.user.id,
          action: 'UPDATE',
          entityType: 'USER',
          entityId: id,
          changes: JSON.stringify({ updated: updateData }),
        },
      });

      return NextResponse.json({
        success: true,
        data: updatedUser,
        message: 'User updated successfully',
      });
    } catch (error) {
      console.error('Error updating user:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update user' },
        { status: 500 }
      );
    }
  }
);

// DELETE - Delete user (soft delete)
export const DELETE = withPermissions([Permission.DELETE_USER])(
  async (request: AuthenticatedRequest, context?: RouteContext) => {
    try {
      const { id } = context!.params;

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

      // Prevent self-deletion
      if (id === request.user.id) {
        return NextResponse.json(
          { success: false, error: 'You cannot delete your own account' },
          { status: 400 }
        );
      }

      // Soft delete user
      await prisma.user.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: request.user.id,
          action: 'DELETE',
          entityType: 'USER',
          entityId: id,
          changes: JSON.stringify({ deleted: { id, email: existingUser.email } }),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete user' },
        { status: 500 }
      );
    }
  }
);

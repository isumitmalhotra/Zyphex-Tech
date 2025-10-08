import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withPermissions } from '@/lib/auth/middleware';
import { Permission } from '@/lib/auth/permissions';
import { hash } from 'bcryptjs';

export const GET = withPermissions([Permission.VIEW_USERS])(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions: any = {
      deletedAt: null
    };

    if (role) {
      whereConditions.role = role.toUpperCase();
    }

    if (search) {
      whereConditions.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get users with pagination
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereConditions,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          skills: true,
          hourlyRate: true,
          timezone: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              projects: true,
              assignedTasks: true,
              timeEntries: true
            }
          }
        },
        orderBy: [
          { role: 'asc' },
          { name: 'asc' }
        ],
        skip: offset,
        take: limit
      }),
      prisma.user.count({ where: whereConditions })
    ]);

    // Get additional stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const [completedTasks, activeProjects, totalHours] = await Promise.all([
          prisma.task.count({
            where: {
              assigneeId: user.id,
              status: 'DONE'
            }
          }),
          prisma.project.count({
            where: {
              users: { some: { id: user.id } },
              status: { in: ['PLANNING', 'IN_PROGRESS', 'REVIEW'] }
            }
          }),
          prisma.timeEntry.aggregate({
            where: {
              userId: user.id,
              date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            },
            _sum: { hours: true }
          })
        ]);

        return {
          ...user,
          stats: {
            totalProjects: user._count.projects,
            totalTasks: user._count.assignedTasks,
            completedTasks,
            activeProjects,
            totalHoursLastMonth: Number(totalHours._sum?.hours || 0),
            taskCompletionRate: user._count.assignedTasks > 0 
              ? Math.round((completedTasks / user._count.assignedTasks) * 100)
              : 0
          }
        };
      })
    );

    // Calculate summary statistics
    const roleStats = await prisma.user.groupBy({
      by: ['role'],
      where: { deletedAt: null },
      _count: { _all: true }
    });

    const roleSummary = roleStats.reduce((acc: Record<string, number>, stat) => {
      acc[stat.role] = stat._count._all;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        users: usersWithStats,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        },
        summary: {
          totalUsers: totalCount,
          roleBreakdown: roleSummary,
          activeUsers: await prisma.user.count({
            where: {
              deletedAt: null,
              assignedTasks: {
                some: {
                  status: { in: ['TODO', 'IN_PROGRESS'] }
                }
              }
            }
          })
        }
      }
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
});

export const POST = withPermissions([Permission.CREATE_USER])(async (request) => {
  try {
    const { 
      name, 
      email, 
      password, 
      role, 
      skills, 
      hourlyRate, 
      timezone 
    } = await request.json();

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role?.toUpperCase() || 'USER',
        skills: skills || null,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        timezone: timezone || null
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        skills: true,
        hourlyRate: true,
        timezone: true,
        createdAt: true
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: request.user.id,
        action: 'CREATE',
        entityType: 'USER',
        entityId: user.id,
        changes: JSON.stringify({ created: user })
      }
    });

    return NextResponse.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
});

export const PUT = withPermissions([Permission.UPDATE_USER])(async (request) => {
  try {
    const { 
      userId,
      name, 
      email, 
      role, 
      skills, 
      hourlyRate, 
      timezone 
    } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(role && { role: role.toUpperCase() }),
        ...(skills !== undefined && { skills }),
        ...(hourlyRate !== undefined && { hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null }),
        ...(timezone !== undefined && { timezone })
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        skills: true,
        hourlyRate: true,
        timezone: true,
        updatedAt: true
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: request.user.id,
        action: 'UPDATE',
        entityType: 'USER',
        entityId: userId,
        changes: JSON.stringify({ updated: updatedUser })
      }
    });

    return NextResponse.json({
      success: true,
      data: { user: updatedUser }
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
});

export const DELETE = withPermissions([Permission.DELETE_USER])(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Soft delete user
    const deletedUser = await prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: request.user.id,
        action: 'DELETE',
        entityType: 'USER',
        entityId: userId,
        changes: JSON.stringify({ deleted: deletedUser })
      }
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
});
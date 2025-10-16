import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createResponseFormatter, validatePaginationParams, calculateOffset } from '@/lib/api/response-formatter';
import { HTTP_STATUS } from '@/lib/api/http-status';

// GET /api/teams - Get all teams with pagination
// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const formatter = createResponseFormatter(request);
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return formatter.unauthorized('Authentication required');
    }
    
    // Get pagination params
    const url = new URL(request.url);
    const pageParam = url.searchParams.get('page');
    const limitParam = url.searchParams.get('limit');
    const search = url.searchParams.get('search');
    
    const { page, limit } = validatePaginationParams(
      pageParam ? parseInt(pageParam) : undefined,
      limitParam ? parseInt(limitParam) : undefined
    );

    // Build where clause
    const whereClause = {
      ...(search && {
        name: { contains: search, mode: 'insensitive' as const },
      }),
    };

    // Get total count
    const total = await prisma.team.count({ where: whereClause });

    // Get paginated teams
    const teams = await prisma.team.findMany({
      where: whereClause,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
      orderBy: { name: 'asc' },
      skip: calculateOffset(page, limit),
      take: limit,
    });
    
    return formatter.paginated(teams, page, limit, total);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return formatter.internalError(error as Error);
  }
}

// POST /api/teams - Create a new team
export async function POST(request: NextRequest) {
  const formatter = createResponseFormatter(request);
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return formatter.unauthorized('Authentication required');
    }
    
    // Only admin and manager can create teams
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return formatter.forbidden('Only admins and managers can create teams');
    }
    
    const body = await request.json();
    const { name, description, userIds, projectIds } = body;
    
    // Validate required fields
    const validationErrors = [];
    
    if (!name) {
      validationErrors.push({
        field: 'name',
        message: 'Team name is required',
        code: 'VAL_002'
      });
    } else if (name.length < 3) {
      validationErrors.push({
        field: 'name',
        message: 'Team name must be at least 3 characters',
        code: 'VAL_004'
      });
    }
    
    if (validationErrors.length > 0) {
      return formatter.validationError(validationErrors);
    }
    
    // Create new team with relationships
    const team = await prisma.team.create({
      data: {
        name,
        description,
        users: userIds && userIds.length > 0 ? {
          connect: userIds.map((id: string) => ({ id })),
        } : undefined,
        projects: projectIds && projectIds.length > 0 ? {
          connect: projectIds.map((id: string) => ({ id })),
        } : undefined,
      },
      include: {
        users: true,
        projects: true,
      },
    });
    
    return formatter.success(team, HTTP_STATUS.CREATED);
  } catch (_error) {
    const error = _error as Error;
    console.error('Error creating team:', error);
    
    // Handle duplicate team name
    if (error.message.includes('Unique constraint')) {
      return formatter.conflict('Team', 'Team name already exists');
    }
    
    return formatter.internalError(error);
  }
}
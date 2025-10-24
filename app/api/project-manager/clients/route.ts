import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/project-manager/clients - Get all clients with project stats
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const _status = searchParams.get('status') || 'all';
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: {
      deletedAt: null;
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' };
        company?: { contains: string; mode: 'insensitive' };
        email?: { contains: string; mode: 'insensitive' };
      }>;
    } = {
      deletedAt: null,
    };

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get clients with project counts
    const clients = await prisma.client.findMany({
      where,
      skip,
      take: limit,
      orderBy: sortBy === 'projectCount' 
        ? undefined 
        : { [sortBy]: sortOrder },
      include: {
        projects: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            status: true,
            completionRate: true,
            budget: true,
            budgetUsed: true,
            startDate: true,
            endDate: true,
            priority: true,
            methodology: true,
          },
        },
        _count: {
          select: {
            projects: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    // Calculate stats for each client
    const clientsWithStats = clients.map((client) => {
      const activeProjects = client.projects.filter(
        (p) => p.status === 'IN_PROGRESS' || p.status === 'PLANNING'
      ).length;
      const completedProjects = client.projects.filter(
        (p) => p.status === 'COMPLETED'
      ).length;
      const totalRevenue = client.projects.reduce(
        (sum, p) => sum + (p.budgetUsed || 0),
        0
      );
      const totalBudget = client.projects.reduce(
        (sum, p) => sum + (p.budget || 0),
        0
      );
      
      return {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        company: client.company || 'N/A',
        address: client.address,
        status: 'active', // Hardcoded for now
        createdAt: client.createdAt,
        projectCount: client._count.projects,
        activeProjects,
        completedProjects,
        totalRevenue,
        totalBudget,
        projects: client.projects,
      };
    });

    // Get total count for pagination
    const totalCount = await prisma.client.count({ where });

    return NextResponse.json({
      clients: clientsWithStats,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}

// POST /api/project-manager/clients - Create new client
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, phone, company, address, website, timezone } = body;

    // Validation
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Check if client with email already exists
    const existingClient = await prisma.client.findUnique({
      where: { email },
    });

    if (existingClient && !existingClient.deletedAt) {
      return NextResponse.json(
        { error: 'Client with this email already exists' },
        { status: 400 }
      );
    }

    // Create client
    const client = await prisma.client.create({
      data: {
        name,
        email,
        phone,
        company,
        address,
        website,
        timezone,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
}

import { Next    const clients = await prisma.client.findMany({
      include: {
        projects: {
          select: { id: true, name: true, status: true }
        },
        _count: {
          select: { projects: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });tResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clients = await prisma.client.findMany({
      where: { deletedAt: null },
      include: {
        projects: {
          select: { id: true, name: true, status: true }
        },
        _count: {
          select: { projects: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({ clients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

// POST /api/admin/clients - Create new client
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone, address, company, website, timezone } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Check if client with email already exists
    const existingClient = await prisma.client.findUnique({
      where: { email }
    });

    if (existingClient && !existingClient.deletedAt) {
      return NextResponse.json(
        { error: 'Client with this email already exists' },
        { status: 409 }
      );
    }

    // Create new client
    const client = await prisma.client.create({
      data: {
        name,
        email,
        phone,
        address,
        company,
        website,
        timezone,
      },
      include: {
        projects: {
          select: { id: true, name: true, status: true }
        },
        _count: {
          select: { projects: true }
        }
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'CLIENT',
        entityId: client.id,
        changes: JSON.stringify({
          name: client.name,
          email: client.email
        })
      }
    });

    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
}

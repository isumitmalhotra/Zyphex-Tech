import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { cache } from '@/lib/cache';
import { withCacheStatus } from '@/lib/api/cache-headers';

// GET /api/clients - Get all clients
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only admin, manager, and project manager can view all clients
    if (!['ADMIN', 'MANAGER', 'PROJECT_MANAGER', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Try to get from cache first
    const cacheKey = `clients:list:${session.user.role}`;
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      return NextResponse.json(cached, {
        headers: withCacheStatus(cached, true, 'short').headers
      });
    }

    const clients = await prisma.client.findMany({
      include: {
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });
    
    // Cache for 5 minutes
    await cache.set(cacheKey, clients, 300);
    
    return NextResponse.json(clients, {
      headers: withCacheStatus(clients, false, 'short').headers
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}

// POST /api/clients - Create a new client
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only admin, manager, and project manager can create clients
    if (!['ADMIN', 'MANAGER', 'PROJECT_MANAGER', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const { name, email, phone, address } = body;
    
    // Validate required fields
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
    
    if (existingClient) {
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
      },
    });
    
    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
}
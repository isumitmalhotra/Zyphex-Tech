import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withPermissions } from '@/lib/auth/middleware';
import { Permission } from '@/lib/auth/permissions';

export const GET = withPermissions([Permission.VIEW_CLIENTS])(async (_request) => {
  try {

    const clients = await prisma.client.findMany({
      include: {
        projects: {
          select: { id: true, name: true, status: true }
        },
        _count: {
          select: { projects: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ clients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
})

export const POST = withPermissions([Permission.CREATE_CLIENT])(async (request) => {
  try {

    const { name, email, phone, address, website, timezone } = await request.json();

    // Check for existing client with same email
    const existingClient = await prisma.client.findUnique({
      where: { email }
    });

    if (existingClient) {
      return NextResponse.json(
        { error: 'Client with this email already exists' }, 
        { status: 400 }
      );
    }

    // Create new client
    const client = await prisma.client.create({
      data: {
        name,
        email,
        phone,
        address,
        website,
        timezone
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
        userId: request.user.id,
        action: 'CREATE',
        entityType: 'CLIENT',
        entityId: client.id,
        changes: JSON.stringify({ created: client })
      }
    });

    return NextResponse.json({ client });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
})
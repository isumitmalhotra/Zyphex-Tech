import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/clients/[id] - Get client by ID
// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        projects: true,
      },
    });
    
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client' },
      { status: 500 }
    );
  }
}

// PUT /api/clients/[id] - Update client
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, email, phone, address } = body;
    
    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id },
    });
    
    if (!existingClient) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }
    
    // If email is being changed, check if it's already in use
    if (email && email !== existingClient.email) {
      const emailInUse = await prisma.client.findUnique({
        where: { email },
      });
      
      if (emailInUse) {
        return NextResponse.json(
          { error: 'Email already in use by another client' },
          { status: 409 }
        );
      }
    }
    
    // Update client
    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        name: name || undefined,
        email: email || undefined,
        phone: phone !== undefined ? phone : undefined,
        address: address !== undefined ? address : undefined,
      },
    });
    
    return NextResponse.json(updatedClient);
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id] - Delete client
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id },
      include: {
        projects: true,
      },
    });
    
    if (!existingClient) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }
    
    // Check if client has associated projects
    if (existingClient.projects.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete client with associated projects' },
        { status: 400 }
      );
    }
    
    // Delete client
    await prisma.client.delete({
      where: { id },
    });
    
    return NextResponse.json(
      { message: 'Client deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    );
  }
}
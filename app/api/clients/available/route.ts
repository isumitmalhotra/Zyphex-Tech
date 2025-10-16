import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/clients/available
 * Fetch available clients for project creation
 * Returns only essential client information needed for project assignment
 */
// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Query database for available clients
    const clients = await prisma.client.findMany({
      where: {
        deletedAt: null, // Only non-deleted clients
      },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
      },
      orderBy: {
        name: 'asc', // Alphabetical order
      },
    });

    return NextResponse.json({
      success: true,
      clients,
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch available clients',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/test-db - Test database connection
export async function GET() {
  try {
    // Test the database connection by querying the database version
    const result = await prisma.$queryRaw`SELECT version();`;
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection successful',
      version: result,
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
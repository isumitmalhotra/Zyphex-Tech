import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: 'Dashboard system is properly configured',
      timestamp: new Date().toISOString(),
      availableRoles: [
        'SUPER_ADMIN',
        'ADMIN', 
        'PROJECT_MANAGER',
        'TEAM_MEMBER',
        'CLIENT',
        'USER'
      ]
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { error: 'Health check failed' },
      { status: 500 }
    );
  }
}
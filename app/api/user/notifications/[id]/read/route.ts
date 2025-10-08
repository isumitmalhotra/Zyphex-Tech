import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notificationId = params.id;

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Handle marking specific notification types as read
    const [type, relatedId] = notificationId.split('-');
    
    if (type === 'message' && relatedId) {
      // Mark message as read
      await prisma.message.update({
        where: { 
          id: relatedId,
          receiverId: user.id 
        },
        data: { readAt: new Date() }
      });
    } else if (type === 'task' && relatedId) {
      // For tasks, we could track read status in a separate table
      // For now, we'll just acknowledge the request
    } else if (type === 'invoice' && relatedId) {
      // Similar handling for invoices
    }

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
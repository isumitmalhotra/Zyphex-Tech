import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Mark all user's unread messages as read
    await prisma.message.updateMany({
      where: {
        receiverId: user.id,
        readAt: null
      },
      data: {
        readAt: new Date()
      }
    });

    // In a real implementation with a Notification model, you would:
    // await prisma.notification.updateMany({
    //   where: {
    //     userId: user.id,
    //     read: false
    //   },
    //   data: {
    //     read: true
    //   }
    // });

    return NextResponse.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
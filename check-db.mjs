import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('=== USERS ===');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true
      }
    });
    console.table(users);

    console.log('\n=== ACCOUNTS ===');
    const accounts = await prisma.account.findMany({
      select: {
        id: true,
        userId: true,
        provider: true,
        providerAccountId: true,
        type: true
      }
    });
    console.table(accounts);

    console.log('\n=== SESSIONS ===');
    const sessions = await prisma.session.findMany({
      select: {
        id: true,
        userId: true,
        expires: true
      }
    });
    console.table(sessions);

  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
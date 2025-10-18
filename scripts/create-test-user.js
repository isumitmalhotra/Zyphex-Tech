/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@zyphex.tech' }
    });

    if (existingUser) {
      console.log('✅ Test user already exists!');
      console.log('Email: admin@zyphex.tech');
      console.log('Password: Admin@123');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'admin@zyphex.tech',
        name: 'Admin User',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        emailVerified: new Date(), // Verify email immediately
      }
    });

    console.log('✅ Test user created successfully!');
    console.log('\n📧 Login Credentials:');
    console.log('Email: admin@zyphex.tech');
    console.log('Password: Admin@123');
    console.log('\n🔑 Role: SUPER_ADMIN');
    console.log('🆔 User ID:', user.id);

  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();

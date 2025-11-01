/**
 * Create Additional Admin User
 * Creates an ADMIN role user (not SUPER_ADMIN)
 */

import { prisma } from '../lib/prisma'
import { hash } from 'bcryptjs'

async function createRegularAdmin() {
  console.log('🔐 Creating Regular Admin User...\n');

  try {
    const email = 'admin@zyphextech.com';
    const password = 'Haryana@272002';
    const name = 'Admin User';

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('⚠️  User already exists!');
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Name: ${existingUser.name}`);
      console.log(`   Role: ${existingUser.role}`);
      
      // Update password and role if user exists
      const hashedPassword = await hash(password, 12);
      await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          role: 'ADMIN', // Regular ADMIN, not SUPER_ADMIN
          emailVerified: new Date(),
        },
      });
      
      console.log('\n✅ Password updated and role set to ADMIN');
      console.log('\nLogin Credentials:');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
      console.log(`   URL: http://localhost:3000/login\n`);
      return;
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: 'ADMIN', // Regular ADMIN role
        emailVerified: new Date(),
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log('\nUser Details:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Email Verified: ${user.emailVerified ? 'Yes' : 'No'}`);
    
    console.log('\n🔑 Login Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Login URL: http://localhost:3000/login`);
    console.log(`   Will redirect to: /admin (not /super-admin)`);
    console.log(`   Production URL: https://zyphextech.com/login\n`);

    console.log('\n📝 Note:');
    console.log('   - SUPER_ADMIN: sumitmalhotra@zyphextech.com → redirects to /super-admin');
    console.log('   - ADMIN: admin@zyphextech.com → redirects to /admin\n');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createRegularAdmin()

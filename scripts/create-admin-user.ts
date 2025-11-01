import { prisma } from '../lib/prisma'
import { hash } from 'bcryptjs'

async function createAdminUser() {
  console.log('🔐 Creating Super Admin User...\n');

  try {
    const email = 'sumitmalhotra@zyphextech.com';
    const password = 'Haryana@272002';
    const name = 'Sumit Malhotra';

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('⚠️  User already exists!');
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Name: ${existingUser.name}`);
      console.log(`   Role: ${existingUser.role}`);
      
      // Update password if user exists
      const hashedPassword = await hash(password, 12);
      await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          emailVerified: new Date(),
        },
      });
      
      console.log('\n✅ Password updated and role set to SUPER_ADMIN');
      console.log('\n🔑 Login Credentials:');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
      console.log(`   Dashboard: http://localhost:3000/super-admin`);
      console.log(`   CMS: http://localhost:3000/super-admin/content`);
      console.log(`   Production: https://zyphextech.com/super-admin\n`);
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
        role: 'SUPER_ADMIN',
        emailVerified: new Date(), // Mark email as verified
      },
    });

    console.log('✅ Super Admin user created successfully!');
    console.log('\nUser Details:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Email Verified: ${user.emailVerified ? 'Yes' : 'No'}`);
    
    console.log('\n🔑 Login Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Dashboard URL: http://localhost:3000/super-admin`);
    console.log(`   CMS URL: http://localhost:3000/super-admin/content`);
    console.log(`   Production URL: https://zyphextech.com/super-admin\n`);

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser()

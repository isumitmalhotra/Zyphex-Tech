const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function verifyPMAccount() {
  try {
    console.log('🔍 Verifying PM test account...\n');

    // Find the PM test account
    const user = await prisma.user.findUnique({
      where: { email: 'pm.test@zyphex.tech' }
    });

    if (!user) {
      console.log('❌ PM test account not found!');
      return;
    }

    console.log('✅ User found:');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Name:', user.name);
    console.log('Role:', user.role);
    console.log('Has password:', !!user.password);
    console.log('Password length:', user.password ? user.password.length : 0);
    console.log('');

    // Test password verification
    const testPassword = 'PMTest123!';
    if (user.password) {
      const isValid = await bcrypt.compare(testPassword, user.password);
      console.log('🔐 Password verification test:');
      console.log('Test password:', testPassword);
      console.log('Is valid:', isValid);
      
      if (!isValid) {
        console.log('');
        console.log('❌ Password verification failed! Updating password...');
        
        // Re-hash the password
        const newHashedPassword = await bcrypt.hash(testPassword, 12);
        
        await prisma.user.update({
          where: { id: user.id },
          data: { password: newHashedPassword }
        });
        
        console.log('✅ Password updated successfully!');
        
        // Verify the new password
        const reVerify = await bcrypt.compare(testPassword, newHashedPassword);
        console.log('New password verification:', reVerify);
      } else {
        console.log('✅ Password is correct!');
      }
    } else {
      console.log('❌ No password set! Setting password...');
      
      const hashedPassword = await bcrypt.hash(testPassword, 12);
      
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });
      
      console.log('✅ Password set successfully!');
    }

    console.log('');
    console.log('🚀 Final Login Credentials:');
    console.log('Email: pm.test@zyphex.tech');
    console.log('Password: PMTest123!');
    console.log('');
    console.log('📝 Troubleshooting tips:');
    console.log('1. Make sure you\'re using the exact email: pm.test@zyphex.tech');
    console.log('2. Password is case-sensitive: PMTest123!');
    console.log('3. Check for extra spaces in email/password fields');
    console.log('4. Try logging in with a fresh browser session (clear cache)');
    console.log('5. Check browser console for any error messages');

  } catch (error) {
    console.error('❌ Error verifying PM account:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
verifyPMAccount();
/**
 * Verify CMS Database Schema
 * Checks that all required fields exist in the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifySchema() {
  console.log('🔍 Verifying CMS Database Schema...\n');

  try {
    // Test 1: Verify CmsPage fields
    console.log('✅ Testing CmsPage model...');
    const testPage = await prisma.cmsPage.findFirst({
      select: {
        id: true,
        seoScore: true,
        requiresAuth: true,
        allowComments: true,
      },
    });
    console.log('   ✓ seoScore field exists');
    console.log('   ✓ requiresAuth field exists');
    console.log('   ✓ allowComments field exists');

    // Test 2: Verify CmsPageSection fields
    console.log('\n✅ Testing CmsPageSection model...');
    const testSection = await prisma.cmsPageSection.findFirst({
      select: {
        id: true,
        showOnMobile: true,
        showOnTablet: true,
        showOnDesktop: true,
      },
    });
    console.log('   ✓ showOnMobile field exists');
    console.log('   ✓ showOnTablet field exists');
    console.log('   ✓ showOnDesktop field exists');

    // Test 3: Verify CmsActivityLog fields
    console.log('\n✅ Testing CmsActivityLog model...');
    const testLog = await prisma.cmsActivityLog.findFirst({
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
      },
    });
    console.log('   ✓ ipAddress field exists');
    console.log('   ✓ userAgent field exists');

    // Test 4: Count existing records
    console.log('\n📊 Database Statistics:');
    const pageCount = await prisma.cmsPage.count();
    const sectionCount = await prisma.cmsPageSection.count();
    const logCount = await prisma.cmsActivityLog.count();
    
    console.log(`   • CMS Pages: ${pageCount}`);
    console.log(`   • Page Sections: ${sectionCount}`);
    console.log(`   • Activity Logs: ${logCount}`);

    console.log('\n🎉 SUCCESS! All required fields exist in the database.\n');
    console.log('✅ Task #2 Complete: Database schema verified!');
    
  } catch (error: any) {
    console.error('\n❌ ERROR: Schema verification failed');
    console.error(error.message);
    
    if (error.message.includes('Unknown field')) {
      console.log('\n⚠️  A field is missing. You need to run:');
      console.log('   npx prisma migrate dev --name add_missing_cms_fields');
    }
  } finally {
    await prisma.$disconnect();
  }
}

verifySchema();

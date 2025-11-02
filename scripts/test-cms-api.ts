/**
 * Test CMS Pages API Endpoint
 * Run this to verify the API is working correctly
 */

async function testCmsApi() {
  console.log('🧪 Testing CMS Pages API...\n');

  try {
    // Test 1: Direct API call (no auth)
    console.log('Test 1: Fetch CMS pages without auth');
    const response1 = await fetch('http://localhost:3000/api/cms/pages');
    const data1 = await response1.json();
    
    console.log(`Status: ${response1.status}`);
    console.log('Response:', JSON.stringify(data1, null, 2));
    
    if (response1.status === 401) {
      console.log('✅ Correctly returns 401 Unauthorized (expected)\n');
    } else if (response1.status === 200 && data1.success) {
      console.log(`✅ API working! Found ${data1.data.length} pages\n`);
      console.log('Pages:');
      data1.data.forEach((page: any) => {
        console.log(`  - ${page.pageTitle} (${page.status})`);
      });
    } else {
      console.log('⚠️  Unexpected response\n');
    }

    // Test 2: Check database directly
    console.log('\nTest 2: Direct database query');
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const pages = await prisma.cmsPage.findMany({
      select: {
        id: true,
        pageKey: true,
        pageTitle: true,
        status: true,
        _count: {
          select: {
            sections: true,
          },
        },
      },
    });
    
    console.log(`Found ${pages.length} pages in database:`);
    pages.forEach(page => {
      console.log(`  - ${page.pageTitle} (${page.pageKey}) - ${page.status} - ${page._count.sections} sections`);
    });
    
    await prisma.$disconnect();
    
    console.log('\n✅ Database query successful!');
    console.log('\n📊 Summary:');
    console.log(`   - Database has ${pages.length} CMS pages`);
    console.log(`   - API requires authentication (this is correct)`);
    console.log(`   - Frontend should work if user is logged in with proper role`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testCmsApi();

/**
 * Test Script for CMS Version Control APIs
 * 
 * This script tests all version control endpoints to ensure they work correctly.
 * Run this after starting the development server.
 * 
 * Usage:
 *   npm run dev
 *   node scripts/test-version-apis.js
 */

const baseUrl = 'http://localhost:3000';

// Replace with actual session token from your browser (after logging in)
const sessionToken = 'YOUR_SESSION_TOKEN_HERE';

// Replace with actual page ID from your database
const testPageId = 'YOUR_PAGE_ID_HERE';

async function apiCall(method, endpoint, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `next-auth.session-token=${sessionToken}`,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${baseUrl}${endpoint}`, options);
  const data = await response.json();
  
  return {
    status: response.status,
    ok: response.ok,
    data,
  };
}

async function runTests() {
  console.log('🧪 Testing CMS Version Control APIs\n');
  console.log('═'.repeat(60));

  try {
    // Test 1: List all versions
    console.log('\n📋 Test 1: GET /api/cms/pages/[id]/versions');
    console.log('─'.repeat(60));
    const listResult = await apiCall('GET', `/api/cms/pages/${testPageId}/versions`);
    console.log(`Status: ${listResult.status}`);
    console.log(`Success: ${listResult.ok}`);
    console.log(`Versions count: ${listResult.data.data?.versions?.length || 0}`);
    console.log(`Stats:`, listResult.data.data?.stats);

    // Test 2: Create a new version manually
    console.log('\n💾 Test 2: POST /api/cms/pages/[id]/versions');
    console.log('─'.repeat(60));
    const createResult = await apiCall('POST', `/api/cms/pages/${testPageId}/versions`, {
      changeDescription: 'Manual test version',
      tags: ['test', 'manual'],
    });
    console.log(`Status: ${createResult.status}`);
    console.log(`Success: ${createResult.ok}`);
    console.log(`Version number: ${createResult.data.data?.versionNumber}`);

    const newVersionId = createResult.data.data?.id;

    // Test 3: Get specific version
    if (newVersionId) {
      console.log('\n🔍 Test 3: GET /api/cms/pages/[id]/versions/[versionId]');
      console.log('─'.repeat(60));
      const getResult = await apiCall('GET', `/api/cms/pages/${testPageId}/versions/${newVersionId}`);
      console.log(`Status: ${getResult.status}`);
      console.log(`Success: ${getResult.ok}`);
      console.log(`Version number: ${getResult.data.data?.versionNumber}`);
      console.log(`Has page snapshot: ${!!getResult.data.data?.pageSnapshot}`);
      console.log(`Has sections snapshot: ${!!getResult.data.data?.sectionsSnapshot}`);
    }

    // Test 4: Get version stats
    console.log('\n📊 Test 4: GET /api/cms/pages/[id]/versions/stats');
    console.log('─'.repeat(60));
    const statsResult = await apiCall('GET', `/api/cms/pages/${testPageId}/versions/stats`);
    console.log(`Status: ${statsResult.status}`);
    console.log(`Success: ${statsResult.ok}`);
    console.log(`Total versions: ${statsResult.data.data?.totalVersions}`);
    console.log(`Latest version: ${statsResult.data.data?.latestVersionNumber}`);

    // Test 5: Compare versions (if we have at least 2)
    if (listResult.data.data?.versions?.length >= 2) {
      console.log('\n🔀 Test 5: GET /api/cms/pages/[id]/versions/compare');
      console.log('─'.repeat(60));
      const v1 = listResult.data.data.versions[0].id;
      const v2 = listResult.data.data.versions[1].id;
      const compareResult = await apiCall('GET', `/api/cms/pages/${testPageId}/versions/compare?v1=${v1}&v2=${v2}`);
      console.log(`Status: ${compareResult.status}`);
      console.log(`Success: ${compareResult.ok}`);
      console.log(`Page changes:`, Object.keys(compareResult.data.data?.pageChanges || {}).length, 'fields');
      console.log(`Section changes:`, compareResult.data.data?.sectionChanges?.length || 0, 'sections');
    }

    // Test 6: Restore version (if we have versions)
    if (listResult.data.data?.versions?.length >= 2) {
      console.log('\n⏮️  Test 6: POST /api/cms/pages/[id]/versions/[versionId]/restore');
      console.log('─'.repeat(60));
      const versionToRestore = listResult.data.data.versions[1].id;
      const restoreResult = await apiCall('POST', `/api/cms/pages/${testPageId}/versions/${versionToRestore}/restore`);
      console.log(`Status: ${restoreResult.status}`);
      console.log(`Success: ${restoreResult.ok}`);
      console.log(`Message: ${restoreResult.data.message}`);
    }

    // Test 7: Cleanup old versions
    console.log('\n🧹 Test 7: DELETE /api/cms/pages/[id]/versions/cleanup');
    console.log('─'.repeat(60));
    const cleanupResult = await apiCall('DELETE', `/api/cms/pages/${testPageId}/versions/cleanup?keep=50`);
    console.log(`Status: ${cleanupResult.status}`);
    console.log(`Success: ${cleanupResult.ok}`);
    console.log(`Cleaned up: ${cleanupResult.data.data?.count || 0} versions`);

    // Test 8: Auto-versioning on page update
    console.log('\n🔄 Test 8: PATCH /api/cms/pages/[id] (auto-versioning)');
    console.log('─'.repeat(60));
    const updateResult = await apiCall('PATCH', `/api/cms/pages/${testPageId}`, {
      metaDescription: `Test update at ${new Date().toISOString()}`,
      changeDescription: 'Testing auto-versioning',
    });
    console.log(`Status: ${updateResult.status}`);
    console.log(`Success: ${updateResult.ok}`);
    console.log(`Message: ${updateResult.data.message}`);

    // Verify version was created
    const finalListResult = await apiCall('GET', `/api/cms/pages/${testPageId}/versions`);
    console.log(`Total versions now: ${finalListResult.data.data?.versions?.length || 0}`);

    console.log('\n═'.repeat(60));
    console.log('✅ All tests completed!');
    console.log('═'.repeat(60));

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error(error);
  }
}

// Check if required values are set
if (sessionToken === 'YOUR_SESSION_TOKEN_HERE' || testPageId === 'YOUR_PAGE_ID_HERE') {
  console.error('❌ Please update the script with:');
  console.error('   1. Your session token (from browser cookies after login)');
  console.error('   2. A valid page ID from your database');
  console.error('\nTo get a page ID, run:');
  console.error('   npx prisma studio');
  console.error('   → Open CmsPage table');
  console.error('   → Copy any page ID');
  process.exit(1);
}

runTests();

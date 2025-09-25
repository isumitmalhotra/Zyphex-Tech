// Test Service API endpoints
const baseUrl = 'http://localhost:3000';

// Test GET /api/admin/content/services
async function testGetServices() {
  try {
    console.log('Testing GET /api/admin/content/services...');
    const response = await fetch(`${baseUrl}/api/admin/content/services`);
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Error testing GET services:', error.message);
  }
}

// Test POST /api/admin/content/services (will fail due to auth, but we can see the error)
async function testCreateService() {
  try {
    console.log('\nTesting POST /api/admin/content/services...');
    const testService = {
      title: 'Test Service',
      description: 'A test service description',
      features: ['Feature 1', 'Feature 2'],
      price: 999,
      category: 'testing'
    };
    
    const response = await fetch(`${baseUrl}/api/admin/content/services`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testService)
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error testing POST service:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('Starting Service API tests...\n');
  await testGetServices();
  await testCreateService();
  console.log('\nService API tests completed!');
}

runTests().catch(console.error);

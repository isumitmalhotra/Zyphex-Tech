// Test direct API access to NextAuth endpoints
const testNextAuth = async () => {
  try {
    console.log('Testing NextAuth Google provider...');
    
    // First test - get providers
    const providersResponse = await fetch('http://localhost:3000/api/auth/providers');
    const providers = await providersResponse.json();
    console.log('Available providers:', Object.keys(providers));
    
    // Test CSRF token
    const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf');
    const csrfData = await csrfResponse.json();
    console.log('CSRF token received:', csrfData.csrfToken ? 'Yes' : 'No');
    
    // Test session endpoint
    const sessionResponse = await fetch('http://localhost:3000/api/auth/session');
    const sessionData = await sessionResponse.json();
    console.log('Current session:', sessionData);
    
    console.log('\nNextAuth endpoints are working correctly!');
    
  } catch (error) {
    console.error('Error testing NextAuth:', error.message);
  }
};

// Add delay to ensure server is ready
setTimeout(testNextAuth, 2000);
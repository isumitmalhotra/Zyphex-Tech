// Simple test to check if OAuth account linking works
const testOAuthFlow = async () => {
  try {
    // Test the Google OAuth sign-in URL
    console.log('Testing OAuth flow...');
    
    const response = await fetch('http://localhost:3000/api/auth/signin/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.redirected) {
      console.log('Redirected to:', response.url);
    }
    
    const responseText = await response.text();
    console.log('Response body:', responseText.substring(0, 500));
    
  } catch (error) {
    console.error('Error testing OAuth:', error);
  }
};

testOAuthFlow();
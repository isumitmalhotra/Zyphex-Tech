/**
 * Test Auth System Integration
 * 
 * This script tests the complete authentication flow including:
 * - User registration with email verification
 * - Password reset functionality
 * - Email service integration
 * - Token validation
 */

const BASE_URL = process.env.APP_URL || 'http://localhost:3000';

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
  error?: unknown;
}

class AuthTester {
  private results: TestResult[] = [];
  private testEmail = `test-${Date.now()}@example.com`;
  private testPassword = 'TestPassword123!';

  private log(test: string, passed: boolean, message: string, error?: unknown) {
    this.results.push({ test, passed, message, error });
    console.log(`${passed ? '✅' : '❌'} ${test}: ${message}`);
    if (error) console.error('Error details:', error);
  }

  async testUserRegistration() {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email: this.testEmail,
          password: this.testPassword
        })
      });

      const data = await response.json();

      if (response.ok && data.requiresEmailVerification) {
        this.log('User Registration', true, 'User registered successfully with email verification required');
        return true;
      } else {
        this.log('User Registration', false, `Registration failed: ${data.message}`);
        return false;
      }
    } catch (error) {
      this.log('User Registration', false, 'Registration request failed', error);
      return false;
    }
  }

  async testEmailVerificationTokenGeneration() {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: this.testEmail })
      });

      const data = await response.json();

      if (response.ok) {
        this.log('Email Verification Token', true, 'Verification token generated and email sent successfully');
        return true;
      } else {
        this.log('Email Verification Token', false, `Token generation failed: ${data.error}`);
        return false;
      }
    } catch (error) {
      this.log('Email Verification Token', false, 'Token generation request failed', error);
      return false;
    }
  }

  async testPasswordResetRequest() {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: this.testEmail })
      });

      const data = await response.json();

      if (response.ok) {
        this.log('Password Reset Request', true, 'Password reset email sent successfully');
        return true;
      } else {
        this.log('Password Reset Request', false, `Reset request failed: ${data.error}`);
        return false;
      }
    } catch (error) {
      this.log('Password Reset Request', false, 'Reset request failed', error);
      return false;
    }
  }

  async testInvalidEmailVerification() {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'invalid-token' })
      });

      const data = await response.json();

      if (!response.ok && data.error) {
        this.log('Invalid Token Handling', true, 'Invalid tokens properly rejected');
        return true;
      } else {
        this.log('Invalid Token Handling', false, 'Invalid token was accepted unexpectedly');
        return false;
      }
    } catch (error) {
      this.log('Invalid Token Handling', false, 'Token validation request failed', error);
      return false;
    }
  }

  async testAuthEndpointsExist() {
    const endpoints = [
      '/api/auth/register',
      '/api/auth/send-verification',
      '/api/auth/verify-email',
      '/api/auth/forgot-password',
      '/api/auth/reset-password',
    ];

    let allExist = true;

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
          method: 'GET', // Just check if endpoint responds
        });

        // We expect some response (even if it's an error for GET on POST endpoint)
        if (response.status !== 404) {
          console.log(`✅ Endpoint ${endpoint} exists`);
        } else {
          console.log(`❌ Endpoint ${endpoint} not found`);
          allExist = false;
        }
      } catch {
        console.log(`❌ Endpoint ${endpoint} not accessible`);
        allExist = false;
      }
    }

    this.log('API Endpoints', allExist, allExist ? 'All auth endpoints exist' : 'Some endpoints missing');
    return allExist;
  }

  async runAllTests() {
    console.log('🚀 Starting Authentication System Tests...\n');

    // Test API endpoints exist
    await this.testAuthEndpointsExist();

    // Test user registration
    await this.testUserRegistration();

    // Test email verification
    await this.testEmailVerificationTokenGeneration();

    // Test password reset
    await this.testPasswordResetRequest();

    // Test security (invalid tokens)
    await this.testInvalidEmailVerification();

    // Summary
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;

    console.log('\n📊 Test Summary:');
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${total - passed}/${total}`);

    if (passed === total) {
      console.log('\n🎉 All tests passed! Authentication system is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the implementation.');
    }

    return { passed, total, results: this.results };
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new AuthTester();
  tester.runAllTests().catch(console.error);
}

export { AuthTester };
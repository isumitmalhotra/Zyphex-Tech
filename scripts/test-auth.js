#!/usr/bin/env node

const testAuth = async () => {
  console.log('🧪 Testing Authentication System...\n')

  try {
    // Test 1: Check NextAuth session endpoint
    console.log('1️⃣ Testing session endpoint...')
    const sessionResponse = await fetch('http://localhost:3000/api/auth/session')
    const sessionData = await sessionResponse.text()
    console.log('✅ Session endpoint:', sessionResponse.status === 200 ? 'OK' : 'FAIL')

    // Test 2: Check providers endpoint
    console.log('2️⃣ Testing providers endpoint...')
    const providersResponse = await fetch('http://localhost:3000/api/auth/providers')
    const providersData = await providersResponse.json()
    console.log('✅ Providers available:', Object.keys(providersData).length > 0 ? 'OK' : 'FAIL')
    console.log('   - Available providers:', Object.keys(providersData).join(', '))

    // Test 3: Check if Google OAuth URL generates correctly
    console.log('3️⃣ Testing Google OAuth...')
    const googleResponse = await fetch('http://localhost:3000/api/auth/signin/google')
    console.log('✅ Google OAuth redirect:', googleResponse.status === 302 ? 'OK' : 'FAIL')

    // Test 4: Check if Microsoft OAuth URL generates correctly
    console.log('4️⃣ Testing Microsoft OAuth...')
    const microsoftResponse = await fetch('http://localhost:3000/api/auth/signin/azure-ad')
    console.log('✅ Microsoft OAuth redirect:', microsoftResponse.status === 302 ? 'OK' : 'FAIL')

    console.log('\n🎉 Authentication system test completed!')
    console.log('\n📝 Test users available:')
    console.log('   Email: test@example.com | Password: password123')
    console.log('   Email: admin@zyphextech.com | Password: admin123')
    console.log('\n🌐 Open http://localhost:3000/login to test!')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testAuth()
#!/usr/bin/env node

// Test script to verify authentication endpoints
const endpoints = [
  'http://localhost:3000/api/auth/providers',
  'http://localhost:3000/api/auth/csrf',
  'http://localhost:3000/api/auth/session'
];

async function testEndpoints() {
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint);
      const data = await response.text();
      console.log(`✅ ${endpoint}: ${response.status}`);
      if (endpoint.includes('providers')) {
        console.log(`   ${data.slice(0, 100)}...`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.message}`);
    }
  }
}

testEndpoints();
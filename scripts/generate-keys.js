#!/usr/bin/env node

/**
 * Quick Key Generator
 * 
 * Generates secure keys for your .env file:
 * - ENCRYPTION_KEY (64 hex characters)
 * - NEXTAUTH_SECRET (base64)
 * 
 * Usage: node scripts/generate-keys.js
 */

const crypto = require('crypto');

console.log('\n🔐 Secure Key Generator\n');

// Generate ENCRYPTION_KEY
const encryptionKey = crypto.randomBytes(32).toString('hex');
console.log('ENCRYPTION_KEY (copy this to your .env file):');
console.log(`ENCRYPTION_KEY="${encryptionKey}"`);

// Generate NEXTAUTH_SECRET
const nextAuthSecret = crypto.randomBytes(32).toString('base64');
console.log('\nNEXTAUTH_SECRET (copy this to your .env file):');
console.log(`NEXTAUTH_SECRET="${nextAuthSecret}"`);

console.log('\n✅ Keys generated successfully!');
console.log('\n📋 Next steps:');
console.log('   1. Copy the keys above to your .env file');
console.log('   2. Configure Redis (optional but recommended):');
console.log('      REDIS_HOST="localhost"');
console.log('      REDIS_PORT="6379"');
console.log('      REDIS_PASSWORD="" # Leave empty for local dev');
console.log('   3. Make sure Redis is running: redis-server');
console.log('\n💡 For production:');
console.log('   - Use a managed Redis service (Upstash, Redis Labs)');
console.log('   - Set strong REDIS_PASSWORD');
console.log('   - Never commit .env to version control\n');

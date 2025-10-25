#!/usr/bin/env node

/**
 * Environment Setup Script
 * 
 * This script helps you set up your .env file with all required configuration:
 * - Generates ENCRYPTION_KEY
 * - Generates NEXTAUTH_SECRET
 * - Tests Redis connection
 * - Validates configuration
 * 
 * Usage: node scripts/setup-env.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('hex');
}

function generateNextAuthSecret() {
  return crypto.randomBytes(32).toString('base64');
}

async function testRedisConnection(host, port, password) {
  try {
    const Redis = require('ioredis');
    const config = {
      host,
      port: parseInt(port),
      password: password || undefined,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null, // Don't retry
    };
    
    const redis = new Redis(config);
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        redis.disconnect();
        resolve(false);
      }, 5000);
      
      redis.ping((err, result) => {
        clearTimeout(timeout);
        redis.disconnect();
        
        if (err || result !== 'PONG') {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('\n🔧 Zyphex-Tech Environment Setup\n');
  console.log('This script will help you configure your .env file.\n');
  
  const envPath = path.join(__dirname, '..', '.env');
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  
  // Check if .env already exists
  if (fs.existsSync(envPath)) {
    const overwrite = await question('⚠️  .env file already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Aborted.');
      rl.close();
      return;
    }
  }
  
  // Read .env.example
  let envContent = fs.readFileSync(envExamplePath, 'utf-8');
  
  console.log('\n📝 Configuration:\n');
  
  // 1. Generate ENCRYPTION_KEY
  console.log('1️⃣  Encryption Key');
  const generateEncryption = await question('   Generate ENCRYPTION_KEY? (Y/n): ');
  if (generateEncryption.toLowerCase() !== 'n') {
    const encryptionKey = generateEncryptionKey();
    envContent = envContent.replace(
      'ENCRYPTION_KEY="your-64-character-hex-encryption-key-here-generate-with-command-above"',
      `ENCRYPTION_KEY="${encryptionKey}"`
    );
    console.log(`   ✅ Generated: ${encryptionKey.substring(0, 16)}...`);
  }
  
  // 2. Generate NEXTAUTH_SECRET
  console.log('\n2️⃣  NextAuth Secret');
  const generateNextAuth = await question('   Generate NEXTAUTH_SECRET? (Y/n): ');
  if (generateNextAuth.toLowerCase() !== 'n') {
    const nextAuthSecret = generateNextAuthSecret();
    envContent = envContent.replace(
      'NEXTAUTH_SECRET="your-nextauth-secret-key-here"',
      `NEXTAUTH_SECRET="${nextAuthSecret}"`
    );
    console.log(`   ✅ Generated: ${nextAuthSecret.substring(0, 20)}...`);
  }
  
  // 3. Redis Configuration
  console.log('\n3️⃣  Redis Configuration');
  const setupRedis = await question('   Configure Redis? (Y/n): ');
  if (setupRedis.toLowerCase() !== 'n') {
    const redisHost = await question('   Redis host (localhost): ') || 'localhost';
    const redisPort = await question('   Redis port (6379): ') || '6379';
    const redisPassword = await question('   Redis password (leave empty if none): ');
    
    // Test Redis connection
    console.log('   Testing Redis connection...');
    const isConnected = await testRedisConnection(redisHost, redisPort, redisPassword);
    
    if (isConnected) {
      console.log('   ✅ Redis connection successful!');
      
      envContent = envContent.replace('REDIS_HOST="localhost"', `REDIS_HOST="${redisHost}"`);
      envContent = envContent.replace('REDIS_PORT="6379"', `REDIS_PORT="${redisPort}"`);
      
      if (redisPassword) {
        envContent = envContent.replace('REDIS_PASSWORD=""', `REDIS_PASSWORD="${redisPassword}"`);
        const redisUrl = `redis://:${redisPassword}@${redisHost}:${redisPort}`;
        envContent = envContent.replace('REDIS_URL="redis://localhost:6379"', `REDIS_URL="${redisUrl}"`);
      } else {
        const redisUrl = `redis://${redisHost}:${redisPort}`;
        envContent = envContent.replace('REDIS_URL="redis://localhost:6379"', `REDIS_URL="${redisUrl}"`);
      }
    } else {
      console.log('   ⚠️  Redis connection failed. Using memory cache fallback.');
      console.log('   You can configure Redis later by editing .env file.');
    }
  }
  
  // 4. Database URL
  console.log('\n4️⃣  Database Configuration');
  const setupDb = await question('   Configure database URL? (y/N): ');
  if (setupDb.toLowerCase() === 'y') {
    const dbUrl = await question('   Database URL: ');
    if (dbUrl) {
      envContent = envContent.replace(
        'DATABASE_URL="postgresql://user:password@localhost:5432/database?schema=public"',
        `DATABASE_URL="${dbUrl}"`
      );
      console.log('   ✅ Database URL configured');
    }
  }
  
  // 5. Email Configuration
  console.log('\n5️⃣  Email Configuration');
  const setupEmail = await question('   Configure email? (y/N): ');
  if (setupEmail.toLowerCase() === 'y') {
    const emailProvider = await question('   Email provider (resend/nodemailer): ');
    if (emailProvider) {
      envContent = envContent.replace('EMAIL_PROVIDER="resend"', `EMAIL_PROVIDER="${emailProvider}"`);
      
      if (emailProvider === 'resend') {
        const resendKey = await question('   Resend API key: ');
        if (resendKey) {
          envContent = envContent.replace(
            'RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"',
            `RESEND_API_KEY="${resendKey}"`
          );
        }
      } else if (emailProvider === 'nodemailer') {
        const smtpHost = await question('   SMTP host: ');
        const smtpPort = await question('   SMTP port (587): ') || '587';
        const smtpUser = await question('   SMTP user: ');
        const smtpPassword = await question('   SMTP password: ');
        
        if (smtpHost && smtpUser && smtpPassword) {
          envContent = envContent.replace('EMAIL_SERVER_HOST="smtp.titan.email"', `EMAIL_SERVER_HOST="${smtpHost}"`);
          envContent = envContent.replace('EMAIL_SERVER_PORT="587"', `EMAIL_SERVER_PORT="${smtpPort}"`);
          envContent = envContent.replace('EMAIL_SERVER_USER="noreply@zyphextech.com"', `EMAIL_SERVER_USER="${smtpUser}"`);
          envContent = envContent.replace('EMAIL_SERVER_PASSWORD="your-smtp-password"', `EMAIL_SERVER_PASSWORD="${smtpPassword}"`);
        }
      }
      console.log('   ✅ Email configured');
    }
  }
  
  // Write .env file
  fs.writeFileSync(envPath, envContent);
  
  console.log('\n✅ Environment setup complete!');
  console.log(`\n📁 Configuration saved to: ${envPath}`);
  console.log('\n📋 Next steps:');
  console.log('   1. Review and update .env file with your specific values');
  console.log('   2. Run: npm run db:push (to sync database)');
  console.log('   3. Run: npm run dev (to start development server)');
  console.log('\n💡 Tips:');
  console.log('   - Never commit .env to version control');
  console.log('   - Keep .env.example updated for team members');
  console.log('   - Use different values for development and production');
  
  rl.close();
}

main().catch(error => {
  console.error('❌ Setup failed:', error);
  rl.close();
  process.exit(1);
});

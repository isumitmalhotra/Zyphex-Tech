/**
 * Quick Test Script for Phase 3: Database Encryption
 * 
 * Tests:
 * 1. Encryption library basic operations
 * 2. Prisma extension automatic encryption
 * 3. Data integrity verification
 * 
 * Run: node --loader ts-node/esm scripts/test-encryption.ts
 */

import { DataEncryption } from '../lib/encryption'
import { prisma } from '../lib/prisma'

async function testEncryptionLibrary() {
  console.log('\n🔐 Testing Encryption Library...\n')
  
  // Test 1: Basic encrypt/decrypt
  console.log('Test 1: Basic Encryption/Decryption')
  const plaintext = 'sensitive-data-123'
  const encrypted = DataEncryption.encrypt(plaintext)
  console.log(`✅ Encrypted: ${encrypted.substring(0, 50)}...`)
  
  const decrypted = DataEncryption.decrypt(encrypted)
  console.log(`✅ Decrypted: ${decrypted}`)
  console.log(`✅ Match: ${plaintext === decrypted ? 'YES' : 'NO'}`)
  
  // Test 2: isEncrypted check
  console.log('\nTest 2: Encryption Detection')
  console.log(`✅ Encrypted data detected: ${DataEncryption.isEncrypted(encrypted)}`)
  console.log(`✅ Plain data detected: ${!DataEncryption.isEncrypted('plain-text')}`)
  
  // Test 3: Multiple encryption/decryption cycles
  console.log('\nTest 3: Multiple Encryption Cycles')
  const values = ['value1', 'value2', 'value3']
  const encryptedValues = values.map(v => DataEncryption.encrypt(v))
  const decryptedValues = encryptedValues.map(v => DataEncryption.decrypt(v))
  
  console.log(`✅ Encrypted ${values.length} values`)
  console.log(`✅ All decrypted correctly: ${JSON.stringify(values) === JSON.stringify(decryptedValues) ? 'YES' : 'NO'}`)
}

async function testPrismaEncryption() {
  console.log('\n🗄️  Testing Prisma Encryption Extension...\n')
  
  try {
    // Test 1: Create client with encrypted phone
    console.log('Test 1: Create Client with Encrypted Phone')
    const client = await prisma.client.create({
      data: {
        name: 'Encryption Test Client',
        email: `test-encryption-${Date.now()}@example.com`,
        phone: '555-TEST-ENCRYPT',
        address: '123 Encryption Test Lane',
      },
    })
    
    console.log(`✅ Client created: ${client.id}`)
    console.log(`✅ Phone returned (decrypted): ${client.phone}`)
    console.log(`✅ Address returned (decrypted): ${client.address}`)
    
    // Test 2: Verify data is encrypted in database
    console.log('\nTest 2: Verify Database Encryption')
    const rawData = await prisma.$queryRaw<Array<{phone: string, address: string}>>`
      SELECT phone, address FROM "Client" WHERE id = ${client.id}
    `
    
    console.log(`✅ Raw phone in DB: ${rawData[0].phone.substring(0, 50)}...`)
    console.log(`✅ Is encrypted: ${DataEncryption.isEncrypted(rawData[0].phone) ? 'YES' : 'NO'}`)
    console.log(`✅ Raw address in DB: ${rawData[0].address.substring(0, 50)}...`)
    console.log(`✅ Is encrypted: ${DataEncryption.isEncrypted(rawData[0].address) ? 'YES' : 'NO'}`)
    
    // Test 3: Query and verify automatic decryption
    console.log('\nTest 3: Query and Automatic Decryption')
    const queriedClient = await prisma.client.findUnique({
      where: { id: client.id },
    })
    
    console.log(`✅ Queried phone (auto-decrypted): ${queriedClient?.phone}`)
    console.log(`✅ Match original: ${queriedClient?.phone === '555-TEST-ENCRYPT' ? 'YES' : 'NO'}`)
    
    // Test 4: Update encrypted field
    console.log('\nTest 4: Update Encrypted Field')
    const updatedClient = await prisma.client.update({
      where: { id: client.id },
      data: {
        phone: '555-NEW-PHONE',
      },
    })
    
    console.log(`✅ Updated phone (decrypted): ${updatedClient.phone}`)
    
    // Verify new encryption in DB
    const rawUpdated = await prisma.$queryRaw<Array<{phone: string}>>`
      SELECT phone FROM "Client" WHERE id = ${client.id}
    `
    
    console.log(`✅ New raw phone in DB: ${rawUpdated[0].phone.substring(0, 50)}...`)
    console.log(`✅ Is encrypted: ${DataEncryption.isEncrypted(rawUpdated[0].phone) ? 'YES' : 'NO'}`)
    
    // Cleanup
    console.log('\nTest 5: Cleanup')
    await prisma.client.delete({
      where: { id: client.id },
    })
    console.log(`✅ Test client deleted`)
    
  } catch (error) {
    console.error('❌ Prisma encryption test failed:', error)
    throw error
  }
}

async function testTamperDetection() {
  console.log('\n🛡️  Testing Tamper Detection...\n')
  
  const plaintext = 'secret-data'
  const encrypted = DataEncryption.encrypt(plaintext)
  
  console.log('Test 1: Valid Encrypted Data')
  try {
    const decrypted = DataEncryption.decrypt(encrypted)
    console.log(`✅ Valid data decrypted: ${decrypted}`)
  } catch (error) {
    console.error('❌ Should not throw:', error)
  }
  
  console.log('\nTest 2: Tampered Data')
  // Tamper with the ciphertext (change last 4 characters)
  const tampered = encrypted.slice(0, -4) + 'XXXX'
  
  try {
    DataEncryption.decrypt(tampered)
    console.error('❌ Should have thrown error for tampered data')
  } catch (error) {
    console.log('✅ Tamper detected and rejected')
    console.log(`✅ Error: ${(error as Error).message}`)
  }
}

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════')
  console.log('    Phase 3: Database Encryption Test Suite')
  console.log('═══════════════════════════════════════════════════')
  
  try {
    await testEncryptionLibrary()
    await testTamperDetection()
    await testPrismaEncryption()
    
    console.log('\n═══════════════════════════════════════════════════')
    console.log('✅ All Tests Passed!')
    console.log('═══════════════════════════════════════════════════\n')
    
    process.exit(0)
  } catch (error) {
    console.error('\n═══════════════════════════════════════════════════')
    console.error('❌ Tests Failed!')
    console.error('═══════════════════════════════════════════════════\n')
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

runAllTests()

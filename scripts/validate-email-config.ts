/**
 * Email Service - Quick Validation Test
 * 
 * Run this to quickly verify the email service is properly configured
 * 
 * Usage: npx tsx scripts/validate-email-config.ts
 */

// Load environment variables
import { config } from 'dotenv'
config()

import { validateEmailConfig, formatConfigForDisplay } from '../lib/email/config'

console.log('🔍 Validating Email Configuration...\n')

const validation = validateEmailConfig()

if (validation.valid && validation.config) {
  console.log('✅ Email configuration is VALID!\n')
  console.log(formatConfigForDisplay(validation.config))
  
  if (validation.warnings.length > 0) {
    console.log('\n⚠️  Warnings:')
    validation.warnings.forEach(warning => {
      console.log(`  • ${warning}`)
    })
  }
  
  console.log('\n✅ Ready to send emails!')
  console.log('\nNext steps:')
  console.log('  1. Run: npm run test:email your-email@example.com')
  console.log('  2. Check your inbox (and spam folder)')
  console.log('  3. Integrate into your application\n')
  
  process.exit(0)
} else {
  console.log('❌ Email configuration is INVALID!\n')
  console.log('Errors found:')
  validation.errors.forEach(error => {
    console.log(`\n  ❌ ${error.message}`)
    if (error.field) {
      console.log(`     Field: ${error.field}`)
    }
    if (error.suggestion) {
      console.log(`     💡 ${error.suggestion}`)
    }
  })
  
  if (validation.warnings.length > 0) {
    console.log('\n⚠️  Warnings:')
    validation.warnings.forEach(warning => {
      console.log(`  • ${warning}`)
    })
  }
  
  console.log('\nPlease fix the errors above and try again.')
  console.log('See .env.example for configuration examples.\n')
  
  process.exit(1)
}

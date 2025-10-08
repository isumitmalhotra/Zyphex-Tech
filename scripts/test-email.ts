/**
 * Email Service Testing Script
 * 
 * Tests all email functionality including templates and delivery
 * 
 * Usage:
 *   npm run test:email <test-email@example.com>
 *   npm run test:email <test-email@example.com> --template=all
 *   npm run test:email <test-email@example.com> --template=welcome
 */

// Load environment variables
import { config } from 'dotenv'
config()

import { emailService } from '../lib/email/service'
import { validateEmailConfig, formatConfigForDisplay } from '../lib/email/config'
import { generateWelcomeEmail } from '../lib/email/templates/welcome'
import { generateVerificationEmail } from '../lib/email/templates/verification'
import { generatePasswordResetEmail } from '../lib/email/templates/password-reset'
import { generateInvoiceEmail } from '../lib/email/templates/invoice'
import { generatePaymentConfirmationEmail } from '../lib/email/templates/payment-confirmation'

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function section(title: string) {
  console.log('\n' + '='.repeat(60))
  log(title, 'bright')
  console.log('='.repeat(60))
}

async function testConfiguration() {
  section('📧 Email Configuration Test')
  
  const validation = validateEmailConfig()
  
  if (!validation.valid) {
    log('\n❌ Configuration Errors:', 'red')
    validation.errors.forEach(error => {
      console.log(`   • ${error.message}`)
      if (error.field) {
        console.log(`     Field: ${error.field}`)
      }
      if (error.suggestion) {
        log(`     💡 ${error.suggestion}`, 'yellow')
      }
    })
    return false
  }
  
  log('\n✅ Configuration is valid!', 'green')
  
  if (validation.warnings.length > 0) {
    log('\n⚠️  Warnings:', 'yellow')
    validation.warnings.forEach(warning => {
      console.log(`   • ${warning}`)
    })
  }
  
  if (validation.config) {
    console.log('\n' + formatConfigForDisplay(validation.config))
  }
  
  return true
}

async function testConnection() {
  section('🔌 Connection Test')
  
  try {
    const result = await emailService.testConnection()
    
    if (result.success) {
      log('\n✅ Connection successful!', 'green')
      console.log(`   Provider: ${result.provider}`)
      if (result.details) {
        Object.entries(result.details).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`)
        })
      }
      return true
    } else {
      log('\n❌ Connection failed!', 'red')
      console.log(`   ${result.message}`)
      return false
    }
  } catch (error) {
    log('\n❌ Connection test error!', 'red')
    console.log(`   ${error instanceof Error ? error.message : 'Unknown error'}`)
    return false
  }
}

async function testBasicEmail(to: string) {
  section('📨 Basic Email Test')
  
  log(`\nSending test email to: ${to}`, 'cyan')
  
  try {
    const result = await emailService.sendTestEmail(to)
    
    if (result.success) {
      log('\n✅ Test email sent successfully!', 'green')
      console.log(`   Message ID: ${result.messageId}`)
      console.log(`   Provider: ${result.provider}`)
      console.log(`   Attempts: ${result.attempts || 1}`)
      log('\n📬 Check your inbox (and spam folder) for the test email', 'yellow')
      return true
    } else {
      log('\n❌ Failed to send test email!', 'red')
      console.log(`   Error: ${result.error}`)
      console.log(`   Provider: ${result.provider}`)
      console.log(`   Attempts: ${result.attempts || 0}`)
      return false
    }
  } catch (error) {
    log('\n❌ Test email error!', 'red')
    console.log(`   ${error instanceof Error ? error.message : 'Unknown error'}`)
    return false
  }
}

async function testTemplate(templateName: string, to: string) {
  section(`📄 Testing Template: ${templateName}`)
  
  let template: { subject: string; html: string; text: string }
  const appUrl = process.env.APP_URL || 'http://localhost:3000'
  
  try {
    switch (templateName) {
      case 'welcome':
        template = generateWelcomeEmail({
          recipientName: 'Test User',
          dashboardUrl: `${appUrl}/dashboard`
        })
        break
        
      case 'verification':
        template = generateVerificationEmail({
          recipientName: 'Test User',
          verificationUrl: `${appUrl}/auth/verify?token=test-token-123`,
          expiryHours: 24
        })
        break
        
      case 'password-reset':
        template = generatePasswordResetEmail({
          recipientName: 'Test User',
          resetUrl: `${appUrl}/reset-password?token=reset-token-456`,
          expiryMinutes: 60,
          ipAddress: '192.168.1.1'
        })
        break
        
      case 'invoice':
        template = generateInvoiceEmail({
          recipientName: 'Test Client',
          invoiceNumber: 'INV-2024-001',
          invoiceDate: new Date().toLocaleDateString(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          amount: 2500.00,
          currency: 'USD',
          items: [
            {
              description: 'Web Development - Landing Page',
              quantity: 1,
              rate: 1500.00,
              amount: 1500.00
            },
            {
              description: 'UI/UX Design',
              quantity: 5,
              rate: 200.00,
              amount: 1000.00
            }
          ],
          subtotal: 2500.00,
          total: 2500.00,
          invoiceUrl: `${appUrl}/invoices/test-invoice-123`,
          paymentUrl: `${appUrl}/invoices/test-invoice-123/pay`
        })
        break
        
      case 'payment-confirmation':
        template = generatePaymentConfirmationEmail({
          recipientName: 'Test Client',
          invoiceNumber: 'INV-2024-001',
          paymentDate: new Date().toLocaleString(),
          amount: 2500.00,
          currency: 'USD',
          paymentMethod: 'Credit Card',
          transactionId: 'pi_test_' + Math.random().toString(36).substr(2, 9),
          last4: '4242',
          receiptUrl: `${appUrl}/invoices/test-invoice-123/receipt`
        })
        break
        
      default:
        log(`\n❌ Unknown template: ${templateName}`, 'red')
        return false
    }
    
    log(`\nSending ${templateName} email to: ${to}`, 'cyan')
    log(`Subject: ${template.subject}`, 'cyan')
    
    const result = await emailService.sendEmail({
      to,
      subject: `[TEST] ${template.subject}`,
      html: template.html,
      text: template.text
    })
    
    if (result.success) {
      log('\n✅ Template email sent successfully!', 'green')
      console.log(`   Message ID: ${result.messageId}`)
      console.log(`   Provider: ${result.provider}`)
      console.log(`   Attempts: ${result.attempts || 1}`)
      return true
    } else {
      log('\n❌ Failed to send template email!', 'red')
      console.log(`   Error: ${result.error}`)
      return false
    }
    
  } catch (error) {
    log('\n❌ Template test error!', 'red')
    console.log(`   ${error instanceof Error ? error.message : 'Unknown error'}`)
    return false
  }
}

async function testAllTemplates(to: string) {
  const templates = [
    'welcome',
    'verification',
    'password-reset',
    'invoice',
    'payment-confirmation'
  ]
  
  section(`📚 Testing All Templates (${templates.length})`)
  
  const results: Record<string, boolean> = {}
  
  for (const template of templates) {
    const success = await testTemplate(template, to)
    results[template] = success
    
    // Wait between emails to avoid rate limiting
    if (templates.indexOf(template) < templates.length - 1) {
      log('\n⏳ Waiting 2 seconds before next template...', 'yellow')
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
  
  section('📊 Template Test Results')
  
  const successful = Object.values(results).filter(Boolean).length
  const total = Object.keys(results).length
  
  console.log('\nResults:')
  Object.entries(results).forEach(([template, success]) => {
    const icon = success ? '✅' : '❌'
    const color = success ? 'green' : 'red'
    log(`   ${icon} ${template}`, color)
  })
  
  console.log(`\nSummary: ${successful}/${total} templates sent successfully`)
  
  if (successful === total) {
    log('\n🎉 All templates sent successfully!', 'green')
  } else {
    log(`\n⚠️  ${total - successful} template(s) failed`, 'yellow')
  }
  
  return successful === total
}

async function main() {
  const args = process.argv.slice(2)
  
  // Display header
  console.clear()
  log('╔════════════════════════════════════════════════════════════╗', 'cyan')
  log('║          📧 Email Service Testing Suite                   ║', 'cyan')
  log('╚════════════════════════════════════════════════════════════╝', 'cyan')
  
  // Parse arguments
  const emailArg = args.find(arg => !arg.startsWith('--'))
  const templateArg = args.find(arg => arg.startsWith('--template='))?.split('=')[1]
  
  if (!emailArg) {
    log('\n❌ Error: Email address required', 'red')
    console.log('\nUsage:')
    console.log('  npm run test:email <test-email@example.com>')
    console.log('  npm run test:email <test-email@example.com> --template=all')
    console.log('  npm run test:email <test-email@example.com> --template=welcome')
    console.log('\nAvailable templates:')
    console.log('  • welcome')
    console.log('  • verification')
    console.log('  • password-reset')
    console.log('  • invoice')
    console.log('  • payment-confirmation')
    console.log('  • all (tests all templates)')
    process.exit(1)
  }
  
  const testEmail = emailArg
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(testEmail)) {
    log(`\n❌ Invalid email address: ${testEmail}`, 'red')
    process.exit(1)
  }
  
  log(`\nTest Email: ${testEmail}`, 'cyan')
  log(`Test Mode: ${templateArg || 'basic'}`, 'cyan')
  
  // Run tests
  let allSuccess = true
  
  // 1. Test configuration
  const configValid = await testConfiguration()
  if (!configValid) {
    log('\n❌ Configuration test failed. Please fix errors above.', 'red')
    process.exit(1)
  }
  
  // 2. Test connection
  const connectionOk = await testConnection()
  if (!connectionOk) {
    log('\n❌ Connection test failed. Please check your configuration.', 'red')
    process.exit(1)
  }
  
  // 3. Test email sending
  if (!templateArg) {
    // Basic test
    const basicOk = await testBasicEmail(testEmail)
    allSuccess = allSuccess && basicOk
  } else if (templateArg === 'all') {
    // Test all templates
    const templatesOk = await testAllTemplates(testEmail)
    allSuccess = allSuccess && templatesOk
  } else {
    // Test specific template
    const templateOk = await testTemplate(templateArg, testEmail)
    allSuccess = allSuccess && templateOk
  }
  
  // Final summary
  section('🏁 Test Summary')
  
  if (allSuccess) {
    log('\n✅ All tests passed!', 'green')
    log('\n📬 Check your email inbox (and spam folder)', 'yellow')
    log('\n💡 Tips:', 'cyan')
    console.log('   • Check spam/junk folder if emails are not in inbox')
    console.log('   • Mark emails as "Not Spam" to improve deliverability')
    console.log('   • Test with multiple email providers (Gmail, Outlook, etc.)')
    console.log('   • Verify SPF/DKIM records for production use')
    process.exit(0)
  } else {
    log('\n❌ Some tests failed', 'red')
    log('\n💡 Troubleshooting:', 'yellow')
    console.log('   • Check your email configuration in .env file')
    console.log('   • Verify SMTP credentials are correct')
    console.log('   • Check firewall/network settings')
    console.log('   • Review error messages above')
    console.log('   • Try testing with a different email provider')
    process.exit(1)
  }
}

// Run tests
main().catch(error => {
  log('\n❌ Fatal error:', 'red')
  console.error(error)
  process.exit(1)
})

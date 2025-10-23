/**
 * Action Integration Test Script
 * 
 * Tests all external service integrations for workflow actions.
 * This script verifies configuration and tests sending messages
 * without creating actual workflows.
 */

import {
  testEmailConfiguration,
  sendEmail,
} from '../lib/workflow/services/email-service'
import {
  testSlackConfiguration,
  sendSlackMessage,
} from '../lib/workflow/services/slack-service'
import {
  testTeamsWebhook,
  sendTeamsMessage,
} from '../lib/workflow/services/teams-service'
import {
  testSmsConfiguration,
  sendSms,
} from '../lib/workflow/services/sms-service'

// Test configuration flags
const SEND_TEST_MESSAGES = process.env.SEND_TEST_MESSAGES === 'true'
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com'
const TEST_SLACK_CHANNEL = process.env.TEST_SLACK_CHANNEL || '#general'
const TEST_PHONE = process.env.TEST_PHONE || '+15551234567'

console.log('='.repeat(70))
console.log('WORKFLOW ACTION INTEGRATION TESTS')
console.log('='.repeat(70))
console.log('')

/**
 * Test Email Integration
 */
async function testEmailIntegration() {
  console.log('📧 Testing Email Integration (SendGrid)...')
  console.log('-'.repeat(70))

  const config = await testEmailConfiguration()

  if (config.configured) {
    console.log('✅ SendGrid configured successfully')
    console.log(`   From Email: ${process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_FROM}`)

    if (SEND_TEST_MESSAGES) {
      console.log(`\n   Sending test email to: ${TEST_EMAIL}`)
      const result = await sendEmail({
        to: TEST_EMAIL,
        subject: 'Workflow Action Test',
        text: 'This is a test email from the workflow automation system.',
        html: '<h1>Test Email</h1><p>This is a test email from the workflow automation system.</p>',
      })

      if (result.success) {
        console.log(`   ✅ Test email sent successfully`)
        console.log(`   Message ID: ${result.messageId}`)
      } else {
        console.log(`   ❌ Test email failed: ${result.error}`)
      }
    }
  } else {
    console.log(`❌ SendGrid not configured: ${config.error}`)
    console.log('   Set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL environment variables')
  }

  console.log('')
}

/**
 * Test Slack Integration
 */
async function testSlackIntegration() {
  console.log('💬 Testing Slack Integration...')
  console.log('-'.repeat(70))

  const config = await testSlackConfiguration()

  if (config.configured && config.botInfo) {
    console.log('✅ Slack configured successfully')
    console.log(`   Bot: ${config.botInfo.name} (${config.botInfo.id})`)

    if (SEND_TEST_MESSAGES) {
      console.log(`\n   Sending test message to: ${TEST_SLACK_CHANNEL}`)
      const result = await sendSlackMessage({
        channel: TEST_SLACK_CHANNEL,
        text: '🤖 Test message from workflow automation system',
      })

      if (result.success) {
        console.log(`   ✅ Test message sent successfully`)
        console.log(`   Channel: ${result.channel}`)
        console.log(`   Message ID: ${result.messageId}`)
      } else {
        console.log(`   ❌ Test message failed: ${result.error}`)
      }
    }
  } else {
    console.log(`❌ Slack not configured: ${config.error}`)
    console.log('   Set SLACK_BOT_TOKEN environment variable')
  }

  console.log('')
}

/**
 * Test Teams Integration
 */
async function testTeamsIntegration() {
  console.log('👥 Testing Microsoft Teams Integration...')
  console.log('-'.repeat(70))

  const webhookUrl = process.env.TEAMS_WEBHOOK_URL

  if (!webhookUrl) {
    console.log('❌ Teams not configured')
    console.log('   Set TEAMS_WEBHOOK_URL environment variable')
    console.log('   Or provide webhook URL in workflow action config')
  } else {
    console.log('✅ Teams webhook URL found')

    if (SEND_TEST_MESSAGES) {
      console.log('\n   Sending test message to Teams...')
      const result = await testTeamsWebhook(webhookUrl)

      if (result.valid) {
        console.log('   ✅ Test message sent successfully')
      } else {
        console.log(`   ❌ Test message failed: ${result.error}`)
      }
    } else {
      // Just validate URL format
      const result = await sendTeamsMessage({
        webhookUrl,
        title: 'Configuration Test',
        text: 'Teams webhook URL is configured',
      })

      if (result.success) {
        console.log('   ✅ Webhook URL is valid')
      } else {
        console.log(`   ❌ Webhook validation failed: ${result.error}`)
      }
    }
  }

  console.log('')
}

/**
 * Test SMS Integration
 */
async function testSmsIntegration() {
  console.log('📱 Testing SMS Integration (Twilio)...')
  console.log('-'.repeat(70))

  const config = await testSmsConfiguration()

  if (config.configured) {
    console.log('✅ Twilio configured successfully')
    console.log(`   Phone Number: ${config.phoneNumber}`)

    if (SEND_TEST_MESSAGES) {
      console.log(`\n   Sending test SMS to: ${TEST_PHONE}`)
      const result = await sendSms({
        to: TEST_PHONE,
        body: 'Test SMS from workflow automation system',
      })

      if (result.success) {
        console.log(`   ✅ Test SMS sent successfully`)
        console.log(`   Message ID: ${result.messageId}`)
        console.log(`   To: ${result.to}`)
      } else {
        console.log(`   ❌ Test SMS failed: ${result.error}`)
      }
    }
  } else {
    console.log(`❌ Twilio not configured: ${config.error}`)
    console.log('   Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER')
  }

  console.log('')
}

/**
 * Run all tests
 */
async function runTests() {
  try {
    await testEmailIntegration()
    await testSlackIntegration()
    await testTeamsIntegration()
    await testSmsIntegration()

    console.log('='.repeat(70))
    console.log('TEST SUMMARY')
    console.log('='.repeat(70))
    console.log('')
    console.log('Configuration tests completed!')
    console.log('')
    
    if (!SEND_TEST_MESSAGES) {
      console.log('ℹ️  To send actual test messages, run:')
      console.log('   SEND_TEST_MESSAGES=true npm run test:actions')
      console.log('')
      console.log('   Configure test recipients:')
      console.log('   TEST_EMAIL=your@email.com')
      console.log('   TEST_SLACK_CHANNEL=#your-channel')
      console.log('   TEST_PHONE=+15551234567')
      console.log('')
    }

    console.log('Next steps:')
    console.log('1. Configure missing service credentials in .env')
    console.log('2. Run this test again to verify all integrations')
    console.log('3. Create workflows using these actions')
    console.log('')
  } catch (error) {
    console.error('Test execution error:', error)
    process.exit(1)
  }
}

// Run tests
runTests()

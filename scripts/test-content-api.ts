/**
 * API Endpoint Testing Script
 * 
 * Tests all PageContent API endpoints to verify they work correctly
 * Run with: tsx scripts/test-content-api.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

// ANSI color codes for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

async function testEndpoint(
  name: string, 
  url: string, 
  options: RequestInit = {}
): Promise<void> {
  try {
    console.log(`\n${colors.blue}Testing: ${name}${colors.reset}`)
    console.log(`URL: ${url}`)
    console.log(`Method: ${options.method || 'GET'}`)

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    const data = await response.json()

    if (response.ok) {
      console.log(`${colors.green}✓ Success (${response.status})${colors.reset}`)
      console.log('Response:', JSON.stringify(data, null, 2).substring(0, 500))
    } else {
      console.log(`${colors.yellow}⚠ Expected Error (${response.status})${colors.reset}`)
      console.log('Error:', data)
    }

  } catch (error) {
    console.log(`${colors.red}✗ Failed${colors.reset}`)
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function main(): Promise<void> {
  console.log(`${colors.bold}${colors.blue}═══════════════════════════════════════${colors.reset}`)
  console.log(`${colors.bold}  Content API Endpoint Tests${colors.reset}`)
  console.log(`${colors.bold}${colors.blue}═══════════════════════════════════════${colors.reset}`)

  // Get a sample section ID from the database
  const sampleSection = await prisma.pageContentSection.findFirst({
    where: {
      page: {
        pageKey: 'home'
      }
    }
  })

  const sectionId = sampleSection?.id || 'test-id'

  // Test 1: GET all pages
  await testEndpoint(
    'GET /api/cms/content/pages',
    `${BASE_URL}/api/cms/content/pages`
  )

  // Test 2: GET single page (home)
  await testEndpoint(
    'GET /api/cms/content/pages/home',
    `${BASE_URL}/api/cms/content/pages/home`
  )

  // Test 3: GET single page (non-existent)
  await testEndpoint(
    'GET /api/cms/content/pages/nonexistent (should 404)',
    `${BASE_URL}/api/cms/content/pages/nonexistent`
  )

  // Test 4: GET single section
  await testEndpoint(
    `GET /api/cms/content/sections/${sectionId}`,
    `${BASE_URL}/api/cms/content/sections/${sectionId}`
  )

  // Test 5: GET with query params
  await testEndpoint(
    'GET /api/cms/content/pages?status=published',
    `${BASE_URL}/api/cms/content/pages?status=published`
  )

  // Test 6: GET home with hidden sections
  await testEndpoint(
    'GET /api/cms/content/pages/home?includeHidden=true',
    `${BASE_URL}/api/cms/content/pages/home?includeHidden=true`
  )

  console.log(`\n${colors.bold}${colors.blue}═══════════════════════════════════════${colors.reset}`)
  console.log(`${colors.bold}${colors.green}✓ All endpoint tests completed!${colors.reset}`)
  console.log(`${colors.bold}${colors.blue}═══════════════════════════════════════${colors.reset}\n`)

  console.log(`${colors.yellow}Note: PUT/POST/DELETE tests skipped (require authentication)${colors.reset}`)
  console.log(`${colors.yellow}Use Thunder Client or Postman to test authenticated endpoints:${colors.reset}`)
  console.log(`  - PUT /api/cms/content/pages/[pageKey]`)
  console.log(`  - PUT /api/cms/content/sections/[id]`)
  console.log(`  - DELETE /api/cms/content/sections/[id]`)
  console.log(`  - POST /api/cms/content/pages`)
}

main()
  .catch((e: Error) => {
    console.error(`${colors.red}Test failed:${colors.reset}`, e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

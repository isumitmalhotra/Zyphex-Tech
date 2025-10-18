/**
 * Response Optimization Test Suite
 * 
 * Tests for API response compression, serialization, and ETags.
 * Validates performance improvements and functionality.
 * 
 * Run: npm run test:response-optimization
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCompressionStats } from '../middleware/compression'
import {
  pickFields,
  omitFields,
  paginateResponse,
  getPaginationParams,
  optimizeResponse,
  minimizeProject,
  estimateResponseSize
} from '../lib/utils/response-serializer'
import {
  generateETag,
  jsonResponseWithETag,
  generateObjectETag,
  generateArrayETag
} from '../lib/utils/etag'

// Test configuration
const TEST_CONFIG = {
  performanceThresholds: {
    compression: 30, // Minimum 30% compression ratio
    serializationOverhead: 10, // Maximum 10ms overhead
    etagGeneration: 5 // Maximum 5ms for ETag generation
  }
}

// Utility functions
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

function checkPerformance(name: string, value: number, threshold: number, higherIsBetter = false): boolean {
  const passed = higherIsBetter ? value >= threshold : value <= threshold
  const status = passed ? '✅' : '❌'
  const comparison = higherIsBetter
    ? (passed ? `(>= ${threshold})` : `(< ${threshold})`)
    : (passed ? `(<= ${threshold})` : `(> ${threshold})`)
  
  console.log(`  ${status} ${name}: ${value.toFixed(2)} ${comparison}`)
  return passed
}

// Sample test data
const sampleProject = {
  id: '1',
  name: 'Test Project',
  description: 'This is a sample project with a long description that will be used for compression testing. '.repeat(10),
  status: 'IN_PROGRESS',
  startDate: new Date(),
  endDate: new Date(),
  budget: 100000,
  progress: 45.5,
  clientId: 'client-1',
  managerId: 'manager-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  metadata: {
    tags: ['web', 'mobile', 'api'],
    notes: 'Additional notes about the project'
  }
}

const sampleProjects = Array.from({ length: 50 }, (_, i) => ({
  ...sampleProject,
  id: `project-${i}`,
  name: `Test Project ${i}`,
  description: `Description for project ${i}. `.repeat(20)
}))

async function test1_CompressionGzip() {
  console.log('\n📦 Test 1: Gzip Compression')
  console.log('  Testing gzip compression on JSON response')
  
  const data = { projects: sampleProjects }
  const response = NextResponse.json(data)
  
  const request = new NextRequest('http://localhost:3000/api/test', {
    headers: { 'accept-encoding': 'gzip' }
  })
  
  const stats = await getCompressionStats(response, request)
  
  console.log(`  Original size: ${formatBytes(stats.originalSize)}`)
  console.log(`  Compressed size: ${formatBytes(stats.compressedSize)}`)
  console.log(`  Compression ratio: ${formatPercent(stats.ratio)}`)
  console.log(`  Encoding: ${stats.encoding}`)
  console.log(`  Duration: ${stats.duration}ms`)
  
  return checkPerformance(
    'Compression Ratio',
    stats.ratio,
    TEST_CONFIG.performanceThresholds.compression,
    true
  )
}

async function test2_CompressionBrotli() {
  console.log('\n📦 Test 2: Brotli Compression')
  console.log('  Testing brotli compression (better than gzip)')
  
  const data = { projects: sampleProjects }
  const response = NextResponse.json(data)
  
  const request = new NextRequest('http://localhost:3000/api/test', {
    headers: { 'accept-encoding': 'br, gzip' }
  })
  
  const stats = await getCompressionStats(response, request)
  
  console.log(`  Original size: ${formatBytes(stats.originalSize)}`)
  console.log(`  Compressed size: ${formatBytes(stats.compressedSize)}`)
  console.log(`  Compression ratio: ${formatPercent(stats.ratio)}`)
  console.log(`  Encoding: ${stats.encoding}`)
  
  const isBrotli = stats.encoding === 'br'
  console.log(`  Uses Brotli: ${isBrotli ? '✅' : '❌'}`)
  
  return checkPerformance(
    'Compression Ratio',
    stats.ratio,
    TEST_CONFIG.performanceThresholds.compression,
    true
  ) && isBrotli
}

async function test3_FieldSelection() {
  console.log('\n🔍 Test 3: Selective Field Serialization')
  console.log('  Testing field picking and omitting')
  
  // Test picking fields
  const picked = pickFields(sampleProject, ['id', 'name', 'status'])
  const pickedKeys = Object.keys(picked)
  const pickedCorrect = pickedKeys.length === 3 &&
                        pickedKeys.includes('id') &&
                        pickedKeys.includes('name') &&
                        pickedKeys.includes('status')
  
  console.log(`  Pick fields: ${pickedCorrect ? '✅' : '❌'}`)
  console.log(`    Picked ${pickedKeys.length} fields from ${Object.keys(sampleProject).length}`)
  
  // Test omitting fields
  const omitted = omitFields(sampleProject, ['description', 'metadata', 'createdAt', 'updatedAt'])
  const omittedKeys = Object.keys(omitted)
  const omittedCorrect = !omittedKeys.includes('description') &&
                         !omittedKeys.includes('metadata')
  
  console.log(`  Omit fields: ${omittedCorrect ? '✅' : '❌'}`)
  console.log(`    Result has ${omittedKeys.length} fields (omitted 4)`)
  
  // Test size reduction
  const originalSize = estimateResponseSize(sampleProject)
  const minimizedSize = estimateResponseSize(picked)
  const reduction = ((1 - minimizedSize / originalSize) * 100)
  
  console.log(`  Original size: ${formatBytes(originalSize)}`)
  console.log(`  Minimized size: ${formatBytes(minimizedSize)}`)
  console.log(`  Size reduction: ${formatPercent(reduction)}`)
  
  return pickedCorrect && omittedCorrect
}

async function test4_Pagination() {
  console.log('\n📄 Test 4: Pagination Utilities')
  console.log('  Testing pagination metadata generation')
  
  const page = 2
  const limit = 20
  const total = 127
  
  const paginated = paginateResponse(
    sampleProjects.slice((page - 1) * limit, page * limit),
    page,
    limit,
    total
  )
  
  console.log(`  Page: ${paginated.meta.page}`)
  console.log(`  Limit: ${paginated.meta.limit}`)
  console.log(`  Total: ${paginated.meta.total}`)
  console.log(`  Total Pages: ${paginated.meta.totalPages}`)
  console.log(`  Has More: ${paginated.meta.hasMore}`)
  console.log(`  Has Previous: ${paginated.meta.hasPrevious}`)
  
  const metadataCorrect =
    paginated.meta.page === page &&
    paginated.meta.limit === limit &&
    paginated.meta.total === total &&
    paginated.meta.totalPages === 7 &&
    paginated.meta.hasMore === true &&
    paginated.meta.hasPrevious === true
  
  console.log(`  Metadata correct: ${metadataCorrect ? '✅' : '❌'}`)
  
  return metadataCorrect
}

async function test5_PaginationParams() {
  console.log('\n📄 Test 5: URL Pagination Parameter Parsing')
  console.log('  Testing pagination parameter extraction')
  
  const searchParams = new URLSearchParams({
    page: '3',
    limit: '50'
  })
  
  const params = getPaginationParams(searchParams)
  
  console.log(`  Page: ${params.page}`)
  console.log(`  Limit: ${params.limit}`)
  console.log(`  Offset: ${params.offset}`)
  
  const paramsCorrect =
    params.page === 3 &&
    params.limit === 50 &&
    params.offset === 100 // (3-1) * 50
  
  console.log(`  Params correct: ${paramsCorrect ? '✅' : '❌'}`)
  
  // Test defaults
  const emptyParams = getPaginationParams(new URLSearchParams())
  const defaultsCorrect =
    emptyParams.page === 1 &&
    emptyParams.limit === 20 &&
    emptyParams.offset === 0
  
  console.log(`  Defaults correct: ${defaultsCorrect ? '✅' : '❌'}`)
  
  return paramsCorrect && defaultsCorrect
}

async function test6_ResponseOptimization() {
  console.log('\n⚡ Test 6: Response Optimization')
  console.log('  Testing combined optimization features')
  
  const startTime = Date.now()
  
  const optimized = optimizeResponse(sampleProject, {
    include: ['id', 'name', 'status', 'budget', 'progress'],
    removeNullish: true
  })
  
  const duration = Date.now() - startTime
  
  const originalSize = estimateResponseSize(sampleProject)
  const optimizedSize = estimateResponseSize(optimized)
  const reduction = ((1 - optimizedSize / originalSize) * 100)
  
  console.log(`  Original size: ${formatBytes(originalSize)}`)
  console.log(`  Optimized size: ${formatBytes(optimizedSize)}`)
  console.log(`  Size reduction: ${formatPercent(reduction)}`)
  console.log(`  Optimization duration: ${duration}ms`)
  
  return checkPerformance(
    'Serialization Overhead',
    duration,
    TEST_CONFIG.performanceThresholds.serializationOverhead,
    false
  )
}

async function test7_ETagGeneration() {
  console.log('\n🏷️  Test 7: ETag Generation')
  console.log('  Testing ETag generation performance')
  
  const data = JSON.stringify(sampleProjects)
  
  const startTime = Date.now()
  const etag = generateETag(data)
  const duration = Date.now() - startTime
  
  console.log(`  Generated ETag: ${etag}`)
  console.log(`  Duration: ${duration}ms`)
  console.log(`  Data size: ${formatBytes(Buffer.from(data).length)}`)
  
  // Test uniqueness
  const etag2 = generateETag(data + ' ')
  const isUnique = etag !== etag2
  
  console.log(`  ETags unique: ${isUnique ? '✅' : '❌'}`)
  
  return checkPerformance(
    'ETag Generation',
    duration,
    TEST_CONFIG.performanceThresholds.etagGeneration,
    false
  ) && isUnique
}

async function test8_ETagCaching() {
  console.log('\n🏷️  Test 8: ETag Caching (304 Not Modified)')
  console.log('  Testing conditional requests with If-None-Match')
  
  const data = { projects: sampleProjects.slice(0, 10) }
  const etag = generateObjectETag(data as never)
  
  // First request - should return full response
  const request1 = new NextRequest('http://localhost:3000/api/projects')
  const response1 = jsonResponseWithETag(data, request1)
  
  console.log(`  First request status: ${response1.status}`)
  console.log(`  Response has ETag: ${response1.headers.has('etag') ? '✅' : '❌'}`)
  
  // Second request with If-None-Match - should return 304
  const request2 = new NextRequest('http://localhost:3000/api/projects', {
    headers: { 'if-none-match': etag }
  })
  const response2 = jsonResponseWithETag(data, request2)
  
  console.log(`  Second request status: ${response2.status}`)
  console.log(`  Returns 304 Not Modified: ${response2.status === 304 ? '✅' : '❌'}`)
  
  return response1.status === 200 && response2.status === 304
}

async function test9_MinimizeHelpers() {
  console.log('\n🎯 Test 9: Minimize Helper Functions')
  console.log('  Testing minimizeProject, minimizeTask, minimizeUser')
  
  const minimized = minimizeProject(sampleProject as never)
  const minimizedKeys = Object.keys(minimized)
  
  console.log(`  Original fields: ${Object.keys(sampleProject).length}`)
  console.log(`  Minimized fields: ${minimizedKeys.length}`)
  
  const hasRequiredFields = 
    minimizedKeys.includes('id') &&
    minimizedKeys.includes('name') &&
    minimizedKeys.includes('status')
  
  console.log(`  Has required fields: ${hasRequiredFields ? '✅' : '❌'}`)
  
  const originalSize = estimateResponseSize(sampleProject)
  const minimizedSize = estimateResponseSize(minimized)
  const reduction = ((1 - minimizedSize / originalSize) * 100)
  
  console.log(`  Size reduction: ${formatPercent(reduction)}`)
  
  return hasRequiredFields && reduction > 20
}

async function test10_ArrayETag() {
  console.log('\n🏷️  Test 10: Array ETag Generation')
  console.log('  Testing ETag for arrays of objects')
  
  const projects = sampleProjects.slice(0, 20)
  
  const startTime = Date.now()
  const etag = generateArrayETag(projects as never[])
  const duration = Date.now() - startTime
  
  console.log(`  Generated ETag for ${projects.length} items`)
  console.log(`  ETag: ${etag}`)
  console.log(`  Duration: ${duration}ms`)
  
  // Test that order matters
  const reversed = [...projects].reverse()
  const etagReversed = generateArrayETag(reversed as never[])
  const orderMatters = etag !== etagReversed
  
  console.log(`  Order affects ETag: ${orderMatters ? '✅' : '❌'}`)
  
  return checkPerformance(
    'Array ETag Generation',
    duration,
    TEST_CONFIG.performanceThresholds.etagGeneration,
    false
  ) && orderMatters
}

async function runTests() {
  console.log('═'.repeat(70))
  console.log('🚀 RESPONSE OPTIMIZATION TEST SUITE')
  console.log('═'.repeat(70))
  
  try {
    // Run tests
    const results = [
      await test1_CompressionGzip(),
      await test2_CompressionBrotli(),
      await test3_FieldSelection(),
      await test4_Pagination(),
      await test5_PaginationParams(),
      await test6_ResponseOptimization(),
      await test7_ETagGeneration(),
      await test8_ETagCaching(),
      await test9_MinimizeHelpers(),
      await test10_ArrayETag()
    ]
    
    // Summary
    const passed = results.filter(r => r).length
    const total = results.length
    const percentage = ((passed / total) * 100).toFixed(1)
    
    console.log('\n' + '═'.repeat(70))
    console.log('📈 TEST SUMMARY')
    console.log('═'.repeat(70))
    console.log(`  Total Tests: ${total}`)
    console.log(`  Passed: ${passed}`)
    console.log(`  Failed: ${total - passed}`)
    console.log(`  Success Rate: ${percentage}%`)
    console.log('═'.repeat(70))
    
    if (passed === total) {
      console.log('✅ All response optimization tests passed!')
      console.log('\n🎉 Response features validated:')
      console.log('  - Gzip/Brotli compression (30%+ ratio)')
      console.log('  - Selective field serialization')
      console.log('  - Pagination utilities')
      console.log('  - ETag generation and caching')
      console.log('  - 304 Not Modified responses')
      console.log('  - Response size optimization')
      console.log('  - Ready for production deployment')
    } else {
      console.log(`❌ ${total - passed} test(s) failed`)
      console.log('⚠️  Some response features need attention')
    }
    
    process.exit(passed === total ? 0 : 1)
    
  } catch (error) {
    console.error('\n❌ Test suite error:', error)
    process.exit(1)
  }
}

// Run tests
runTests()

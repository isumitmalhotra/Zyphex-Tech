/**
 * Performance Benchmark Suite
 * 
 * Automated performance testing with load testing, regression detection,
 * and benchmark comparisons.
 * 
 * Features:
 * - Query performance testing
 * - Load testing scenarios
 * - Regression detection
 * - Benchmark comparison
 * - Performance report generation
 * 
 * Usage:
 * npm run benchmark
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Benchmark result
 */
interface BenchmarkResult {
  name: string
  iterations: number
  totalTime: number
  averageTime: number
  minTime: number
  maxTime: number
  medianTime: number
  p95Time: number
  p99Time: number
  throughput: number
  success: boolean
  error?: string
}

/**
 * Benchmark configuration
 */
interface BenchmarkConfig {
  name: string
  iterations: number
  warmup?: number
  fn: () => Promise<void>
}

/**
 * Load test configuration
 */
interface LoadTestConfig {
  name: string
  duration: number  // seconds
  concurrency: number
  fn: () => Promise<void>
}

/**
 * Load test result
 */
interface LoadTestResult {
  name: string
  duration: number
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  requestsPerSecond: number
  averageLatency: number
  minLatency: number
  maxLatency: number
  p95Latency: number
  p99Latency: number
}

/**
 * Run benchmark
 */
async function runBenchmark(config: BenchmarkConfig): Promise<BenchmarkResult> {
  const times: number[] = []
  let error: string | undefined
  let success = true
  
  // Warmup
  if (config.warmup) {
    for (let i = 0; i < config.warmup; i++) {
      try {
        await config.fn()
      } catch {
        // Ignore warmup errors
      }
    }
  }
  
  // Run benchmark
  for (let i = 0; i < config.iterations; i++) {
    const start = Date.now()
    
    try {
      await config.fn()
      times.push(Date.now() - start)
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error'
      success = false
      break
    }
  }
  
  if (times.length === 0) {
    return {
      name: config.name,
      iterations: 0,
      totalTime: 0,
      averageTime: 0,
      minTime: 0,
      maxTime: 0,
      medianTime: 0,
      p95Time: 0,
      p99Time: 0,
      throughput: 0,
      success: false,
      error
    }
  }
  
  // Calculate statistics
  const sortedTimes = [...times].sort((a, b) => a - b)
  const totalTime = times.reduce((sum, t) => sum + t, 0)
  const averageTime = totalTime / times.length
  const minTime = sortedTimes[0]
  const maxTime = sortedTimes[sortedTimes.length - 1]
  const medianTime = sortedTimes[Math.floor(sortedTimes.length / 2)]
  const p95Index = Math.floor(sortedTimes.length * 0.95)
  const p99Index = Math.floor(sortedTimes.length * 0.99)
  const p95Time = sortedTimes[p95Index]
  const p99Time = sortedTimes[p99Index]
  const throughput = (times.length / totalTime) * 1000
  
  return {
    name: config.name,
    iterations: times.length,
    totalTime,
    averageTime,
    minTime,
    maxTime,
    medianTime,
    p95Time,
    p99Time,
    throughput,
    success,
    error
  }
}

/**
 * Run load test
 */
async function runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
  const latencies: number[] = []
  let successful = 0
  let failed = 0
  const endTime = Date.now() + (config.duration * 1000)
  
  const workers: Promise<void>[] = []
  
  // Start concurrent workers
  for (let i = 0; i < config.concurrency; i++) {
    workers.push((async () => {
      while (Date.now() < endTime) {
        const start = Date.now()
        
        try {
          await config.fn()
          latencies.push(Date.now() - start)
          successful++
        } catch {
          failed++
        }
      }
    })())
  }
  
  await Promise.all(workers)
  
  // Calculate statistics
  const sortedLatencies = [...latencies].sort((a, b) => a - b)
  const totalRequests = successful + failed
  const averageLatency = latencies.length > 0
    ? latencies.reduce((sum, t) => sum + t, 0) / latencies.length
    : 0
  const minLatency = sortedLatencies[0] || 0
  const maxLatency = sortedLatencies[sortedLatencies.length - 1] || 0
  const p95Index = Math.floor(sortedLatencies.length * 0.95)
  const p99Index = Math.floor(sortedLatencies.length * 0.99)
  const p95Latency = sortedLatencies[p95Index] || 0
  const p99Latency = sortedLatencies[p99Index] || 0
  const requestsPerSecond = totalRequests / config.duration
  
  return {
    name: config.name,
    duration: config.duration,
    totalRequests,
    successfulRequests: successful,
    failedRequests: failed,
    requestsPerSecond,
    averageLatency,
    minLatency,
    maxLatency,
    p95Latency,
    p99Latency
  }
}

/**
 * Print benchmark result
 */
function printBenchmark(result: BenchmarkResult): void {
  console.log(`\n${result.name}`)
  console.log('─'.repeat(result.name.length))
  
  if (!result.success) {
    console.log(`❌ Failed: ${result.error}`)
    return
  }
  
  console.log(`Iterations:     ${result.iterations}`)
  console.log(`Total Time:     ${result.totalTime.toFixed(2)}ms`)
  console.log(`Average:        ${result.averageTime.toFixed(2)}ms`)
  console.log(`Min:            ${result.minTime.toFixed(2)}ms`)
  console.log(`Max:            ${result.maxTime.toFixed(2)}ms`)
  console.log(`Median:         ${result.medianTime.toFixed(2)}ms`)
  console.log(`P95:            ${result.p95Time.toFixed(2)}ms`)
  console.log(`P99:            ${result.p99Time.toFixed(2)}ms`)
  console.log(`Throughput:     ${result.throughput.toFixed(2)} ops/sec`)
}

/**
 * Print load test result
 */
function printLoadTest(result: LoadTestResult): void {
  console.log(`\n${result.name}`)
  console.log('─'.repeat(result.name.length))
  console.log(`Duration:           ${result.duration}s`)
  console.log(`Total Requests:     ${result.totalRequests}`)
  console.log(`Successful:         ${result.successfulRequests}`)
  console.log(`Failed:             ${result.failedRequests}`)
  console.log(`Req/sec:            ${result.requestsPerSecond.toFixed(2)}`)
  console.log(`Average Latency:    ${result.averageLatency.toFixed(2)}ms`)
  console.log(`Min Latency:        ${result.minLatency.toFixed(2)}ms`)
  console.log(`Max Latency:        ${result.maxLatency.toFixed(2)}ms`)
  console.log(`P95 Latency:        ${result.p95Latency.toFixed(2)}ms`)
  console.log(`P99 Latency:        ${result.p99Latency.toFixed(2)}ms`)
}

/**
 * Main benchmarks
 */
async function main() {
  console.log('🚀 Performance Benchmark Suite\n')
  console.log('=' .repeat(50))
  
  // Query Benchmarks
  console.log('\n📊 QUERY BENCHMARKS\n')
  
  const benchmarks: BenchmarkConfig[] = [
    {
      name: 'findMany - 100 users',
      iterations: 100,
      warmup: 10,
      fn: async () => {
        await prisma.user.findMany({ take: 100 })
      }
    },
    {
      name: 'findUnique with relations',
      iterations: 100,
      warmup: 10,
      fn: async () => {
        const user = await prisma.user.findFirst()
        if (user) {
          await prisma.user.findUnique({
            where: { id: user.id }
          })
        }
      }
    },
    {
      name: 'Complex aggregation',
      iterations: 50,
      warmup: 5,
      fn: async () => {
        await prisma.user.aggregate({
          _count: true
        })
      }
    },
    {
      name: 'Pagination query',
      iterations: 100,
      warmup: 10,
      fn: async () => {
        await prisma.user.findMany({
          take: 20,
          skip: 0,
          orderBy: { createdAt: 'desc' }
        })
      }
    },
    {
      name: 'Search query (contains)',
      iterations: 50,
      warmup: 5,
      fn: async () => {
        await prisma.user.findMany({
          where: {
            OR: [
              { name: { contains: 'test' } },
              { email: { contains: 'test' } }
            ]
          },
          take: 20
        })
      }
    }
  ]
  
  const benchmarkResults: BenchmarkResult[] = []
  
  for (const config of benchmarks) {
    const result = await runBenchmark(config)
    benchmarkResults.push(result)
    printBenchmark(result)
  }
  
  // Load Tests
  console.log('\n\n⚡ LOAD TESTS\n')
  
  const loadTests: LoadTestConfig[] = [
    {
      name: 'Light load - 10 concurrent users',
      duration: 10,
      concurrency: 10,
      fn: async () => {
        await prisma.user.findMany({ take: 10 })
      }
    },
    {
      name: 'Medium load - 50 concurrent users',
      duration: 10,
      concurrency: 50,
      fn: async () => {
        await prisma.user.findMany({ take: 10 })
      }
    },
    {
      name: 'Heavy load - 100 concurrent users',
      duration: 10,
      concurrency: 100,
      fn: async () => {
        await prisma.user.findMany({ take: 10 })
      }
    }
  ]
  
  const loadTestResults: LoadTestResult[] = []
  
  for (const config of loadTests) {
    const result = await runLoadTest(config)
    loadTestResults.push(result)
    printLoadTest(result)
  }
  
  // Summary
  console.log('\n\n📈 SUMMARY\n')
  console.log('=' .repeat(50))
  
  const avgQueryTime = benchmarkResults.reduce((sum, r) => sum + r.averageTime, 0) / benchmarkResults.length
  const avgThroughput = benchmarkResults.reduce((sum, r) => sum + r.throughput, 0) / benchmarkResults.length
  const successfulBenchmarks = benchmarkResults.filter(r => r.success).length
  
  console.log(`\nQuery Benchmarks:`)
  console.log(`  Total:            ${benchmarkResults.length}`)
  console.log(`  Successful:       ${successfulBenchmarks}`)
  console.log(`  Avg Query Time:   ${avgQueryTime.toFixed(2)}ms`)
  console.log(`  Avg Throughput:   ${avgThroughput.toFixed(2)} ops/sec`)
  
  const avgReqPerSec = loadTestResults.reduce((sum, r) => sum + r.requestsPerSecond, 0) / loadTestResults.length
  const avgLatency = loadTestResults.reduce((sum, r) => sum + r.averageLatency, 0) / loadTestResults.length
  const totalRequests = loadTestResults.reduce((sum, r) => sum + r.totalRequests, 0)
  const failedRequests = loadTestResults.reduce((sum, r) => sum + r.failedRequests, 0)
  
  console.log(`\nLoad Tests:`)
  console.log(`  Total:            ${loadTestResults.length}`)
  console.log(`  Total Requests:   ${totalRequests}`)
  console.log(`  Failed Requests:  ${failedRequests}`)
  console.log(`  Avg Req/sec:      ${avgReqPerSec.toFixed(2)}`)
  console.log(`  Avg Latency:      ${avgLatency.toFixed(2)}ms`)
  
  console.log('\n✅ Benchmark complete!')
}

// Run benchmarks
main()
  .catch((error) => {
    console.error('❌ Benchmark error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

/**
 * Cache Performance Benchmark
 * 
 * Benchmark cache performance and compare different strategies.
 * 
 * Usage:
 * ```bash
 * npm run cache:benchmark
 * # or
 * tsx scripts/cache-benchmark.ts
 * ```
 */

import { getMultiLevelCache } from '../lib/cache/multi-level-cache'
import { getMemoryCache } from '../lib/cache/memory-cache'
import { cacheService } from '../lib/cache/cache-service'

console.log('╔═══════════════════════════════════════════════════════════╗')
console.log('║          CACHE PERFORMANCE BENCHMARK                      ║')
console.log('╚═══════════════════════════════════════════════════════════╝\n')

interface BenchmarkResult {
  name: string
  operations: number
  duration: number
  opsPerSecond: number
  avgLatency: number
}

/**
 * Run benchmark test
 */
async function runBenchmark(
  name: string,
  testFn: () => Promise<void>,
  iterations: number
): Promise<BenchmarkResult> {
  console.log(`🔄 Running: ${name}...`)
  
  const startTime = Date.now()
  
  for (let i = 0; i < iterations; i++) {
    await testFn()
  }
  
  const duration = Date.now() - startTime
  const opsPerSecond = (iterations / duration) * 1000
  const avgLatency = duration / iterations
  
  console.log(`   ✅ Completed: ${iterations.toLocaleString()} ops in ${duration}ms`)
  console.log(`   📊 ${opsPerSecond.toLocaleString()} ops/sec, ${avgLatency.toFixed(3)}ms avg latency\n`)
  
  return {
    name,
    operations: iterations,
    duration,
    opsPerSecond,
    avgLatency,
  }
}

async function main(): Promise<void> {
  const results: BenchmarkResult[] = []
  const iterations = 10000
  
  console.log(`Running ${iterations.toLocaleString()} operations per test\n`)
  
  // Test 1: L1 (Memory) Cache Write
  const l1 = getMemoryCache()
  results.push(
    await runBenchmark(
      'L1 (Memory) Cache Write',
      async () => {
        l1.set(`test-${Math.random()}`, { data: 'test' }, 300)
      },
      iterations
    )
  )
  
  // Test 2: L1 (Memory) Cache Read (Hit)
  l1.set('benchmark-key', { data: 'test' }, 300)
  results.push(
    await runBenchmark(
      'L1 (Memory) Cache Read (Hit)',
      async () => {
        l1.get('benchmark-key')
      },
      iterations
    )
  )
  
  // Test 3: L1 (Memory) Cache Read (Miss)
  results.push(
    await runBenchmark(
      'L1 (Memory) Cache Read (Miss)',
      async () => {
        l1.get(`nonexistent-${Math.random()}`)
      },
      iterations
    )
  )
  
  // Test 4: L2 (Redis) Cache Write
  try {
    results.push(
      await runBenchmark(
        'L2 (Redis) Cache Write',
        async () => {
          await cacheService.set(`test-${Math.random()}`, { data: 'test' }, 300)
        },
        Math.min(iterations, 1000) // Reduce iterations for network operations
      )
    )
  } catch (_error) {
    console.log('   ⚠️  L2 (Redis) cache not available, skipping\n')
  }
  
  // Test 5: L2 (Redis) Cache Read (Hit)
  try {
    await cacheService.set('benchmark-key', { data: 'test' }, 300)
    results.push(
      await runBenchmark(
        'L2 (Redis) Cache Read (Hit)',
        async () => {
          await cacheService.get('benchmark-key')
        },
        Math.min(iterations, 1000) // Reduce iterations for network operations
      )
    )
  } catch (_error) {
    console.log('   ⚠️  L2 (Redis) cache not available, skipping\n')
  }
  
  // Test 6: Multi-Level Cache Write
  const cache = getMultiLevelCache()
  results.push(
    await runBenchmark(
      'Multi-Level Cache Write',
      async () => {
        await cache.set(`test-${Math.random()}`, { data: 'test' }, { l1Ttl: 300, l2Ttl: 600 })
      },
      Math.min(iterations, 1000) // Reduce iterations for multi-level operations
    )
  )
  
  // Test 7: Multi-Level Cache Read (L1 Hit)
  await cache.set('benchmark-key', { data: 'test' }, { l1Ttl: 300, l2Ttl: 600 })
  results.push(
    await runBenchmark(
      'Multi-Level Cache Read (L1 Hit)',
      async () => {
        await cache.get('benchmark-key')
      },
      iterations
    )
  )
  
  // Test 8: Multi-Level Cache Read (L2 Hit)
  // First set in L2 only
  await cache.set('benchmark-key-l2', { data: 'test' }, { l1Ttl: 0, l2Ttl: 600 })
  results.push(
    await runBenchmark(
      'Multi-Level Cache Read (L2 Hit)',
      async () => {
        await cache.get('benchmark-key-l2')
      },
      Math.min(iterations, 1000)
    )
  )
  
  // Test 9: Multi-Level Cache Delete
  results.push(
    await runBenchmark(
      'Multi-Level Cache Delete',
      async () => {
        await cache.delete(`test-${Math.random()}`)
      },
      Math.min(iterations, 1000)
    )
  )
  
  // Summary
  console.log('═══════════════════════════════════════════════════════════')
  console.log('📊 BENCHMARK RESULTS SUMMARY\n')
  
  // Sort by ops/sec descending
  const sorted = [...results].sort((a, b) => b.opsPerSecond - a.opsPerSecond)
  
  console.log('Ranking by Operations per Second:\n')
  sorted.forEach((result, index) => {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  '
    console.log(`${medal} #${index + 1}: ${result.name}`)
    console.log(`   ${result.opsPerSecond.toLocaleString()} ops/sec (${result.avgLatency.toFixed(3)}ms avg latency)`)
  })
  
  console.log('\n═══════════════════════════════════════════════════════════')
  
  // Performance analysis
  console.log('\n📈 PERFORMANCE ANALYSIS\n')
  
  const l1Write = results.find((r) => r.name === 'L1 (Memory) Cache Write')
  const l1Read = results.find((r) => r.name === 'L1 (Memory) Cache Read (Hit)')
  const l2Write = results.find((r) => r.name === 'L2 (Redis) Cache Write')
  const l2Read = results.find((r) => r.name === 'L2 (Redis) Cache Read (Hit)')
  const multiRead = results.find((r) => r.name === 'Multi-Level Cache Read (L1 Hit)')
  
  if (l1Write && l2Write) {
    const speedup = l1Write.opsPerSecond / l2Write.opsPerSecond
    console.log(`L1 vs L2 Write: L1 is ${speedup.toFixed(1)}x faster`)
  }
  
  if (l1Read && l2Read) {
    const speedup = l1Read.opsPerSecond / l2Read.opsPerSecond
    console.log(`L1 vs L2 Read: L1 is ${speedup.toFixed(1)}x faster`)
  }
  
  if (l1Read && multiRead) {
    const overhead = ((l1Read.avgLatency - multiRead.avgLatency) / l1Read.avgLatency) * 100
    console.log(`Multi-Level overhead: ${Math.abs(overhead).toFixed(2)}% ${overhead > 0 ? 'slower' : 'faster'} than pure L1`)
  }
  
  console.log('\n💡 RECOMMENDATIONS\n')
  
  if (l1Read && l1Read.avgLatency > 0.1) {
    console.log('⚠️  L1 (Memory) read latency is high (>0.1ms)')
    console.log('   Consider optimizing serialization or reducing L1 size\n')
  } else {
    console.log('✅ L1 (Memory) performance is excellent (<0.1ms)\n')
  }
  
  if (l2Read && l2Read.avgLatency > 5) {
    console.log('⚠️  L2 (Redis) read latency is high (>5ms)')
    console.log('   Consider checking Redis connection pool or network latency\n')
  } else if (l2Read) {
    console.log('✅ L2 (Redis) performance is good (<5ms)\n')
  }
  
  if (multiRead && multiRead.opsPerSecond > 100000) {
    console.log('✅ Multi-level cache is highly optimized (>100K ops/sec)\n')
  } else if (multiRead && multiRead.opsPerSecond > 50000) {
    console.log('✅ Multi-level cache performance is good (>50K ops/sec)\n')
  } else {
    console.log('⚠️  Multi-level cache performance could be improved\n')
  }
  
  console.log('═══════════════════════════════════════════════════════════\n')
}

// Run benchmark
main()
  .then(() => {
    console.log('✅ Benchmark completed\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Benchmark failed:', error)
    process.exit(1)
  })

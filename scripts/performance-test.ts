/**
 * Performance Testing Script
 * Tests page load times for all major pages
 */

interface PerformanceResult {
  url: string
  pageName: string
  loadTime: number
  status: number
  success: boolean
}

const BASE_URL = 'http://localhost:3000'

const pages = [
  { name: 'Home Page', path: '/' },
  { name: 'Services Page', path: '/services' },
  { name: 'Portfolio Page', path: '/portfolio' },
  { name: 'Updates/Blog Page', path: '/updates' },
  { name: 'About Page', path: '/about' },
  { name: 'Contact Page', path: '/contact' },
]

async function testPageLoad(pageName: string, url: string): Promise<PerformanceResult> {
  const startTime = Date.now()
  
  try {
    const response = await fetch(url)
    const endTime = Date.now()
    const loadTime = endTime - startTime

    return {
      url,
      pageName,
      loadTime,
      status: response.status,
      success: response.ok
    }
  } catch (error) {
    const endTime = Date.now()
    return {
      url,
      pageName,
      loadTime: endTime - startTime,
      status: 0,
      success: false
    }
  }
}

function getPerformanceRating(loadTime: number): { emoji: string, rating: string, color: string } {
  if (loadTime < 500) return { emoji: '🚀', rating: 'EXCELLENT', color: '\x1b[32m' } // Green
  if (loadTime < 1000) return { emoji: '✅', rating: 'GOOD', color: '\x1b[36m' } // Cyan
  if (loadTime < 2000) return { emoji: '⚠️', rating: 'ACCEPTABLE', color: '\x1b[33m' } // Yellow
  if (loadTime < 3000) return { emoji: '⏳', rating: 'SLOW', color: '\x1b[35m' } // Magenta
  return { emoji: '❌', rating: 'VERY SLOW', color: '\x1b[31m' } // Red
}

async function runPerformanceTests() {
  console.log('🔍 Starting Performance Tests...\n')
  console.log('='.repeat(80))
  console.log('Testing Page Load Times for Zyphex-Tech Website')
  console.log('='.repeat(80))
  console.log()

  const results: PerformanceResult[] = []

  for (const page of pages) {
    const url = `${BASE_URL}${page.path}`
    console.log(`Testing: ${page.name}...`)
    
    // Run test 3 times and take average
    const attempts: number[] = []
    for (let i = 0; i < 3; i++) {
      const result = await testPageLoad(page.name, url)
      attempts.push(result.loadTime)
      
      if (i === 0) {
        results.push(result)
      }
    }

    const avgLoadTime = Math.round(attempts.reduce((a, b) => a + b, 0) / attempts.length)
    const { emoji, rating, color } = getPerformanceRating(avgLoadTime)
    
    console.log(`${color}  ${emoji} ${page.name}: ${avgLoadTime}ms (${rating})\x1b[0m`)
    console.log(`     Individual loads: ${attempts[0]}ms, ${attempts[1]}ms, ${attempts[2]}ms`)
    console.log()
  }

  // Summary
  console.log('='.repeat(80))
  console.log('📊 PERFORMANCE SUMMARY')
  console.log('='.repeat(80))
  console.log()

  const avgLoadTime = Math.round(
    results.reduce((sum, r) => sum + r.loadTime, 0) / results.length
  )
  const { emoji: summaryEmoji, rating: summaryRating, color: summaryColor } = getPerformanceRating(avgLoadTime)

  console.log(`Total Pages Tested: ${results.length}`)
  console.log(`Successful Loads: ${results.filter(r => r.success).length}`)
  console.log(`Failed Loads: ${results.filter(r => !r.success).length}`)
  console.log()
  console.log(`${summaryColor}Overall Average Load Time: ${avgLoadTime}ms (${summaryRating} ${summaryEmoji})\x1b[0m`)
  console.log()

  // Performance breakdown
  console.log('Performance Breakdown:')
  const excellent = results.filter(r => r.loadTime < 500).length
  const good = results.filter(r => r.loadTime >= 500 && r.loadTime < 1000).length
  const acceptable = results.filter(r => r.loadTime >= 1000 && r.loadTime < 2000).length
  const slow = results.filter(r => r.loadTime >= 2000 && r.loadTime < 3000).length
  const verySlow = results.filter(r => r.loadTime >= 3000).length

  console.log(`  🚀 Excellent (<500ms):     ${excellent} pages`)
  console.log(`  ✅ Good (500-1000ms):      ${good} pages`)
  console.log(`  ⚠️  Acceptable (1-2s):      ${acceptable} pages`)
  console.log(`  ⏳ Slow (2-3s):            ${slow} pages`)
  console.log(`  ❌ Very Slow (>3s):        ${verySlow} pages`)
  console.log()

  // Recommendations
  console.log('='.repeat(80))
  console.log('💡 RECOMMENDATIONS')
  console.log('='.repeat(80))
  console.log()

  if (avgLoadTime < 1000) {
    console.log('✅ Your website performance is excellent!')
    console.log('   Continue monitoring performance as you add more content.')
  } else if (avgLoadTime < 2000) {
    console.log('⚠️  Your website performance is acceptable but can be improved.')
    console.log('   Consider implementing:')
    console.log('   • Image optimization (WebP conversion, compression)')
    console.log('   • Lazy loading for images')
    console.log('   • Database query optimization')
    console.log('   • Redis caching for API responses')
  } else {
    console.log('❌ Your website performance needs improvement.')
    console.log('   URGENT actions needed:')
    console.log('   • Optimize images (current images may be too large)')
    console.log('   • Add Redis caching')
    console.log('   • Review database queries')
    console.log('   • Consider using a CDN')
    console.log('   • Enable Next.js Image optimization')
  }

  console.log()
  console.log('='.repeat(80))
  console.log('✅ Performance Test Complete!')
  console.log('='.repeat(80))
}

// Run the tests
runPerformanceTests().catch(console.error)

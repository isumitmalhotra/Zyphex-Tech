#!/usr/bin/env ts-node
/**
 * Performance Audit Script
 * Analyzes application performance and provides optimization recommendations
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

interface PerformanceCheck {
  category: string
  check: string
  status: 'PASS' | 'FAIL' | 'WARN' | 'INFO'
  metric?: string
  target?: string
  details?: string
  recommendation?: string
}

class PerformanceAuditor {
  private results: PerformanceCheck[] = []
  
  async runAudit() {
    console.log('⚡ Starting Performance Audit...\n')
    
    await this.checkBundleSize()
    await this.checkDatabaseQueries()
    await this.checkImageOptimization()
    await this.checkCodeSplitting()
    await this.checkCachingStrategy()
    await this.checkAPIOptimization()
    await this.checkDependencySize()
    await this.checkNextJsOptimizations()
    
    this.generateReport()
  }
  
  private async checkBundleSize() {
    console.log('📦 Analyzing Bundle Size...')
    
    const buildDir = path.join(process.cwd(), '.next')
    
    if (!fs.existsSync(buildDir)) {
      this.results.push({
        category: 'Bundle Size',
        check: 'Production Build',
        status: 'WARN',
        details: 'No production build found',
        recommendation: 'Run: npm run build'
      })
      return
    }
    
    // Check for large chunks
    const chunksDir = path.join(buildDir, 'static', 'chunks')
    if (fs.existsSync(chunksDir)) {
      const chunks = fs.readdirSync(chunksDir)
      const largeChunks = chunks.filter(chunk => {
        const stat = fs.statSync(path.join(chunksDir, chunk))
        return stat.size > 244000 // 244KB is Next.js default warning threshold
      })
      
      if (largeChunks.length > 0) {
        this.results.push({
          category: 'Bundle Size',
          check: 'Large Chunks',
          status: 'WARN',
          metric: `${largeChunks.length} chunks`,
          target: '< 244KB per chunk',
          details: `Found ${largeChunks.length} chunks larger than 244KB`,
          recommendation: 'Implement code splitting and dynamic imports'
        })
      } else {
        this.results.push({
          category: 'Bundle Size',
          check: 'Chunk Size',
          status: 'PASS',
          details: 'All chunks are within recommended size'
        })
      }
    }
    
    // Check package.json for bundle analysis
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'))
    if (packageJson.scripts?.analyze || packageJson.devDependencies?.['@next/bundle-analyzer']) {
      this.results.push({
        category: 'Bundle Size',
        check: 'Bundle Analyzer',
        status: 'PASS',
        details: 'Bundle analyzer is configured'
      })
    } else {
      this.results.push({
        category: 'Bundle Size',
        check: 'Bundle Analyzer',
        status: 'INFO',
        details: 'Bundle analyzer not configured',
        recommendation: 'Install @next/bundle-analyzer for detailed bundle analysis'
      })
    }
  }
  
  private async checkDatabaseQueries() {
    console.log('🗄️ Analyzing Database Queries...')
    
    // Check Prisma schema for indexes
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma')
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf-8')
      
      // Count models and indexes
      const modelCount = (schema.match(/model \w+ {/g) || []).length
      const indexCount = (schema.match(/@@index/g) || []).length
      const uniqueCount = (schema.match(/@@unique/g) || []).length
      
      if (indexCount > 0 || uniqueCount > 0) {
        this.results.push({
          category: 'Database',
          check: 'Database Indexes',
          status: 'PASS',
          metric: `${indexCount + uniqueCount} indexes`,
          details: `Found ${indexCount} indexes and ${uniqueCount} unique constraints across ${modelCount} models`
        })
      } else {
        this.results.push({
          category: 'Database',
          check: 'Database Indexes',
          status: 'WARN',
          details: 'No database indexes found',
          recommendation: 'Add indexes for frequently queried fields (email, userId, createdAt, etc.)'
        })
      }
      
      // Check for connection pooling
      if (schema.includes('connection_limit') || schema.includes('pool_timeout')) {
        this.results.push({
          category: 'Database',
          check: 'Connection Pooling',
          status: 'PASS',
          details: 'Connection pooling is configured'
        })
      } else {
        this.results.push({
          category: 'Database',
          check: 'Connection Pooling',
          status: 'WARN',
          details: 'Connection pooling not detected',
          recommendation: 'Add connection_limit and pool_timeout to database URL'
        })
      }
    }
    
    // Check for N+1 query prevention
    const apiFiles = this.findFiles(path.join(process.cwd(), 'app', 'api'), 'route.ts')
    let includeUsage = 0
    let selectUsage = 0
    
    apiFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8')
      includeUsage += (content.match(/include:\s*{/g) || []).length
      selectUsage += (content.match(/select:\s*{/g) || []).length
    })
    
    if (includeUsage > 0 || selectUsage > 0) {
      this.results.push({
        category: 'Database',
        check: 'Query Optimization',
        status: 'PASS',
        details: `Using include (${includeUsage}) and select (${selectUsage}) for efficient queries`
      })
    } else {
      this.results.push({
        category: 'Database',
        check: 'Query Optimization',
        status: 'INFO',
        details: 'No include/select usage detected',
        recommendation: 'Use Prisma include/select to fetch only needed fields'
      })
    }
  }
  
  private async checkImageOptimization() {
    console.log('🖼️ Checking Image Optimization...')
    
    // Check for next/image usage
    const componentFiles = this.findFiles(path.join(process.cwd(), 'components'), '.tsx')
    const appFiles = this.findFiles(path.join(process.cwd(), 'app'), '.tsx')
    const allFiles = [...componentFiles, ...appFiles]
    
    let nextImageUsage = 0
    let imgTagUsage = 0
    
    allFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8')
      if (content.includes("from 'next/image'") || content.includes('from "next/image"')) {
        nextImageUsage++
      }
      if (content.match(/<img\s/g)) {
        imgTagUsage++
      }
    })
    
    if (nextImageUsage > 0 && imgTagUsage === 0) {
      this.results.push({
        category: 'Image Optimization',
        check: 'Next.js Image Component',
        status: 'PASS',
        details: `Using next/image in ${nextImageUsage} files`
      })
    } else if (imgTagUsage > 0) {
      this.results.push({
        category: 'Image Optimization',
        check: 'Next.js Image Component',
        status: 'WARN',
        metric: `${imgTagUsage} <img> tags`,
        details: `Found ${imgTagUsage} files using <img> instead of next/image`,
        recommendation: 'Replace <img> tags with Next.js Image component'
      })
    } else {
      this.results.push({
        category: 'Image Optimization',
        check: 'Next.js Image Component',
        status: 'INFO',
        details: 'No image usage detected'
      })
    }
    
    // Check for WebP support in next.config
    const nextConfigPath = path.join(process.cwd(), 'next.config.mjs')
    if (fs.existsSync(nextConfigPath)) {
      const config = fs.readFileSync(nextConfigPath, 'utf-8')
      
      if (config.includes('formats:') && config.includes("'webp'")) {
        this.results.push({
          category: 'Image Optimization',
          check: 'WebP Support',
          status: 'PASS',
          details: 'WebP format is configured'
        })
      } else {
        this.results.push({
          category: 'Image Optimization',
          check: 'WebP Support',
          status: 'INFO',
          details: 'WebP format configuration not detected',
          recommendation: 'Configure WebP format in next.config.mjs for better compression'
        })
      }
    }
  }
  
  private async checkCodeSplitting() {
    console.log('✂️ Analyzing Code Splitting...')
    
    const appFiles = this.findFiles(path.join(process.cwd(), 'app'), '.tsx')
    const compFiles = this.findFiles(path.join(process.cwd(), 'components'), '.tsx')
    
    let dynamicImports = 0
    let lazyComponents = 0
    
    const allCodeFiles = [...appFiles, ...compFiles]
    allCodeFiles.forEach((file: string) => {
      const content = fs.readFileSync(file, 'utf-8')
      dynamicImports += (content.match(/dynamic\(.*import\(/g) || []).length
      lazyComponents += (content.match(/React\.lazy\(/g) || []).length
    })
    
    if (dynamicImports > 0 || lazyComponents > 0) {
      this.results.push({
        category: 'Code Splitting',
        check: 'Dynamic Imports',
        status: 'PASS',
        metric: `${dynamicImports + lazyComponents} components`,
        details: `Found ${dynamicImports} dynamic() and ${lazyComponents} lazy() imports`
      })
    } else {
      this.results.push({
        category: 'Code Splitting',
        check: 'Dynamic Imports',
        status: 'WARN',
        details: 'No dynamic imports detected',
        recommendation: 'Use dynamic imports for large components and routes'
      })
    }
  }
  
  private async checkCachingStrategy() {
    console.log('💾 Analyzing Caching Strategy...')
    
    // Check for Redis or cache implementation
    const cacheLibPath = path.join(process.cwd(), 'lib', 'cache')
    if (fs.existsSync(cacheLibPath)) {
      this.results.push({
        category: 'Caching',
        check: 'Cache Implementation',
        status: 'PASS',
        details: 'Cache library implementation found'
      })
    } else {
      this.results.push({
        category: 'Caching',
        check: 'Cache Implementation',
        status: 'WARN',
        details: 'No cache implementation found',
        recommendation: 'Implement caching for expensive operations (Redis, in-memory, etc.)'
      })
    }
    
    // Check API routes for caching headers
    const apiFiles = this.findFiles(path.join(process.cwd(), 'app', 'api'), 'route.ts')
    let cacheHeaderUsage = 0
    
    apiFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8')
      if (content.includes('Cache-Control') || content.includes('cache-control')) {
        cacheHeaderUsage++
      }
    })
    
    if (cacheHeaderUsage > 0) {
      this.results.push({
        category: 'Caching',
        check: 'API Cache Headers',
        status: 'PASS',
        metric: `${cacheHeaderUsage} endpoints`,
        details: `${cacheHeaderUsage} API endpoints use cache headers`
      })
    } else {
      this.results.push({
        category: 'Caching',
        check: 'API Cache Headers',
        status: 'WARN',
        details: 'No API cache headers detected',
        recommendation: 'Add Cache-Control headers to API responses'
      })
    }
    
    // Check for revalidation in page components
    const pageFiles = this.findFiles(path.join(process.cwd(), 'app'), 'page.tsx')
    let revalidateUsage = 0
    
    pageFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8')
      if (content.includes('revalidate') || content.includes('cache:')) {
        revalidateUsage++
      }
    })
    
    if (revalidateUsage > 0) {
      this.results.push({
        category: 'Caching',
        check: 'Page Revalidation',
        status: 'PASS',
        details: `${revalidateUsage} pages use revalidation`
      })
    } else {
      this.results.push({
        category: 'Caching',
        check: 'Page Revalidation',
        status: 'INFO',
        details: 'No page revalidation detected',
        recommendation: 'Consider using revalidate for static pages with dynamic data'
      })
    }
  }
  
  private async checkAPIOptimization() {
    console.log('🚀 Analyzing API Optimization...')
    
    // Check for compression
    const middlewarePath = path.join(process.cwd(), 'middleware.ts')
    if (fs.existsSync(middlewarePath)) {
      const middleware = fs.readFileSync(middlewarePath, 'utf-8')
      
      if (middleware.includes('compress') || middleware.includes('gzip')) {
        this.results.push({
          category: 'API Optimization',
          check: 'Response Compression',
          status: 'PASS',
          details: 'Response compression is configured'
        })
      } else {
        this.results.push({
          category: 'API Optimization',
          check: 'Response Compression',
          status: 'INFO',
          details: 'Response compression not detected',
          recommendation: 'Implement gzip/brotli compression for API responses'
        })
      }
    }
    
    // Check for pagination in list endpoints
    const apiFiles = this.findFiles(path.join(process.cwd(), 'app', 'api'), 'route.ts')
    let paginationUsage = 0
    
    apiFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8')
      if (content.includes('skip') && content.includes('take')) {
        paginationUsage++
      }
    })
    
    if (paginationUsage > 0) {
      this.results.push({
        category: 'API Optimization',
        check: 'Pagination',
        status: 'PASS',
        metric: `${paginationUsage} endpoints`,
        details: `${paginationUsage} endpoints implement pagination`
      })
    } else {
      this.results.push({
        category: 'API Optimization',
        check: 'Pagination',
        status: 'WARN',
        details: 'No pagination detected in API endpoints',
        recommendation: 'Implement pagination for list endpoints using skip/take'
      })
    }
  }
  
  private async checkDependencySize() {
    console.log('📚 Analyzing Dependencies...')
    
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'))
    const depCount = Object.keys(packageJson.dependencies || {}).length
    const devDepCount = Object.keys(packageJson.devDependencies || {}).length
    
    this.results.push({
      category: 'Dependencies',
      check: 'Dependency Count',
      status: 'INFO',
      metric: `${depCount} prod + ${devDepCount} dev`,
      details: `${depCount} production dependencies, ${devDepCount} dev dependencies`
    })
    
    // Check for moment.js (should use date-fns or day.js instead)
    if (packageJson.dependencies?.moment) {
      this.results.push({
        category: 'Dependencies',
        check: 'Heavy Dependencies',
        status: 'WARN',
        details: 'moment.js is a heavy dependency',
        recommendation: 'Replace moment.js with date-fns or day.js for smaller bundle size'
      })
    }
    
    // Check for lodash (should use lodash-es or individual imports)
    if (packageJson.dependencies?.lodash && !packageJson.dependencies?.['lodash-es']) {
      this.results.push({
        category: 'Dependencies',
        check: 'Tree-shakeable Dependencies',
        status: 'WARN',
        details: 'Using full lodash library',
        recommendation: 'Use lodash-es or import individual functions for better tree-shaking'
      })
    }
  }
  
  private async checkNextJsOptimizations() {
    console.log('⚡ Checking Next.js Optimizations...')
    
    const nextConfigPath = path.join(process.cwd(), 'next.config.mjs')
    if (fs.existsSync(nextConfigPath)) {
      const config = fs.readFileSync(nextConfigPath, 'utf-8')
      
      // Check for SWC minification
      if (config.includes('swcMinify: true')) {
        this.results.push({
          category: 'Next.js',
          check: 'SWC Minification',
          status: 'PASS',
          details: 'SWC minification is enabled'
        })
      } else {
        this.results.push({
          category: 'Next.js',
          check: 'SWC Minification',
          status: 'INFO',
          details: 'SWC minification not explicitly enabled',
          recommendation: 'Enable swcMinify: true for faster builds'
        })
      }
      
      // Check for compiler optimizations
      if (config.includes('compiler:')) {
        this.results.push({
          category: 'Next.js',
          check: 'Compiler Optimizations',
          status: 'PASS',
          details: 'Compiler optimizations configured'
        })
      } else {
        this.results.push({
          category: 'Next.js',
          check: 'Compiler Optimizations',
          status: 'INFO',
          details: 'Consider adding compiler optimizations',
          recommendation: 'Configure removeConsole, reactRemoveProperties, etc.'
        })
      }
    }
    
    // Check for font optimization
    const layoutFiles = this.findFiles(path.join(process.cwd(), 'app'), 'layout.tsx')
    let fontOptimization = false
    
    layoutFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8')
      if (content.includes('next/font')) {
        fontOptimization = true
      }
    })
    
    if (fontOptimization) {
      this.results.push({
        category: 'Next.js',
        check: 'Font Optimization',
        status: 'PASS',
        details: 'Using Next.js font optimization'
      })
    } else {
      this.results.push({
        category: 'Next.js',
        check: 'Font Optimization',
        status: 'INFO',
        details: 'next/font not detected',
        recommendation: 'Use next/font for automatic font optimization'
      })
    }
  }
  
  private findFiles(dir: string, extension: string): string[] {
    const files: string[] = []
    
    if (!fs.existsSync(dir)) return files
    
    const items = fs.readdirSync(dir)
    
    items.forEach(item => {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        files.push(...this.findFiles(fullPath, extension))
      } else if (item.endsWith(extension)) {
        files.push(fullPath)
      }
    })
    
    return files
  }
  
  private generateReport() {
    console.log('\n' + '='.repeat(80))
    console.log('⚡ PERFORMANCE AUDIT REPORT')
    console.log('='.repeat(80) + '\n')
    
    const categories = [...new Set(this.results.map(r => r.category))]
    
    categories.forEach(category => {
      const categoryResults = this.results.filter(r => r.category === category)
      const passed = categoryResults.filter(r => r.status === 'PASS').length
      const failed = categoryResults.filter(r => r.status === 'FAIL').length
      const warnings = categoryResults.filter(r => r.status === 'WARN').length
      
      console.log(`\n📋 ${category}`)
      console.log('-'.repeat(80))
      console.log(`✅ Passed: ${passed} | ❌ Failed: ${failed} | ⚠️  Warnings: ${warnings}`)
      console.log()
      
      categoryResults.forEach(result => {
        const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : result.status === 'WARN' ? '⚠️' : 'ℹ️'
        console.log(`${icon} ${result.check}`)
        if (result.metric) {
          console.log(`   📊 Metric: ${result.metric}`)
        }
        if (result.target) {
          console.log(`   🎯 Target: ${result.target}`)
        }
        if (result.details) {
          console.log(`   ${result.details}`)
        }
        if (result.recommendation) {
          console.log(`   💡 ${result.recommendation}`)
        }
        console.log()
      })
    })
    
    // Summary
    const totalPassed = this.results.filter(r => r.status === 'PASS').length
    const totalFailed = this.results.filter(r => r.status === 'FAIL').length
    const totalWarnings = this.results.filter(r => r.status === 'WARN').length
    const total = this.results.length
    
    console.log('='.repeat(80))
    console.log('📊 SUMMARY')
    console.log('='.repeat(80))
    console.log(`Total Checks: ${total}`)
    console.log(`✅ Passed: ${totalPassed} (${((totalPassed/total)*100).toFixed(1)}%)`)
    console.log(`❌ Failed: ${totalFailed} (${((totalFailed/total)*100).toFixed(1)}%)`)
    console.log(`⚠️  Warnings: ${totalWarnings} (${((totalWarnings/total)*100).toFixed(1)}%)`)
    console.log('='.repeat(80))
    
    if (totalFailed === 0 && totalWarnings < 3) {
      console.log('\n🎉 Excellent performance! Only minor optimizations needed.')
    } else if (totalWarnings < 5) {
      console.log('\n👍 Good performance with room for optimization')
    } else {
      console.log(`\n⚠️  ${totalWarnings} optimization opportunities identified`)
    }
    
    // Save to file
    this.saveReport()
  }
  
  private saveReport() {
    const reportPath = path.join(process.cwd(), 'PERFORMANCE_AUDIT_REPORT.md')
    let markdown = '# Performance Audit Report\n\n'
    markdown += `**Date**: ${new Date().toISOString()}\n\n`
    
    const categories = [...new Set(this.results.map(r => r.category))]
    
    categories.forEach(category => {
      const categoryResults = this.results.filter(r => r.category === category)
      markdown += `\n## ${category}\n\n`
      
      categoryResults.forEach(result => {
        const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : result.status === 'WARN' ? '⚠️' : 'ℹ️'
        markdown += `### ${icon} ${result.check}\n\n`
        if (result.metric) {
          markdown += `**Metric**: ${result.metric}\n\n`
        }
        if (result.target) {
          markdown += `**Target**: ${result.target}\n\n`
        }
        if (result.details) {
          markdown += `**Details**: ${result.details}\n\n`
        }
        if (result.recommendation) {
          markdown += `**Recommendation**: ${result.recommendation}\n\n`
        }
      })
    })
    
    // Summary
    const totalPassed = this.results.filter(r => r.status === 'PASS').length
    const totalFailed = this.results.filter(r => r.status === 'FAIL').length
    const totalWarnings = this.results.filter(r => r.status === 'WARN').length
    const total = this.results.length
    
    markdown += `\n## Summary\n\n`
    markdown += `- **Total Checks**: ${total}\n`
    markdown += `- **Passed**: ${totalPassed} (${((totalPassed/total)*100).toFixed(1)}%)\n`
    markdown += `- **Failed**: ${totalFailed} (${((totalFailed/total)*100).toFixed(1)}%)\n`
    markdown += `- **Warnings**: ${totalWarnings} (${((totalWarnings/total)*100).toFixed(1)}%)\n`
    
    fs.writeFileSync(reportPath, markdown)
    console.log(`\n📄 Report saved to: ${reportPath}`)
  }
}

// Run the audit
const auditor = new PerformanceAuditor()
auditor.runAudit().catch(console.error)

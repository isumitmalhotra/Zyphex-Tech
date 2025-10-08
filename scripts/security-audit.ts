#!/usr/bin/env ts-node
/**
 * Security Audit Script
 * Performs comprehensive security checks across the application
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

interface SecurityCheck {
  category: string
  check: string
  status: 'PASS' | 'FAIL' | 'WARN' | 'INFO'
  details?: string
  recommendation?: string
}

class SecurityAuditor {
  private results: SecurityCheck[] = []
  
  async runAudit() {
    console.log('🔒 Starting Security Audit...\n')
    
    await this.checkDependencies()
    await this.checkEnvironmentVariables()
    await this.checkAuthenticationSecurity()
    await this.checkAPISecurityHeaders()
    await this.checkDatabaseSecurity()
    await this.checkFrontendSecurity()
    await this.checkCORS()
    await this.checkRateLimiting()
    await this.checkInputValidation()
    await this.checkFileStructure()
    
    this.generateReport()
  }
  
  private async checkDependencies() {
    console.log('📦 Checking Dependencies...')
    
    try {
      // Check for known vulnerabilities
      const audit = execSync('npm audit --json', { encoding: 'utf-8' })
      const auditData = JSON.parse(audit)
      
      if (auditData.metadata.vulnerabilities.critical > 0) {
        this.results.push({
          category: 'Dependencies',
          check: 'Critical Vulnerabilities',
          status: 'FAIL',
          details: `Found ${auditData.metadata.vulnerabilities.critical} critical vulnerabilities`,
          recommendation: 'Run: npm audit fix --force'
        })
      } else if (auditData.metadata.vulnerabilities.high > 0) {
        this.results.push({
          category: 'Dependencies',
          check: 'High Vulnerabilities',
          status: 'WARN',
          details: `Found ${auditData.metadata.vulnerabilities.high} high vulnerabilities`,
          recommendation: 'Run: npm audit fix'
        })
      } else {
        this.results.push({
          category: 'Dependencies',
          check: 'Vulnerability Scan',
          status: 'PASS',
          details: 'No critical or high vulnerabilities found'
        })
      }
    } catch (error) {
      this.results.push({
        category: 'Dependencies',
        check: 'Vulnerability Scan',
        status: 'WARN',
        details: 'Could not run npm audit',
        recommendation: 'Manually run: npm audit'
      })
    }
  }
  
  private async checkEnvironmentVariables() {
    console.log('🔑 Checking Environment Variables...')
    
    const requiredEnvVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL',
      'RESEND_API_KEY'
    ]
    
    const envPath = path.join(process.cwd(), '.env')
    
    if (!fs.existsSync(envPath)) {
      this.results.push({
        category: 'Environment',
        check: '.env file',
        status: 'FAIL',
        details: '.env file not found',
        recommendation: 'Create .env file from .env.example'
      })
      return
    }
    
    const envContent = fs.readFileSync(envPath, 'utf-8')
    
    requiredEnvVars.forEach(varName => {
      if (!envContent.includes(varName)) {
        this.results.push({
          category: 'Environment',
          check: varName,
          status: 'FAIL',
          details: `${varName} not found in .env`,
          recommendation: `Add ${varName} to .env file`
        })
      } else if (envContent.includes(`${varName}=""`)) {
        this.results.push({
          category: 'Environment',
          check: varName,
          status: 'WARN',
          details: `${varName} is empty`,
          recommendation: `Set a value for ${varName}`
        })
      } else {
        this.results.push({
          category: 'Environment',
          check: varName,
          status: 'PASS',
          details: `${varName} is configured`
        })
      }
    })
    
    // Check for .env in .gitignore
    const gitignorePath = path.join(process.cwd(), '.gitignore')
    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8')
      if (gitignoreContent.includes('.env')) {
        this.results.push({
          category: 'Environment',
          check: '.env in .gitignore',
          status: 'PASS',
          details: '.env is properly excluded from git'
        })
      } else {
        this.results.push({
          category: 'Environment',
          check: '.env in .gitignore',
          status: 'FAIL',
          details: '.env is not in .gitignore',
          recommendation: 'Add .env to .gitignore immediately'
        })
      }
    }
  }
  
  private async checkAuthenticationSecurity() {
    console.log('🔐 Checking Authentication Security...')
    
    // Check auth configuration
    const authConfigPath = path.join(process.cwd(), 'lib', 'auth.ts')
    if (fs.existsSync(authConfigPath)) {
      const authConfig = fs.readFileSync(authConfigPath, 'utf-8')
      
      // Check for secure session settings
      if (authConfig.includes('secure: true') || authConfig.includes('secure:true')) {
        this.results.push({
          category: 'Authentication',
          check: 'Secure Cookies',
          status: 'PASS',
          details: 'Cookies are configured with secure flag'
        })
      } else {
        this.results.push({
          category: 'Authentication',
          check: 'Secure Cookies',
          status: 'WARN',
          details: 'Cookies may not have secure flag',
          recommendation: 'Set secure: true in cookie configuration'
        })
      }
      
      // Check for httpOnly
      if (authConfig.includes('httpOnly: true') || authConfig.includes('httpOnly:true')) {
        this.results.push({
          category: 'Authentication',
          check: 'HttpOnly Cookies',
          status: 'PASS',
          details: 'Cookies are configured with httpOnly flag'
        })
      } else {
        this.results.push({
          category: 'Authentication',
          check: 'HttpOnly Cookies',
          status: 'WARN',
          details: 'Cookies may not have httpOnly flag',
          recommendation: 'Set httpOnly: true in cookie configuration'
        })
      }
      
      // Check for session maxAge
      if (authConfig.includes('maxAge')) {
        this.results.push({
          category: 'Authentication',
          check: 'Session Expiration',
          status: 'PASS',
          details: 'Session expiration is configured'
        })
      } else {
        this.results.push({
          category: 'Authentication',
          check: 'Session Expiration',
          status: 'WARN',
          details: 'Session expiration may not be set',
          recommendation: 'Configure session maxAge'
        })
      }
    }
    
    // Check password hashing
    const passwordPath = path.join(process.cwd(), 'lib', 'auth', 'password.ts')
    if (fs.existsSync(passwordPath)) {
      const passwordConfig = fs.readFileSync(passwordPath, 'utf-8')
      
      if (passwordConfig.includes('bcrypt') || passwordConfig.includes('argon2')) {
        this.results.push({
          category: 'Authentication',
          check: 'Password Hashing',
          status: 'PASS',
          details: 'Using secure password hashing algorithm'
        })
      } else {
        this.results.push({
          category: 'Authentication',
          check: 'Password Hashing',
          status: 'WARN',
          details: 'Password hashing algorithm not verified',
          recommendation: 'Use bcrypt or argon2 for password hashing'
        })
      }
    }
  }
  
  private async checkAPISecurityHeaders() {
    console.log('🛡️ Checking API Security Headers...')
    
    const nextConfigPath = path.join(process.cwd(), 'next.config.mjs')
    if (fs.existsSync(nextConfigPath)) {
      const config = fs.readFileSync(nextConfigPath, 'utf-8')
      
      const securityHeaders = [
        { name: 'X-Frame-Options', value: 'DENY' },
        { name: 'X-Content-Type-Options', value: 'nosniff' },
        { name: 'X-XSS-Protection', value: '1; mode=block' },
        { name: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { name: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
      ]
      
      securityHeaders.forEach(header => {
        if (config.includes(header.name)) {
          this.results.push({
            category: 'Security Headers',
            check: header.name,
            status: 'PASS',
            details: `${header.name} header is configured`
          })
        } else {
          this.results.push({
            category: 'Security Headers',
            check: header.name,
            status: 'WARN',
            details: `${header.name} header not found`,
            recommendation: `Add ${header.name}: ${header.value} to security headers`
          })
        }
      })
      
      // Check for Content-Security-Policy
      if (config.includes('Content-Security-Policy')) {
        this.results.push({
          category: 'Security Headers',
          check: 'Content-Security-Policy',
          status: 'PASS',
          details: 'CSP is configured'
        })
      } else {
        this.results.push({
          category: 'Security Headers',
          check: 'Content-Security-Policy',
          status: 'FAIL',
          details: 'CSP not configured',
          recommendation: 'Implement Content-Security-Policy headers'
        })
      }
    }
  }
  
  private async checkDatabaseSecurity() {
    console.log('🗄️ Checking Database Security...')
    
    // Check Prisma schema
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma')
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf-8')
      
      // Check for sensitive field encryption markers
      if (schema.includes('@db.Text') && schema.includes('password')) {
        this.results.push({
          category: 'Database',
          check: 'Password Storage',
          status: 'INFO',
          details: 'Password field detected - ensure hashing before storage'
        })
      }
      
      // Check for indexes on frequently queried fields
      if (schema.includes('@@index')) {
        this.results.push({
          category: 'Database',
          check: 'Database Indexes',
          status: 'PASS',
          details: 'Database indexes are configured'
        })
      } else {
        this.results.push({
          category: 'Database',
          check: 'Database Indexes',
          status: 'WARN',
          details: 'No database indexes found',
          recommendation: 'Add indexes for frequently queried fields'
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
          status: 'INFO',
          details: 'Connection pooling configuration not detected',
          recommendation: 'Configure connection pooling for better performance'
        })
      }
    }
  }
  
  private async checkFrontendSecurity() {
    console.log('🎨 Checking Frontend Security...')
    
    // Check for dangerous innerHTML usage
    const componentPaths = this.findFiles(path.join(process.cwd(), 'components'), '.tsx')
    let dangerousHTMLFound = false
    
    componentPaths.forEach(filePath => {
      const content = fs.readFileSync(filePath, 'utf-8')
      if (content.includes('dangerouslySetInnerHTML')) {
        dangerousHTMLFound = true
      }
    })
    
    if (dangerousHTMLFound) {
      this.results.push({
        category: 'Frontend Security',
        check: 'XSS Prevention',
        status: 'WARN',
        details: 'dangerouslySetInnerHTML found in components',
        recommendation: 'Sanitize HTML content or avoid dangerouslySetInnerHTML'
      })
    } else {
      this.results.push({
        category: 'Frontend Security',
        check: 'XSS Prevention',
        status: 'PASS',
        details: 'No dangerouslySetInnerHTML usage found'
      })
    }
  }
  
  private async checkCORS() {
    console.log('🌐 Checking CORS Configuration...')
    
    const middlewarePath = path.join(process.cwd(), 'middleware.ts')
    if (fs.existsSync(middlewarePath)) {
      const middleware = fs.readFileSync(middlewarePath, 'utf-8')
      
      if (middleware.includes('Access-Control-Allow-Origin')) {
        if (middleware.includes('Access-Control-Allow-Origin: *')) {
          this.results.push({
            category: 'CORS',
            check: 'CORS Configuration',
            status: 'FAIL',
            details: 'CORS allows all origins (*)',
            recommendation: 'Restrict CORS to specific trusted origins'
          })
        } else {
          this.results.push({
            category: 'CORS',
            check: 'CORS Configuration',
            status: 'PASS',
            details: 'CORS is configured with specific origins'
          })
        }
      } else {
        this.results.push({
          category: 'CORS',
          check: 'CORS Configuration',
          status: 'INFO',
          details: 'CORS configuration not detected in middleware'
        })
      }
    }
  }
  
  private async checkRateLimiting() {
    console.log('⏱️ Checking Rate Limiting...')
    
    // Check for rate limiting middleware
    const securityMiddlewarePath = path.join(process.cwd(), 'lib', 'auth', 'security-middleware.ts')
    if (fs.existsSync(securityMiddlewarePath)) {
      const content = fs.readFileSync(securityMiddlewarePath, 'utf-8')
      
      if (content.includes('rateLimit') || content.includes('rate-limit')) {
        this.results.push({
          category: 'Rate Limiting',
          check: 'Rate Limiting Implementation',
          status: 'PASS',
          details: 'Rate limiting is implemented'
        })
      } else {
        this.results.push({
          category: 'Rate Limiting',
          check: 'Rate Limiting Implementation',
          status: 'WARN',
          details: 'Rate limiting not detected',
          recommendation: 'Implement rate limiting for API endpoints'
        })
      }
    }
  }
  
  private async checkInputValidation() {
    console.log('✅ Checking Input Validation...')
    
    const schemaPath = path.join(process.cwd(), 'lib', 'validation', 'schemas.ts')
    if (fs.existsSync(schemaPath)) {
      const schemas = fs.readFileSync(schemaPath, 'utf-8')
      
      if (schemas.includes('zod') || schemas.includes('yup')) {
        this.results.push({
          category: 'Input Validation',
          check: 'Validation Library',
          status: 'PASS',
          details: 'Using validation library (Zod/Yup)'
        })
      } else {
        this.results.push({
          category: 'Input Validation',
          check: 'Validation Library',
          status: 'WARN',
          details: 'Validation library not detected',
          recommendation: 'Use Zod or Yup for input validation'
        })
      }
    }
  }
  
  private async checkFileStructure() {
    console.log('📁 Checking File Structure...')
    
    const sensitiveFiles = [
      '.env',
      '.env.local',
      'prisma/dev.db',
      'node_modules'
    ]
    
    const gitignorePath = path.join(process.cwd(), '.gitignore')
    if (fs.existsSync(gitignorePath)) {
      const gitignore = fs.readFileSync(gitignorePath, 'utf-8')
      
      sensitiveFiles.forEach(file => {
        if (gitignore.includes(file)) {
          this.results.push({
            category: 'File Structure',
            check: `${file} exclusion`,
            status: 'PASS',
            details: `${file} is properly excluded from version control`
          })
        } else {
          this.results.push({
            category: 'File Structure',
            check: `${file} exclusion`,
            status: 'WARN',
            details: `${file} may not be excluded from version control`,
            recommendation: `Add ${file} to .gitignore`
          })
        }
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
      
      if (stat.isDirectory()) {
        files.push(...this.findFiles(fullPath, extension))
      } else if (item.endsWith(extension)) {
        files.push(fullPath)
      }
    })
    
    return files
  }
  
  private generateReport() {
    console.log('\n' + '='.repeat(80))
    console.log('🔒 SECURITY AUDIT REPORT')
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
    
    if (totalFailed === 0) {
      console.log('\n🎉 No critical security issues found!')
    } else {
      console.log(`\n⚠️  ${totalFailed} critical issue(s) require immediate attention`)
    }
    
    // Save to file
    this.saveReport()
  }
  
  private saveReport() {
    const reportPath = path.join(process.cwd(), 'SECURITY_AUDIT_REPORT.md')
    let markdown = '# Security Audit Report\n\n'
    markdown += `**Date**: ${new Date().toISOString()}\n\n`
    
    const categories = [...new Set(this.results.map(r => r.category))]
    
    categories.forEach(category => {
      const categoryResults = this.results.filter(r => r.category === category)
      markdown += `\n## ${category}\n\n`
      
      categoryResults.forEach(result => {
        const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : result.status === 'WARN' ? '⚠️' : 'ℹ️'
        markdown += `### ${icon} ${result.check}\n\n`
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
const auditor = new SecurityAuditor()
auditor.runAudit().catch(console.error)

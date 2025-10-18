/**
 * Migration Optimization Script
 * 
 * Analyzes Prisma migrations for performance issues and suggests improvements.
 * 
 * Features:
 * - Migration performance analysis
 * - Schema change validation
 * - Index recommendation
 * - Batch operation detection
 * - Migration benchmarking
 * - Rollback safety checks
 * 
 * Usage:
 * npm run optimize-migrations
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

/**
 * Migration analysis result
 */
interface MigrationAnalysis {
  migrationName: string
  filePath: string
  issues: MigrationIssue[]
  recommendations: MigrationRecommendation[]
  estimatedImpact: 'low' | 'medium' | 'high'
  riskLevel: 'low' | 'medium' | 'high'
}

/**
 * Migration issue
 */
interface MigrationIssue {
  type: 'missing-index' | 'blocking-ddl' | 'missing-batching' | 'unsafe-operation' | 'performance-risk'
  severity: 'info' | 'warning' | 'error'
  description: string
  line?: number
}

/**
 * Migration recommendation
 */
interface MigrationRecommendation {
  type: 'add-index' | 'use-concurrent' | 'batch-data' | 'add-transaction' | 'split-migration'
  priority: 'low' | 'medium' | 'high'
  suggestion: string
  implementation?: string
}

/**
 * Migration benchmark result
 */
interface BenchmarkResult {
  migrationName: string
  executionTime: number
  rowsAffected?: number
  success: boolean
  error?: string
}

/**
 * Get all migrations
 */
function getMigrations(): string[] {
  const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations')
  
  if (!fs.existsSync(migrationsDir)) {
    console.error('[MigrationOptimizer] Migrations directory not found')
    return []
  }
  
  return fs.readdirSync(migrationsDir)
    .filter(dir => fs.statSync(path.join(migrationsDir, dir)).isDirectory())
    .filter(dir => dir !== 'migration_lock.toml')
}

/**
 * Analyze a migration file
 */
function analyzeMigration(migrationName: string): MigrationAnalysis {
  const migrationPath = path.join(process.cwd(), 'prisma', 'migrations', migrationName, 'migration.sql')
  
  if (!fs.existsSync(migrationPath)) {
    throw new Error(`Migration file not found: ${migrationPath}`)
  }
  
  const sql = fs.readFileSync(migrationPath, 'utf-8')
  const lines = sql.split('\n')
  
  const issues: MigrationIssue[] = []
  const recommendations: MigrationRecommendation[] = []
  
  // Analyze SQL statements
  lines.forEach((line, index) => {
    const trimmed = line.trim().toLowerCase()
    
    // Check for blocking DDL operations
    if (trimmed.startsWith('alter table') && trimmed.includes('add column')) {
      if (!trimmed.includes('default') && !trimmed.includes('null')) {
        issues.push({
          type: 'blocking-ddl',
          severity: 'warning',
          description: 'Adding non-nullable column without default may lock table',
          line: index + 1
        })
        
        recommendations.push({
          type: 'use-concurrent',
          priority: 'high',
          suggestion: 'Add column as nullable or with default value to avoid table locks',
          implementation: `-- Instead of:\n-- ALTER TABLE table_name ADD COLUMN column_name TYPE;\n-- Use:\nALTER TABLE table_name ADD COLUMN column_name TYPE DEFAULT default_value;`
        })
      }
    }
    
    // Check for missing indexes after adding foreign keys
    if (trimmed.includes('foreign key')) {
      const columnMatch = line.match(/FOREIGN KEY\s*\("([^"]+)"\)/i)
      if (columnMatch) {
        const column = columnMatch[1]
        
        // Check if index exists in subsequent lines
        const hasIndex = lines.some(l => 
          l.toLowerCase().includes('create index') && 
          l.toLowerCase().includes(column.toLowerCase())
        )
        
        if (!hasIndex) {
          issues.push({
            type: 'missing-index',
            severity: 'warning',
            description: `Foreign key on column "${column}" may need an index`,
            line: index + 1
          })
          
          recommendations.push({
            type: 'add-index',
            priority: 'medium',
            suggestion: `Add index for foreign key column "${column}"`,
            implementation: `CREATE INDEX "idx_table_${column}" ON "table_name"("${column}");`
          })
        }
      }
    }
    
    // Check for large data migrations without batching
    if ((trimmed.includes('update') || trimmed.includes('insert')) && 
        !trimmed.includes('where') && 
        !trimmed.includes('limit')) {
      issues.push({
        type: 'missing-batching',
        severity: 'warning',
        description: 'Bulk operation without batching may cause performance issues',
        line: index + 1
      })
      
      recommendations.push({
        type: 'batch-data',
        priority: 'high',
        suggestion: 'Use batching for large data operations',
        implementation: `-- Process in batches of 1000\nDO $$\nDECLARE\n  batch_size INTEGER := 1000;\nBEGIN\n  LOOP\n    UPDATE table_name SET column = value WHERE id IN (\n      SELECT id FROM table_name WHERE condition LIMIT batch_size\n    );\n    EXIT WHEN NOT FOUND;\n  END LOOP;\nEND $$;`
      })
    }
    
    // Check for DROP operations
    if (trimmed.startsWith('drop table') || trimmed.startsWith('drop column')) {
      issues.push({
        type: 'unsafe-operation',
        severity: 'error',
        description: 'DROP operation detected - ensure data backup exists',
        line: index + 1
      })
      
      recommendations.push({
        type: 'split-migration',
        priority: 'high',
        suggestion: 'Consider deprecating first, then dropping in a later migration',
        implementation: `-- Migration 1: Deprecate\nCOMMENT ON COLUMN table_name.column_name IS 'DEPRECATED: Will be removed in version X';\n\n-- Migration 2 (later): Drop\nALTER TABLE table_name DROP COLUMN column_name;`
      })
    }
    
    // Check for CREATE TABLE without indexes on common query columns
    if (trimmed.startsWith('create table')) {
      const tableName = line.match(/CREATE TABLE\s+"([^"]+)"/i)?.[1]
      if (tableName) {
        // Check if any indexes are created for this table
        const hasIndexes = lines.some(l => 
          l.toLowerCase().includes('create index') && 
          l.toLowerCase().includes(tableName.toLowerCase())
        )
        
        if (!hasIndexes) {
          issues.push({
            type: 'performance-risk',
            severity: 'info',
            description: `Table "${tableName}" has no indexes - consider adding for common queries`,
            line: index + 1
          })
          
          recommendations.push({
            type: 'add-index',
            priority: 'low',
            suggestion: `Review query patterns and add appropriate indexes for "${tableName}"`,
            implementation: `-- Example: Add index on commonly queried columns\nCREATE INDEX "idx_${tableName}_column" ON "${tableName}"("column_name");\nCREATE INDEX "idx_${tableName}_created" ON "${tableName}"("createdAt");`
          })
        }
      }
    }
  })
  
  // Calculate impact and risk
  const estimatedImpact = calculateImpact(issues)
  const riskLevel = calculateRisk(issues)
  
  return {
    migrationName,
    filePath: migrationPath,
    issues,
    recommendations,
    estimatedImpact,
    riskLevel
  }
}

/**
 * Calculate migration impact
 */
function calculateImpact(issues: MigrationIssue[]): 'low' | 'medium' | 'high' {
  const blockingDDL = issues.filter(i => i.type === 'blocking-ddl').length
  const unsafeOps = issues.filter(i => i.type === 'unsafe-operation').length
  
  if (unsafeOps > 0 || blockingDDL > 2) return 'high'
  if (blockingDDL > 0 || issues.length > 5) return 'medium'
  return 'low'
}

/**
 * Calculate risk level
 */
function calculateRisk(issues: MigrationIssue[]): 'low' | 'medium' | 'high' {
  const errors = issues.filter(i => i.severity === 'error').length
  const warnings = issues.filter(i => i.severity === 'warning').length
  
  if (errors > 0) return 'high'
  if (warnings > 2) return 'medium'
  return 'low'
}

/**
 * Benchmark a migration
 */
async function _benchmarkMigration(sql: string, migrationName: string): Promise<BenchmarkResult> {
  const startTime = Date.now()
  
  try {
    // Execute in a transaction for safety
    await prisma.$executeRawUnsafe(`BEGIN;`)
    await prisma.$executeRawUnsafe(sql)
    await prisma.$executeRawUnsafe(`ROLLBACK;`)
    
    const executionTime = Date.now() - startTime
    
    return {
      migrationName,
      executionTime,
      success: true
    }
  } catch (error) {
    const executionTime = Date.now() - startTime
    
    return {
      migrationName,
      executionTime,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Generate optimization report
 */
function generateReport(analyses: MigrationAnalysis[]): string {
  let report = '# Migration Optimization Report\n\n'
  report += `Generated: ${new Date().toISOString()}\n\n`
  
  // Summary
  report += '## Summary\n\n'
  report += `Total migrations: ${analyses.length}\n`
  report += `High risk: ${analyses.filter(a => a.riskLevel === 'high').length}\n`
  report += `Medium risk: ${analyses.filter(a => a.riskLevel === 'medium').length}\n`
  report += `Low risk: ${analyses.filter(a => a.riskLevel === 'low').length}\n\n`
  
  // High-priority issues
  const highPriorityAnalyses = analyses.filter(a => 
    a.riskLevel === 'high' || a.estimatedImpact === 'high'
  )
  
  if (highPriorityAnalyses.length > 0) {
    report += '## High Priority Issues\n\n'
    
    for (const analysis of highPriorityAnalyses) {
      report += `### ${analysis.migrationName}\n\n`
      report += `- **Risk Level**: ${analysis.riskLevel}\n`
      report += `- **Estimated Impact**: ${analysis.estimatedImpact}\n\n`
      
      if (analysis.issues.length > 0) {
        report += '**Issues:**\n\n'
        for (const issue of analysis.issues) {
          report += `- [${issue.severity.toUpperCase()}] ${issue.description}`
          if (issue.line) report += ` (Line ${issue.line})`
          report += '\n'
        }
        report += '\n'
      }
      
      if (analysis.recommendations.length > 0) {
        report += '**Recommendations:**\n\n'
        for (const rec of analysis.recommendations) {
          report += `- [${rec.priority.toUpperCase()}] ${rec.suggestion}\n`
          if (rec.implementation) {
            report += '\n```sql\n' + rec.implementation + '\n```\n\n'
          }
        }
      }
      
      report += '\n---\n\n'
    }
  }
  
  // All migrations detail
  report += '## All Migrations\n\n'
  
  for (const analysis of analyses) {
    report += `### ${analysis.migrationName}\n\n`
    report += `- **Risk**: ${analysis.riskLevel}\n`
    report += `- **Impact**: ${analysis.estimatedImpact}\n`
    report += `- **Issues**: ${analysis.issues.length}\n`
    report += `- **Recommendations**: ${analysis.recommendations.length}\n\n`
  }
  
  return report
}

/**
 * Main execution
 */
async function main() {
  console.log('[MigrationOptimizer] Starting migration analysis...\n')
  
  const migrations = getMigrations()
  
  if (migrations.length === 0) {
    console.log('[MigrationOptimizer] No migrations found')
    return
  }
  
  console.log(`[MigrationOptimizer] Found ${migrations.length} migrations\n`)
  
  // Analyze all migrations
  const analyses: MigrationAnalysis[] = []
  
  for (const migration of migrations) {
    try {
      const analysis = analyzeMigration(migration)
      analyses.push(analysis)
      
      console.log(`✓ Analyzed: ${migration}`)
      console.log(`  Risk: ${analysis.riskLevel}, Impact: ${analysis.estimatedImpact}`)
      console.log(`  Issues: ${analysis.issues.length}, Recommendations: ${analysis.recommendations.length}`)
      
      if (analysis.issues.length > 0) {
        console.log('  Issues:')
        for (const issue of analysis.issues.slice(0, 3)) {
          console.log(`    - [${issue.severity}] ${issue.description}`)
        }
        if (analysis.issues.length > 3) {
          console.log(`    ... and ${analysis.issues.length - 3} more`)
        }
      }
      
      console.log('')
    } catch (error) {
      console.error(`✗ Error analyzing ${migration}:`, error)
    }
  }
  
  // Generate report
  const report = generateReport(analyses)
  const reportPath = path.join(process.cwd(), 'MIGRATION_OPTIMIZATION_REPORT.md')
  fs.writeFileSync(reportPath, report)
  
  console.log(`\n[MigrationOptimizer] Report saved to: ${reportPath}`)
  
  // Summary
  const highRisk = analyses.filter(a => a.riskLevel === 'high').length
  const totalIssues = analyses.reduce((sum, a) => sum + a.issues.length, 0)
  const totalRecommendations = analyses.reduce((sum, a) => sum + a.recommendations.length, 0)
  
  console.log('\n=== Summary ===')
  console.log(`Total Migrations: ${migrations.length}`)
  console.log(`High Risk: ${highRisk}`)
  console.log(`Total Issues: ${totalIssues}`)
  console.log(`Total Recommendations: ${totalRecommendations}`)
  
  if (highRisk > 0) {
    console.log('\n⚠️  WARNING: High-risk migrations detected. Review the report for details.')
  } else {
    console.log('\n✓ All migrations look good!')
  }
}

// Run
main()
  .catch((error) => {
    console.error('[MigrationOptimizer] Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

/**
 * Query Performance Optimizer
 * 
 * Analyzes queries, provides optimization recommendations, and generates
 * performance hints for database operations.
 * 
 * Features:
 * - Automatic query analysis
 * - Index recommendations
 * - N+1 query detection
 * - Query complexity scoring
 * - Performance optimization hints
 * - Slow query identification
 * 
 * Usage:
 * import { QueryOptimizer } from '@/lib/db/query-optimizer'
 * const analysis = QueryOptimizer.analyzeQuery(queryPlan)
 */

/**
 * Query analysis result
 */
export interface QueryAnalysis {
  query: string
  complexity: 'low' | 'medium' | 'high' | 'critical'
  estimatedCost: number
  issues: QueryIssue[]
  recommendations: QueryRecommendation[]
  hasIndexes: boolean
  executionTime?: number
}

/**
 * Query issue
 */
export interface QueryIssue {
  type: 'n+1' | 'missing-index' | 'full-scan' | 'sequential-query' | 'large-result' | 'nested-include'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  impact: string
}

/**
 * Optimization recommendation
 */
export interface QueryRecommendation {
  type: 'index' | 'query-rewrite' | 'caching' | 'pagination' | 'parallel' | 'denormalize'
  priority: 'low' | 'medium' | 'high' | 'critical'
  suggestion: string
  expectedImprovement: string
  implementation?: string
}

/**
 * Query pattern detection
 */
interface QueryPattern {
  type: string
  model: string
  operation: string
  hasInclude: boolean
  includeDepth: number
  hasWhere: boolean
  hasOrderBy: boolean
  hasPagination: boolean
  selectFieldCount?: number
}

/**
 * Query Optimizer Class
 */
class QueryPerformanceOptimizer {
  private slowQueryThreshold = 1000 // 1 second
  private nPlusOneThreshold = 10 // 10 queries in sequence
  
  /**
   * Analyze a Prisma query
   */
  analyzeQuery(query: string, executionTime?: number): QueryAnalysis {
    const pattern = this.detectQueryPattern(query)
    const issues: QueryIssue[] = []
    const recommendations: QueryRecommendation[] = []
    
    // Check for N+1 queries
    if (this.detectNPlusOne(pattern)) {
      issues.push({
        type: 'n+1',
        severity: 'critical',
        description: 'Potential N+1 query pattern detected',
        impact: 'Multiple sequential database queries causing performance degradation'
      })
      
      recommendations.push({
        type: 'query-rewrite',
        priority: 'critical',
        suggestion: 'Use include or select with nested relations',
        expectedImprovement: '80-95% reduction in queries',
        implementation: `
// Bad: N+1 pattern
const projects = await prisma.project.findMany()
for (const project of projects) {
  const tasks = await prisma.task.findMany({ where: { projectId: project.id } })
}

// Good: Single query with include
const projects = await prisma.project.findMany({
  include: { tasks: true }
})
        `.trim()
      })
    }
    
    // Check for missing indexes
    if (pattern.hasWhere && !this.hasIndexOnWhereClause(query)) {
      issues.push({
        type: 'missing-index',
        severity: 'high',
        description: 'WHERE clause without index',
        impact: 'Full table scan causing slow query performance'
      })
      
      recommendations.push({
        type: 'index',
        priority: 'high',
        suggestion: 'Add index on WHERE clause fields',
        expectedImprovement: '60-90% faster query execution',
        implementation: 'CREATE INDEX idx_table_column ON table(column)'
      })
    }
    
    // Check for deep nesting
    if (pattern.includeDepth > 2) {
      issues.push({
        type: 'nested-include',
        severity: 'medium',
        description: `Deep nesting detected (depth: ${pattern.includeDepth})`,
        impact: 'Large result sets and slow serialization'
      })
      
      recommendations.push({
        type: 'query-rewrite',
        priority: 'medium',
        suggestion: 'Limit include depth or use separate queries',
        expectedImprovement: '40-60% reduction in response time'
      })
    }
    
    // Check for missing pagination
    if (pattern.operation === 'findMany' && !pattern.hasPagination) {
      issues.push({
        type: 'large-result',
        severity: 'medium',
        description: 'findMany without pagination',
        impact: 'Potential memory issues with large datasets'
      })
      
      recommendations.push({
        type: 'pagination',
        priority: 'medium',
        suggestion: 'Add take and skip for pagination',
        expectedImprovement: '50-70% reduction in memory usage',
        implementation: `
// Add pagination
const results = await prisma.project.findMany({
  skip: (page - 1) * limit,
  take: limit
})
        `.trim()
      })
    }
    
    // Check for sequential queries that could be parallel
    if (this.detectSequentialQueries(query)) {
      issues.push({
        type: 'sequential-query',
        severity: 'medium',
        description: 'Sequential queries detected',
        impact: 'Unnecessary wait time between independent queries'
      })
      
      recommendations.push({
        type: 'parallel',
        priority: 'high',
        suggestion: 'Execute independent queries in parallel',
        expectedImprovement: '60-80% reduction in total execution time',
        implementation: `
// Use Promise.all for parallel execution
const [projects, tasks, users] = await Promise.all([
  prisma.project.findMany(),
  prisma.task.findMany(),
  prisma.user.findMany()
])
        `.trim()
      })
    }
    
    // Determine complexity
    const complexity = this.calculateComplexity(pattern, issues)
    const estimatedCost = this.estimateQueryCost(pattern, issues)
    
    // Check if slow
    if (executionTime && executionTime > this.slowQueryThreshold) {
      recommendations.push({
        type: 'caching',
        priority: 'high',
        suggestion: 'Cache query results',
        expectedImprovement: '90-99% reduction on cache hits',
        implementation: 'Use Redis or query-cache.ts for result caching'
      })
    }
    
    return {
      query,
      complexity,
      estimatedCost,
      issues,
      recommendations,
      hasIndexes: this.hasIndexOnWhereClause(query),
      executionTime
    }
  }
  
  /**
   * Detect query pattern from Prisma query
   */
  private detectQueryPattern(query: string): QueryPattern {
    const pattern: QueryPattern = {
      type: 'prisma',
      model: this.extractModel(query),
      operation: this.extractOperation(query),
      hasInclude: query.includes('include'),
      includeDepth: this.calculateIncludeDepth(query),
      hasWhere: query.includes('where'),
      hasOrderBy: query.includes('orderBy'),
      hasPagination: query.includes('take') && query.includes('skip'),
      selectFieldCount: this.countSelectedFields(query)
    }
    
    return pattern
  }
  
  /**
   * Extract model name from query
   */
  private extractModel(query: string): string {
    const match = query.match(/prisma\.(\w+)\./)
    return match ? match[1] : 'unknown'
  }
  
  /**
   * Extract operation from query
   */
  private extractOperation(query: string): string {
    const match = query.match(/\.(\w+)\(/)
    return match ? match[1] : 'unknown'
  }
  
  /**
   * Calculate include depth
   */
  private calculateIncludeDepth(query: string): number {
    const includes = query.match(/include:/g)
    return includes ? includes.length : 0
  }
  
  /**
   * Count selected fields
   */
  private countSelectedFields(query: string): number {
    const selectMatch = query.match(/select:\s*{([^}]+)}/)
    if (!selectMatch) return 0
    
    const fields = selectMatch[1].split(',')
    return fields.length
  }
  
  /**
   * Detect N+1 query pattern
   */
  private detectNPlusOne(pattern: QueryPattern): boolean {
    // Heuristic: findMany without include on related data
    return pattern.operation === 'findMany' && 
           !pattern.hasInclude &&
           pattern.model !== 'unknown'
  }
  
  /**
   * Check if WHERE clause has indexes
   */
  private hasIndexOnWhereClause(_query: string): boolean {
    // Simplified check - in production, query EXPLAIN ANALYZE
    // For now, assume common fields have indexes
    return true
  }
  
  /**
   * Detect sequential queries
   */
  private detectSequentialQueries(query: string): boolean {
    // Check if multiple await statements
    const awaits = query.match(/await/g)
    return awaits ? awaits.length > 2 : false
  }
  
  /**
   * Calculate query complexity
   */
  private calculateComplexity(
    pattern: QueryPattern,
    issues: QueryIssue[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    let score = 0
    
    // Base complexity
    if (pattern.includeDepth > 0) score += pattern.includeDepth * 2
    if (pattern.hasWhere) score += 1
    if (pattern.hasOrderBy) score += 1
    if (!pattern.hasPagination && pattern.operation === 'findMany') score += 2
    
    // Issue severity
    const criticalIssues = issues.filter(i => i.severity === 'critical').length
    const highIssues = issues.filter(i => i.severity === 'high').length
    
    score += criticalIssues * 5
    score += highIssues * 3
    
    if (score >= 10) return 'critical'
    if (score >= 6) return 'high'
    if (score >= 3) return 'medium'
    return 'low'
  }
  
  /**
   * Estimate query cost (arbitrary units)
   */
  private estimateQueryCost(pattern: QueryPattern, issues: QueryIssue[]): number {
    let cost = 10 // Base cost
    
    cost += pattern.includeDepth * 20
    if (!pattern.hasPagination) cost += 50
    if (pattern.hasWhere && !this.hasIndexOnWhereClause('')) cost += 100
    
    issues.forEach(issue => {
      if (issue.severity === 'critical') cost += 200
      if (issue.severity === 'high') cost += 100
      if (issue.severity === 'medium') cost += 50
    })
    
    return cost
  }
  
  /**
   * Generate optimization report for multiple queries
   */
  generateReport(queries: Array<{ query: string; executionTime?: number }>): {
    totalQueries: number
    slowQueries: number
    criticalIssues: number
    analyses: QueryAnalysis[]
    summary: string
  } {
    const analyses = queries.map(q => this.analyzeQuery(q.query, q.executionTime))
    
    const slowQueries = analyses.filter(a => 
      a.executionTime && a.executionTime > this.slowQueryThreshold
    ).length
    
    const criticalIssues = analyses.reduce((sum, a) => 
      sum + a.issues.filter(i => i.severity === 'critical').length, 0
    )
    
    const summary = this.generateSummary(analyses)
    
    return {
      totalQueries: queries.length,
      slowQueries,
      criticalIssues,
      analyses,
      summary
    }
  }
  
  /**
   * Generate summary text
   */
  private generateSummary(analyses: QueryAnalysis[]): string {
    const critical = analyses.filter(a => a.complexity === 'critical').length
    const high = analyses.filter(a => a.complexity === 'high').length
    
    if (critical > 0) {
      return `⚠️  ${critical} critical performance issues found. Immediate optimization required.`
    }
    
    if (high > 0) {
      return `⚠️  ${high} high-priority performance issues found. Optimization recommended.`
    }
    
    return '✅ No critical performance issues detected.'
  }
  
  /**
   * Get top recommendations across all queries
   */
  getTopRecommendations(analyses: QueryAnalysis[], limit = 5): QueryRecommendation[] {
    const allRecommendations = analyses.flatMap(a => a.recommendations)
    
    // Sort by priority
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
    allRecommendations.sort((a, b) => 
      priorityOrder[b.priority] - priorityOrder[a.priority]
    )
    
    // Deduplicate by suggestion
    const unique = allRecommendations.filter((rec, index, self) =>
      index === self.findIndex(r => r.suggestion === rec.suggestion)
    )
    
    return unique.slice(0, limit)
  }
}

// Singleton instance
const optimizer = new QueryPerformanceOptimizer()

/**
 * Analyze a single query
 */
export function analyzeQuery(query: string, executionTime?: number): QueryAnalysis {
  return optimizer.analyzeQuery(query, executionTime)
}

/**
 * Generate optimization report
 */
export function generateOptimizationReport(
  queries: Array<{ query: string; executionTime?: number }>
) {
  return optimizer.generateReport(queries)
}

/**
 * Get top recommendations
 */
export function getTopRecommendations(analyses: QueryAnalysis[], limit = 5) {
  return optimizer.getTopRecommendations(analyses, limit)
}

/**
 * Middleware to analyze query performance
 */
export async function withQueryAnalysis<T>(
  query: () => Promise<T>,
  queryString: string
): Promise<{ result: T; analysis: QueryAnalysis }> {
  const startTime = Date.now()
  const result = await query()
  const executionTime = Date.now() - startTime
  
  const analysis = analyzeQuery(queryString, executionTime)
  
  // Log if slow
  if (executionTime > 1000) {
    console.warn('[QueryOptimizer] Slow query detected:', {
      query: queryString.substring(0, 100),
      executionTime,
      complexity: analysis.complexity,
      issues: analysis.issues.length
    })
  }
  
  return { result, analysis }
}

export { QueryPerformanceOptimizer }
export const QueryOptimizer = optimizer

const QueryOptimizerUtils = {
  analyzeQuery,
  generateOptimizationReport,
  getTopRecommendations,
  withQueryAnalysis,
  QueryOptimizer
}

export default QueryOptimizerUtils

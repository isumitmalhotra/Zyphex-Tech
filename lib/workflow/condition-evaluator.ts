/**
 * Condition Evaluator - Evaluates workflow conditions
 * 
 * Evaluates complex condition trees with comparison operators,
 * logical operators (AND/OR/NOT), and nested conditions.
 * 
 * @module lib/workflow/condition-evaluator
 */

import {
  ConditionTree,
  Condition,
  ConditionGroup,
  ConditionOperator,
  LogicalOperator,
  ExecutionContext,
} from '@/types/workflow'

/**
 * Evaluates workflow conditions against execution context
 */
export class ConditionEvaluator {
  /**
   * Initialize the condition evaluator
   */
  public async initialize(): Promise<void> {
    // Initialization logic if needed
  }

  /**
   * Evaluate condition tree
   */
  public async evaluate(
    conditionTree: ConditionTree,
    context: ExecutionContext
  ): Promise<boolean> {
    if (!conditionTree) {
      return true // No conditions = always true
    }

    return this.evaluateConditionTree(conditionTree, context)
  }

  /**
   * Evaluate condition tree (recursive)
   */
  private evaluateConditionTree(
    node: ConditionTree,
    context: ExecutionContext
  ): boolean {
    // Check if it's a condition group
    if ('operator' in node && 'conditions' in node) {
      return this.evaluateConditionGroup(node as ConditionGroup, context)
    }

    // It's a single condition
    return this.evaluateCondition(node as Condition, context)
  }

  /**
   * Evaluate condition group with logical operator
   */
  private evaluateConditionGroup(
    group: ConditionGroup,
    context: ExecutionContext
  ): boolean {
    const { operator, conditions } = group

    switch (operator) {
      case LogicalOperator.AND:
        return conditions.every((cond) => this.evaluateConditionTree(cond, context))

      case LogicalOperator.OR:
        return conditions.some((cond) => this.evaluateConditionTree(cond, context))

      case LogicalOperator.NOT:
        // NOT should have exactly one condition
        if (conditions.length !== 1) {
          throw new Error('NOT operator must have exactly one condition')
        }
        return !this.evaluateConditionTree(conditions[0], context)

      default:
        throw new Error(`Unknown logical operator: ${operator}`)
    }
  }

  /**
   * Evaluate single condition
   */
  private evaluateCondition(condition: Condition, context: ExecutionContext): boolean {
    const { field, operator, value } = condition

    // Get field value from context using dot notation
    const fieldValue = this.getFieldValue(field, context)

    // Evaluate based on operator
    return this.evaluateOperator(operator, fieldValue, value)
  }

  /**
   * Get field value from context using dot notation
   */
  private getFieldValue(path: string, context: ExecutionContext): unknown {
    const parts = path.split('.')
    let current: unknown = context

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined
      }

      if (typeof current === 'object') {
        current = (current as Record<string, unknown>)[part]
      } else {
        return undefined
      }
    }

    return current
  }

  /**
   * Evaluate comparison operator
   */
  private evaluateOperator(
    operator: ConditionOperator,
    fieldValue: unknown,
    compareValue: unknown
  ): boolean {
    switch (operator) {
      // Comparison Operators
      case ConditionOperator.EQUALS:
        return fieldValue === compareValue

      case ConditionOperator.NOT_EQUALS:
        return fieldValue !== compareValue

      case ConditionOperator.GREATER_THAN:
        return this.compareNumbers(fieldValue, compareValue, (a, b) => a > b)

      case ConditionOperator.LESS_THAN:
        return this.compareNumbers(fieldValue, compareValue, (a, b) => a < b)

      case ConditionOperator.GREATER_OR_EQUAL:
        return this.compareNumbers(fieldValue, compareValue, (a, b) => a >= b)

      case ConditionOperator.LESS_OR_EQUAL:
        return this.compareNumbers(fieldValue, compareValue, (a, b) => a <= b)

      // String Operators
      case ConditionOperator.CONTAINS:
        return this.stringContains(fieldValue, compareValue)

      case ConditionOperator.NOT_CONTAINS:
        return !this.stringContains(fieldValue, compareValue)

      case ConditionOperator.STARTS_WITH:
        return this.stringStartsWith(fieldValue, compareValue)

      case ConditionOperator.ENDS_WITH:
        return this.stringEndsWith(fieldValue, compareValue)

      case ConditionOperator.MATCHES_REGEX:
        return this.matchesRegex(fieldValue, compareValue)

      // Array Operators
      case ConditionOperator.IN:
        return this.valueInArray(fieldValue, compareValue)

      case ConditionOperator.NOT_IN:
        return !this.valueInArray(fieldValue, compareValue)

      // Boolean Operators
      case ConditionOperator.IS_TRUE:
        return fieldValue === true

      case ConditionOperator.IS_FALSE:
        return fieldValue === false

      case ConditionOperator.IS_NULL:
        return fieldValue === null || fieldValue === undefined

      case ConditionOperator.IS_NOT_NULL:
        return fieldValue !== null && fieldValue !== undefined

      // Date Operators
      case ConditionOperator.BEFORE:
        return this.compareDates(fieldValue, compareValue, (a, b) => a < b)

      case ConditionOperator.AFTER:
        return this.compareDates(fieldValue, compareValue, (a, b) => a > b)

      case ConditionOperator.BETWEEN:
        return this.dateBetween(fieldValue, compareValue)

      default:
        throw new Error(`Unknown condition operator: ${operator}`)
    }
  }

  // ========================================================================
  // HELPER METHODS
  // ========================================================================

  /**
   * Compare numbers
   */
  private compareNumbers(
    a: unknown,
    b: unknown,
    compare: (x: number, y: number) => boolean
  ): boolean {
    const numA = typeof a === 'number' ? a : Number(a)
    const numB = typeof b === 'number' ? b : Number(b)

    if (isNaN(numA) || isNaN(numB)) {
      return false
    }

    return compare(numA, numB)
  }

  /**
   * String contains
   */
  private stringContains(value: unknown, search: unknown): boolean {
    if (typeof value !== 'string' || typeof search !== 'string') {
      return false
    }
    return value.toLowerCase().includes(search.toLowerCase())
  }

  /**
   * String starts with
   */
  private stringStartsWith(value: unknown, search: unknown): boolean {
    if (typeof value !== 'string' || typeof search !== 'string') {
      return false
    }
    return value.toLowerCase().startsWith(search.toLowerCase())
  }

  /**
   * String ends with
   */
  private stringEndsWith(value: unknown, search: unknown): boolean {
    if (typeof value !== 'string' || typeof search !== 'string') {
      return false
    }
    return value.toLowerCase().endsWith(search.toLowerCase())
  }

  /**
   * Matches regex
   */
  private matchesRegex(value: unknown, pattern: unknown): boolean {
    if (typeof value !== 'string' || typeof pattern !== 'string') {
      return false
    }

    try {
      const regex = new RegExp(pattern)
      return regex.test(value)
    } catch {
      return false
    }
  }

  /**
   * Value in array
   */
  private valueInArray(value: unknown, array: unknown): boolean {
    if (!Array.isArray(array)) {
      return false
    }

    return array.includes(value)
  }

  /**
   * Compare dates
   */
  private compareDates(
    a: unknown,
    b: unknown,
    compare: (x: Date, y: Date) => boolean
  ): boolean {
    const dateA = this.toDate(a)
    const dateB = this.toDate(b)

    if (!dateA || !dateB) {
      return false
    }

    return compare(dateA, dateB)
  }

  /**
   * Date between
   */
  private dateBetween(value: unknown, range: unknown): boolean {
    if (!Array.isArray(range) || range.length !== 2) {
      return false
    }

    const date = this.toDate(value)
    const startDate = this.toDate(range[0])
    const endDate = this.toDate(range[1])

    if (!date || !startDate || !endDate) {
      return false
    }

    return date >= startDate && date <= endDate
  }

  /**
   * Convert to Date
   */
  private toDate(value: unknown): Date | null {
    if (value instanceof Date) {
      return value
    }

    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value)
      return isNaN(date.getTime()) ? null : date
    }

    return null
  }
}

#!/usr/bin/env tsx

/**
 * Comprehensive Test Runner
 * Runs all test suites and generates coverage reports
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import chalk from 'chalk'

const execAsync = promisify(exec)

interface TestResult {
  name: string
  passed: boolean
  duration: number
  output: string
}

const runTest = async (name: string, command: string): Promise<TestResult> => {
  console.log(chalk.blue(`\n🧪 Running ${name}...`))
  const startTime = Date.now()

  try {
    const { stdout, stderr } = await execAsync(command)
    const duration = Date.now() - startTime

    console.log(chalk.green(`✅ ${name} passed in ${duration}ms`))

    return {
      name,
      passed: true,
      duration,
      output: stdout + stderr,
    }
  } catch (error: any) {
    const duration = Date.now() - startTime

    console.log(chalk.red(`❌ ${name} failed in ${duration}ms`))
    console.log(chalk.red(error.stdout || error.message))

    return {
      name,
      passed: false,
      duration,
      output: error.stdout || error.message,
    }
  }
}

const main = async () => {
  console.log(chalk.bold.cyan('\n🚀 Starting Comprehensive Test Suite\n'))
  console.log(chalk.gray('=' .repeat(60)))

  const results: TestResult[] = []

  // Unit Tests
  results.push(
    await runTest('Unit Tests', 'npm run test:unit -- --passWithNoTests')
  )

  // Integration Tests
  results.push(
    await runTest(
      'Integration Tests',
      'npm run test:integration -- --passWithNoTests'
    )
  )

  // API Tests
  results.push(
    await runTest('API Tests', 'npm run test:api -- --passWithNoTests')
  )

  // E2E Tests (only if not in CI)
  if (!process.env.CI) {
    results.push(
      await runTest('E2E Tests (Chrome)', 'npm run test:e2e:chrome')
    )
  }

  // Coverage Report
  results.push(
    await runTest('Coverage Report', 'npm run test:coverage')
  )

  // Print Summary
  console.log(chalk.bold.cyan('\n📊 Test Summary'))
  console.log(chalk.gray('=' .repeat(60)))

  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed).length
  const total = results.length

  results.forEach((result) => {
    const icon = result.passed ? '✅' : '❌'
    const color = result.passed ? chalk.green : chalk.red
    console.log(
      `${icon} ${color(result.name.padEnd(30))} ${result.duration}ms`
    )
  })

  console.log(chalk.gray('\n' + '='.repeat(60)))
  console.log(
    chalk.bold(
      `\nTotal: ${total} | Passed: ${chalk.green(passed)} | Failed: ${chalk.red(
        failed
      )}`
    )
  )

  const successRate = ((passed / total) * 100).toFixed(1)
  console.log(chalk.bold(`Success Rate: ${successRate}%\n`))

  // Exit with error code if any tests failed
  if (failed > 0) {
    console.log(chalk.red('❌ Some tests failed. Please review the output above.'))
    process.exit(1)
  } else {
    console.log(chalk.green('🎉 All tests passed!'))
    process.exit(0)
  }
}

main().catch((error) => {
  console.error(chalk.red('Fatal error running tests:'), error)
  process.exit(1)
})

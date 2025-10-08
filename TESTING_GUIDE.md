# 🧪 Comprehensive Testing Guide

## Overview

This document provides a complete guide to testing the Zyphex Tech IT Services Platform. Our testing strategy ensures reliability, maintainability, and confidence in deployments.

---

## 📋 Table of Contents

1. [Testing Infrastructure](#testing-infrastructure)
2. [Test Types](#test-types)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Coverage Requirements](#coverage-requirements)
6. [CI/CD Integration](#cicd-integration)
7. [Troubleshooting](#troubleshooting)

---

## 🏗️ Testing Infrastructure

### Tools & Frameworks

| Tool | Purpose | Version |
|------|---------|---------|
| **Jest** | Unit & Integration Testing | Latest |
| **React Testing Library** | Component Testing | Latest |
| **Playwright** | End-to-End Testing | Latest |
| **MSW** | API Mocking | Latest |
| **ts-jest** | TypeScript Support | Latest |

### Directory Structure

```
Zyphex-Tech/
├── __tests__/              # Unit & Integration Tests
│   ├── api/               # API route tests
│   ├── components/        # Component tests
│   ├── integration/       # Integration tests
│   └── lib/               # Library/utility tests
├── e2e/                   # End-to-End Tests
│   ├── auth-flow.spec.ts
│   ├── project-management.spec.ts
│   ├── payment-flow.spec.ts
│   └── messaging.spec.ts
├── __mocks__/             # Mock files
├── lib/test-utils/        # Test utilities
│   ├── factory.ts         # Test data factories
│   ├── mocks.ts           # Mock helpers
│   └── auth-helpers.ts    # Auth test helpers
├── jest.config.ts         # Jest configuration
├── jest.setup.ts          # Jest setup
└── playwright.config.ts   # Playwright configuration
```

---

## 🧩 Test Types

### 1. Unit Tests

**Purpose:** Test individual functions, components, and utilities in isolation.

**Location:** `__tests__/` directory

**Examples:**
- Component rendering
- Function logic
- Data transformation
- Validation rules

**Sample Test:**
```typescript
describe('LoginForm', () => {
  it('validates email format', async () => {
    render(<LoginForm />)
    const emailInput = screen.getByLabelText(/email/i)
    
    await userEvent.type(emailInput, 'invalid-email')
    await userEvent.tab()
    
    expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
  })
})
```

### 2. Integration Tests

**Purpose:** Test how different parts of the system work together.

**Location:** `__tests__/integration/`

**Examples:**
- Database operations
- Email service delivery
- Payment processing
- File uploads

**Sample Test:**
```typescript
describe('Email Service Integration', () => {
  it('sends welcome email with correct data', async () => {
    const emailService = new EmailService()
    
    await emailService.sendWelcomeEmail('test@example.com', 'Test User')
    
    expect(mockResend.emails.send).toHaveBeenCalledWith({
      from: expect.any(String),
      to: 'test@example.com',
      subject: expect.stringContaining('Welcome'),
    })
  })
})
```

### 3. API Route Tests

**Purpose:** Test API endpoints for correct responses, validation, and error handling.

**Location:** `__tests__/api/`

**Coverage:**
- Authentication & Authorization
- Input validation
- Error responses
- Success scenarios

**Sample Test:**
```typescript
describe('POST /api/projects', () => {
  it('creates a new project successfully', async () => {
    mockAuthenticatedSession('PROJECT_MANAGER')
    
    const response = await POST(request)
    
    expect(response.status).toBe(201)
    expect(data.project.name).toBe('Test Project')
  })
})
```

### 4. End-to-End (E2E) Tests

**Purpose:** Test complete user workflows from UI to database.

**Location:** `e2e/`

**Coverage:**
- User registration → email verification → login
- Project creation → task management → completion
- Invoice generation → payment processing
- Real-time messaging

**Sample Test:**
```typescript
test('complete user registration journey', async ({ page }) => {
  await page.goto('/auth/register')
  
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'Password123!')
  await page.click('button[type="submit"]')
  
  await expect(page).toHaveURL(/\/auth\/verify-email/)
})
```

---

## 🚀 Running Tests

### Quick Start

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage
```

### Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run specific test file
npm test -- login-form.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="validates email"
```

### Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific integration test
npm test -- email-service.test.ts
```

### API Tests

```bash
# Run all API tests
npm run test:api

# Run specific API test
npm test -- projects.test.ts
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run in UI mode (interactive)
npm run test:e2e:ui

# Run on specific browser
npm run test:e2e:chrome
npm run test:e2e:firefox
npm run test:e2e:webkit

# Run mobile tests
npm run test:e2e:mobile

# Generate test code
npm run playwright:codegen
```

### Run All Tests

```bash
# Comprehensive test suite
npm run test:all
```

### Critical Path Only

```bash
# Test only critical user flows
npm run test:critical
```

---

## ✍️ Writing Tests

### Test Structure

Follow the **Arrange-Act-Assert** pattern:

```typescript
it('should do something', () => {
  // Arrange - Set up test data
  const user = { name: 'Test', email: 'test@example.com' }
  
  // Act - Perform the action
  const result = validateUser(user)
  
  // Assert - Verify the outcome
  expect(result.isValid).toBe(true)
})
```

### Using Test Factories

```typescript
import { testDataFactory } from '@/lib/test-utils/factory'

it('creates a project with client', async () => {
  // Create test data easily
  const client = await testDataFactory.createClient()
  const manager = await testDataFactory.createProjectManager()
  const project = await testDataFactory.createProject(client.id, manager.id)
  
  expect(project.clientId).toBe(client.id)
})
```

### Mocking

```typescript
import { mockAuthenticatedSession } from '@/lib/test-utils/auth-helpers'
import { mockResend } from '@/lib/test-utils/mocks'

// Mock authentication
mockAuthenticatedSession('ADMIN')

// Mock API calls
jest.spyOn(global, 'fetch').mockResolvedValue({
  json: async () => ({ data: 'mocked' }),
} as Response)

// Mock email service
mockResend.emails.send.mockResolvedValue({ id: 'email_123' })
```

### Cleanup

Always clean up after tests:

```typescript
import { cleanupTestData, disconnectPrisma } from '@/lib/test-utils/factory'

afterAll(async () => {
  await cleanupTestData()
  await disconnectPrisma()
})

beforeEach(() => {
  jest.clearAllMocks()
})
```

---

## 📊 Coverage Requirements

### Minimum Coverage Thresholds

```json
{
  "global": {
    "branches": 80,
    "functions": 80,
    "lines": 80,
    "statements": 80
  }
}
```

### Critical Paths (100% Coverage Required)

- Authentication flows
- Payment processing
- Data validation
- Security middleware
- API authentication

### Generate Coverage Report

```bash
npm run test:coverage
```

View report at: `coverage/lcov-report/index.html`

### Check Coverage

```bash
# Fail if coverage below threshold
npm run test:coverage -- --coverage --coverageThreshold='{"global":{"lines":80}}'
```

---

## 🔄 CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

### Pre-commit Hook

```bash
# .husky/pre-commit
#!/bin/sh
npm run test:critical
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Tests Timing Out

**Problem:** Jest tests timeout after 5 seconds

**Solution:**
```typescript
it('slow test', async () => {
  // Increase timeout
}, 10000) // 10 seconds
```

#### 2. Database Connection Errors

**Problem:** `ECONNREFUSED` when connecting to test database

**Solution:**
```bash
# Create test database
createdb zyphextech_test

# Update .env.test
DATABASE_URL="postgresql://postgres:password@localhost:5432/zyphextech_test"
```

#### 3. Playwright Not Installed

**Problem:** Playwright browsers not found

**Solution:**
```bash
npm run playwright:install
```

#### 4. Mock Not Working

**Problem:** Mock function not being called

**Solution:**
```typescript
// Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks()
})

// Verify mock was called
expect(mockFunction).toHaveBeenCalled()
```

#### 5. React Testing Library Issues

**Problem:** Can't find element

**Solution:**
```typescript
// Wait for element
await waitFor(() => {
  expect(screen.getByText('Hello')).toBeInTheDocument()
})

// Use findBy (async)
const element = await screen.findByText('Hello')
```

---

## 📝 Best Practices

### DO ✅

- Write descriptive test names
- Test one thing per test
- Use data factories for test data
- Clean up after tests
- Mock external dependencies
- Test error cases
- Keep tests fast
- Use `data-testid` for E2E selectors

### DON'T ❌

- Test implementation details
- Share state between tests
- Use hardcoded IDs
- Skip cleanup
- Test third-party libraries
- Write flaky tests
- Ignore failing tests

---

## 📚 Resources

### Documentation

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)

### Test Examples

| Test Type | Location | Example |
|-----------|----------|---------|
| Component | `__tests__/components/` | `login-form.test.tsx` |
| API Route | `__tests__/api/` | `projects.test.ts` |
| Integration | `__tests__/integration/` | `email-service.test.ts` |
| E2E | `e2e/` | `auth-flow.spec.ts` |

---

## 🎯 Quick Reference

### Essential Commands

| Command | Purpose |
|---------|---------|
| `npm test` | Run all Jest tests |
| `npm run test:watch` | Watch mode |
| `npm run test:coverage` | Generate coverage |
| `npm run test:e2e` | Run E2E tests |
| `npm run test:e2e:ui` | E2E UI mode |
| `npm run test:all` | All test suites |
| `npm run test:critical` | Critical paths only |

### Test File Naming

- Unit/Component: `*.test.tsx` or `*.test.ts`
- Integration: `*.test.ts` in `integration/`
- E2E: `*.spec.ts` in `e2e/`

### Data Test IDs

Use semantic IDs for E2E tests:

```tsx
<button data-testid="submit-button">Submit</button>
<input data-testid="email-input" name="email" />
<div data-testid="user-menu">...</div>
```

---

## ✅ Testing Checklist

Before deployment, ensure:

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All API tests pass
- [ ] All E2E critical paths pass
- [ ] Coverage meets 80% threshold
- [ ] No console errors in tests
- [ ] All mocks properly cleaned up
- [ ] Database connections closed
- [ ] External services mocked
- [ ] CI/CD pipeline passes

---

**Last Updated:** October 8, 2025
**Coverage Target:** 80% minimum (100% for critical paths)
**Test Count:** 100+ tests across all suites

**Questions?** Check the troubleshooting section or review existing test examples.

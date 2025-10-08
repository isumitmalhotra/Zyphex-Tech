# 🧪 Testing Quick Reference Card

## 🚀 Essential Commands

```bash
# Run all tests
npm test

# Watch mode (auto-rerun on changes)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test types
npm run test:unit              # Unit tests only
npm run test:integration       # Integration tests
npm run test:api               # API route tests
npm run test:e2e               # End-to-end tests

# Run comprehensive test suite
npm run test:all               # All tests + summary

# Run critical path only (fast)
npm run test:critical

# E2E browser-specific
npm run test:e2e:chrome        # Chrome only
npm run test:e2e:firefox       # Firefox only
npm run test:e2e:webkit        # Safari/WebKit
npm run test:e2e:mobile        # Mobile devices

# Interactive E2E
npm run test:e2e:ui            # UI mode (recommended)
```

---

## 📁 Test File Locations

```
__tests__/
├── api/                  # API route tests
├── components/           # Component tests
├── integration/          # Integration tests
└── lib/                  # Utility tests

e2e/                      # End-to-end tests
├── auth-flow.spec.ts
├── project-management.spec.ts
└── payment-flow.spec.ts

lib/test-utils/           # Test helpers
├── factory.ts            # Test data creation
├── mocks.ts              # Mock helpers
└── auth-helpers.ts       # Auth utilities
```

---

## ✍️ Writing Tests

### Unit Test Template

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('ComponentName', () => {
  it('should do something', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<Component />)
    
    // Act
    await user.click(screen.getByRole('button'))
    
    // Assert
    expect(screen.getByText('Result')).toBeInTheDocument()
  })
})
```

### API Test Template

```typescript
import { GET, POST } from '@/app/api/route/route'
import { mockAuthenticatedSession } from '@/lib/test-utils/auth-helpers'

describe('API Route', () => {
  it('requires authentication', async () => {
    mockUnauthenticatedSession()
    const response = await GET(request)
    expect(response.status).toBe(401)
  })
})
```

### E2E Test Template

```typescript
import { test, expect } from '@playwright/test'

test('user journey', async ({ page }) => {
  await page.goto('/page')
  await page.fill('input[name="field"]', 'value')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/next-page')
})
```

---

## 🎯 Coverage Commands

```bash
# View coverage summary
npm run test:coverage

# Open HTML report
open coverage/lcov-report/index.html  # Mac/Linux
start coverage/lcov-report/index.html # Windows

# Check specific threshold
npm test -- --coverage --coverageThreshold='{"global":{"lines":80}}'
```

---

## 🛠️ Test Utilities

### Create Test Data

```typescript
import { testDataFactory } from '@/lib/test-utils/factory'

// Users
const admin = await testDataFactory.createAdmin()
const manager = await testDataFactory.createProjectManager()
const user = await testDataFactory.createUser()

// Business entities
const client = await testDataFactory.createClient()
const project = await testDataFactory.createProject(client.id, manager.id)
const task = await testDataFactory.createTask(project.id, user.id)
const invoice = await testDataFactory.createInvoice(client.id, project.id)
```

### Mock Authentication

```typescript
import { mockAuthenticatedSession, mockUnauthenticatedSession } from '@/lib/test-utils/auth-helpers'

// Mock logged-in user
mockAuthenticatedSession('ADMIN')
mockAuthenticatedSession('PROJECT_MANAGER')
mockAuthenticatedSession('USER')

// Mock logged-out
mockUnauthenticatedSession()
```

### Mock API Responses

```typescript
import { mockApiResponse, mockFetch } from '@/lib/test-utils/mocks'

// Success response
mockFetch(mockApiResponse.success({ data: 'test' }))

// Error responses
mockFetch(mockApiResponse.error('Something went wrong'))
mockFetch(mockApiResponse.unauthorized())
mockFetch(mockApiResponse.forbidden())
mockFetch(mockApiResponse.notFound())
```

### Cleanup

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

## 🎨 Common Queries

### React Testing Library

```typescript
// By role (preferred)
screen.getByRole('button', { name: /submit/i })
screen.getByRole('textbox', { name: /email/i })

// By label
screen.getByLabelText(/email address/i)

// By text
screen.getByText(/welcome/i)

// By test ID
screen.getByTestId('submit-button')

// Async queries (wait for element)
await screen.findByText(/success/i)

// Wait for condition
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument()
})
```

### Playwright Selectors

```typescript
// By text
page.locator('text=Submit')

// By role
page.getByRole('button', { name: 'Submit' })

// By test ID
page.locator('[data-testid="submit-button"]')

// By placeholder
page.getByPlaceholder('Enter email')

// CSS selectors
page.locator('button.primary')

// XPath
page.locator('xpath=//button[@type="submit"]')
```

---

## 📊 Test Statistics

### Current Coverage

| Type | Tests | Coverage |
|------|-------|----------|
| **Unit** | 20+ | 80%+ |
| **API** | 20+ | 80%+ |
| **Integration** | 10+ | 80%+ |
| **E2E** | 100+ | Critical Paths |
| **Total** | **150+** | **80%+** |

### Execution Time

- Unit Tests: ~10 seconds
- Integration Tests: ~15 seconds
- API Tests: ~20 seconds
- E2E Tests: ~5 minutes
- **Total: ~6 minutes**

---

## 🐛 Troubleshooting

### Common Fixes

```bash
# Clear Jest cache
npm test -- --clearCache

# Update snapshots
npm test -- -u

# Run single test file
npm test -- login-form.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="validates email"

# Debug mode
npm test -- --no-coverage --verbose

# Playwright debug
npm run test:e2e -- --debug

# Install Playwright browsers
npm run playwright:install
```

### Timeout Issues

```typescript
// Increase timeout for slow tests
it('slow test', async () => {
  // test code
}, 10000) // 10 seconds
```

### Async Issues

```typescript
// Use findBy for async elements
const element = await screen.findByText('Loaded')

// Or waitFor
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument()
})
```

---

## 🎯 Best Practices

### ✅ DO

- Use `data-testid` for E2E selectors
- Clean up after tests
- Mock external services
- Test user behavior, not implementation
- Keep tests fast
- Write descriptive test names

### ❌ DON'T

- Share state between tests
- Test third-party libraries
- Use hardcoded IDs or timeouts
- Ignore failing tests
- Test implementation details

---

## 📝 Data Test IDs

```tsx
// Add to components for E2E testing
<button data-testid="submit-button">Submit</button>
<input data-testid="email-input" name="email" />
<div data-testid="user-menu">Menu</div>
```

---

## 🔗 Useful Links

- [Jest Docs](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Docs](https://playwright.dev)
- [Full Testing Guide](./TESTING_GUIDE.md)
- [Implementation Summary](./TESTING_IMPLEMENTATION_COMPLETE.md)

---

## 💡 Pro Tips

1. **Use watch mode during development:**
   ```bash
   npm run test:watch
   ```

2. **Run only failed tests:**
   ```bash
   npm test -- --onlyFailures
   ```

3. **Generate test with Playwright:**
   ```bash
   npm run playwright:codegen
   ```

4. **View test coverage in browser:**
   ```bash
   npm run test:coverage
   open coverage/lcov-report/index.html
   ```

5. **Debug specific test:**
   ```bash
   npm test -- login-form.test.tsx --no-coverage
   ```

---

**Quick Start:**
```bash
# 1. Install Playwright browsers
npm run playwright:install

# 2. Run all tests
npm run test:all

# 3. View coverage
npm run test:coverage
```

**Print this card and keep it handy!** 📌

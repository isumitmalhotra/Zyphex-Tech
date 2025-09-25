# CMS Testing Guide

This document provides guidance on testing the Content Management System (CMS) module.

## Test Setup

To set up testing for the CMS module, install the required testing dependencies:

```bash
npm install --save-dev jest @types/jest ts-jest @testing-library/react @testing-library/jest-dom
```

Create a `jest.config.js` file in the project root:

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
}

module.exports = createJestConfig(customJestConfig)
```

Create a `jest.setup.js` file:

```javascript
import '@testing-library/jest-dom'
```

## API Testing

### Content API Tests

Test the content management API endpoints:

1. **GET /api/admin/cms/content**
   - Test pagination
   - Test filtering by content type
   - Test search functionality
   - Test authorization

2. **POST /api/admin/cms/content**
   - Test content creation
   - Test validation
   - Test required fields
   - Test duplicate slug prevention

3. **PUT /api/admin/cms/content/[id]**
   - Test content updates
   - Test partial updates
   - Test authorization

4. **DELETE /api/admin/cms/content/[id]**
   - Test content deletion
   - Test authorization
   - Test cascade deletion

### Content Types API Tests

Test the content type management API:

1. **GET /api/admin/cms/content-types**
   - Test retrieval of all content types
   - Test system vs custom types

2. **POST /api/admin/cms/content-types**
   - Test content type creation
   - Test field validation
   - Test duplicate slug prevention
   - Test system type protection

### Bulk Operations Tests

Test bulk content operations:

1. **POST /api/admin/cms/content/bulk**
   - Test bulk deletion
   - Test bulk status updates
   - Test bulk content type changes
   - Test error handling

## Component Testing

### CMS Hooks Tests

Test the custom hooks:

```typescript
// Example test for useCMSApi hook
import { renderHook, waitFor } from '@testing-library/react'
import { useCMSApi } from '@/hooks/use-cms'

test('useCMSApi should fetch content', async () => {
  const { result } = renderHook(() => useCMSApi())
  
  await waitFor(() => {
    expect(result.current.content).toBeDefined()
    expect(result.current.loading).toBe(false)
  })
})
```

### UI Component Tests

Test React components:

```typescript
// Example test for ContentForm component
import { render, screen } from '@testing-library/react'
import { ContentForm } from '@/components/cms/ContentForm'

test('ContentForm renders correctly', () => {
  render(<ContentForm contentType={mockContentType} />)
  
  expect(screen.getByLabelText('Title')).toBeInTheDocument()
  expect(screen.getByLabelText('Slug')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
})
```

## Integration Testing

### End-to-End CMS Workflow

Test complete CMS workflows:

1. **Content Type Creation to Content Creation**
   - Create a new content type
   - Create content using that type
   - Verify content displays correctly

2. **Content Management Workflow**
   - Create draft content
   - Edit content
   - Publish content
   - Archive content
   - Delete content

3. **Media Management**
   - Upload media files
   - Associate media with content
   - Optimize images
   - Generate thumbnails

## Performance Testing

### Load Testing

Test API performance under load:

```typescript
// Example performance test
test('Content API should handle large datasets', async () => {
  const startTime = Date.now()
  
  const response = await fetch('/api/admin/cms/content?pageSize=100')
  const data = await response.json()
  
  const endTime = Date.now()
  const duration = endTime - startTime
  
  expect(duration).toBeLessThan(1000) // Should complete within 1 second
  expect(data.success).toBe(true)
  expect(data.data.data.length).toBeLessThanOrEqual(100)
})
```

### Memory Usage Testing

Monitor memory usage during bulk operations:

```typescript
test('Bulk operations should not cause memory leaks', async () => {
  const initialMemory = process.memoryUsage().heapUsed
  
  // Perform bulk operation
  await bulkDeleteContent(Array.from({ length: 1000 }, (_, i) => `id-${i}`))
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc()
  }
  
  const finalMemory = process.memoryUsage().heapUsed
  const memoryIncrease = finalMemory - initialMemory
  
  // Memory increase should be reasonable
  expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // Less than 50MB
})
```

## Security Testing

### Authorization Tests

Test access control:

```typescript
test('Content API requires admin role', async () => {
  // Mock non-admin user
  mockGetServerSession.mockResolvedValue({
    user: { id: 'user-1', role: 'USER' }
  })
  
  const response = await fetch('/api/admin/cms/content')
  expect(response.status).toBe(403)
})
```

### Input Validation Tests

Test against malicious input:

```typescript
test('Content creation rejects XSS attempts', async () => {
  const maliciousContent = {
    title: '<script>alert("xss")</script>',
    content: '<img src="x" onerror="alert(1)">',
    fields: {
      body: '<script>malicious()</script>'
    }
  }
  
  const response = await createContent(maliciousContent)
  
  // Verify content is sanitized
  expect(response.data.title).not.toContain('<script>')
  expect(response.data.fields.body).not.toContain('<script>')
})
```

## Test Data Management

### Mock Data

Use consistent mock data across tests:

```typescript
export const mockContentTypes = [
  {
    id: 'ct-blog',
    name: 'Blog Post',
    slug: 'blog',
    fields: [
      { name: 'title', type: 'text', required: true },
      { name: 'content', type: 'richtext', required: true }
    ]
  }
]

export const mockContent = [
  {
    id: 'c-1',
    title: 'Test Post',
    slug: 'test-post',
    contentTypeId: 'ct-blog',
    status: 'PUBLISHED',
    fields: {
      title: 'Test Post',
      content: '<p>Test content</p>'
    }
  }
]
```

### Database Cleanup

Clean up test data between tests:

```typescript
beforeEach(async () => {
  // Clear test database
  await prisma.content.deleteMany()
  await prisma.contentType.deleteMany()
  await prisma.mediaAsset.deleteMany()
})
```

## Running Tests

Add test scripts to `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

Run tests:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run tests for CI
npm run test:ci
```

## Test Coverage Goals

Aim for high test coverage:

- **API Routes**: 90%+ coverage
- **Custom Hooks**: 85%+ coverage  
- **UI Components**: 80%+ coverage
- **Utility Functions**: 95%+ coverage

## Continuous Integration

Configure CI/CD pipeline to run tests:

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm run test:ci
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

This testing guide provides a comprehensive approach to testing the CMS module, ensuring reliability, performance, and security.
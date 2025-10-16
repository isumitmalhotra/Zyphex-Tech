# Phase 2: Quick Reference Card

**Status**: ✅ Complete (122/122 tests passing)
**Date**: October 16, 2025

---

## 🚀 Quick Start

### 1. Basic Route with Validation

```typescript
import { withBodyValidation, ValidatedRequest } from '@/lib/api/validation';
import { userCreateSchema } from '@/lib/api/validation/schemas';
import { z } from 'zod';

export const POST = withBodyValidation(userCreateSchema)(
  async (request: ValidatedRequest<z.infer<typeof userCreateSchema>>) => {
    const { email, name, password } = request.validatedData;
    // Your logic here
  }
);
```

### 2. Add Rate Limiting

```typescript
import { withRateLimit } from '@/lib/api/rate-limit';

export const POST = withRateLimit()(
  withBodyValidation(userCreateSchema)(
    async (request) => {
      // Automatically rate-limited + validated
    }
  )
);
```

### 3. Query Parameters

```typescript
import { withQueryValidation } from '@/lib/api/validation';
import { paginationQuerySchema } from '@/lib/api/validation/schemas';

export const GET = withQueryValidation(paginationQuerySchema)(
  async (request) => {
    const { page, limit, search } = request.validatedData;
    // Query params validated and coerced
  }
);
```

---

## 📚 Available Schemas

```typescript
// Common Fields
import {
  uuidSchema,      // UUID v4
  emailSchema,     // Email (lowercase + trim)
  passwordSchema,  // Min 8 chars, letters + numbers
  nameSchema,      // Min 2 chars
  phoneSchema,     // E.164 format
  urlSchema,       // HTTP/HTTPS only
  dateSchema,      // ISO8601
} from '@/lib/api/validation/schemas';

// CRUD Operations
import {
  userCreateSchema,
  userUpdateSchema,
  teamCreateSchema,
  teamUpdateSchema,
  projectCreateSchema,
  projectUpdateSchema,
} from '@/lib/api/validation/schemas';

// Authentication
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/lib/api/validation/schemas';

// Pagination
import { paginationQuerySchema } from '@/lib/api/validation/schemas';
// Validates: page, limit, search, sort, sortOrder
```

---

## ⚙️ Rate Limit Defaults

```typescript
// Auto-applied based on route path:
'/api/auth/*'           // 10 req/15min (brute force protection)
'/api/*'                // 100 req/15min (standard API)
'/api/upload'           // 50 req/hour (heavy operation)
'/api/export'           // 50 req/hour
'/api/reports/generate' // 50 req/hour
```

### Custom Rate Limits

```typescript
export const POST = withRateLimit({
  config: {
    windowMs: 60 * 1000,  // 1 minute
    max: 10,              // 10 requests
  }
})(handler);
```

### Role-Based Multipliers

Automatically applied when user role is detected:
- **ADMIN**: 10x (1000 req/15min)
- **MANAGER**: 5x (500 req/15min)
- **MEMBER**: 1x (100 req/15min)
- **GUEST**: 0.5x (50 req/15min)

---

## 🔍 Standalone Validation

```typescript
import { validateData, isValid } from '@/lib/api/validation';
import { userCreateSchema } from '@/lib/api/validation/schemas';

// Full validation with errors
const result = validateData(userCreateSchema, data);
if (result.success) {
  console.log('Valid:', result.data);
} else {
  console.error('Errors:', result.errors);
}

// Simple boolean check
if (isValid(userCreateSchema, data)) {
  // Data is valid
}
```

---

## 🚨 Error Responses

### Validation Error (400)

```json
{
  "success": false,
  "error": {
    "code": "VAL_001",
    "message": "Validation failed",
    "statusCode": 400,
    "details": [
      {
        "field": "email",
        "message": "Invalid email address",
        "code": "VAL_007"
      }
    ]
  }
}
```

### Rate Limit Error (429)

```json
{
  "success": false,
  "error": {
    "code": "RATE_001",
    "message": "Rate limit exceeded. Try again in 5 minutes.",
    "statusCode": 429
  }
}
```

**Headers:**
- `X-RateLimit-Limit`: Max requests
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp
- `Retry-After`: Seconds until reset

---

## 🧪 Testing

### Test Schemas

```typescript
import { validateData } from '@/lib/api/validation';
import { userCreateSchema } from '@/lib/api/validation/schemas';

it('validates user data', () => {
  const result = validateData(userCreateSchema, {
    email: 'test@example.com',
    name: 'Test User',
    password: 'password123',
    role: 'MEMBER',
  });
  
  expect(result.success).toBe(true);
});
```

### Test Rate Limiting

```typescript
import { RateLimiter } from '@/lib/api/rate-limit/limiter';
import { MemoryRateLimitStore } from '@/lib/api/rate-limit/store';

it('blocks over limit', async () => {
  const store = new MemoryRateLimitStore();
  const limiter = new RateLimiter(store);
  const config = { windowMs: 60000, max: 2 };
  
  await limiter.check('key', config);
  await limiter.check('key', config);
  
  const result = await limiter.check('key', config);
  expect(result.allowed).toBe(false);
});
```

---

## 📈 Production Setup

### Environment Variables

```env
# Rate Limiting (Production)
REDIS_URL=redis://your-redis:6379
RATE_LIMIT_REDIS_PREFIX=rl:
```

### Switch to Redis

```typescript
// lib/api/rate-limit/index.ts
const store = createRateLimitStore('redis', {
  url: process.env.REDIS_URL,
  prefix: 'rl:',
});
```

---

## 📝 Common Patterns

### Multi-Target Validation

```typescript
import { withMultiValidation } from '@/lib/api/validation';

export const PUT = withMultiValidation({
  body: userUpdateSchema,
  query: paginationQuerySchema,
  params: z.object({ id: uuidSchema }),
})(async (request) => {
  const { body, query, params } = request.validatedData;
});
```

### Skip Rate Limiting

```typescript
export const GET = withRateLimit({
  skip: async (request) => {
    const session = await getSession(request);
    return session?.user?.role === 'ADMIN';
  }
})(handler);
```

### Custom Key Generator

```typescript
export const POST = withRateLimit({
  keyGenerator: async (request) => {
    const session = await getSession(request);
    return session?.user?.id || 'anonymous';
  }
})(handler);
```

---

## 🎯 Migration Checklist

- [ ] Import validation/rate-limit middleware
- [ ] Choose or create Zod schema
- [ ] Wrap route with middleware
- [ ] Remove manual validation code
- [ ] Access `request.validatedData`
- [ ] Update tests
- [ ] Test rate limiting behavior

---

## 📊 Test Results

```
✅ Validation: 79/79 tests passing
✅ Rate Limiting: 43/43 tests passing
✅ Total: 122/122 tests passing (100%)
```

---

## 🔗 Documentation

- **Integration Guide**: `docs/PHASE_2_INTEGRATION_GUIDE.md`
- **Completion Summary**: `docs/PHASE_2_COMPLETION_SUMMARY.md`
- **Example Route**: `app/api/example/items/route.ts`
- **Schemas Reference**: `lib/api/validation/schemas.ts`
- **Rate Limit Config**: `lib/api/rate-limit/config.ts`

---

**Phase 2 Complete!** Ready for Phase 3: OpenAPI Spec & Documentation 🚀

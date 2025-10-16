# Phase 2: API Validation & Rate Limiting - Implementation Plan

## Overview
**Duration:** 3-4 hours  
**Status:** 🚀 Starting Now  
**Dependencies:** Phase 1 Complete ✅

## Objectives

### Primary Goals
1. ✅ Implement Zod-based validation middleware
2. ✅ Create rate limiting system (IP-based, user-based, endpoint-specific)
3. ✅ Add request validation schemas for all endpoints
4. ✅ Integrate with Phase 1 response formatters
5. ✅ Comprehensive test coverage

### Success Criteria
- [ ] All API routes have request validation
- [ ] Rate limiting active on all endpoints
- [ ] 100% test pass rate maintained
- [ ] Documentation complete
- [ ] Production ready

---

## Phase 2 Breakdown (3-4 hours)

### 2.1: Validation Middleware (60-75 min)
**Components:**
- [ ] Zod schema definitions for common types
- [ ] Validation middleware factory
- [ ] Error formatting integration
- [ ] Type-safe schema composition
- [ ] Integration with existing routes

**Files to Create:**
- `lib/api/validation/schemas.ts` - Common Zod schemas
- `lib/api/validation/middleware.ts` - Validation middleware
- `lib/api/validation/index.ts` - Public exports

**Deliverables:**
- Reusable validation schemas (user, team, project, etc.)
- Type-safe middleware for body/query/params validation
- Automatic error formatting with VAL_* codes
- 20+ unit tests

---

### 2.2: Rate Limiting System (60-75 min)
**Components:**
- [ ] In-memory rate limiter (Redis-ready architecture)
- [ ] IP-based rate limiting
- [ ] User-based rate limiting (authenticated)
- [ ] Endpoint-specific limits
- [ ] Rate limit headers (X-RateLimit-*)
- [ ] Configurable limits per route

**Files to Create:**
- `lib/api/rate-limit/limiter.ts` - Core rate limiter
- `lib/api/rate-limit/middleware.ts` - Rate limit middleware
- `lib/api/rate-limit/config.ts` - Rate limit configurations
- `lib/api/rate-limit/store.ts` - Storage abstraction (memory/Redis)
- `lib/api/rate-limit/index.ts` - Public exports

**Features:**
- Token bucket algorithm
- Sliding window rate limiting
- Per-route customization
- Automatic reset handling
- RATE_* error codes integration

**Deliverables:**
- Production-ready rate limiter
- Configurable limits by role/endpoint
- Response headers (limit, remaining, reset)
- 25+ unit tests

---

### 2.3: Schema Integration & Route Updates (45-60 min)
**Tasks:**
- [ ] Create validation schemas for all endpoints
- [ ] Apply validation middleware to routes
- [ ] Apply rate limiting middleware to routes
- [ ] Test integration with existing routes
- [ ] Update error handling

**Routes to Update:**
- `/api/users` (POST) - User creation validation
- `/api/users/[id]` (PUT) - User update validation
- `/api/teams` (POST) - Team creation validation
- `/api/projects` (POST/PUT) - Project validation
- `/api/auth/*` - Authentication validation

**Deliverables:**
- 5+ routes with validation
- 5+ routes with rate limiting
- Integration tests

---

### 2.4: Testing & Documentation (30-45 min)
**Components:**
- [ ] Unit tests for validation
- [ ] Unit tests for rate limiting
- [ ] Integration tests
- [ ] Documentation updates
- [ ] Migration guide

**Files to Create:**
- `__tests__/api/validation/schemas.test.ts`
- `__tests__/api/validation/middleware.test.ts`
- `__tests__/api/rate-limit/limiter.test.ts`
- `__tests__/api/rate-limit/middleware.test.ts`
- `docs/api/guides/validation-guide.md`
- `docs/api/guides/rate-limiting-guide.md`

**Deliverables:**
- 45+ new tests (all passing)
- Comprehensive documentation
- Usage examples

---

## Technical Architecture

### Validation Flow
```
Request → Parse Body/Query/Params → Validate with Zod Schema
  ↓
  ├─ Valid → Continue to handler
  └─ Invalid → formatter.validationError([...]) → 422 Response
```

### Rate Limiting Flow
```
Request → Extract identifier (IP/User) → Check limit
  ↓
  ├─ Under limit → Increment counter → Add headers → Continue
  └─ Over limit → formatter.rateLimit(retryAfter) → 429 Response
```

### Middleware Composition
```typescript
// Example route with both validations
export const POST = withRateLimit(
  withValidation(userCreateSchema, 'body'),
  handler
);
```

---

## Validation Schemas

### Common Schemas
```typescript
// User schemas
const userCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(100),
  role: z.enum(['ADMIN', 'MANAGER', 'MEMBER']).optional()
});

const userUpdateSchema = userCreateSchema.partial();

// Pagination schemas
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
});

// Team schemas
const teamCreateSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional()
});

// ID validation
const uuidSchema = z.string().uuid();
```

---

## Rate Limit Configuration

### Default Limits
```typescript
const DEFAULT_RATE_LIMITS = {
  // Global limits
  global: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // requests per window
  },
  
  // Authentication endpoints (stricter)
  auth: {
    windowMs: 15 * 60 * 1000,
    max: 10, // 10 login attempts per 15 min
  },
  
  // API endpoints (standard)
  api: {
    windowMs: 15 * 60 * 1000,
    max: 100, // 100 requests per 15 min
  },
  
  // Heavy operations (more restrictive)
  heavy: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 requests per hour
  },
};

// Role-based multipliers
const ROLE_MULTIPLIERS = {
  ADMIN: 5, // 5x normal limit
  MANAGER: 3, // 3x normal limit
  MEMBER: 1, // Normal limit
};
```

---

## Response Headers

### Rate Limit Headers (RFC 6585)
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1697198400
Retry-After: 900
```

### Validation Error Response
```json
{
  "success": false,
  "error": {
    "code": "VAL_001",
    "message": "Validation failed",
    "timestamp": "2025-10-13T15:00:00.000Z",
    "requestId": "req_abc123",
    "path": "/api/users",
    "details": {
      "validationErrors": [
        {
          "field": "email",
          "message": "Invalid email format",
          "code": "VAL_007",
          "value": "invalid-email"
        },
        {
          "field": "password",
          "message": "Password must be at least 8 characters",
          "code": "VAL_004",
          "value": "****"
        }
      ]
    }
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2025-10-13T15:00:00.000Z",
    "version": "v1"
  }
}
```

---

## Implementation Order

### Step 1: Foundation (20 min)
1. Create validation schemas file
2. Create rate limiter core
3. Set up test files

### Step 2: Validation Middleware (40 min)
1. Build validation middleware factory
2. Integrate with response formatter
3. Add unit tests
4. Update 2-3 routes

### Step 3: Rate Limiting (40 min)
1. Build rate limiter class
2. Create middleware wrapper
3. Add storage abstraction
4. Add unit tests
5. Update 2-3 routes

### Step 4: Integration (30 min)
1. Apply to remaining routes
2. Integration tests
3. Error handling verification

### Step 5: Documentation (30 min)
1. Validation guide
2. Rate limiting guide
3. Update API standards guide
4. Add examples

---

## Testing Strategy

### Unit Tests
- [ ] Schema validation (valid/invalid cases)
- [ ] Middleware functionality
- [ ] Rate limiter algorithms
- [ ] Storage operations
- [ ] Error formatting

### Integration Tests
- [ ] Full request validation flow
- [ ] Rate limit enforcement
- [ ] Header correctness
- [ ] Multi-route scenarios
- [ ] Reset behavior

### Edge Cases
- [ ] Invalid JSON bodies
- [ ] Missing required fields
- [ ] Type coercion
- [ ] Rate limit boundary conditions
- [ ] Concurrent requests

---

## Dependencies

### Already Installed ✅
- zod (latest) - Schema validation
- nanoid (^5.0.0) - Request IDs

### May Need
- None (will use in-memory for now, Redis-ready architecture)

---

## Success Metrics

### Code Quality
- [ ] 100% TypeScript strict mode
- [ ] All tests passing (current 89 + new 45 = 134 total)
- [ ] Zero ESLint errors
- [ ] Comprehensive JSDoc comments

### Performance
- [ ] Validation overhead < 5ms per request
- [ ] Rate limiter check < 1ms
- [ ] Memory efficient (< 100MB for 10k active users)

### Developer Experience
- [ ] Simple API (1-2 lines to add validation)
- [ ] Clear error messages
- [ ] Type-safe schemas
- [ ] Good documentation

---

## Risks & Mitigations

### Risk 1: Performance Impact
**Mitigation:** Use efficient algorithms, benchmark validation overhead

### Risk 2: Memory Usage (in-memory rate limiter)
**Mitigation:** Implement cleanup for expired entries, add Redis support later

### Risk 3: Breaking Changes
**Mitigation:** Add validation gradually, backward compatible

### Risk 4: Complex Validation Logic
**Mitigation:** Start simple, iterate based on needs

---

## Next Phase Preview

### Phase 3: OpenAPI Spec & Documentation (3-4 hours)
- Generate OpenAPI 3.0 spec from schemas
- Swagger UI integration
- Interactive API documentation
- Schema documentation
- Example generation

---

**Ready to Start:** ✅  
**Estimated Completion:** October 13, 2025 (3-4 hours from now)  
**Current Time:** Starting Phase 2.1 - Validation Middleware

Let's build! 🚀

# 🔒 SECURITY HARDENING - QUICK ACTION GUIDE

## 📋 TASK 2 OVERVIEW

**Status:** Many security features already implemented ✅  
**Focus:** File upload security, token management, encryption, testing  
**Time:** 3-4 days (20-24 hours)  
**Priority:** CRITICAL

---

## ✅ ALREADY IMPLEMENTED (No Action Needed)

Your codebase already has:
1. ✅ JWT Authentication (NextAuth)
2. ✅ Password Security (Bcrypt + complexity)
3. ✅ Rate Limiting (7 types)
4. ✅ Input Validation (Zod schemas)
5. ✅ Security Headers (CSP, HSTS, XSS)
6. ✅ CORS Configuration
7. ✅ Session Security (httpOnly, secure)
8. ✅ RBAC (Role-based access)
9. ✅ Audit Logging
10. ✅ OAuth (Google, Azure AD)

**Files:**
- `lib/auth.ts` - Authentication
- `lib/auth/rate-limiting.ts` - Rate limiting
- `lib/auth/security-middleware.ts` - Security middleware
- `lib/validation/schemas.ts` - Input validation
- `middleware.ts` - Global security
- `next.config.mjs` - Security headers

---

## 🎯 WHAT TO IMPLEMENT

### Phase 1: File Upload Security (Day 1 - 6 hours) ⚠️ CRITICAL
**Why:** Currently no file upload security exists  
**Impact:** HIGH - Production blocker

**Quick Actions:**
```powershell
# 1. Create file security library
New-Item -Path "lib\storage" -ItemType Directory -Force

# 2. Copy implementation from plan
# File: lib/storage/file-security.ts (provided in plan)

# 3. Create upload API
New-Item -Path "app\api\upload" -ItemType Directory -Force
# File: app/api/upload/route.ts (provided in plan)

# 4. Create download API
New-Item -Path "app\api\files\[filename]" -ItemType Directory -Force
# File: app/api/files/[filename]/route.ts (provided in plan)

# 5. Add to Prisma schema
# Model: File (provided in plan)

# 6. Run migration
npx prisma migrate dev --name add_file_security

# 7. Test
# Create file: __tests__/security/file-upload.test.ts
```

**Features Implemented:**
- ✅ File type validation (whitelist)
- ✅ File size limits
- ✅ MIME type verification
- ✅ Magic number checking
- ✅ Filename sanitization
- ✅ Malware scanning (basic)
- ✅ Secure file URLs with expiration
- ✅ Access control

---

### Phase 2: Token Management (Day 1-2 - 6 hours) ⚠️ HIGH
**Why:** Enhance logout security and token lifecycle  
**Impact:** MEDIUM-HIGH - Security enhancement

**Quick Actions:**
```powershell
# 1. Create token management library
# File: lib/auth/token-management.ts (provided in plan)

# 2. Add Prisma models
# Models: TokenBlacklist, RefreshToken (provided in plan)

# 3. Run migration
npx prisma migrate dev --name add_token_models

# 4. Create logout API
# File: app/api/auth/logout/route.ts (provided in plan)

# 5. Create refresh API
# File: app/api/auth/refresh/route.ts (provided in plan)

# 6. Test
# Create file: __tests__/security/token-management.test.ts
```

**Features Implemented:**
- ✅ Token blacklisting on logout
- ✅ Refresh token rotation
- ✅ Short-lived access tokens (15min)
- ✅ Token introspection
- ✅ Automatic cleanup

---

### Phase 3: Database Encryption (Day 2 - 4 hours) ⚠️ HIGH
**Why:** Protect sensitive data at rest  
**Impact:** MEDIUM - Data protection

**Quick Actions:**
```powershell
# 1. Create encryption library
# File: lib/encryption.ts (provided in plan)

# 2. Create Prisma middleware
# File: lib/db/encryption-middleware.ts (provided in plan)

# 3. Update .env with encryption key
# ENCRYPTION_KEY=<generate-with-openssl-rand-hex-32>

# 4. Apply middleware in lib/db.ts
# Import and apply encryption middleware

# 5. Test
# Create file: __tests__/security/encryption.test.ts
```

**Features Implemented:**
- ✅ AES-256-GCM encryption
- ✅ Automatic Prisma middleware
- ✅ PII data encryption
- ✅ Data masking for logs
- ✅ Secure key management

---

### Phase 4: Security Testing (Day 3 - 4 hours) 🧪
**Why:** Ensure all security measures work correctly  
**Impact:** MEDIUM - Quality assurance

**Quick Actions:**
```powershell
# 1. Create test directory
New-Item -Path "__tests__\security" -ItemType Directory -Force

# 2. Create security test suite
# File: __tests__/security/security-suite.test.ts (provided in plan)

# 3. Run tests
npm run test:security

# 4. Run npm audit
npm audit --audit-level high

# 5. Security scan
git secrets --scan
```

**Tests Implemented:**
- ✅ File upload security
- ✅ Token management
- ✅ Encryption/decryption
- ✅ Input validation
- ✅ XSS prevention
- ✅ SQL injection prevention

---

## 🚀 QUICK START - DAY 1

### Morning (4 hours) - File Upload Security
```powershell
# 1. Create directories
New-Item -Path "lib\storage" -ItemType Directory -Force
New-Item -Path "app\api\upload" -ItemType Directory -Force
New-Item -Path "app\api\files\[filename]" -ItemType Directory -Force

# 2. Copy files from implementation plan
# - lib/storage/file-security.ts
# - app/api/upload/route.ts
# - app/api/files/[filename]/route.ts

# 3. Update Prisma schema (add File model)

# 4. Run migration
npx prisma migrate dev --name add_file_security
npx prisma generate

# 5. Test
# Create basic upload test
```

### Afternoon (2 hours) - Token Management
```powershell
# 1. Create token management
# Copy lib/auth/token-management.ts

# 2. Update Prisma schema (add TokenBlacklist, RefreshToken)

# 3. Run migration
npx prisma migrate dev --name add_token_models
npx prisma generate

# 4. Create API routes
# - app/api/auth/logout/route.ts
# - app/api/auth/refresh/route.ts
```

---

## 📝 ENVIRONMENT VARIABLES TO ADD

```bash
# Add to .env

# Encryption
ENCRYPTION_KEY=<generate-with: openssl rand -hex 32>

# File Upload Security
FILE_ACCESS_SECRET=<generate-with: openssl rand -hex 32>
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Token Management
REFRESH_TOKEN_EXPIRY=604800000
ACCESS_TOKEN_EXPIRY=900000
```

---

## 🧪 TESTING CHECKLIST

### Before Deployment
- [ ] File upload tests pass
- [ ] Token management tests pass
- [ ] Encryption tests pass
- [ ] npm audit clean (high/critical)
- [ ] No hardcoded secrets
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Security headers present
- [ ] Rate limiting functional
- [ ] CORS properly configured

---

## 📊 DAILY PROGRESS TRACKING

### Day 1
- [ ] File upload security (6 hours)
  - [ ] Create file-security.ts
  - [ ] Create upload API
  - [ ] Create download API
  - [ ] Add File model
  - [ ] Run migrations
  - [ ] Basic testing
- [ ] Token management start (2 hours)
  - [ ] Create token-management.ts
  - [ ] Add Prisma models
  - [ ] Run migrations

### Day 2
- [ ] Token management complete (4 hours)
  - [ ] Create logout API
  - [ ] Create refresh API
  - [ ] Integration testing
- [ ] Database encryption (4 hours)
  - [ ] Create encryption.ts
  - [ ] Create Prisma middleware
  - [ ] Apply middleware
  - [ ] Testing

### Day 3
- [ ] Security testing suite (4 hours)
  - [ ] File upload tests
  - [ ] Token tests
  - [ ] Encryption tests
  - [ ] Integration tests
- [ ] Documentation (2 hours)
  - [ ] Update README
  - [ ] Create SECURITY.md
  - [ ] Update API docs

### Day 4
- [ ] Final testing & deployment (4 hours)
  - [ ] Full security audit
  - [ ] Performance testing
  - [ ] Production deployment
  - [ ] Monitoring setup

---

## 🎯 SUCCESS CRITERIA

### Must Have (CRITICAL)
- ✅ File upload security implemented
- ✅ Token blacklisting working
- ✅ Database encryption operational
- ✅ All tests passing
- ✅ No critical vulnerabilities

### Nice to Have
- ✅ Security dashboard
- ✅ Automated monitoring
- ✅ Performance metrics
- ✅ Comprehensive documentation

---

## 🆘 TROUBLESHOOTING

### Common Issues

**Issue:** Prisma migration fails  
**Fix:** 
```powershell
npx prisma migrate reset
npx prisma migrate dev
npx prisma generate
```

**Issue:** File upload fails  
**Fix:** Check permissions on upload directory
```powershell
New-Item -Path "uploads" -ItemType Directory -Force
```

**Issue:** Encryption fails  
**Fix:** Ensure ENCRYPTION_KEY is set
```bash
openssl rand -hex 32
# Add to .env as ENCRYPTION_KEY
```

**Issue:** Tests fail  
**Fix:** Ensure test database is set up
```powershell
$env:DATABASE_URL="postgresql://user:pass@localhost:5432/test_db"
npm run test
```

---

## 🔗 USEFUL COMMANDS

```powershell
# Generate encryption key
openssl rand -hex 32

# Run security tests
npm run test:security

# Security audit
npm audit --audit-level high

# Check for secrets
git secrets --scan

# Run migrations
npx prisma migrate dev
npx prisma generate

# Format code
npm run format

# Lint code
npm run lint

# Build production
npm run build

# Start production
npm start
```

---

## 📚 REFERENCE LINKS

- Full Implementation Plan: `SECURITY_HARDENING_TASK2_IMPLEMENTATION_PLAN.md`
- Current Security Features: `docs/audits/SECURITY_IMPLEMENTATION_COMPLETE.md`
- Rate Limiting: `lib/auth/rate-limiting.ts`
- Security Middleware: `lib/auth/security-middleware.ts`
- Validation Schemas: `lib/validation/schemas.ts`

---

## ⚡ ONE-LINER SUMMARIES

**Phase 1:** Add file upload validation, scanning, and secure storage  
**Phase 2:** Implement token blacklisting and refresh rotation  
**Phase 3:** Encrypt sensitive data at rest with AES-256  
**Phase 4:** Write comprehensive security tests

---

**TOTAL TIME:** 20-24 hours (3-4 days)  
**DIFFICULTY:** High but well-structured  
**IMPACT:** Critical for production readiness 🚀

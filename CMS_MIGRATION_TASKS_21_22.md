# Tasks 21 & 22: Database Migration Guide

## ⚡ Quick Start (3 Steps)

### 1. Create Migration
```bash
npx prisma migrate dev --name add_automation_and_comments
```

### 2. Restart TypeScript Server
```
VS Code: Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

### 3. Verify
```bash
npx tsc --noEmit  # Should show 0 errors
```

---

## 🗄️ What Gets Created

### 3 New Tables
1. **cms_automation_rules** - Automation configurations
2. **cms_automation_executions** - Execution history
3. **cms_comments** - Page comments & threads

### 22 Indexes for Performance
- Automation rules: 4 indexes
- Automation executions: 6 indexes  
- Comments: 8 indexes
- CMS pages: 1 new index
- Users: 1 new index

---

## ✅ Post-Migration Checklist

- [ ] Run `npx prisma migrate dev`
- [ ] Restart TypeScript server in VS Code
- [ ] Verify 0 TypeScript errors
- [ ] Test automation endpoint: `POST /api/cms/automation`
- [ ] Test comments endpoint: `POST /api/cms/comments`
- [ ] Check database in Prisma Studio

---

## 🐛 If TypeScript Errors Persist

```bash
# Option 1: Restart VS Code
# Option 2: Clear Prisma cache and regenerate
rm -rf node_modules/.prisma
npx prisma generate

# Option 3: Reload VS Code window
# Ctrl+Shift+P → "Developer: Reload Window"
```

---

## 📚 Full Documentation

- **Implementation:** `TASKS_21_22_IMPLEMENTATION.md`
- **Schema Details:** `SCHEMA_UPDATES_NEEDED.md`
- **Service Code:** `lib/cms/automation-service.ts`, `lib/cms/comment-service.ts`

---

**Status:** ✅ Code Complete - Ready for Migration  
**Estimated Time:** 5 minutes

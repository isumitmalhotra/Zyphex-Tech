# CMS Comprehensive Fix Plan

**Generated**: November 2, 2025  
**Status**: FIXING IN PROGRESS

---

## 🔴 CRITICAL ISSUES - FIXED

### 1. ✅ Hardcoded Routing in pages-list.tsx
**Issue**: All navigation routes hardcoded to `/admin` even when on `/super-admin`

**Fix Applied**:
- Added `usePathname()` hook
- Detected current path (admin vs super-admin)
- Dynamically route to `${basePath}/cms/pages/...`

**Files Modified**:
- `components/cms/pages-list.tsx`

### 2. ✅ Hardcoded Routing in template-list.tsx
**Issue**: Same routing problem as pages-list

**Fix Applied**:
- Added `usePathname()` hook
- Implemented dynamic basePath detection
- Updated all router.push() calls

**Files Modified**:
- `components/cms/template-list.tsx`

---

## 🟠 HIGH PRIORITY ISSUES - TO FIX

### 3. ⏳ No Templates in Database
**Issue**: CmsTemplate table is empty, causing Templates section to show "No templates found"

**Action Required**:
- Create seed script for CMS templates
- Seed at least 3-5 basic templates

### 4. ⏳ Media Model Mismatch
**Issue**: Using `MediaAsset` model (7 records) but API queries `CmsMediaAsset` (0 records)

**Options**:
A. Migrate MediaAsset data to CmsMediaAsset
B. Update API to use MediaAsset model instead

**Recommended**: Option A (maintain CMS model consistency)

### 5. ⏳ Page Editor Components Missing
**Issue**: New page routes don't render editor components

**Files to Update**:
- `app/admin/cms/pages/new/page.tsx`
- `app/super-admin/cms/pages/new/page.tsx`

**Action**: Add proper PageEditor component imports and rendering

---

## 🔧 FIXES IN PROGRESS

### Media Library Data Migration

**Current State**:
- `MediaAsset`: 7 records
- `CmsMediaAsset`: 0 records
- Media library showing empty

**Migration Plan**:
1. Create migration script to copy MediaAsset → CmsMediaAsset
2. Map fields appropriately
3. Verify media library displays files

### Template Seeding

**Required Templates**:
1. Basic Landing Page
2. Blog Post
3. Portfolio Page
4. Standard Content Page
5. Contact Page

**Script Location**: `scripts/seed-cms-templates.ts`

---

## ✅ WORKING CORRECTLY

- CMS Pages API (GET /api/cms/pages) - ✅
- CMS Pages List Display - ✅
- Filter System (status="all" fix) - ✅
- Authentication & Permissions - ✅
- Database Connection - ✅
- Page CRUD Operations (GET, PATCH, DELETE) - ✅
- Media Upload API (/api/cms/media/upload) - ✅ (separate endpoint)

---

## 🎯 NEXT STEPS

1. **Test routing fixes** - Refresh browser and click Edit on a page
2. **Create template seed script**
3. **Migrate media data to CmsMediaAsset**
4. **Fix page editor components**
5. **End-to-end testing of all CMS features**

---

**Last Updated**: November 2, 2025 at 5:45 PM

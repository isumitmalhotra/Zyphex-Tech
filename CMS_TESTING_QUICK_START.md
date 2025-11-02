# 🚀 CMS Testing - Quick Start

**Status**: Dev server running at http://localhost:3000  
**Branch**: `cms-consolidation`  
**Test Data**: ✅ Seeded (7 pages, 5 media assets)

---

## ⚡ IMMEDIATE TESTING STEPS

### 1. Login
```
URL: http://localhost:3000/login
Credentials: Your super-admin account
```

### 2. Check Navigation
- Sidebar should show **only ONE** "Content Management" entry
- Click it → should go to `/super-admin/cms`

### 3. Test CMS Pages
```
URL: http://localhost:3000/super-admin/cms/pages

Expected to see:
✅ Home
✅ About Us
✅ Services
✅ Portfolio
✅ Contact
✅ Updates
✅ Careers
```

**Actions to test:**
- Click on "Home" page to edit
- Make a change to the content
- Click Save
- Refresh page - change should persist

### 4. Test Media Library
```
URL: http://localhost:3000/super-admin/cms/media

Expected to see:
✅ hero-background.jpg
✅ company-logo.png
✅ project-showcase-1.jpg
✅ blog-post-cover.jpg
✅ default-user-avatar.png
```

**Actions to test:**
- Upload a new image
- Delete an image
- Search for an image

### 5. Compare with Legacy
```
URL: http://localhost:3000/super-admin/content-legacy

This is the OLD system - still accessible for comparison.
Check what features it has that CMS doesn't.
```

---

## 📊 KEY QUESTIONS TO ANSWER

While testing, ask yourself:

1. **Can I create a new page in CMS?**
   - [ ] Yes, works perfectly
   - [ ] No, feature missing
   - [ ] Broken, needs fix

2. **Can I edit page content with all the tools I need?**
   - [ ] Yes, editor is complete
   - [ ] No, missing features (list them)
   - [ ] Partially working

3. **Does the CMS have content types management?**
   - [ ] Yes, can create custom content types
   - [ ] No, only in legacy
   - [ ] Not sure

4. **Can I manage dynamic content items?**
   - [ ] Yes, fully functional
   - [ ] No, legacy only
   - [ ] Partially

5. **Is the media library better/worse than legacy?**
   - [ ] Better
   - [ ] Same
   - [ ] Worse - missing: [list features]

---

## 🎯 WHAT TO LOOK FOR

### ✅ GOOD SIGNS
- No 404 errors
- No console errors (F12 → Console)
- All pages load quickly
- Save/edit works smoothly
- Data persists after refresh

### ⚠️ WARNING SIGNS
- 404 on any route
- Console errors (red text)
- Features grayed out/disabled
- Can't save changes
- Missing buttons or UI elements

### 🚨 CRITICAL ISSUES
- Can't login
- CMS pages completely broken
- Data loss after save
- Cannot create/edit content
- Media upload fails

---

## 📝 QUICK DOCUMENTATION

Use this format when you find issues:

```
Issue: [Short description]
URL: [Where it happens]
Steps to reproduce:
1. Go to X
2. Click Y
3. Error appears

Error message: [Paste from console]
Priority: Critical/High/Medium/Low
```

---

## 🔧 DEBUGGING TIPS

### If page won't load:
1. Check browser console (F12)
2. Check terminal where `npm run dev` is running
3. Look for red error messages

### If save doesn't work:
1. Open Network tab (F12 → Network)
2. Click Save
3. Look for failed requests (red)
4. Click on failed request → Response tab

### If images won't upload:
1. Check file size (< 5MB?)
2. Check file type (jpg, png, gif?)
3. Check console for errors
4. Check API logs in terminal

---

## ✅ COMPLETION CHECKLIST

- [ ] Tested CMS pages (all 7 pages accessible)
- [ ] Tested page editor (can edit and save)
- [ ] Tested media library (can view, upload, delete)
- [ ] Tested templates (if available)
- [ ] Tested analytics (if available)
- [ ] Compared with legacy (identified gaps)
- [ ] Documented issues in `CMS_TESTING_GUIDE.md`
- [ ] Filled out feature matrix
- [ ] Ready to migrate missing features

---

## 🆘 IF STUCK

1. **Check main guide**: `CMS_TESTING_GUIDE.md`
2. **Check consolidation plan**: `CMS_CONSOLIDATION_PLAN.md`
3. **Check dev server terminal** for errors
4. **Check browser console** (F12) for errors

---

**Time Estimate**: 30-45 minutes for basic testing  
**Last Updated**: November 2, 2025

**Status**: ✅ READY - Dev server running, test data seeded, documentation complete

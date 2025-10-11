# 404 Error Handling - Testing Guide

**Date:** October 11, 2025  
**Phase:** 1 - Testing & Verification  
**Status:** READY TO TEST

---

## 🎯 Testing Overview

This guide will help you systematically test all error handling features implemented in Phase 1.

---

## 🚀 Quick Start

### 1. Start Development Server
```bash
npm run dev
```
Server should start at: `http://localhost:3000`

### 2. Open Testing Dashboard
Navigate to: **http://localhost:3000/test-errors**

This interactive dashboard provides one-click testing for all error scenarios.

---

## 📋 Testing Checklist

### ✅ Test 1: 404 Not Found Page

**URL to Test:** `http://localhost:3000/test-404-page-does-not-exist`

**What to Verify:**
- [ ] Custom 404 page displays (not browser default)
- [ ] "404" large heading visible
- [ ] "Page Not Found" title displays
- [ ] Friendly error message shows
- [ ] Animated background blobs visible
- [ ] Search bar is functional
- [ ] "Go Home" button works → redirects to `/`
- [ ] "Go Back" button works → browser back
- [ ] Popular pages cards display (Services, About, Contact)
- [ ] Clicking popular page cards navigates correctly
- [ ] Help section displays with support buttons
- [ ] "Contact Support" button opens contact page
- [ ] Footer displays "Error Code: 404 • Page Not Found"

**Mobile Testing:**
- [ ] Layout responsive on mobile (375px width)
- [ ] Buttons stack vertically on small screens
- [ ] Text remains readable
- [ ] Cards display in single column

**Sentry Verification:**
- [ ] Open: https://zyphex-tech.sentry.io/issues/
- [ ] Search for "404 Page Not Found"
- [ ] Verify error level: **WARNING**
- [ ] Check tags include: `error_type: 404`

---

### ✅ Test 2: Route-Level Error Boundary

**URL to Test:** `http://localhost:3000/test-error`

**What to Verify:**
- [ ] Error page displays (not crash)
- [ ] "Something Went Wrong" or specific error title
- [ ] AlertCircle icon visible
- [ ] Error description is user-friendly
- [ ] "Try Again" button displays
- [ ] "Go Home" button displays
- [ ] Error information card shows
- [ ] "What Happened?" section visible
- [ ] Error suggestion text displays

**Try Again Functionality:**
- [ ] Click "Try Again" button
- [ ] Page attempts to re-render
- [ ] Error may persist (expected for test page)

**Navigation:**
- [ ] Click "Go Home" → redirects to `/`
- [ ] Click "Go Back" → browser history works
- [ ] Click "Contact Support" → opens contact page

**Error Type Detection (Test Different Errors):**

**Network Error:**
- Navigate to test dashboard and click "Test Network Error"
- [ ] Title shows "Network Error"
- [ ] Description mentions "Unable to connect"
- [ ] Suggestion mentions "Check your internet connection"

**Timeout Error:**
- Click "Test Timeout Error" from dashboard
- [ ] Title shows "Request Timeout"
- [ ] Description mentions "took too long"
- [ ] Suggestion mentions slow connection

**Authorization Error:**
- Click "Test Auth Error" from dashboard
- [ ] Title shows "Access Denied"
- [ ] Description mentions "permission"
- [ ] Suggestion mentions "log in or contact support"

**Development Features (Dev Mode Only):**
- [ ] Error details card displays
- [ ] Error message shows in red text
- [ ] Stack trace visible
- [ ] Error is readable and formatted

**Sentry Verification:**
- [ ] Open: https://zyphex-tech.sentry.io/issues/
- [ ] Find "Test Error" entry
- [ ] Verify error level: **ERROR**
- [ ] Check tags include: `error_boundary: app_error`
- [ ] Verify error digest is captured

---

### ✅ Test 3: Global Error Handler

**How to Test:**
This is harder to test as it requires breaking the root layout. You can test it by:

**Option 1: Simulate in Code**
Temporarily add to `app/layout.tsx`:
```typescript
if (typeof window !== 'undefined') {
  throw new Error('Test global error')
}
```

**Option 2: Break Something Critical**
Temporarily remove a required import in `app/layout.tsx`

**What to Verify:**
- [ ] Page loads with inline-styled design (no Tailwind)
- [ ] Dark gradient background displays
- [ ] "Critical System Error" heading shows
- [ ] SVG warning icon displays
- [ ] Error description is clear
- [ ] "Try Again" button displays
- [ ] "Go to Homepage" button displays
- [ ] Error reference/digest shows (if available)
- [ ] Support contact link visible
- [ ] Design is fully responsive

**Sentry Verification:**
- [ ] Find error in Sentry dashboard
- [ ] Verify error level: **FATAL**
- [ ] Check tags include: `error_boundary: global_error`

---

## 🎨 Design & UX Testing

### Visual Consistency
- [ ] All error pages match Zyphex-Tech brand colors
- [ ] Typography is consistent with main site
- [ ] Button styles match design system
- [ ] Card components use Radix UI
- [ ] Icons are from Lucide React

### Dark/Light Mode
- [ ] Toggle theme in settings (if available)
- [ ] All error pages work in dark mode
- [ ] All error pages work in light mode
- [ ] Text remains readable in both modes
- [ ] Color contrast is sufficient

### Animations
- [ ] Background blob animations work
- [ ] Animations are smooth (60fps)
- [ ] No janky or stuttering animations
- [ ] Animations don't distract from content

---

## 📱 Responsive Testing

### Mobile (375px - 639px)
- [ ] Single column layout
- [ ] Stacked buttons
- [ ] Readable text sizes
- [ ] Touch targets ≥44px
- [ ] No horizontal scrolling
- [ ] Cards stack vertically

### Tablet (640px - 1023px)
- [ ] Horizontal button layouts
- [ ] 2-column card grid (where applicable)
- [ ] Larger text sizes
- [ ] Proper spacing

### Desktop (1024px+)
- [ ] Maximum width containers (2xl, 4xl)
- [ ] 3-column card grids
- [ ] Optimal line lengths
- [ ] Proper visual hierarchy

---

## ♿ Accessibility Testing

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Focus indicators visible
- [ ] Logical tab order
- [ ] Enter/Space activate buttons
- [ ] Escape closes modals (if any)

### Screen Reader
Test with NVDA (Windows) or VoiceOver (Mac):
- [ ] Heading hierarchy read correctly (h1, h2)
- [ ] Button labels are descriptive
- [ ] Error messages are announced
- [ ] Links describe destination
- [ ] No "click here" generic text

### Color Contrast
Use browser DevTools or online checker:
- [ ] Normal text: ≥4.5:1 contrast ratio
- [ ] Large text: ≥3:1 contrast ratio
- [ ] Interactive elements: ≥3:1 contrast
- [ ] Error states clearly visible

### Content
- [ ] Text is clear and concise
- [ ] No technical jargon for users
- [ ] Instructions are actionable
- [ ] Language is empathetic

---

## 🔧 Functional Testing

### Search Functionality (404 Page)
- [ ] Type query in search box
- [ ] Press Enter or click Search button
- [ ] Redirects to `/blog?q=<query>`
- [ ] Query parameter is properly encoded
- [ ] Special characters handled correctly

### Button Actions
- [ ] All buttons trigger expected actions
- [ ] No JavaScript errors in console
- [ ] Loading states display (if applicable)
- [ ] Error states handled gracefully

### Links
- [ ] All links navigate to correct pages
- [ ] External links open in new tab
- [ ] Internal links use Next.js routing
- [ ] No broken links

---

## 📊 Performance Testing

### Load Time
Open browser DevTools Network tab:
- [ ] 404 page loads in <2 seconds
- [ ] Error boundary activates in <100ms
- [ ] No blocking resources
- [ ] Images optimized

### Bundle Size
Check build output:
```bash
npm run build
```
- [ ] not-found.tsx: ~15KB or less
- [ ] error.tsx: ~12KB or less
- [ ] global-error.tsx: ~3KB or less

### Sentry Performance
- [ ] Error capture takes <10ms
- [ ] No noticeable lag when error occurs
- [ ] Error context enrichment is fast

---

## 🐛 Edge Cases Testing

### Long Error Messages
Modify test page to throw error with very long message:
- [ ] Text wraps properly
- [ ] No overflow issues
- [ ] Scrolling works if needed

### Missing Error Digest
Test error without digest:
- [ ] Page still displays correctly
- [ ] No undefined errors in console
- [ ] Conditional rendering works

### Multiple Rapid Errors
Trigger errors in quick succession:
- [ ] Last error displays
- [ ] No infinite error loops
- [ ] Sentry rate limiting works

### Offline Testing
Disconnect internet and test:
- [ ] Network error detection works
- [ ] Proper messaging displays
- [ ] Sentry queues errors for later

---

## 📸 Visual Testing

### Screenshots to Capture
1. 404 page - Desktop
2. 404 page - Mobile
3. Error boundary - Desktop (each error type)
4. Error boundary - Mobile
5. Global error - Desktop
6. Dark mode versions
7. Light mode versions

### Browser Testing
Test in multiple browsers:
- [ ] Chrome/Edge (Latest)
- [ ] Firefox (Latest)
- [ ] Safari (Latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## 🔍 Sentry Dashboard Verification

### Navigate to Sentry
**URL:** https://zyphex-tech.sentry.io/issues/

### Check for Errors
After triggering all test scenarios:
- [ ] At least 3 error entries visible
- [ ] Different severity levels (WARNING, ERROR, FATAL)
- [ ] Error details are complete
- [ ] Stack traces captured
- [ ] Tags are present
- [ ] Context includes error digest
- [ ] Timestamps are correct

### Verify Grouping
- [ ] Similar errors are grouped together
- [ ] Different error types are separate
- [ ] Error titles are descriptive

---

## ✅ Final Checklist

### Before Marking Tests Complete:
- [ ] All 3 error pages tested
- [ ] All error types verified
- [ ] Mobile responsiveness confirmed
- [ ] Accessibility audit passed
- [ ] Sentry integration verified
- [ ] Performance metrics met
- [ ] Browser compatibility checked
- [ ] Documentation reviewed

### Known Issues to Note:
- [ ] Document any bugs found
- [ ] Create issues for improvements
- [ ] Note browser-specific quirks

---

## 🎬 Testing Results

### Test Session Information
**Date:** _______________  
**Tester:** _______________  
**Browser:** _______________  
**Device:** _______________

### Overall Results
- [ ] ✅ All tests passed
- [ ] ⚠️ Minor issues found (document below)
- [ ] ❌ Major issues found (document below)

### Issues Found:
```
Issue 1:
Description: 
Severity: [ ] Low [ ] Medium [ ] High
Status: [ ] Open [ ] Fixed

Issue 2:
Description:
Severity: [ ] Low [ ] Medium [ ] High
Status: [ ] Open [ ] Fixed
```

---

## 🚀 Next Steps After Testing

### If All Tests Pass ✅
1. Mark Phase 1 as fully verified
2. Proceed to Phase 2 (Route-Specific Error Handling)
3. Update documentation with test results

### If Issues Found ⚠️
1. Document all issues clearly
2. Prioritize by severity
3. Fix critical issues before proceeding
4. Re-test after fixes
5. Update documentation

---

## 📞 Support

### Questions or Issues?
- Check documentation in `docs/` folder
- Review code comments in error files
- Check Sentry dashboard for error details
- Consult Next.js error handling docs

### Useful Commands
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Check TypeScript
npx tsc --noEmit

# View git changes
git diff

# Check Sentry config
cat sentry.server.config.ts
```

---

**Happy Testing! 🧪✨**

**Remember:** The goal is to ensure users never see confusing or broken error states!

# 🚀 Careers Page - Quick Start Guide

## How to Test the New Careers Page

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Navigate to Careers Page
Open your browser and go to:
```
http://localhost:3000/careers
```

---

## 🧪 Test Scenarios

### Test 1: Browse Jobs
1. Scroll down to "Open Positions" section
2. You should see **6 job listings**
3. Each job should show:
   - Job title
   - Department, Location, Type
   - Salary range
   - "Remote" badge
   - Brief description
   - Skills badges
   - "Apply Now" button

### Test 2: Search Jobs
1. Find the search bar under "Open Positions"
2. Type "Developer" → Should filter to developer positions only
3. Type "Designer" → Should show UI/UX Designer
4. Clear search → Should show all jobs again

### Test 3: Filter Jobs
1. Click department dropdown → Select "Engineering"
   - Should show only engineering positions (3 jobs)
2. Click location dropdown → Select "Remote"
   - Should show remote positions
3. Click job type dropdown → Select "Full-time"
   - Should show only full-time positions
4. Reset all filters to "All" → Should show all 6 jobs

### Test 4: View Job Details
1. Click any "Apply Now" button or job card
2. Should navigate to `/careers/[id]` page
3. Should see:
   - Full job description
   - Responsibilities list (with checkmarks)
   - Requirements list (with checkmarks)
   - Benefits preview
   - Application form on the right

### Test 5: Submit Application
1. On job detail page, find application form
2. Fill in all fields:
   - Full Name: "John Doe"
   - Email: "john@example.com"
   - Phone: "+1-555-123-4567"
   - LinkedIn: "https://linkedin.com/in/johndoe" (optional)
   - Portfolio: "https://johndoe.com" (optional)
   - Cover Letter: "I am excited to apply..."
   - Resume: Upload any PDF file
3. Click "Submit Application"
4. Should see loading spinner
5. Should see success toast notification
6. Form should reset

### Test 6: Invalid Application
1. Try to submit with invalid email (e.g., "notanemail")
2. Should see validation error
3. Try to submit without required fields
4. Should see "required" errors

### Test 7: Subscribe to Job Alerts
1. Scroll to "Don't See the Right Position?" section
2. Enter email: "test@example.com"
3. Click "Subscribe" button
4. Should see success toast
5. Form should clear

### Test 8: Test FAQ & Contact
1. Scroll to bottom of careers page
2. Should see 3 contact cards (Email, Phone, Live Chat)
3. Should see 4 FAQ items
4. Click email link → Should open email client
5. Click phone link → Should open phone dialer

### Test 9: Test Mobile Responsive
1. Open browser dev tools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test on:
   - iPhone (375px)
   - iPad (768px)
   - Desktop (1920px)
4. Everything should stack properly and be readable

### Test 10: Test Animations
1. Scroll down the page slowly
2. Elements should fade in/scale in as they appear
3. Hover over cards → Should lift up
4. Hover over buttons → Should have effects
5. Particles should be animating in hero section

---

## ✅ Expected Results

### Main Careers Page (`/careers`)
- ✅ Hero section with gradient background
- ✅ 4 company value cards
- ✅ 3 employee testimonials
- ✅ 6 job listings (filterable/searchable)
- ✅ 8 benefits cards
- ✅ 5-step hiring process
- ✅ Diversity statement
- ✅ Email subscription form
- ✅ 3 contact cards
- ✅ 4 FAQ items
- ✅ CTA section at bottom

### Job Detail Page (`/careers/[id]`)
- ✅ Back to careers button
- ✅ Job title and badges
- ✅ Job metadata (department, location, type, salary)
- ✅ Full job description
- ✅ Responsibilities list
- ✅ Requirements list
- ✅ Benefits preview (4 items)
- ✅ Application form (8 fields)
- ✅ Form validation
- ✅ File upload
- ✅ Success feedback

---

## 🔗 Navigation Links

### Main Navigation
```
Home → /
About → /about
Services → /services
Careers → /careers (NEW!)
Contact → /contact
```

### Careers Navigation
```
/careers → Main careers page
/careers/1 → Senior Full Stack Developer
/careers/2 → UI/UX Designer
/careers/3 → DevOps Engineer
/careers/4 → Product Manager
/careers/5 → Frontend Developer
/careers/6 → Marketing Manager
```

---

## 🎨 Visual Checks

### Colors & Branding
- ✅ Zyphex blue accent color (#0080ff)
- ✅ Gradient backgrounds (blue to purple)
- ✅ Dark theme consistency
- ✅ White text on dark backgrounds
- ✅ Card shadows and borders

### Typography
- ✅ Clear, readable fonts
- ✅ Proper heading hierarchy (h1, h2, h3)
- ✅ Consistent spacing
- ✅ Good line height

### Spacing
- ✅ Consistent padding/margins
- ✅ Proper section spacing
- ✅ Card gaps
- ✅ Form field spacing

---

## 🐛 Common Issues & Solutions

### Issue: Page not found
**Solution:** Make sure files are in correct location:
- `app/careers/page.tsx`
- `app/careers/[id]/page.tsx`
- `app/careers/layout.tsx`

### Issue: Animations not working
**Solution:** Check that `useScrollAnimation` hook exists in:
- `components/scroll-animations.tsx`

### Issue: Styling looks off
**Solution:** Verify Tailwind classes and custom CSS:
- Check `app/globals.css` for custom classes
- Ensure Tailwind config includes all paths

### Issue: Form submission doesn't work
**Solution:** Check browser console for errors
- Verify API route exists: `app/api/careers/applications/route.ts`
- Check network tab for API response

### Issue: Toast notifications not showing
**Solution:** Verify toast hook:
- Check `hooks/use-toast.ts` exists
- Ensure toast provider is in layout

---

## 📱 Browser Compatibility

### Should Work On:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

---

## 🎯 Performance Checks

### Page Load
- First load: < 2 seconds
- Navigation: < 500ms
- Filter/Search: Instant

### Lighthouse Scores (Target)
- Performance: > 90
- Accessibility: 100
- Best Practices: > 90
- SEO: 100

---

## 📞 Support

### If You Find Issues
1. Check browser console for errors
2. Verify all files were created
3. Check file paths match documentation
4. Restart dev server
5. Clear browser cache

### Need Help?
- Review `CAREERS_PAGE_COMPLETE.md` for detailed docs
- Check component code for inline comments
- Review API routes for endpoint details

---

## 🎉 Success Criteria

**Page is working correctly if:**
- ✅ All 6 jobs display
- ✅ Search filters jobs in real-time
- ✅ Filters work independently and together
- ✅ Job detail pages load
- ✅ Application form validates correctly
- ✅ File upload works
- ✅ Success messages appear
- ✅ Responsive on mobile
- ✅ All animations smooth
- ✅ No console errors

---

## 🚀 Ready to Launch!

If all tests pass, the Careers page is **production ready**!

**Happy Testing! 🎊**

---

**Last Updated:** October 25, 2024

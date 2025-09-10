# PropertyPulse Marketing Frontend - Smoke Test Checklist

## Pre-Test Setup
- [ ] `npm run build` completes successfully
- [ ] No console errors in development mode
- [ ] Server running on http://localhost:5000 (backend)
- [ ] Client running on http://localhost:3000 (frontend)

## Core Page Load Tests
### Homepage (/)
- [ ] Page loads without errors
- [ ] Title: "AI-Powered Property Management Platform | PropertyPulse"
- [ ] H1 headline: "The Future of Property Management is Here"
- [ ] Navigation menu visible and functional
- [ ] Footer links work
- [ ] CTA buttons visible ("Start Free Trial", "Book a Demo")

### Features (/features)
- [ ] Page loads without errors  
- [ ] Title contains "Complete Property Management Platform"
- [ ] All feature sections visible (AI-Powered, Business Management, Operations)
- [ ] Integration logos visible (Firebase, Stripe, Plaid, AWS S3)

### Pricing (/pricing)
- [ ] Page loads without errors
- [ ] Pricing tiers displayed correctly
- [ ] "Start Free Trial" buttons work
- [ ] FAQ section visible

### Demo (/demo)
- [ ] Page loads without errors
- [ ] Only ONE Calendly widget visible (15-min)
- [ ] No 30-minute widget in main demo section
- [ ] Calendly iframe loads correctly

### Founders (/founders)
- [ ] Page loads without errors
- [ ] Both 15-min and 30-min options mentioned
- [ ] Calendly widgets/links present for both durations
- [ ] Pricing discount information visible

### Affiliate (/affiliate)
- [ ] Page loads without errors
- [ ] Commission structure visible (35% + 20%)
- [ ] "Apply Now" button works
- [ ] Dashboard link works

### Contact (/contact)
- [ ] Page loads without errors
- [ ] Contact form functional
- [ ] Form validation works
- [ ] Success message appears after submission
- [ ] Live chat button works

### About (/about)
- [ ] Page loads without errors
- [ ] Company story and values visible
- [ ] Team information displayed

### Blog (/blog)
- [ ] Page loads without errors
- [ ] Featured articles visible
- [ ] Blog post links work

## Embed & Widget Tests
### Tawk Chat Widget
- [ ] No CSP console errors
- [ ] `window.Tawk_API` object exists
- [ ] Chat widget accessible (no blocking errors)
- [ ] Chat can be opened/closed

### Calendly Integration
- [ ] Demo page: Exactly 1 Calendly iframe
- [ ] Founders page: Both 15min and 30min options
- [ ] No console errors from Calendly script
- [ ] `window.Calendly` object exists

### Google Analytics
- [ ] GA script loads without errors
- [ ] GA ID: G-1GTRJ30EMH
- [ ] Page views tracked in GA Realtime
- [ ] No GA-related console errors

## UTM & Tracking Tests
### UTM Parameter Flow
- [ ] Visit: `/founders?utm_source=email&utm_medium=outbound&utm_campaign=founders_launch&ref=AFF123`
- [ ] UTM parameters visible in URL
- [ ] Click "Start Free Trial" button
- [ ] UTM parameters preserved in signup URL
- [ ] UTMs stored in localStorage (check developer tools)
- [ ] UTM data persists across navigation

### Navigation & Links
- [ ] All navigation links work (no 404s)
- [ ] Logo links back to homepage
- [ ] Footer links functional
- [ ] Mobile menu opens/closes correctly
- [ ] Active page highlighted in navigation

## Error Handling Tests
### 404 Page
- [ ] Visit `/nonexistent-page`
- [ ] 404 page displays correctly
- [ ] "Home" link works
- [ ] Navigation still functional

### Form Error Handling
- [ ] Contact form: Submit empty form → validation errors shown
- [ ] Contact form: Invalid email → error message
- [ ] Affiliate signup: Form validation works

## Mobile Responsiveness
- [ ] Homepage responsive on mobile (375px width)
- [ ] Navigation hamburger menu works
- [ ] All CTA buttons accessible
- [ ] Text readable, no horizontal scroll
- [ ] Touch targets appropriate size

## Performance & SEO
### Meta Tags
- [ ] Each page has unique title
- [ ] Meta descriptions present
- [ ] Open Graph tags present (og:title, og:description)
- [ ] Canonical URLs set correctly

### Performance
- [ ] Bundle size reasonable (< 150kB main bundle)
- [ ] No unused JavaScript warnings
- [ ] Images load efficiently
- [ ] No accessibility warnings in console

## Build & Deployment
### Production Build
- [ ] `npm run build` succeeds
- [ ] Build warnings reviewed (should be minimal)
- [ ] Static files generated correctly
- [ ] No build-breaking errors

### Files Present
- [ ] robots.txt accessible at `/robots.txt`
- [ ] sitemap.xml accessible at `/sitemap.xml`
- [ ] favicon.ico loads correctly

## Console Verification
- [ ] No JavaScript errors in console
- [ ] No CSP violations
- [ ] No network request failures
- [ ] No React warnings/errors

## Critical User Flows
### Signup Flow
1. [ ] Homepage → Click "Start Free Trial"
2. [ ] Lands on /signup with UTMs (if present)
3. [ ] Signup form loads correctly
4. [ ] Form accepts valid data

### Demo Booking Flow  
1. [ ] Any page → Click "Book a Demo" or "Schedule Call"
2. [ ] Lands on /demo page
3. [ ] Calendly widget loads
4. [ ] Can select time slot (in demo mode)

### Affiliate Application Flow
1. [ ] /affiliate → Click "Apply Now" 
2. [ ] Lands on /affiliate/signup
3. [ ] Application form loads
4. [ ] Form accepts valid data

## Environment Variables Verification
- [ ] VITE_GA_ID set correctly
- [ ] VITE_API_BASE configured
- [ ] VITE_CALENDLY_INTRO_URL working
- [ ] VITE_CALENDLY_SETUP_URL working
- [ ] No secrets exposed in client bundle

## Final Checklist
- [ ] All smoke tests passed
- [ ] No critical errors identified
- [ ] Performance acceptable
- [ ] User experience smooth
- [ ] Ready for production deployment

---

**Test Date:** ___________  
**Tester:** ___________  
**Environment:** [ ] Development [ ] Staging [ ] Production  
**Browser:** [ ] Chrome [ ] Firefox [ ] Safari [ ] Edge  
**Notes:** ___________
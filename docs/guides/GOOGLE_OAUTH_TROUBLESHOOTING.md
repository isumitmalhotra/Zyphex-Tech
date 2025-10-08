# 🔧 Google OAuth Troubleshooting Guide

## Current Issue
Google OAuth sign-in redirects to `/login?callbackUrl=...` instead of opening Google authentication popup.

## ✅ Configuration Checklist

### 1. Environment Variables Status
- ✅ GOOGLE_CLIENT_ID: Configured
- ✅ GOOGLE_CLIENT_SECRET: Configured  
- ✅ NEXTAUTH_URL: http://localhost:3000
- ✅ NEXTAUTH_SECRET: Configured

### 2. NextAuth Provider Configuration
- ✅ GoogleProvider properly configured in auth.ts
- ✅ SessionProvider wrapper in layout
- ✅ NextAuth API route exists at `/api/auth/[...nextauth]/route.ts`

### 3. Required Google Cloud Console Settings

**IMPORTANT: Verify these settings in your Google Cloud Console:**

#### OAuth 2.0 Client ID Configuration
1. **Go to**: https://console.cloud.google.com/apis/credentials
2. **Find your OAuth 2.0 Client ID**: `1020662819215-ee7ugbsr6f711udasqmttbpo71elmidc.apps.googleusercontent.com`

#### Required Redirect URIs
**ADD THESE EXACT URIs** to your Google OAuth client:
```
http://localhost:3000/api/auth/callback/google
```

#### Authorized JavaScript Origins
**ADD THIS DOMAIN** to authorized origins:
```
http://localhost:3000
```

#### OAuth Consent Screen
1. **User Type**: External (for testing) or Internal (for organization)
2. **Scopes**: Make sure these are included:
   - `openid`
   - `email` 
   - `profile`

### 4. Common Issues & Solutions

#### Issue: "redirect_uri_mismatch" error
**Solution**: Ensure redirect URI in Google Console exactly matches:
`http://localhost:3000/api/auth/callback/google`

#### Issue: OAuth redirects to login page
**Possible Causes**:
1. Google Client ID not properly configured
2. Redirect URI mismatch
3. OAuth consent screen not published
4. Domain restrictions in Google Console

#### Issue: "invalid_client" error
**Solution**: Double-check Client ID and Client Secret in .env file

### 5. Testing Steps

1. **Clear browser cache** and cookies for localhost:3000
2. **Open browser dev tools** to check console errors
3. **Test OAuth flow** by clicking Google sign-in button
4. **Check network tab** for failed OAuth requests

### 6. Debug Information

To get more debug info, check browser console when clicking Google sign-in button.

### 7. Alternative Testing

If localhost issues persist, try:
1. Using ngrok for public URL testing
2. Testing with a different browser
3. Checking if Google OAuth works with other applications

## 🚀 Quick Fix Checklist

- [ ] Verify Google Console redirect URI: `http://localhost:3000/api/auth/callback/google`
- [ ] Verify authorized origins: `http://localhost:3000`
- [ ] Check OAuth consent screen status
- [ ] Clear browser cache
- [ ] Test in incognito/private browsing mode
- [ ] Check browser console for JavaScript errors

## Expected Behavior

When working correctly:
1. User clicks "Google" button
2. Browser redirects to `accounts.google.com` OAuth page  
3. User selects Google account
4. Google redirects back to `/api/auth/callback/google`
5. NextAuth processes callback and redirects to `/dashboard`
# Google OAuth Setup Guide

## Issue: Google OAuth 404 Error

The 404 error from Google OAuth indicates that the OAuth application is not properly configured in Google Cloud Console.

## Steps to Fix Google OAuth:

### 1. Go to Google Cloud Console
- Visit: https://console.cloud.google.com/
- Sign in with your Google account

### 2. Create or Select a Project
- Create a new project or select an existing one
- Enable the "Google+ API" and "Google OAuth2 API"

### 3. Configure OAuth Consent Screen
- Go to "APIs & Services" > "OAuth consent screen"
- Choose "External" user type
- Fill in required fields:
  - App name: "Zyphex Tech"
  - User support email: your email
  - Developer contact email: your email
- Add authorized domains: `localhost`

### 4. Create OAuth 2.0 Credentials
- Go to "APIs & Services" > "Credentials"
- Click "Create Credentials" > "OAuth 2.0 Client IDs"
- Application type: "Web application"
- Name: "Zyphex Tech Local Dev"
- Authorized JavaScript origins:
  - `http://localhost:3000`
- Authorized redirect URIs:
  - `http://localhost:3000/api/auth/callback/google`

### 5. Update Environment Variables
- Copy the Client ID and Client Secret
- Update `.env` file with new credentials

### 6. Test the Configuration
- Restart your Next.js development server
- Try the Google sign-in again

## Alternative Solution: Use Test Credentials

If you want to test immediately, I can provide test credentials that are already configured.

## Common Issues:
1. **Wrong redirect URI**: Must exactly match `http://localhost:3000/api/auth/callback/google`
2. **OAuth consent screen not configured**: Required for external users
3. **APIs not enabled**: Google+ API and OAuth2 API must be enabled
4. **Domain not authorized**: localhost must be added to authorized domains

## Current Configuration:
- Redirect URI: `http://localhost:3000/api/auth/callback/google`
- Scope: `openid email profile`
- Response type: `code`
# OAuth Authentication Setup Guide

This guide covers the OAuth authentication setup for Zyphex Tech, which supports **Google** and **Microsoft** social login providers only.

## Current Status

### ✅ Fully Configured Providers
- **Google OAuth** - Ready to use
- **Microsoft Azure AD** - Ready to use

## Provider Setup Instructions

### Google OAuth Setup
Already configured with your credentials. The setup includes:
- **Client ID**: Configured in environment variables
- **Client Secret**: Configured in environment variables
- **Redirect URI**: `http://localhost:3000/api/auth/callback/google`
- **Scopes**: `openid email profile`

### Microsoft OAuth Setup
Already configured with your credentials. The setup includes:
- **Client ID**: Configured in environment variables
- **Client Secret**: Configured in environment variables
- **Tenant ID**: Configured in environment variables
- **Redirect URI**: `http://localhost:3000/api/auth/callback/azure-ad`
- **Scopes**: `openid profile email`

## Testing OAuth Providers

### Check Provider Configuration Status
Visit: `http://localhost:3000/api/auth/providers`

This endpoint will show you:
- Status of Google and Microsoft OAuth providers
- Configuration details for each provider

### Test Login Flow
1. Start your development server: `npm run dev`
2. Navigate to: `http://localhost:3000/login`
3. You should see social login buttons for Google and Microsoft
4. Click on any provider to test the OAuth flow

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI" error**
   - Ensure your redirect URIs exactly match what's configured in the OAuth app
   - For development: 
     - Google: `http://localhost:3000/api/auth/callback/google`
     - Microsoft: `http://localhost:3000/api/auth/callback/azure-ad`

2. **"Client not found" error**
   - Double-check your Client ID and Client Secret
   - Ensure there are no extra spaces or characters

3. **Provider not showing in UI**
   - Check if the provider credentials are set in `.env`
   - Restart your development server after updating `.env`

### Environment Variables Checklist

Ensure these are set in your `.env` file:

```env
# Required for all setups
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (Already configured)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Microsoft OAuth (Already configured)
MICROSOFT_CLIENT_ID="your-microsoft-client-id"
MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret"
MICROSOFT_TENANT_ID="your-microsoft-tenant-id"
```

## Security Notes

- Never commit actual OAuth credentials to version control
- Use environment variables for all sensitive configuration
- Regenerate secrets if they are accidentally exposed
- Use different OAuth apps for development and production environments

## Architecture

- `lib/auth.ts` - OAuth provider configurations for Google and Microsoft
- `components/auth/fixed-auth-form.tsx` - Social login UI with 2 providers
- `app/api/auth/providers/route.ts` - Provider status endpoint

## Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Microsoft Identity Platform](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
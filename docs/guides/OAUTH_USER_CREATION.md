# OAuth User Sign-up and Management

This document explains how new user sign-ups are handled via OAuth providers in the Zyphex Tech application.

## Overview

The OAuth sign-in callback has been enhanced to properly handle new user registrations through Google and Microsoft OAuth providers. When a user signs in with OAuth for the first time, the system automatically creates a user account with appropriate defaults.

## OAuth Sign-up Flow

### 1. Initial OAuth Request
- User clicks "Sign in with Google" or "Sign in with Microsoft"
- User is redirected to the OAuth provider's authorization server
- User grants permission and is redirected back to the application

### 2. Sign-in Callback Processing
The `signIn` callback in NextAuth configuration handles the returned OAuth data:

```typescript
async signIn({ user, account }) {
  // Validate required user data
  if (!user.email) {
    console.error(`OAuth sign-in failed: No email provided by ${account.provider}`);
    return false;
  }

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email: user.email },
    include: { accounts: { where: { provider: account.provider } } }
  });

  if (existingUser) {
    // Handle existing user (link account if needed)
  } else {
    // Create new user for OAuth provider
    const newUser = await prisma.user.create({
      data: {
        email: user.email,
        name: user.name || `${account.provider} User`,
        image: user.image,
        emailVerified: new Date(), // OAuth users are automatically verified
        role: 'USER', // Default role for new OAuth users
        password: null, // OAuth users don't need password
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });
  }
}
```

### 3. New User Creation

When a new OAuth user is detected:

#### User Record Creation
- **Email**: Provided by OAuth provider (required)
- **Name**: From OAuth profile or defaults to "[Provider] User"
- **Image**: Profile picture from OAuth provider
- **Email Verified**: Set to current timestamp (OAuth providers handle verification)
- **Role**: Default 'USER' role assigned
- **Password**: Set to `null` (OAuth users don't need passwords)
- **Created/Updated At**: Current timestamp

#### OAuth Account Linking
```typescript
await prisma.account.create({
  data: {
    userId: newUser.id,
    type: account.type,
    provider: account.provider, // 'google' or 'azure-ad'
    providerAccountId: account.providerAccountId,
    refresh_token: account.refresh_token,
    access_token: account.access_token,
    expires_at: account.expires_at,
    token_type: account.token_type,
    scope: account.scope,
    id_token: account.id_token,
    session_state: account.session_state,
  }
});
```

## Database Schema

### User Table Fields for OAuth Users
```sql
-- Core user information
email VARCHAR NOT NULL UNIQUE
name VARCHAR
image VARCHAR
emailVerified TIMESTAMP -- Set automatically for OAuth users
role VARCHAR DEFAULT 'USER'
password VARCHAR NULL -- Always null for OAuth users
createdAt TIMESTAMP
updatedAt TIMESTAMP

-- OAuth users are identified by:
-- 1. password IS NULL
-- 2. emailVerified IS NOT NULL
-- 3. Associated account records with OAuth providers
```

### Account Table for OAuth
```sql
userId VARCHAR -- Foreign key to users table
type VARCHAR -- 'oauth'
provider VARCHAR -- 'google' or 'azure-ad'
providerAccountId VARCHAR -- Unique ID from OAuth provider
refresh_token TEXT
access_token TEXT
expires_at INTEGER
token_type VARCHAR
scope VARCHAR
id_token TEXT
session_state VARCHAR
```

## Error Handling

### Validation Checks
1. **Email Required**: OAuth sign-in fails if no email is provided
2. **Provider Validation**: Only configured providers are accepted
3. **Database Constraints**: Unique email constraint prevents duplicates

### Error Scenarios
```typescript
// Missing email from OAuth provider
if (!user.email) {
  console.error(`OAuth sign-in failed: No email provided by ${account.provider}`);
  return false;
}

// Database operation failures
try {
  // User creation logic
} catch (error) {
  console.error(`Error during ${account.provider} OAuth sign-in:`, error);
  return false;
}
```

## Logging and Monitoring

### Sign-in Events
```typescript
console.log('SignIn callback - User:', { 
  name: user.name, 
  email: user.email, 
  image: user.image 
});
console.log('SignIn callback - Account provider:', account?.provider);
```

### User Creation Events
```typescript
console.log(`Creating new user for ${account.provider} OAuth sign-in`);
console.log(`Created new user with ID: ${newUser.id}`);
console.log(`Created OAuth account record for provider: ${account.provider}`);
```

### NextAuth Events
```typescript
events: {
  async createUser({ user }) {
    console.log(`New user created - Email: ${user.email}, ID: ${user.id}`);
  },
  async signIn({ user, account, isNewUser }) {
    console.log(`User signed in - Provider: ${account?.provider}, New User: ${isNewUser}`);
  }
}
```

## Testing OAuth User Creation

### Test Endpoint
Use the OAuth users endpoint to monitor new user creation:
```
GET /api/auth/oauth-users
```

Response includes:
- Recent OAuth users (last 24 hours)
- Total OAuth users count
- Provider statistics
- User creation timestamps

### Manual Testing
1. Clear browser data or use incognito mode
2. Visit `/login`
3. Click "Sign in with Google" or "Sign in with Microsoft"
4. Complete OAuth flow with a new email address
5. Verify user creation in database
6. Check logs for creation events

## Security Considerations

### Email Verification
- OAuth users have `emailVerified` automatically set
- OAuth providers handle email verification before providing user data
- No additional email verification needed

### Role Assignment
- New OAuth users get 'USER' role by default
- Role can be updated through admin interface after creation
- No automatic admin role assignment for security

### Account Linking
- Multiple OAuth accounts can be linked to same email
- Existing users can add OAuth providers to their account
- Prevents duplicate user creation for same email

## Common Issues and Solutions

### Issue: User Creation Fails
**Symptoms**: OAuth sign-in redirects to error page
**Solution**: Check logs for specific error messages, verify database schema

### Issue: Duplicate Users
**Symptoms**: Same email has multiple user records
**Solution**: Email uniqueness constraint should prevent this; check for case sensitivity issues

### Issue: Missing User Data
**Symptoms**: User signed in but missing name/image
**Solution**: Check OAuth provider scope includes profile information

### Issue: Role Not Set
**Symptoms**: New OAuth user has no role
**Solution**: Verify default role assignment in user creation code

## Monitoring and Analytics

### Key Metrics
- OAuth sign-up rate vs traditional registration
- Provider preference (Google vs Microsoft)
- OAuth user engagement vs email users
- Account linking frequency

### Database Queries
```sql
-- Count OAuth users by provider
SELECT a.provider, COUNT(*) as user_count
FROM accounts a
GROUP BY a.provider;

-- Recent OAuth sign-ups
SELECT u.email, u.name, u.createdAt, a.provider
FROM users u
JOIN accounts a ON u.id = a.userId
WHERE u.createdAt >= NOW() - INTERVAL 24 HOUR
AND u.password IS NULL;
```

## Future Enhancements

### Welcome Email Integration
```typescript
// Optional: Send welcome email for new OAuth users
try {
  await sendWelcomeEmail(newUser.email, newUser.name || 'User');
  console.log(`Welcome email sent to ${newUser.email}`);
} catch (emailError) {
  console.error('Failed to send welcome email:', emailError);
  // Don't fail the sign-in if email fails
}
```

### Additional OAuth Providers
- Framework ready for LinkedIn, Discord, GitHub
- Easy to add new providers by updating configuration
- Same user creation logic applies to all OAuth providers
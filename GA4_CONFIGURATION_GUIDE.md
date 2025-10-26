# Google Analytics 4 Setup Guide

## Step 1: Create GA4 Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Enable the Google Analytics Data API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Analytics Data API"
   - Click "Enable"

4. Create a Service Account:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Name: `zyphex-analytics` (or your preferred name)
   - Role: None needed yet
   - Click "Done"

5. Create and Download Key:
   - Click on the created service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create New Key"
   - Select "JSON"
   - Click "Create" - the key file will download

## Step 2: Grant GA4 Access

1. Go to [Google Analytics](https://analytics.google.com/)
2. Select your GA4 property
3. Go to "Admin" (bottom left)
4. Under "Property" column, click "Property Access Management"
5. Click "+" (Add Users)
6. Enter your service account email (looks like: `zyphex-analytics@project-id.iam.gserviceaccount.com`)
7. Select "Viewer" role
8. Uncheck "Notify new users by email"
9. Click "Add"

## Step 3: Get Your Property ID

1. In Google Analytics, go to "Admin"
2. Under "Property" column, click "Property Settings"
3. Copy the "Property ID" (format: `123456789`)

## Step 4: Configure Environment Variables

Add these to your `.env.local` file:

```env
# Google Analytics 4 Configuration
GA4_PROPERTY_ID=123456789
GA4_CREDENTIALS_JSON={"type":"service_account","project_id":"your-project",...}
```

### Option A: Using JSON String (Recommended for Production)

Copy the entire contents of your downloaded JSON file and paste it as a single line:

```env
GA4_CREDENTIALS_JSON={"type":"service_account","project_id":"your-project-id","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\nMIIE...","client_email":"zyphex-analytics@project-id.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/zyphex-analytics%40project-id.iam.gserviceaccount.com"}
```

### Option B: Using File Path (Development)

Save the JSON file to `config/ga4-credentials.json` and reference it:

```env
GA4_CREDENTIALS_PATH=./config/ga4-credentials.json
```

**Important**: Add `config/ga4-credentials.json` to your `.gitignore`!

## Step 5: Verify Configuration

The library at `lib/google-analytics.ts` will automatically detect and use your credentials. When configured correctly, the Traffic Analytics page will show:

- Badge: "📊 Live GA4 Data" (instead of "🔧 Demo Data")
- Real traffic metrics from your website
- Actual visitor data and behavior

## Troubleshooting

### "Mock data" still showing

1. Check environment variables are loaded:
   ```powershell
   # Restart your dev server
   npm run dev
   ```

2. Verify credentials format:
   - JSON should be valid
   - No extra spaces or line breaks
   - Property ID should be numbers only

### "Unauthorized" or "Permission denied"

1. Verify service account email is added to GA4
2. Check the role is "Viewer" or higher
3. Wait 5-10 minutes for permissions to propagate

### "Property not found"

1. Double-check your Property ID
2. Ensure it's a GA4 property (not Universal Analytics)
3. Verify the service account has access to that specific property

## Testing

1. Access: `http://localhost:3000/super-admin/analytics/traffic`
2. Check the badge at the top right
3. If it shows "📊 Live GA4 Data", you're successfully connected!
4. Data may take 24-48 hours to fully populate for a new property

## Security Best Practices

- ✅ Never commit GA4 credentials to Git
- ✅ Use environment variables for sensitive data
- ✅ Restrict service account to Viewer role only
- ✅ Rotate credentials periodically
- ✅ Use different service accounts for dev/staging/production

## Sample .env.local

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/zyphextech_dev"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Google Analytics 4
GA4_PROPERTY_ID=123456789
GA4_CREDENTIALS_JSON={"type":"service_account","project_id":"your-project-id",...}

# Other configs...
```

---

**Status**: Ready to configure ⏳
**Required**: GA4 property and service account
**Time to setup**: ~10 minutes

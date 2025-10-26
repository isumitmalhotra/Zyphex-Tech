# Google Analytics 4 Setup Guide

This guide will help you integrate Google Analytics 4 (GA4) with your application for real-time traffic analytics.

## Benefits

- ✅ **Free tier**: 200,000 API calls per day
- ✅ Real-time traffic data
- ✅ Historical data (up to 14 months)
- ✅ Custom dimensions & metrics
- ✅ No mock data needed

## Setup Steps

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Note your project ID

### 2. Enable Google Analytics Data API

1. In Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google Analytics Data API"
3. Click "Enable"

### 3. Create Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in details:
   - **Name**: `ga4-analytics-reader`
   - **Description**: `Service account for reading GA4 data`
4. Click "Create and Continue"
5. Grant role: **"Viewer"** (under "Quick Access")
6. Click "Done"

### 4. Generate Service Account Key

1. Click on the service account you just created
2. Go to "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose **JSON** format
5. Click "Create" - a JSON file will download
6. **Keep this file secure!**

### 5. Get GA4 Property ID

1. Go to [Google Analytics](https://analytics.google.com/)
2. Select your property
3. Go to "Admin" (gear icon bottom left)
4. Under "Property" column, click "Property Settings"
5. Copy your **Property ID** (format: `123456789`)

### 6. Grant Access to Service Account

1. Still in GA4 Admin > Property column
2. Click "Property Access Management"
3. Click "+ Add users"
4. Paste your service account email from step 3 (format: `ga4-analytics-reader@yourproject.iam.gserviceaccount.com`)
5. Select role: **"Viewer"**
6. Uncheck "Notify new users by email"
7. Click "Add"

### 7. Configure Environment Variables

Open your `.env` or `.env.local` file and add:

```bash
# Google Analytics 4 Configuration
GOOGLE_SERVICE_ACCOUNT_EMAIL="ga4-analytics-reader@yourproject.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourPrivateKeyHere\n-----END PRIVATE KEY-----\n"
GA4_PROPERTY_ID="123456789"
```

**Important Notes:**
- The `GOOGLE_PRIVATE_KEY` should include the full key from the JSON file
- Keep the `\n` characters in the private key
- The private key should be wrapped in quotes
- Never commit the `.env` file to version control!

### 8. Install Dependencies

```bash
npm install @google-analytics/data
# or
yarn add @google-analytics/data
# or
pnpm add @google-analytics/data
```

### 9. Test the Integration

Restart your development server:

```bash
npm run dev
```

Navigate to: `http://localhost:3000/super-admin/analytics/traffic`

You should see:
- ✅ Real GA4 data if configured correctly
- ⚠️ Mock data with a message if not configured

## Extracting Credentials from JSON

Your downloaded JSON file looks like this:

```json
{
  "type": "service_account",
  "project_id": "your-project-123456",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n",
  "client_email": "ga4-analytics-reader@your-project.iam.gserviceaccount.com",
  "client_id": "123456789",
  ...
}
```

Extract these values:

1. **GOOGLE_SERVICE_ACCOUNT_EMAIL** = `client_email` value
2. **GOOGLE_PRIVATE_KEY** = `private_key` value (keep the `\n` characters!)
3. **GA4_PROPERTY_ID** = From GA4 settings (step 5)

## Troubleshooting

### Error: "GA4_PROPERTY_ID is not configured"

- Make sure you added all three environment variables
- Restart your Next.js server after adding env vars
- Check for typos in variable names

### Error: "Permission denied" or "403"

- Verify the service account email is added to GA4 with Viewer role
- Wait 5-10 minutes after granting access (propagation time)
- Ensure the private key is correctly formatted with `\n` characters

### Error: "Invalid property ID"

- Double-check your GA4 Property ID (numbers only, no "G-" prefix)
- Make sure you're using GA4 (not Universal Analytics)

### Mock Data Shows Instead of Real Data

The app will automatically fall back to mock data if:
- Environment variables are not configured
- GA4 API returns an error
- You explicitly request mock data with `?useMock=true`

This ensures the app always works, even without GA4 setup.

## API Quotas

**Google Analytics Data API Free Tier:**
- 200,000 requests per day
- 50 requests per second
- 10 concurrent requests

This is more than enough for most applications. Monitor usage in [Google Cloud Console](https://console.cloud.google.com/apis/dashboard).

## Available Data

Once configured, you'll get access to:

### Traffic Metrics
- Total users, sessions, page views
- Bounce rate
- Average session duration
- New vs returning users

### Traffic Sources
- Organic search (Google, Bing, etc.)
- Direct traffic
- Social media (LinkedIn, Twitter, etc.)
- Referrals
- Email campaigns

### Geographic Data
- Users by country
- Sessions by region
- Top cities

### Device Data
- Desktop vs mobile vs tablet
- Browser types
- Operating systems

### Page Performance
- Top pages by views
- Average time on page
- Bounce rate per page
- User flow

### Real-Time Data
- Currently active users
- Live traffic sources
- Real-time conversions

## Development vs Production

**Development:**
- Use mock data (`?useMock=true`) to avoid hitting API quotas
- Test UI without real GA4 setup

**Production:**
- Configure GA4 credentials
- Real data automatically used
- Falls back to mock data on errors

## Security Best Practices

1. ✅ Never commit `.env` files
2. ✅ Add `.env*` to `.gitignore`
3. ✅ Use environment variables in production (Vercel, Railway, etc.)
4. ✅ Rotate service account keys periodically
5. ✅ Use minimal permissions (Viewer only)
6. ✅ Monitor API usage for anomalies

## Alternative: Plausible Analytics

If you prefer a simpler, privacy-focused alternative:

1. Sign up at [Plausible.io](https://plausible.io/)
2. Add tracking script to your site
3. Use Plausible API (simpler than GA4)
4. No Google account needed

## Support

- GA4 Documentation: https://developers.google.com/analytics/devguides/reporting/data/v1
- Google Cloud Console: https://console.cloud.google.com/
- Service Account Guide: https://cloud.google.com/iam/docs/service-accounts

---

**Ready to go!** Once configured, your analytics dashboard will show real-time data from Google Analytics 4. 🎉

import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const hasGoogleId = !!process.env.GOOGLE_CLIENT_ID
  const hasGoogleSecret = !!process.env.GOOGLE_CLIENT_SECRET
  const hasAzureId = !!process.env.AZURE_AD_CLIENT_ID
  const hasAzureSecret = !!process.env.AZURE_AD_CLIENT_SECRET
  const hasAzureTenant = !!process.env.AZURE_AD_TENANT_ID
  const nextAuthUrl = process.env.NEXTAUTH_URL
  
  return NextResponse.json({
    oauth_config: {
      google: {
        hasClientId: hasGoogleId,
        hasClientSecret: hasGoogleSecret
      },
      azure: {
        hasClientId: hasAzureId,
        hasClientSecret: hasAzureSecret,
        hasTenantId: hasAzureTenant
      },
      nextAuthUrl
    }
  })
}
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/integrations/[id]/sync - Sync integration data
// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'PROJECT_MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const integration = await prisma.integration.findUnique({
      where: { id: params.id }
    })

    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      )
    }

    if (!integration.isEnabled) {
      return NextResponse.json(
        { error: 'Integration is not enabled' },
        { status: 400 }
      )
    }

    // Update status to syncing
    await prisma.integration.update({
      where: { id: params.id },
      data: { status: 'SYNCING' }
    })

    try {
      // Simulate sync operation
      let syncResult = await performSync(integration)

      // Update integration with sync results
      await prisma.integration.update({
        where: { id: params.id },
        data: {
          status: syncResult.success ? 'ACTIVE' : 'ERROR',
          lastSyncAt: new Date(),
          errorMessage: syncResult.success ? null : syncResult.message
        }
      })

      // Log the sync
      await prisma.integrationLog.create({
        data: {
          integrationId: integration.id,
          action: 'sync',
          status: syncResult.success ? 'success' : 'error',
          message: syncResult.message,
          metadata: {
            itemsSynced: syncResult.itemsSynced,
            errors: syncResult.errors
          }
        }
      })

      return NextResponse.json(syncResult)
    } catch (error: any) {
      // Update status to error
      await prisma.integration.update({
        where: { id: params.id },
        data: {
          status: 'ERROR',
          errorMessage: error.message
        }
      })

      // Log the error
      await prisma.integrationLog.create({
        data: {
          integrationId: integration.id,
          action: 'sync',
          status: 'error',
          message: error.message || 'Sync failed'
        }
      })

      return NextResponse.json({
        success: false,
        message: error.message || 'Sync failed',
        itemsSynced: 0,
        errors: [error.toString()]
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Error syncing integration:', error)
    return NextResponse.json(
      { error: 'Failed to sync integration' },
      { status: 500 }
    )
  }
}

async function performSync(integration: any) {
  // Simulate sync based on integration type
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

  const syncResults: { [key: string]: any } = {
    'SLACK': {
      success: true,
      message: 'Synced 15 channels and 42 messages',
      itemsSynced: 57,
      errors: []
    },
    'GITHUB': {
      success: true,
      message: 'Synced 8 repositories, 23 issues, and 12 pull requests',
      itemsSynced: 43,
      errors: []
    },
    'GOOGLE_ANALYTICS': {
      success: true,
      message: 'Synced analytics data for the past 7 days',
      itemsSynced: 168, // hours
      errors: []
    },
    'TRELLO': {
      success: true,
      message: 'Synced 5 boards with 34 cards',
      itemsSynced: 39,
      errors: []
    },
    'ZOOM': {
      success: true,
      message: 'Synced 12 upcoming meetings',
      itemsSynced: 12,
      errors: []
    },
    'HUBSPOT': {
      success: true,
      message: 'Synced 45 contacts and 18 deals',
      itemsSynced: 63,
      errors: []
    },
    'JIRA': {
      success: true,
      message: 'Synced 28 issues across 3 projects',
      itemsSynced: 28,
      errors: []
    },
    'DISCORD': {
      success: true,
      message: 'Synced 8 channels and 156 messages',
      itemsSynced: 164,
      errors: []
    }
  }

  return syncResults[integration.type] || {
    success: true,
    message: `Sync completed for ${integration.name}`,
    itemsSynced: Math.floor(Math.random() * 50) + 10,
    errors: []
  }
}

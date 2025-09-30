import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { IntegrationHub } from '@/lib/psa/integration';
import { hasPermission, Permission, ExtendedUser } from '@/lib/auth/permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canViewIntegrations = await hasPermission(session.user as ExtendedUser, Permission.VIEW_DASHBOARD);
    if (!canViewIntegrations) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const source = searchParams.get('source');

    const integrationHub = IntegrationHub.getInstance();

    switch (action) {
      case 'endpoints':
        const endpoints = await integrationHub.getActiveEndpoints();
        return NextResponse.json({
          success: true,
          data: endpoints
        });

      case 'status':
        const status = await integrationHub.getIntegrationStatus();
        return NextResponse.json({
          success: true,
          data: status
        });

      case 'webhooks':
        const webhooks = await integrationHub.getWebhookHistory(source || undefined);
        return NextResponse.json({
          success: true,
          data: webhooks
        });

      default:
        const overview = await integrationHub.getIntegrationOverview();
        return NextResponse.json({
          success: true,
          data: overview
        });
    }

  } catch (error) {
    console.error('Integration GET Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canManageIntegrations = await hasPermission(session.user as ExtendedUser, Permission.MANAGE_INTEGRATIONS);
    if (!canManageIntegrations) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { action, data } = body;

    const integrationHub = IntegrationHub.getInstance();

    switch (action) {
      case 'register-webhook':
        const webhook = await integrationHub.registerWebhook(data);
        return NextResponse.json({
          success: true,
          data: webhook,
          message: 'Webhook registered successfully'
        });

      case 'sync-data':
        await integrationHub.syncExternalData(data.endpointId);
        return NextResponse.json({
          success: true,
          message: 'Data synchronization initiated'
        });

      case 'test-integration':
        const testResult = await integrationHub.testIntegration(data.endpointId);
        return NextResponse.json({
          success: true,
          data: testResult,
          message: 'Integration test completed'
        });

      case 'configure-integration':
        const integration = await integrationHub.configureIntegration(data);
        return NextResponse.json({
          success: true,
          data: integration,
          message: 'Integration configured successfully'
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Integration POST Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle incoming webhooks
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const event = searchParams.get('event');

    if (!source || !event) {
      return NextResponse.json({ error: 'Source and event are required' }, { status: 400 });
    }

    const payload = await request.json();
    
    const integrationHub = IntegrationHub.getInstance();
    await integrationHub.processWebhook(source, event, payload);

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('Webhook Processing Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canManageIntegrations = await hasPermission(session.user as ExtendedUser, Permission.MANAGE_INTEGRATIONS);
    if (!canManageIntegrations) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const endpointId = searchParams.get('endpointId');

    if (!endpointId) {
      return NextResponse.json({ error: 'Endpoint ID is required' }, { status: 400 });
    }

    const integrationHub = IntegrationHub.getInstance();
    await integrationHub.removeEndpoint(endpointId);

    return NextResponse.json({
      success: true,
      message: 'Integration endpoint removed successfully'
    });

  } catch (error) {
    console.error('Integration DELETE Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
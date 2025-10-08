import { NextRequest, NextResponse } from 'next/server';
import { psaCore } from '@/lib/psa';

// Initialize PSA Core on first request
let initialized = false;

async function ensurePSAInitialized() {
  if (!initialized) {
    try {
      await psaCore.initialize();
      initialized = true;
    } catch (error) {
      throw error;
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensurePSAInitialized();
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'dashboard';

    switch (action) {
      case 'dashboard':
        const dashboardData = await psaCore.getDashboardData();
        return NextResponse.json(dashboardData);

      case 'health':
        const systemHealth = await psaCore.getSystemHealth();
        return NextResponse.json(systemHealth);

      case 'reports':
        const reportType = searchParams.get('type') as 'profitability' | 'resource_efficiency' | 'client_value' | 'predictive';
        if (!reportType) {
          return NextResponse.json({ error: 'Report type is required' }, { status: 400 });
        }
        
        const options: Record<string, unknown> = {};
        const projectId = searchParams.get('projectId');
        const clientId = searchParams.get('clientId');
        
        if (projectId) options.projectId = projectId;
        if (clientId) options.clientId = clientId;

        const report = await psaCore.generateBusinessReport(reportType, options);
        return NextResponse.json(report);

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensurePSAInitialized();
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await request.json();

    switch (action) {
      case 'workflow':
        if (!body.templateId) {
          return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
        }
        
        const workflowResult = await psaCore.executeWorkflow(body.templateId, body.context || {});
        return NextResponse.json(workflowResult);

      case 'webhook':
        const endpoint = searchParams.get('endpoint');
        if (!endpoint) {
          return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 });
        }
        
        const headers = Object.fromEntries(request.headers.entries());
        const webhookResult = await psaCore.processWebhook(endpoint, body, headers);
        return NextResponse.json(webhookResult);

      case 'config':
        await psaCore.updateConfiguration(body);
        return NextResponse.json({ success: true, message: 'Configuration updated' });

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
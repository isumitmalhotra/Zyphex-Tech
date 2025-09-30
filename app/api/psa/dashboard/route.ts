import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PSADashboard } from '@/lib/psa/dashboard';
import { hasPermission, Permission, ExtendedUser } from '@/lib/auth/permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    const canViewDashboard = await hasPermission(session.user as ExtendedUser, Permission.VIEW_DASHBOARD);
    if (!canViewDashboard) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const metric = searchParams.get('metric');
    const _projectId = searchParams.get('projectId');
    const _timeframe = searchParams.get('timeframe') || '30';

    const dashboard = new PSADashboard();

    switch (metric) {
      case 'health':
        const healthMetrics = await dashboard.getProjectHealth();
        return NextResponse.json({
          success: true,
          data: healthMetrics,
          timestamp: new Date().toISOString()
        });

      case 'resources':
        const resourceMetrics = await dashboard.getResourceUtilization();
        return NextResponse.json({
          success: true,
          data: resourceMetrics,
          timestamp: new Date().toISOString()
        });

      case 'financial':
        const financialMetrics = await dashboard.getFinancialSummary();
        return NextResponse.json({
          success: true,
          data: financialMetrics,
          timestamp: new Date().toISOString()
        });

      case 'client-satisfaction':
        const clientMetrics = await dashboard.getClientSatisfaction();
        return NextResponse.json({
          success: true,
          data: clientMetrics,
          timestamp: new Date().toISOString()
        });

      case 'alerts':
        const alerts = await dashboard.getActiveAlerts();
        return NextResponse.json({
          success: true,
          data: alerts,
          timestamp: new Date().toISOString()
        });

      default:
        // Return comprehensive dashboard data
        const [health, resources, financial, client, alertData] = await Promise.all([
          dashboard.getProjectHealth(),
          dashboard.getResourceUtilization(),
          dashboard.getFinancialSummary(),
          dashboard.getClientSatisfaction(),
          dashboard.getActiveAlerts()
        ]);

        return NextResponse.json({
          success: true,
          data: {
            projectHealth: health,
            resourceUtilization: resources,
            financialMetrics: financial,
            clientSatisfaction: client,
            alerts: alertData,
            lastUpdated: new Date().toISOString()
          }
        });
    }

  } catch (error) {
    console.error('PSA Dashboard Error:', error);
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

    const canManageSystem = await hasPermission(session.user as ExtendedUser, Permission.MANAGE_SYSTEM);
    if (!canManageSystem) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { action, data } = body;

    const dashboard = new PSADashboard();

    switch (action) {
      case 'create-alert':
        const alert = await dashboard.createAlert(data);
        return NextResponse.json({
          success: true,
          data: alert,
          message: 'Alert created successfully'
        });

      case 'update-alert':
        const updatedAlert = await dashboard.updateAlert(data.id, data);
        return NextResponse.json({
          success: true,
          data: updatedAlert,
          message: 'Alert updated successfully'
        });

      case 'refresh-metrics':
        const refreshed = await dashboard.refreshAllMetrics();
        return NextResponse.json({
          success: true,
          data: refreshed,
          message: 'Metrics refreshed successfully'
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('PSA Dashboard POST Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
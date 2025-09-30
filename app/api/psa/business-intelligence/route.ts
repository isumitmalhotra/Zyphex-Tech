import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BusinessIntelligence } from '@/lib/psa/business-intelligence';
import { hasPermission, Permission } from '@/lib/auth/permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canViewReports = await hasPermission(session.user.id, Permission.VIEW_REPORTS);
    if (!canViewReports) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type');
    const timeframe = searchParams.get('timeframe') || '30';
    const projectId = searchParams.get('projectId');
    const clientId = searchParams.get('clientId');

    const bi = new BusinessIntelligence();

    switch (reportType) {
      case 'profitability':
        const profitabilityReport = await bi.getProjectProfitabilityAnalysis({
          timeframe: parseInt(timeframe),
          projectId: projectId || undefined,
          clientId: clientId || undefined
        });
        return NextResponse.json({
          success: true,
          data: profitabilityReport,
          type: 'profitability'
        });

      case 'resource-efficiency':
        const resourceReport = await bi.getResourceEfficiencyReport({
          timeframe: parseInt(timeframe)
        });
        return NextResponse.json({
          success: true,
          data: resourceReport,
          type: 'resource-efficiency'
        });

      case 'client-value':
        const clientValueReport = await bi.getClientLifetimeValueAnalysis({
          timeframe: parseInt(timeframe),
          clientId: clientId || undefined
        });
        return NextResponse.json({
          success: true,
          data: clientValueReport,
          type: 'client-value'
        });

      case 'predictive':
        const predictiveReport = await bi.getPredictiveAnalytics({
          timeframe: parseInt(timeframe),
          projectId: projectId || undefined
        });
        return NextResponse.json({
          success: true,
          data: predictiveReport,
          type: 'predictive'
        });

      case 'financial-summary':
        const financialSummary = await bi.getFinancialSummary({
          timeframe: parseInt(timeframe)
        });
        return NextResponse.json({
          success: true,
          data: financialSummary,
          type: 'financial-summary'
        });

      case 'performance-metrics':
        const performanceMetrics = await bi.getPerformanceMetrics({
          timeframe: parseInt(timeframe),
          projectId: projectId || undefined
        });
        return NextResponse.json({
          success: true,
          data: performanceMetrics,
          type: 'performance-metrics'
        });

      default:
        // Return comprehensive dashboard data
        const [profitability, resources, clientValue, predictive] = await Promise.all([
          bi.getProjectProfitabilityAnalysis({ timeframe: parseInt(timeframe) }),
          bi.getResourceEfficiencyReport({ timeframe: parseInt(timeframe) }),
          bi.getClientLifetimeValueAnalysis({ timeframe: parseInt(timeframe) }),
          bi.getPredictiveAnalytics({ timeframe: parseInt(timeframe) })
        ]);

        return NextResponse.json({
          success: true,
          data: {
            profitability,
            resourceEfficiency: resources,
            clientValue,
            predictive,
            lastUpdated: new Date().toISOString()
          }
        });
    }

  } catch (error) {
    console.error('Business Intelligence Error:', error);
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

    const canCreateReports = await hasPermission(session.user.id, Permission.CREATE_REPORTS);
    if (!canCreateReports) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { action, data } = body;

    const bi = new BusinessIntelligence();

    switch (action) {
      case 'generate-custom-report':
        const customReport = await bi.generateCustomReport(data);
        return NextResponse.json({
          success: true,
          data: customReport,
          message: 'Custom report generated successfully'
        });

      case 'export-data':
        const exportedData = await bi.exportData(data.reportType, data.format, data.options);
        return NextResponse.json({
          success: true,
          data: exportedData,
          message: 'Data exported successfully'
        });

      case 'schedule-report':
        const scheduledReport = await bi.scheduleReport(data);
        return NextResponse.json({
          success: true,
          data: scheduledReport,
          message: 'Report scheduled successfully'
        });

      case 'refresh-cache':
        await bi.refreshReportCache();
        return NextResponse.json({
          success: true,
          message: 'Report cache refreshed successfully'
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Business Intelligence POST Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
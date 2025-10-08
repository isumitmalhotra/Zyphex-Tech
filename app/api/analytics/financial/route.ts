import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FinancialAnalyticsEngine } from '@/lib/analytics/financial-analytics-engine';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const timeframe = searchParams.get('timeframe') || '6m';

    const analyticsEngine = new FinancialAnalyticsEngine();
    
    if (projectId) {
      // Get profitability for specific project
      const profitability = await analyticsEngine.calculateProjectProfitability(projectId);
      
      return NextResponse.json({
        success: true,
        data: profitability
      });
    } else {
      // Get overview of all project profitability
      const projects = await prisma.project.findMany({
        where: {
          deletedAt: null,
          // Add timeframe filtering based on createdAt
          ...(timeframe === '3m' && {
            createdAt: {
              gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
            }
          }),
          ...(timeframe === '6m' && {
            createdAt: {
              gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
            }
          }),
          ...(timeframe === '12m' && {
            createdAt: {
              gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
            }
          })
        },
        select: { id: true, name: true }
      });

      const profitabilityData = await Promise.all(
        projects.map(async (project) => {
          try {
            const profitability = await analyticsEngine.calculateProjectProfitability(project.id);
            return {
              ...profitability,
              projectName: project.name
            };
          } catch (error) {
            return null;
          }
        })
      );

      return NextResponse.json({
        success: true,
        data: profitabilityData.filter(Boolean)
      });
    }

  } catch (error) {
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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, projectIds, clientIds, timeframe } = body;

    const analyticsEngine = new FinancialAnalyticsEngine();
    
    switch (action) {
      case 'bulk_profitability':
        if (!projectIds || !Array.isArray(projectIds)) {
          return NextResponse.json(
            { error: 'projectIds array is required' },
            { status: 400 }
          );
        }

        const profitabilityResults = await Promise.all(
          projectIds.map(async (id: string) => {
            try {
              return await analyticsEngine.calculateProjectProfitability(id);
            } catch (error) {
              return null;
            }
          })
        );

        return NextResponse.json({
          success: true,
          data: profitabilityResults.filter(Boolean)
        });

      case 'client_ltv_analysis':
        if (!clientIds || !Array.isArray(clientIds)) {
          return NextResponse.json(
            { error: 'clientIds array is required' },
            { status: 400 }
          );
        }

        const ltvResults = await Promise.all(
          clientIds.map(async (id: string) => {
            try {
              return await analyticsEngine.calculateClientLifetimeValue(id);
            } catch (error) {
              return null;
            }
          })
        );

        return NextResponse.json({
          success: true,
          data: ltvResults.filter(Boolean)
        });

      case 'revenue_forecast':
        const months = typeof timeframe === 'number' ? timeframe : 12;
        const forecast = await analyticsEngine.generateRevenueForecasting(months);
        
        return NextResponse.json({
          success: true,
          data: forecast
        });

      case 'cash_flow_analysis':
        const cashFlow = await analyticsEngine.analyzeCashFlow(timeframe || '12m');
        
        return NextResponse.json({
          success: true,
          data: cashFlow
        });

      case 'expense_analysis':
        // Convert timeframe to date range for expense analysis
        const analysisMonths = timeframe === '3m' ? 3 : timeframe === '6m' ? 6 : timeframe === '12m' ? 12 : 6;
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - analysisMonths);
        
        const expenseAnalysis = await analyticsEngine.analyzeExpenses(startDate, endDate);
        
        return NextResponse.json({
          success: true,
          data: expenseAnalysis
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
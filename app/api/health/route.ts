/**
 * Health Check API Endpoint
 * Provides comprehensive health status for monitoring and alerting
 * 
 * GET /api/health - Full health check (all services)
 * GET /api/health?quick=true - Quick health check (basic connectivity only)
 * GET /api/health?service=database - Check specific service only
 */

import { NextRequest, NextResponse } from 'next/server';
import { DatabaseHealthChecker } from '@/lib/health/database';
import { ExternalServicesHealthChecker } from '@/lib/health/external-services';
import { SystemResourceMonitor } from '@/lib/health/system-resources';
import { Logger } from '@/lib/logger';
import type { HealthReport, HealthStatus, ServiceHealthCheck } from '@/lib/health/types';

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
const ENVIRONMENT = process.env.NODE_ENV || 'development';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;
  
  // Check query parameters
  const isQuickCheck = searchParams.get('quick') === 'true';
  const specificService = searchParams.get('service');

  try {
    // Quick check - just verify database connectivity
    if (isQuickCheck) {
      const isHealthy = await DatabaseHealthChecker.quickCheck();
      const responseTime = Date.now() - startTime;

      return NextResponse.json({
        status: isHealthy ? 'healthy' : 'unhealthy',
        message: isHealthy ? 'Service is operational' : 'Service is down',
        timestamp: new Date().toISOString(),
        responseTime,
        version: APP_VERSION,
      }, {
        status: isHealthy ? 200 : 503,
      });
    }

    // Check specific service
    if (specificService) {
      const result = await checkSpecificService(specificService);
      const responseTime = Date.now() - startTime;

      return NextResponse.json({
        ...result,
        responseTime,
        version: APP_VERSION,
      }, {
        status: getHTTPStatus(result.status),
      });
    }

    // Full health check
    const healthReport = await performFullHealthCheck();
    const responseTime = Date.now() - startTime;

    // Log health check
    Logger.logHealthCheck('application', healthReport.status, responseTime);

    return NextResponse.json(
      {
        ...healthReport,
        responseTime,
      },
      {
        status: getHTTPStatus(healthReport.status),
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    Logger.logError(error as Error, 'Health check endpoint failed');

    return NextResponse.json(
      {
        status: 'unhealthy',
        message: 'Health check failed',
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        version: APP_VERSION,
      },
      { status: 503 }
    );
  }
}

/**
 * Perform full health check on all services
 */
async function performFullHealthCheck(): Promise<HealthReport> {
  // Define all health checks
  const checks: ServiceHealthCheck[] = [
    {
      name: 'database',
      check: () => DatabaseHealthChecker.checkHealth(),
      critical: true,
    },
    {
      name: 'external_services',
      check: () => ExternalServicesHealthChecker.checkAll(),
      critical: false,
    },
    {
      name: 'system',
      check: () => SystemResourceMonitor.checkHealth(),
      critical: false,
    },
  ];

  // Run all checks in parallel
  const results = await Promise.allSettled(
    checks.map(async (check) => ({
      name: check.name,
      critical: check.critical,
      result: await check.check(),
    }))
  );

  // Process results
  const services: HealthReport['services'] = {};
  let overallStatus: HealthStatus = 'healthy';

  for (const result of results) {
    if (result.status === 'fulfilled') {
      const { name, critical, result: checkResult } = result.value;
      services[name] = checkResult;

      // Update overall status
      if (checkResult.status === 'unhealthy' && critical) {
        overallStatus = 'unhealthy';
      } else if (
        checkResult.status === 'unhealthy' ||
        (checkResult.status === 'degraded' && overallStatus !== 'unhealthy')
      ) {
        overallStatus = 'degraded';
      }
    } else {
      // Health check itself failed
      const checkName = checks.find((c) => c.name)?.name || 'unknown';
      services[checkName] = {
        status: 'unhealthy',
        message: `Health check failed: ${result.reason}`,
        timestamp: new Date(),
      };
      overallStatus = 'unhealthy';
    }
  }

  // Get system metrics
  const systemMetrics = await SystemResourceMonitor.collectMetrics();

  const report: HealthReport = {
    status: overallStatus,
    timestamp: new Date(),
    uptime: process.uptime(),
    version: APP_VERSION,
    environment: ENVIRONMENT,
    services,
    system: {
      memory: {
        total: parseMemoryString(systemMetrics.memory.total),
        used: parseMemoryString(systemMetrics.memory.used),
        free: parseMemoryString(systemMetrics.memory.free),
        percentUsed: systemMetrics.memory.usagePercent,
      },
      cpu: {
        usage: systemMetrics.cpu.usage,
        loadAverage: [
          systemMetrics.cpu.loadAverage['1min'],
          systemMetrics.cpu.loadAverage['5min'],
          systemMetrics.cpu.loadAverage['15min'],
        ],
      },
    },
  };

  return report;
}

/**
 * Check a specific service
 */
async function checkSpecificService(serviceName: string) {
  switch (serviceName.toLowerCase()) {
    case 'database':
    case 'db':
      return await DatabaseHealthChecker.checkHealth();

    case 'external':
    case 'external_services':
      return await ExternalServicesHealthChecker.checkAll();

    case 'system':
    case 'resources':
      return await SystemResourceMonitor.checkHealth();

    case 'email':
      return await ExternalServicesHealthChecker.checkEmailService();

    case 'payment':
    case 'stripe':
      return await ExternalServicesHealthChecker.checkPaymentGateway();

    case 'storage':
      return await ExternalServicesHealthChecker.checkStorageService();

    default:
      return {
        status: 'unhealthy' as HealthStatus,
        message: `Unknown service: ${serviceName}`,
        timestamp: new Date(),
      };
  }
}

/**
 * Convert health status to HTTP status code
 */
function getHTTPStatus(status: HealthStatus): number {
  switch (status) {
    case 'healthy':
      return 200;
    case 'degraded':
      return 200; // Still operational, but warning
    case 'unhealthy':
      return 503; // Service Unavailable
    default:
      return 500;
  }
}

/**
 * Parse memory string to bytes (for consistent formatting)
 */
function parseMemoryString(memStr: string): number {
  const match = memStr.match(/^([\d.]+)\s*(\w+)$/);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();

  const units: Record<string, number> = {
    BYTES: 1,
    KB: 1024,
    MB: 1024 ** 2,
    GB: 1024 ** 3,
    TB: 1024 ** 4,
  };

  return value * (units[unit] || 1);
}
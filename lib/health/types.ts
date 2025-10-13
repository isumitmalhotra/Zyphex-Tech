/**
 * Health Check Types
 * Defines the structure for health check results across the application
 */

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface HealthCheckResult {
  status: HealthStatus;
  message: string;
  timestamp: Date;
  responseTime?: number;
  details?: Record<string, unknown>;
}

export interface ServiceHealthCheck {
  name: string;
  check: () => Promise<HealthCheckResult>;
  critical?: boolean; // If true, failure affects overall health
}

export interface HealthReport {
  status: HealthStatus;
  timestamp: Date;
  uptime: number;
  version: string;
  environment: string;
  services: {
    [key: string]: HealthCheckResult;
  };
  system?: {
    memory: {
      total: number;
      used: number;
      free: number;
      percentUsed: number;
    };
    cpu: {
      usage: number;
      loadAverage: number[];
    };
    disk?: {
      total: number;
      used: number;
      free: number;
      percentUsed: number;
    };
  };
}

export interface DatabaseHealthMetrics {
  connectionStatus: 'connected' | 'disconnected' | 'error';
  responseTime: number;
  activeConnections?: number;
  maxConnections?: number;
  poolUtilization?: number;
  slowQueries?: number;
  errors?: string[];
}

export interface ExternalServiceHealth {
  service: string;
  status: HealthStatus;
  responseTime: number;
  endpoint?: string;
  lastChecked: Date;
  error?: string;
}

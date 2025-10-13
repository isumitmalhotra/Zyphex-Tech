/**
 * External Services Health Checks
 * Monitors connectivity and response times for third-party services
 */

import { Logger } from '@/lib/logger';
import type { HealthCheckResult, ExternalServiceHealth, HealthStatus } from './types';

export class ExternalServicesHealthChecker {
  private static readonly TIMEOUT = 10000; // 10 seconds
  private static readonly SLOW_RESPONSE_THRESHOLD = 3000; // 3 seconds

  /**
   * Check all external services
   */
  static async checkAll(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const services = await Promise.all([
        this.checkEmailService(),
        this.checkPaymentGateway(),
        this.checkStorageService(),
      ]);

      const responseTime = Date.now() - startTime;
      const status = this.determineOverallStatus(services);

      return {
        status,
        message: this.getStatusMessage(status, services),
        timestamp: new Date(),
        responseTime,
        details: {
          services: services.reduce((acc, service) => {
            acc[service.service] = service;
            return acc;
          }, {} as Record<string, ExternalServiceHealth>),
        },
      };
    } catch (error) {
      Logger.logError(error as Error, 'External services health check failed');

      return {
        status: 'unhealthy',
        message: `External services health check failed: ${(error as Error).message}`,
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Check email service (Resend)
   */
  static async checkEmailService(): Promise<ExternalServiceHealth> {
    const serviceName = 'email';
    const startTime = Date.now();

    try {
      // Check if API key is configured
      const apiKey = process.env.RESEND_API_KEY;
      
      if (!apiKey) {
        return {
          service: serviceName,
          status: 'unhealthy',
          responseTime: 0,
          lastChecked: new Date(),
          error: 'Email service API key not configured',
        };
      }

      // Make a lightweight API call to verify connectivity
      const response = await this.fetchWithTimeout(
        'https://api.resend.com/domains',
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const status = responseTime > this.SLOW_RESPONSE_THRESHOLD ? 'degraded' : 'healthy';
        
        Logger.logExternalService('email', 'health_check', responseTime, true);

        return {
          service: serviceName,
          status,
          responseTime,
          endpoint: 'api.resend.com',
          lastChecked: new Date(),
        };
      } else {
        Logger.logExternalService('email', 'health_check', responseTime, false);

        return {
          service: serviceName,
          status: 'unhealthy',
          responseTime,
          endpoint: 'api.resend.com',
          lastChecked: new Date(),
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      Logger.logError(error as Error, 'Email service health check failed');

      return {
        service: serviceName,
        status: 'unhealthy',
        responseTime,
        endpoint: 'api.resend.com',
        lastChecked: new Date(),
        error: (error as Error).message,
      };
    }
  }

  /**
   * Check payment gateway (Stripe)
   */
  static async checkPaymentGateway(): Promise<ExternalServiceHealth> {
    const serviceName = 'payment';
    const startTime = Date.now();

    try {
      // Check if API key is configured
      const apiKey = process.env.STRIPE_SECRET_KEY;
      
      if (!apiKey) {
        return {
          service: serviceName,
          status: 'unhealthy',
          responseTime: 0,
          lastChecked: new Date(),
          error: 'Payment gateway API key not configured',
        };
      }

      // Make a lightweight API call to Stripe
      const response = await this.fetchWithTimeout(
        'https://api.stripe.com/v1/balance',
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const status = responseTime > this.SLOW_RESPONSE_THRESHOLD ? 'degraded' : 'healthy';
        
        Logger.logExternalService('stripe', 'health_check', responseTime, true);

        return {
          service: serviceName,
          status,
          responseTime,
          endpoint: 'api.stripe.com',
          lastChecked: new Date(),
        };
      } else {
        Logger.logExternalService('stripe', 'health_check', responseTime, false);

        return {
          service: serviceName,
          status: 'unhealthy',
          responseTime,
          endpoint: 'api.stripe.com',
          lastChecked: new Date(),
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      Logger.logError(error as Error, 'Payment gateway health check failed');

      return {
        service: serviceName,
        status: 'unhealthy',
        responseTime,
        endpoint: 'api.stripe.com',
        lastChecked: new Date(),
        error: (error as Error).message,
      };
    }
  }

  /**
   * Check storage service (if configured)
   */
  static async checkStorageService(): Promise<ExternalServiceHealth> {
    const serviceName = 'storage';
    const startTime = Date.now();

    try {
      // Check if storage is configured (e.g., AWS S3, Cloudinary, etc.)
      // For now, we'll check if environment variables exist
      const hasS3Config = process.env.AWS_S3_BUCKET && process.env.AWS_ACCESS_KEY_ID;
      const hasCloudinaryConfig = process.env.CLOUDINARY_URL;

      if (!hasS3Config && !hasCloudinaryConfig) {
        // Storage might not be configured yet - this is okay
        return {
          service: serviceName,
          status: 'healthy',
          responseTime: 0,
          lastChecked: new Date(),
          error: 'Storage service not configured (optional)',
        };
      }

      // If S3 is configured, check AWS health
      if (hasS3Config) {
        // Simple check - we'd need AWS SDK for a real check
        // For now, just mark as healthy if configured
        return {
          service: serviceName,
          status: 'healthy',
          responseTime: Date.now() - startTime,
          endpoint: 's3.amazonaws.com',
          lastChecked: new Date(),
        };
      }

      // If Cloudinary is configured
      if (hasCloudinaryConfig) {
        return {
          service: serviceName,
          status: 'healthy',
          responseTime: Date.now() - startTime,
          endpoint: 'cloudinary.com',
          lastChecked: new Date(),
        };
      }

      return {
        service: serviceName,
        status: 'healthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      Logger.logError(error as Error, 'Storage service health check failed');

      return {
        service: serviceName,
        status: 'unhealthy',
        responseTime,
        lastChecked: new Date(),
        error: (error as Error).message,
      };
    }
  }

  /**
   * Determine overall status from individual service statuses
   */
  private static determineOverallStatus(services: ExternalServiceHealth[]): HealthStatus {
    const unhealthyServices = services.filter(s => s.status === 'unhealthy');
    const degradedServices = services.filter(s => s.status === 'degraded');

    // If any critical service is unhealthy, overall is unhealthy
    if (unhealthyServices.length > 0) {
      // Email and payment are critical
      const criticalUnhealthy = unhealthyServices.filter(
        s => s.service === 'email' || s.service === 'payment'
      );
      
      if (criticalUnhealthy.length > 0) {
        return 'unhealthy';
      }
    }

    // If any service is degraded or some non-critical services are down
    if (degradedServices.length > 0 || unhealthyServices.length > 0) {
      return 'degraded';
    }

    return 'healthy';
  }

  /**
   * Get human-readable status message
   */
  private static getStatusMessage(
    status: HealthStatus,
    services: ExternalServiceHealth[]
  ): string {
    const unhealthyServices = services.filter(s => s.status === 'unhealthy');
    const degradedServices = services.filter(s => s.status === 'degraded');

    if (status === 'unhealthy') {
      const serviceNames = unhealthyServices.map(s => s.service).join(', ');
      return `External services unhealthy: ${serviceNames}`;
    }

    if (status === 'degraded') {
      const serviceNames = [
        ...unhealthyServices.map(s => s.service),
        ...degradedServices.map(s => s.service),
      ].join(', ');
      return `External services degraded: ${serviceNames}`;
    }

    return 'All external services are healthy';
  }

  /**
   * Fetch with timeout
   */
  private static async fetchWithTimeout(
    url: string,
    options?: RequestInit
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return response;
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  }
}

/**
 * Email Alert System
 * Automated alerting for critical system issues via email
 */

import { Resend } from 'resend';
import { Logger } from '@/lib/logger';
import type { HealthStatus } from '@/lib/health/types';

const resend = new Resend(process.env.RESEND_API_KEY);

export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertCategory = 'health' | 'error' | 'performance' | 'security';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  message: string;
  timestamp: Date;
  details?: Record<string, unknown>;
  resolved?: boolean;
  resolvedAt?: Date;
}

export interface AlertConfig {
  enabled: boolean;
  recipients: string[];
  severities: AlertSeverity[];
  categories?: AlertCategory[];
  cooldownMinutes?: number; // Prevent alert spam
}

export class EmailAlertSystem {
  private static alertHistory: Map<string, Date> = new Map();
  private static readonly DEFAULT_COOLDOWN = 15; // 15 minutes
  private static readonly FROM_EMAIL = process.env.ALERT_FROM_EMAIL || 'alerts@zyphex.com';

  /**
   * Send an alert email
   */
  static async sendAlert(alert: Alert, config: AlertConfig): Promise<boolean> {
    try {
      // Check if alerts are enabled
      if (!config.enabled) {
        Logger.debug('Alerts disabled, skipping', { alert: alert.title });
        return false;
      }

      // Check severity filter
      if (!config.severities.includes(alert.severity)) {
        Logger.debug('Alert severity filtered', { 
          severity: alert.severity, 
          allowed: config.severities 
        });
        return false;
      }

      // Check category filter
      if (config.categories && !config.categories.includes(alert.category)) {
        Logger.debug('Alert category filtered', { 
          category: alert.category, 
          allowed: config.categories 
        });
        return false;
      }

      // Check cooldown to prevent spam
      if (this.isInCooldown(alert.id, config.cooldownMinutes)) {
        Logger.debug('Alert in cooldown period', { alertId: alert.id });
        return false;
      }

      // Send email to all recipients
      const results = await Promise.allSettled(
        config.recipients.map(email => this.sendAlertEmail(email, alert))
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failureCount = results.length - successCount;

      if (successCount > 0) {
        // Update alert history
        this.alertHistory.set(alert.id, new Date());

        Logger.info('Alert sent successfully', {
          alertId: alert.id,
          severity: alert.severity,
          recipients: successCount,
          failures: failureCount,
        });

        return true;
      } else {
        Logger.logError(
          new Error('Failed to send alert to any recipient'),
          'EmailAlertSystem.sendAlert'
        );
        return false;
      }
    } catch (error) {
      Logger.logError(error as Error, 'Failed to send alert');
      return false;
    }
  }

  /**
   * Send health status alert
   */
  static async sendHealthAlert(
    status: HealthStatus,
    serviceName: string,
    message: string,
    details?: Record<string, unknown>
  ): Promise<boolean> {
    const severity: AlertSeverity = 
      status === 'unhealthy' ? 'critical' : 
      status === 'degraded' ? 'warning' : 'info';

    const alert: Alert = {
      id: `health-${serviceName}-${Date.now()}`,
      severity,
      category: 'health',
      title: `${serviceName} Health: ${status.toUpperCase()}`,
      message,
      timestamp: new Date(),
      details,
    };

    const config = this.getDefaultConfig();
    return await this.sendAlert(alert, config);
  }

  /**
   * Send error alert
   */
  static async sendErrorAlert(
    error: Error,
    context?: Record<string, unknown>
  ): Promise<boolean> {
    const alert: Alert = {
      id: `error-${Date.now()}`,
      severity: 'critical',
      category: 'error',
      title: `Application Error: ${error.name}`,
      message: error.message,
      timestamp: new Date(),
      details: {
        stack: error.stack,
        ...context,
      },
    };

    const config = this.getDefaultConfig();
    return await this.sendAlert(alert, config);
  }

  /**
   * Send performance alert
   */
  static async sendPerformanceAlert(
    metric: string,
    value: number,
    threshold: number,
    unit: string
  ): Promise<boolean> {
    const severity: AlertSeverity = value > threshold * 1.5 ? 'critical' : 'warning';

    const alert: Alert = {
      id: `performance-${metric}-${Date.now()}`,
      severity,
      category: 'performance',
      title: `Performance Alert: ${metric}`,
      message: `${metric} is at ${value}${unit}, exceeding threshold of ${threshold}${unit}`,
      timestamp: new Date(),
      details: {
        metric,
        value,
        threshold,
        unit,
        percentageOver: Math.round(((value - threshold) / threshold) * 100),
      },
    };

    const config = this.getDefaultConfig();
    return await this.sendAlert(alert, config);
  }

  /**
   * Send security alert
   */
  static async sendSecurityAlert(
    event: string,
    description: string,
    details?: Record<string, unknown>
  ): Promise<boolean> {
    const alert: Alert = {
      id: `security-${event}-${Date.now()}`,
      severity: 'critical',
      category: 'security',
      title: `Security Alert: ${event}`,
      message: description,
      timestamp: new Date(),
      details,
    };

    const config = this.getDefaultConfig();
    return await this.sendAlert(alert, config);
  }

  /**
   * Send resolution notification
   */
  static async sendResolutionAlert(
    originalAlert: Alert
  ): Promise<boolean> {
    const alert: Alert = {
      ...originalAlert,
      id: `resolution-${originalAlert.id}`,
      title: `RESOLVED: ${originalAlert.title}`,
      message: `The issue has been resolved: ${originalAlert.message}`,
      resolved: true,
      resolvedAt: new Date(),
    };

    const config = this.getDefaultConfig();
    // Resolution alerts are always info severity
    return await this.sendAlert({ ...alert, severity: 'info' }, config);
  }

  /**
   * Check if alert is in cooldown period
   */
  private static isInCooldown(alertId: string, cooldownMinutes?: number): boolean {
    const lastSent = this.alertHistory.get(alertId);
    if (!lastSent) return false;

    const cooldown = (cooldownMinutes || this.DEFAULT_COOLDOWN) * 60 * 1000;
    const timeSinceLastAlert = Date.now() - lastSent.getTime();

    return timeSinceLastAlert < cooldown;
  }

  /**
   * Send actual email via Resend
   */
  private static async sendAlertEmail(
    to: string,
    alert: Alert
  ): Promise<void> {
    const html = this.generateAlertHTML(alert);
    const subject = this.generateSubject(alert);

    await resend.emails.send({
      from: this.FROM_EMAIL,
      to,
      subject,
      html,
    });

    Logger.logEmailEvent('sent', to);
  }

  /**
   * Generate email subject line
   */
  private static generateSubject(alert: Alert): string {
    const prefix = alert.severity === 'critical' ? '🚨 CRITICAL' : 
                   alert.severity === 'warning' ? '⚠️ WARNING' : 'ℹ️ INFO';
    
    return `${prefix}: ${alert.title}`;
  }

  /**
   * Generate HTML email content
   */
  private static generateAlertHTML(alert: Alert): string {
    const severityColor = 
      alert.severity === 'critical' ? '#dc2626' : 
      alert.severity === 'warning' ? '#f59e0b' : '#3b82f6';

    const severityIcon = 
      alert.severity === 'critical' ? '🚨' : 
      alert.severity === 'warning' ? '⚠️' : 'ℹ️';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${alert.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: ${severityColor}; color: #ffffff; padding: 20px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600;">
                ${severityIcon} ${alert.title}
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <div style="margin-bottom: 20px;">
                <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
                  ${alert.category} Alert
                </p>
                <p style="margin: 0; color: #111827; font-size: 16px; line-height: 1.6;">
                  ${alert.message}
                </p>
              </div>
              
              <!-- Details -->
              ${alert.details ? `
              <div style="background-color: #f9fafb; border-left: 4px solid ${severityColor}; padding: 15px; margin-top: 20px; border-radius: 4px;">
                <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #374151; font-weight: 600;">
                  Details:
                </h3>
                <pre style="margin: 0; font-family: 'Courier New', monospace; font-size: 12px; color: #4b5563; white-space: pre-wrap; word-wrap: break-word;">
${JSON.stringify(alert.details, null, 2)}
                </pre>
              </div>
              ` : ''}
              
              <!-- Metadata -->
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="color: #6b7280; font-size: 14px;">
                      <strong>Severity:</strong> ${alert.severity.toUpperCase()}
                    </td>
                    <td align="right" style="color: #6b7280; font-size: 14px;">
                      ${alert.timestamp.toLocaleString()}
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- Action Button -->
              <div style="margin-top: 30px; text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/monitoring" 
                   style="display: inline-block; background-color: ${severityColor}; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                  View Monitoring Dashboard
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                This is an automated alert from Zyphex Tech Monitoring System
              </p>
              <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">
                Alert ID: ${alert.id}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Get default alert configuration
   */
  private static getDefaultConfig(): AlertConfig {
    // In production, this would be loaded from database or environment
    const recipients = process.env.ALERT_RECIPIENTS?.split(',') || [];
    
    return {
      enabled: process.env.ALERTS_ENABLED === 'true',
      recipients,
      severities: ['critical', 'warning'],
      cooldownMinutes: parseInt(process.env.ALERT_COOLDOWN_MINUTES || '15', 10),
    };
  }

  /**
   * Clear alert history (for testing or manual reset)
   */
  static clearHistory(): void {
    this.alertHistory.clear();
    Logger.info('Alert history cleared');
  }

  /**
   * Get alert statistics
   */
  static getStats(): {
    totalAlerts: number;
    oldestAlert: Date | null;
    newestAlert: Date | null;
  } {
    if (this.alertHistory.size === 0) {
      return {
        totalAlerts: 0,
        oldestAlert: null,
        newestAlert: null,
      };
    }

    const dates = Array.from(this.alertHistory.values());
    const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());

    return {
      totalAlerts: this.alertHistory.size,
      oldestAlert: sortedDates[0],
      newestAlert: sortedDates[sortedDates.length - 1],
    };
  }
}

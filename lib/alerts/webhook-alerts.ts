/**
 * Slack & Discord Alert Integration
 * Real-time notifications to team communication channels
 */

import { Logger } from '@/lib/logger';
import type { Alert, AlertSeverity } from './email-alerts';
import type { HealthStatus } from '@/lib/health/types';

export interface WebhookConfig {
  enabled: boolean;
  url: string;
  channel?: string;
  username?: string;
  iconEmoji?: string;
}

export class SlackAlerts {
  private static readonly DEFAULT_USERNAME = 'Zyphex Monitoring';
  private static readonly DEFAULT_ICON = ':robot_face:';

  /**
   * Send alert to Slack
   */
  static async sendAlert(alert: Alert, config: WebhookConfig): Promise<boolean> {
    if (!config.enabled || !config.url) {
      Logger.debug('Slack alerts disabled or URL not configured');
      return false;
    }

    try {
      const payload = this.formatSlackMessage(alert, config);

      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        Logger.info('Slack alert sent successfully', {
          alertId: alert.id,
          severity: alert.severity,
        });
        return true;
      } else {
        Logger.logError(
          new Error(`Slack webhook returned ${response.status}`),
          'SlackAlerts.sendAlert'
        );
        return false;
      }
    } catch (error) {
      Logger.logError(error as Error, 'Failed to send Slack alert');
      return false;
    }
  }

  /**
   * Send health status alert to Slack
   */
  static async sendHealthAlert(
    status: HealthStatus,
    serviceName: string,
    message: string,
    config: WebhookConfig
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
    };

    return await this.sendAlert(alert, config);
  }

  /**
   * Format alert as Slack message
   */
  private static formatSlackMessage(alert: Alert, config: WebhookConfig) {
    const color = this.getSeverityColor(alert.severity);
    const emoji = this.getSeverityEmoji(alert.severity);

    return {
      username: config.username || this.DEFAULT_USERNAME,
      icon_emoji: config.iconEmoji || this.DEFAULT_ICON,
      channel: config.channel,
      attachments: [
        {
          color,
          title: `${emoji} ${alert.title}`,
          text: alert.message,
          fields: [
            {
              title: 'Severity',
              value: alert.severity.toUpperCase(),
              short: true,
            },
            {
              title: 'Category',
              value: alert.category.toUpperCase(),
              short: true,
            },
            {
              title: 'Time',
              value: alert.timestamp.toLocaleString(),
              short: false,
            },
          ],
          footer: `Alert ID: ${alert.id}`,
          footer_icon: 'https://platform.slack-edge.com/img/default_application_icon.png',
          ts: Math.floor(alert.timestamp.getTime() / 1000),
        },
      ],
    };
  }

  /**
   * Get color for severity level
   */
  private static getSeverityColor(severity: AlertSeverity): string {
    switch (severity) {
      case 'critical':
        return 'danger';
      case 'warning':
        return 'warning';
      case 'info':
        return 'good';
      default:
        return '#808080';
    }
  }

  /**
   * Get emoji for severity level
   */
  private static getSeverityEmoji(severity: AlertSeverity): string {
    switch (severity) {
      case 'critical':
        return '🚨';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  }
}

export class DiscordAlerts {
  /**
   * Send alert to Discord
   */
  static async sendAlert(alert: Alert, config: WebhookConfig): Promise<boolean> {
    if (!config.enabled || !config.url) {
      Logger.debug('Discord alerts disabled or URL not configured');
      return false;
    }

    try {
      const payload = this.formatDiscordMessage(alert, config);

      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok || response.status === 204) {
        Logger.info('Discord alert sent successfully', {
          alertId: alert.id,
          severity: alert.severity,
        });
        return true;
      } else {
        Logger.logError(
          new Error(`Discord webhook returned ${response.status}`),
          'DiscordAlerts.sendAlert'
        );
        return false;
      }
    } catch (error) {
      Logger.logError(error as Error, 'Failed to send Discord alert');
      return false;
    }
  }

  /**
   * Send health status alert to Discord
   */
  static async sendHealthAlert(
    status: HealthStatus,
    serviceName: string,
    message: string,
    config: WebhookConfig
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
    };

    return await this.sendAlert(alert, config);
  }

  /**
   * Format alert as Discord message
   */
  private static formatDiscordMessage(alert: Alert, config: WebhookConfig) {
    const color = this.getSeverityColor(alert.severity);
    const emoji = this.getSeverityEmoji(alert.severity);

    return {
      username: config.username || 'Zyphex Monitoring',
      embeds: [
        {
          title: `${emoji} ${alert.title}`,
          description: alert.message,
          color,
          fields: [
            {
              name: 'Severity',
              value: alert.severity.toUpperCase(),
              inline: true,
            },
            {
              name: 'Category',
              value: alert.category.toUpperCase(),
              inline: true,
            },
            {
              name: 'Time',
              value: alert.timestamp.toLocaleString(),
              inline: false,
            },
          ],
          footer: {
            text: `Alert ID: ${alert.id}`,
          },
          timestamp: alert.timestamp.toISOString(),
        },
      ],
    };
  }

  /**
   * Get color for severity level (Discord uses decimal color codes)
   */
  private static getSeverityColor(severity: AlertSeverity): number {
    switch (severity) {
      case 'critical':
        return 0xdc2626; // Red
      case 'warning':
        return 0xf59e0b; // Orange
      case 'info':
        return 0x3b82f6; // Blue
      default:
        return 0x808080; // Gray
    }
  }

  /**
   * Get emoji for severity level
   */
  private static getSeverityEmoji(severity: AlertSeverity): string {
    switch (severity) {
      case 'critical':
        return '🚨';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  }
}

/**
 * Unified webhook alert system
 * Sends alerts to all configured channels
 */
export class WebhookAlertSystem {
  /**
   * Send alert to all configured webhooks
   */
  static async sendToAll(alert: Alert): Promise<{
    slack: boolean;
    discord: boolean;
  }> {
    const slackConfig = this.getSlackConfig();
    const discordConfig = this.getDiscordConfig();

    const [slackResult, discordResult] = await Promise.allSettled([
      SlackAlerts.sendAlert(alert, slackConfig),
      DiscordAlerts.sendAlert(alert, discordConfig),
    ]);

    return {
      slack: slackResult.status === 'fulfilled' && slackResult.value,
      discord: discordResult.status === 'fulfilled' && discordResult.value,
    };
  }

  /**
   * Send health alert to all configured webhooks
   */
  static async sendHealthAlertToAll(
    status: HealthStatus,
    serviceName: string,
    message: string
  ): Promise<{
    slack: boolean;
    discord: boolean;
  }> {
    const slackConfig = this.getSlackConfig();
    const discordConfig = this.getDiscordConfig();

    const [slackResult, discordResult] = await Promise.allSettled([
      SlackAlerts.sendHealthAlert(status, serviceName, message, slackConfig),
      DiscordAlerts.sendHealthAlert(status, serviceName, message, discordConfig),
    ]);

    return {
      slack: slackResult.status === 'fulfilled' && slackResult.value,
      discord: discordResult.status === 'fulfilled' && discordResult.value,
    };
  }

  /**
   * Get Slack configuration from environment
   */
  private static getSlackConfig(): WebhookConfig {
    return {
      enabled: process.env.SLACK_ALERTS_ENABLED === 'true',
      url: process.env.SLACK_WEBHOOK_URL || '',
      channel: process.env.SLACK_CHANNEL,
      username: process.env.SLACK_USERNAME,
      iconEmoji: process.env.SLACK_ICON_EMOJI,
    };
  }

  /**
   * Get Discord configuration from environment
   */
  private static getDiscordConfig(): WebhookConfig {
    return {
      enabled: process.env.DISCORD_ALERTS_ENABLED === 'true',
      url: process.env.DISCORD_WEBHOOK_URL || '',
      username: process.env.DISCORD_USERNAME,
    };
  }
}

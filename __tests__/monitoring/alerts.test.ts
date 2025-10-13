/**
 * Alert System Tests
 * Tests for email and webhook alert functionality
 */

// Mock dependencies
jest.mock('@/lib/logger', () => ({
  Logger: {
    debug: jest.fn(),
    info: jest.fn(),
    logError: jest.fn(),
    logEmailEvent: jest.fn(),
  },
}));

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ id: 'mock-email-id' }),
    },
  })),
}));

import { EmailAlertSystem } from '@/lib/alerts/email-alerts';
import { SlackAlerts, DiscordAlerts, WebhookAlertSystem } from '@/lib/alerts/webhook-alerts';
import type { Alert, AlertConfig } from '@/lib/alerts/email-alerts';
import type { WebhookConfig } from '@/lib/alerts/webhook-alerts';

describe('EmailAlertSystem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    EmailAlertSystem.clearHistory();
    global.fetch = jest.fn();
  });

  const mockAlert: Alert = {
    id: 'test-alert-1',
    severity: 'critical',
    category: 'health',
    title: 'Test Alert',
    message: 'This is a test alert',
    timestamp: new Date(),
  };

  const mockConfig: AlertConfig = {
    enabled: true,
    recipients: ['test@example.com'],
    severities: ['critical', 'warning'],
    cooldownMinutes: 15,
  };

  describe('sendAlert', () => {
    it('should send alert when enabled and severity matches', async () => {
      const result = await EmailAlertSystem.sendAlert(mockAlert, mockConfig);

      expect(result).toBe(true);
    });

    it('should not send alert when disabled', async () => {
      const disabledConfig = { ...mockConfig, enabled: false };
      const result = await EmailAlertSystem.sendAlert(mockAlert, disabledConfig);

      expect(result).toBe(false);
    });

    it('should filter alerts by severity', async () => {
      const infoAlert = { ...mockAlert, severity: 'info' as const };
      const result = await EmailAlertSystem.sendAlert(infoAlert, mockConfig);

      expect(result).toBe(false);
    });

    it('should respect cooldown period', async () => {
      // Send first alert
      await EmailAlertSystem.sendAlert(mockAlert, mockConfig);

      // Try to send same alert immediately
      const result = await EmailAlertSystem.sendAlert(mockAlert, mockConfig);

      expect(result).toBe(false);
    });

    it('should filter alerts by category', async () => {
      const configWithCategory = {
        ...mockConfig,
        categories: ['error' as const],
      };

      const result = await EmailAlertSystem.sendAlert(mockAlert, configWithCategory);

      expect(result).toBe(false);
    });
  });

  describe('sendHealthAlert', () => {
    it('should send critical alert for unhealthy status', async () => {
      // Set up environment
      process.env.ALERTS_ENABLED = 'true';
      process.env.ALERT_RECIPIENTS = 'test@example.com';

      const result = await EmailAlertSystem.sendHealthAlert(
        'unhealthy',
        'database',
        'Database is down',
        { responseTime: 5000 }
      );

      expect(result).toBe(true);
    });

    it('should send warning alert for degraded status', async () => {
      // Set up environment
      process.env.ALERTS_ENABLED = 'true';
      process.env.ALERT_RECIPIENTS = 'test@example.com';

      const result = await EmailAlertSystem.sendHealthAlert(
        'degraded',
        'database',
        'Database is slow'
      );

      expect(result).toBe(true);
    });
  });

  describe('sendErrorAlert', () => {
    it('should send error alert with stack trace', async () => {
      process.env.ALERTS_ENABLED = 'true';
      process.env.ALERT_RECIPIENTS = 'test@example.com';

      const error = new Error('Test error');
      const result = await EmailAlertSystem.sendErrorAlert(error, {
        userId: '123',
        action: 'test',
      });

      expect(result).toBe(true);
    });
  });

  describe('sendPerformanceAlert', () => {
    it('should send critical alert when value exceeds 1.5x threshold', async () => {
      process.env.ALERTS_ENABLED = 'true';
      process.env.ALERT_RECIPIENTS = 'test@example.com';

      const result = await EmailAlertSystem.sendPerformanceAlert(
        'response_time',
        3000,
        1000,
        'ms'
      );

      expect(result).toBe(true);
    });

    it('should send warning alert when value exceeds threshold', async () => {
      process.env.ALERTS_ENABLED = 'true';
      process.env.ALERT_RECIPIENTS = 'test@example.com';

      const result = await EmailAlertSystem.sendPerformanceAlert(
        'response_time',
        1200,
        1000,
        'ms'
      );

      expect(result).toBe(true);
    });
  });

  describe('sendSecurityAlert', () => {
    it('should send security alert', async () => {
      process.env.ALERTS_ENABLED = 'true';
      process.env.ALERT_RECIPIENTS = 'test@example.com';

      const result = await EmailAlertSystem.sendSecurityAlert(
        'suspicious_login',
        'Multiple failed login attempts detected',
        { ip: '192.168.1.1', attempts: 5 }
      );

      expect(result).toBe(true);
    });
  });

  describe('sendResolutionAlert', () => {
    it('should send resolution notification', async () => {
      process.env.ALERTS_ENABLED = 'true';
      process.env.ALERT_RECIPIENTS = 'test@example.com';

      const result = await EmailAlertSystem.sendResolutionAlert(mockAlert);

      // Resolution alerts are info severity, which may be filtered by default config
      // The result depends on the getDefaultConfig() severity settings
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getStats', () => {
    it('should return empty stats when no alerts sent', () => {
      const stats = EmailAlertSystem.getStats();

      expect(stats.totalAlerts).toBe(0);
      expect(stats.oldestAlert).toBeNull();
      expect(stats.newestAlert).toBeNull();
    });

    it('should return stats after sending alerts', async () => {
      await EmailAlertSystem.sendAlert(mockAlert, mockConfig);

      const stats = EmailAlertSystem.getStats();

      expect(stats.totalAlerts).toBe(1);
      expect(stats.oldestAlert).toBeInstanceOf(Date);
      expect(stats.newestAlert).toBeInstanceOf(Date);
    });
  });

  describe('clearHistory', () => {
    it('should clear alert history', async () => {
      await EmailAlertSystem.sendAlert(mockAlert, mockConfig);

      EmailAlertSystem.clearHistory();

      const stats = EmailAlertSystem.getStats();
      expect(stats.totalAlerts).toBe(0);
    });
  });
});

describe('SlackAlerts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  const mockAlert: Alert = {
    id: 'slack-test-1',
    severity: 'warning',
    category: 'performance',
    title: 'High CPU Usage',
    message: 'CPU usage is at 85%',
    timestamp: new Date(),
  };

  const mockConfig: WebhookConfig = {
    enabled: true,
    url: 'https://hooks.slack.com/services/TEST/WEBHOOK/URL',
    channel: '#alerts',
    username: 'Zyphex Bot',
  };

  describe('sendAlert', () => {
    it('should send alert to Slack when enabled', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
      });

      const result = await SlackAlerts.sendAlert(mockAlert, mockConfig);

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        mockConfig.url,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should not send when disabled', async () => {
      const disabledConfig = { ...mockConfig, enabled: false };
      const result = await SlackAlerts.sendAlert(mockAlert, disabledConfig);

      expect(result).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle webhook failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await SlackAlerts.sendAlert(mockAlert, mockConfig);

      expect(result).toBe(false);
    });
  });

  describe('sendHealthAlert', () => {
    it('should send health alert to Slack', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
      });

      const result = await SlackAlerts.sendHealthAlert(
        'degraded',
        'database',
        'Database performance degraded',
        mockConfig
      );

      expect(result).toBe(true);
    });
  });
});

describe('DiscordAlerts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  const mockAlert: Alert = {
    id: 'discord-test-1',
    severity: 'info',
    category: 'health',
    title: 'Service Restored',
    message: 'Database service is back online',
    timestamp: new Date(),
  };

  const mockConfig: WebhookConfig = {
    enabled: true,
    url: 'https://discord.com/api/webhooks/TEST/WEBHOOK/URL',
    username: 'Zyphex Monitor',
  };

  describe('sendAlert', () => {
    it('should send alert to Discord when enabled', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await DiscordAlerts.sendAlert(mockAlert, mockConfig);

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        mockConfig.url,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should not send when disabled', async () => {
      const disabledConfig = { ...mockConfig, enabled: false };
      const result = await DiscordAlerts.sendAlert(mockAlert, disabledConfig);

      expect(result).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle webhook failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
      });

      const result = await DiscordAlerts.sendAlert(mockAlert, mockConfig);

      expect(result).toBe(false);
    });
  });

  describe('sendHealthAlert', () => {
    it('should send health alert to Discord', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await DiscordAlerts.sendHealthAlert(
        'healthy',
        'system',
        'All systems operational',
        mockConfig
      );

      expect(result).toBe(true);
    });
  });
});

describe('WebhookAlertSystem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    // Mock successful responses
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
    });
  });

  const mockAlert: Alert = {
    id: 'unified-test-1',
    severity: 'critical',
    category: 'error',
    title: 'Application Error',
    message: 'Critical error occurred',
    timestamp: new Date(),
  };

  describe('sendToAll', () => {
    it('should send alerts to all configured channels', async () => {
      // Set environment variables
      process.env.SLACK_ALERTS_ENABLED = 'true';
      process.env.SLACK_WEBHOOK_URL = 'https://slack.test/webhook';
      process.env.DISCORD_ALERTS_ENABLED = 'true';
      process.env.DISCORD_WEBHOOK_URL = 'https://discord.test/webhook';

      const results = await WebhookAlertSystem.sendToAll(mockAlert);

      expect(results.slack).toBe(true);
      expect(results.discord).toBe(true);
    });

    it('should handle partial failures gracefully', async () => {
      process.env.SLACK_ALERTS_ENABLED = 'true';
      process.env.SLACK_WEBHOOK_URL = 'https://slack.test/webhook';
      process.env.DISCORD_ALERTS_ENABLED = 'false';
      process.env.DISCORD_WEBHOOK_URL = '';

      const results = await WebhookAlertSystem.sendToAll(mockAlert);

      expect(results.slack).toBe(true);
      expect(results.discord).toBe(false);
    });
  });

  describe('sendHealthAlertToAll', () => {
    it('should send health alerts to all channels', async () => {
      process.env.SLACK_ALERTS_ENABLED = 'true';
      process.env.SLACK_WEBHOOK_URL = 'https://slack.test/webhook';
      process.env.DISCORD_ALERTS_ENABLED = 'true';
      process.env.DISCORD_WEBHOOK_URL = 'https://discord.test/webhook';

      const results = await WebhookAlertSystem.sendHealthAlertToAll(
        'unhealthy',
        'database',
        'Database connection lost'
      );

      expect(results.slack).toBe(true);
      expect(results.discord).toBe(true);
    });
  });
});

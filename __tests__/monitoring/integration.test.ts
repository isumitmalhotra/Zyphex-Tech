// Integration Tests for Complete Monitoring System// Integration Tests for Complete Monitoring System

// Tests end-to-end flow from health checks → alerts → dashboard// Tests end-to-end flow from health checks → alerts → dashboard



import { DatabaseHealthChecker } from '@/lib/health/database';import { DatabaseHealthChecker } from '@/lib/health/database';

import { ExternalServicesHealthChecker } from '@/lib/health/external-services';import { ExternalServicesHealthChecker } from '@/lib/health/external-services';

import { SystemResourceMonitor } from '@/lib/health/system-resources';import { SystemResourceMonitor } from '@/lib/health/system-resources';

import { EmailAlertSystem } from '@/lib/alerts/email-alerts';import { EmailAlertSystem } from '@/lib/alerts/email-alerts';

import { WebhookAlertSystem } from '@/lib/alerts/webhook-alerts';import { WebhookAlertSystem } from '@/lib/alerts/webhook-alerts';

import { Logger } from '@/lib/logger';import { Logger } from '@/lib/logger';



// Mock dependencies// Mock dependencies

jest.mock('@/lib/logger');jest.mock('@/lib/logger');

jest.mock('resend');jest.mock('resend');

jest.mock('@prisma/client', () => ({jest.mock('@prisma/client', () => ({

  PrismaClient: jest.fn().mockImplementation(() => ({  PrismaClient: jest.fn().mockImplementation(() => ({

    $queryRaw: jest.fn().mockResolvedValue([{ now: new Date() }]),    $queryRaw: jest.fn().mockResolvedValue([{ now: new Date() }]),

    $disconnect: jest.fn().mockResolvedValue(undefined),    $disconnect: jest.fn().mockResolvedValue(undefined),

  })),  })),

}));}));



describe('Monitoring System Integration Tests', () => {describe('Monitoring System Integration Tests', () => {

  beforeEach(() => {  beforeEach(() => {

    jest.clearAllMocks();    jest.clearAllMocks();

    EmailAlertSystem.clearHistory();    EmailAlertSystem.clearHistory();

        

    // Set up environment for alerts    // Set up environment for alerts

    process.env.ALERTS_ENABLED = 'true';    process.env.ALERTS_ENABLED = 'true';

    process.env.ALERT_RECIPIENTS = 'test@example.com';    process.env.ALERT_RECIPIENTS = 'test@example.com';

    process.env.SLACK_ALERTS_ENABLED = 'false';    process.env.SLACK_ALERTS_ENABLED = 'false';

    process.env.DISCORD_ALERTS_ENABLED = 'false';    process.env.DISCORD_ALERTS_ENABLED = 'false';

  });  });



  describe('End-to-End Health Check → Alert Flow', () => {  describe('End-to-End Health Check → Alert Flow', () => {

    it('should detect unhealthy service and send email alert', async () => {    it('should detect unhealthy service and send email alert', async () => {

      // Arrange: Set up unhealthy database      // Arrange: Set up unhealthy database

      jest.spyOn(DatabaseHealthChecker, 'checkHealth').mockResolvedValue({      const mockError = new Error('Connection failed');

        status: 'unhealthy',      jest.spyOn(DatabaseHealthChecker, 'checkHealth').mockResolvedValue({

        message: 'Database connection failed',        status: 'unhealthy',

        details: { error: 'Connection timeout' },        message: 'Database connection failed',

        responseTime: 5000,        details: { error: 'Connection timeout' },

        timestamp: new Date(),        responseTime: 5000,

      });        timestamp: new Date(),

      });

      // Mock Resend

      const mockResend = require('resend');      // Mock Resend

      mockResend.Resend.mockImplementation(() => ({      const mockResend = require('resend');

        emails: {      mockResend.Resend.mockImplementation(() => ({

          send: jest.fn().mockResolvedValue({ id: 'test-email-id' }),        emails: {

        },          send: jest.fn().mockResolvedValue({ id: 'test-email-id' }),

      }));        },

      }));

      // Act: Check health

      const health = await DatabaseHealthChecker.checkHealth();      // Act: Check health

            const health = await DatabaseHealthChecker.checkHealth();

      // Act: Send alert based on health      

      const alertSent = await EmailAlertSystem.sendHealthAlert(      // Act: Send alert based on health

        health.status,      const alertSent = await EmailAlertSystem.sendHealthAlert(

        'database',        health.status,

        health.message,        'database',

        health.details        health.message,

      );        health.details

      );

      // Assert: Alert should be sent

      expect(alertSent).toBe(true);      // Assert: Alert should be sent

      expect(health.status).toBe('unhealthy');      expect(alertSent).toBe(true);

      expect(mockResend.Resend().emails.send).toHaveBeenCalled();      expect(health.status).toBe('unhealthy');

    });      expect(mockResend.Resend().emails.send).toHaveBeenCalled();

    });

    it('should monitor all services and send alerts for failures', async () => {

      // Arrange: Mock mixed health statuses    it('should monitor all services and send alerts for failures', async () => {

      jest.spyOn(DatabaseHealthChecker, 'checkHealth').mockResolvedValue({      // Arrange: Mock mixed health statuses

        status: 'healthy',      jest.spyOn(DatabaseHealthChecker, 'checkHealth').mockResolvedValue({

        message: 'Database operational',        status: 'healthy',

        responseTime: 50,        message: 'Database operational',

        timestamp: new Date(),        responseTime: 50,

      });        timestamp: new Date(),

      });

      jest.spyOn(ExternalServicesHealthChecker, 'checkAuth').mockResolvedValue({

        status: 'degraded',      jest.spyOn(ExternalServicesChecker, 'checkAuth').mockResolvedValue({

        message: 'Auth service slow',        status: 'degraded',

        responseTime: 2000,        message: 'Auth service slow',

        timestamp: new Date(),        responseTime: 2000,

      });        timestamp: new Date(),

      });

      // Mock Resend

      const mockResend = require('resend');      // Mock Resend

      mockResend.Resend.mockImplementation(() => ({      const mockResend = require('resend');

        emails: {      mockResend.Resend.mockImplementation(() => ({

          send: jest.fn().mockResolvedValue({ id: 'test-email-id' }),        emails: {

        },          send: jest.fn().mockResolvedValue({ id: 'test-email-id' }),

      }));        },

      }));

      // Act: Check all services

      const dbHealth = await DatabaseHealthChecker.checkHealth();      // Act: Check all services

      const authHealth = await ExternalServicesHealthChecker.checkAuth();      const dbHealth = await DatabaseHealthChecker.checkHealth();

      const authHealth = await ExternalServicesChecker.checkAuth();

      // Act: Send alerts for degraded services

      const alerts = await Promise.all([      // Act: Send alerts for degraded services

        dbHealth.status !== 'healthy'      const alerts = await Promise.all([

          ? EmailAlertSystem.sendHealthAlert(dbHealth.status, 'database', dbHealth.message)        dbHealth.status !== 'healthy'

          : Promise.resolve(false),          ? EmailAlertSystem.sendHealthAlert(dbHealth.status, 'database', dbHealth.message)

        authHealth.status !== 'healthy'          : Promise.resolve(false),

          ? EmailAlertSystem.sendHealthAlert(authHealth.status, 'auth', authHealth.message)        authHealth.status !== 'healthy'

          : Promise.resolve(false),          ? EmailAlertSystem.sendHealthAlert(authHealth.status, 'auth', authHealth.message)

      ]);          : Promise.resolve(false),

      ]);

      // Assert: Only degraded service should trigger alert

      expect(alerts[0]).toBe(false); // Database is healthy      // Assert: Only degraded service should trigger alert

      expect(alerts[1]).toBe(true); // Auth is degraded      expect(alerts[0]).toBe(false); // Database is healthy

    });      expect(alerts[1]).toBe(true); // Auth is degraded

  });    });

  });

  describe('System Resource Monitoring → Performance Alerts', () => {

    it('should detect high memory usage and send performance alert', async () => {  describe('System Resource Monitoring → Performance Alerts', () => {

      // Arrange: Mock high memory usage    it('should detect high memory usage and send performance alert', async () => {

      jest.spyOn(SystemResourceMonitor, 'collectMetrics').mockResolvedValue({      // Arrange: Mock high memory usage

        memory: {      jest.spyOn(SystemResourceMonitor, 'collectMetrics').mockResolvedValue({

          total: '16.00 GB',        memory: {

          free: '1.00 GB',          total: 16000000000, // 16 GB

          used: '15.00 GB',          free: 1000000000, // 1 GB

          usagePercent: 93.75,          used: 15000000000, // 15 GB

          process: {          usagePercent: 93.75, // 93.75%

            heapUsed: '100 MB',        },

            heapTotal: '200 MB',        cpu: {

            external: '10 MB',          loadAverage: [2.5, 2.0, 1.8],

            rss: '150 MB',          cores: 8,

          },        },

        },        uptime: 86400,

        cpu: {        timestamp: new Date(),

          cores: 8,      });

          model: 'Test CPU',

          speed: 2400,      // Mock Resend

          usage: 45.5,      const mockResend = require('resend');

          loadAverage: {      mockResend.Resend.mockImplementation(() => ({

            '1min': 2.5,        emails: {

            '5min': 2.0,          send: jest.fn().mockResolvedValue({ id: 'test-email-id' }),

            '15min': 1.8,        },

          },      }));

        },

        uptime: 86400,      // Act: Collect metrics

        nodeVersion: 'v18.0.0',      const metrics = await SystemResourceMonitor.collectMetrics();

        platform: 'linux',

        arch: 'x64',      // Act: Send alert if memory is high

        processId: 1234,      let alertSent = false;

      });      if (metrics.memory.usagePercent > 90) {

        alertSent = await EmailAlertSystem.sendPerformanceAlert(

      // Mock Resend          'memory_usage',

      const mockResend = require('resend');          metrics.memory.usagePercent,

      mockResend.Resend.mockImplementation(() => ({          80,

        emails: {          '%'

          send: jest.fn().mockResolvedValue({ id: 'test-email-id' }),        );

        },      }

      }));

      // Assert

      // Act: Collect metrics      expect(metrics.memory.usagePercent).toBeGreaterThan(90);

      const metrics = await SystemResourceMonitor.collectMetrics();      expect(alertSent).toBe(true);

    });

      // Act: Send alert if memory is high

      let alertSent = false;    it('should detect high CPU load and send critical alert', async () => {

      if (metrics.memory.usagePercent > 90) {      // Arrange: Mock high CPU load

        alertSent = await EmailAlertSystem.sendPerformanceAlert(      jest.spyOn(SystemResourceMonitor, 'collectMetrics').mockResolvedValue({

          'memory_usage',        memory: {

          metrics.memory.usagePercent,          total: 16000000000,

          80,          free: 8000000000,

          '%'          used: 8000000000,

        );          usagePercent: 50,

      }        },

        cpu: {

      // Assert          loadAverage: [8.5, 7.2, 6.8], // Very high for 8 cores

      expect(metrics.memory.usagePercent).toBeGreaterThan(90);          cores: 8,

      expect(alertSent).toBe(true);        },

    });        uptime: 86400,

        timestamp: new Date(),

    it('should detect high CPU load and send critical alert', async () => {      });

      // Arrange: Mock high CPU load

      jest.spyOn(SystemResourceMonitor, 'collectMetrics').mockResolvedValue({      // Mock Resend

        memory: {      const mockResend = require('resend');

          total: '16.00 GB',      mockResend.Resend.mockImplementation(() => ({

          free: '8.00 GB',        emails: {

          used: '8.00 GB',          send: jest.fn().mockResolvedValue({ id: 'test-email-id' }),

          usagePercent: 50,        },

          process: {      }));

            heapUsed: '100 MB',

            heapTotal: '200 MB',      // Act: Collect metrics

            external: '10 MB',      const metrics = await SystemResourceMonitor.collectMetrics();

            rss: '150 MB',

          },      // Calculate CPU usage percentage (load / cores)

        },      const cpuUsagePercent = (metrics.cpu.loadAverage[0] / metrics.cpu.cores) * 100;

        cpu: {

          cores: 8,      // Act: Send alert if CPU is high

          model: 'Test CPU',      let alertSent = false;

          speed: 2400,      if (cpuUsagePercent > 100) {

          usage: 106.25,        alertSent = await EmailAlertSystem.sendPerformanceAlert(

          loadAverage: {          'cpu_load',

            '1min': 8.5,          cpuUsagePercent,

            '5min': 7.2,          80,

            '15min': 6.8,          '%'

          },        );

        },      }

        uptime: 86400,

        nodeVersion: 'v18.0.0',      // Assert

        platform: 'linux',      expect(cpuUsagePercent).toBeGreaterThan(100);

        arch: 'x64',      expect(alertSent).toBe(true);

        processId: 1234,    });

      });  });



      // Mock Resend  describe('Multi-Channel Alert Delivery', () => {

      const mockResend = require('resend');    it('should send alerts to all configured channels', async () => {

      mockResend.Resend.mockImplementation(() => ({      // Arrange: Enable all channels

        emails: {      process.env.ALERTS_ENABLED = 'true';

          send: jest.fn().mockResolvedValue({ id: 'test-email-id' }),      process.env.ALERT_RECIPIENTS = 'test@example.com';

        },      process.env.SLACK_ALERTS_ENABLED = 'true';

      }));      process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';

      process.env.DISCORD_ALERTS_ENABLED = 'true';

      // Act: Collect metrics      process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/test';

      const metrics = await SystemResourceMonitor.collectMetrics();

      // Mock Resend

      // Calculate CPU usage percentage (load / cores)      const mockResend = require('resend');

      const cpuUsagePercent = (metrics.cpu.loadAverage['1min'] / metrics.cpu.cores) * 100;      mockResend.Resend.mockImplementation(() => ({

        emails: {

      // Act: Send alert if CPU is high          send: jest.fn().mockResolvedValue({ id: 'test-email-id' }),

      let alertSent = false;        },

      if (cpuUsagePercent > 100) {      }));

        alertSent = await EmailAlertSystem.sendPerformanceAlert(

          'cpu_load',      // Mock fetch for webhooks

          cpuUsagePercent,      global.fetch = jest.fn().mockResolvedValue({

          80,        ok: true,

          '%'        json: async () => ({}),

        );      });

      }

      // Act: Send alert to all channels

      // Assert      const alert = {

      expect(cpuUsagePercent).toBeGreaterThan(100);        id: 'test-alert-1',

      expect(alertSent).toBe(true);        severity: 'critical' as const,

    });        category: 'health' as const,

  });        title: 'Service Down',

        message: 'Critical service is down',

  describe('Multi-Channel Alert Delivery', () => {        timestamp: new Date(),

    it('should send alerts to all configured channels', async () => {      };

      // Arrange: Enable all channels

      process.env.ALERTS_ENABLED = 'true';      const [emailResult, webhookResults] = await Promise.all([

      process.env.ALERT_RECIPIENTS = 'test@example.com';        EmailAlertSystem.sendAlert(alert),

      process.env.SLACK_ALERTS_ENABLED = 'true';        WebhookAlertSystem.sendToAll(alert),

      process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';      ]);

      process.env.DISCORD_ALERTS_ENABLED = 'true';

      process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/test';      // Assert

      expect(emailResult).toBe(true);

      // Mock Resend      expect(webhookResults.slack).toBe(true);

      const mockResend = require('resend');      expect(webhookResults.discord).toBe(true);

      mockResend.Resend.mockImplementation(() => ({      expect(global.fetch).toHaveBeenCalledTimes(2); // Slack + Discord

        emails: {    });

          send: jest.fn().mockResolvedValue({ id: 'test-email-id' }),

        },    it('should handle partial webhook failures gracefully', async () => {

      }));      // Arrange: Enable webhooks

      process.env.SLACK_ALERTS_ENABLED = 'true';

      // Mock fetch for webhooks      process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';

      global.fetch = jest.fn().mockResolvedValue({      process.env.DISCORD_ALERTS_ENABLED = 'true';

        ok: true,      process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/test';

        json: async () => ({}),

      });      // Mock fetch: Slack fails, Discord succeeds

      let callCount = 0;

      // Act: Send alert to all channels      global.fetch = jest.fn().mockImplementation(() => {

      const alert = {        callCount++;

        id: 'test-alert-1',        if (callCount === 1) {

        severity: 'critical' as const,          // Slack fails

        category: 'health' as const,          return Promise.resolve({ ok: false, status: 500 });

        title: 'Service Down',        } else {

        message: 'Critical service is down',          // Discord succeeds

        timestamp: new Date(),          return Promise.resolve({ ok: true, json: async () => ({}) });

      };        }

      });

      const config = {

        enabled: true,      // Act: Send alert

        recipients: ['test@example.com'],      const alert = {

        severities: ['critical' as const],        id: 'test-alert-2',

        categories: ['health' as const],        severity: 'warning' as const,

        cooldownMinutes: 15,        category: 'performance' as const,

      };        title: 'High Memory',

        message: 'Memory usage at 85%',

      const [emailResult, webhookResults] = await Promise.all([        timestamp: new Date(),

        EmailAlertSystem.sendAlert(alert, config),      };

        WebhookAlertSystem.sendToAll(alert),

      ]);      const results = await WebhookAlertSystem.sendToAll(alert);



      // Assert      // Assert: Discord should succeed even though Slack failed

      expect(emailResult).toBe(true);      expect(results.slack).toBe(false);

      expect(webhookResults.slack).toBe(true);      expect(results.discord).toBe(true);

      expect(webhookResults.discord).toBe(true);    });

      expect(global.fetch).toHaveBeenCalledTimes(2); // Slack + Discord  });

    });

  describe('Alert Cooldown & Deduplication', () => {

    it('should handle partial webhook failures gracefully', async () => {    it('should not send duplicate alerts within cooldown period', async () => {

      // Arrange: Enable webhooks      // Mock Resend

      process.env.SLACK_ALERTS_ENABLED = 'true';      const mockResend = require('resend');

      process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';      const mockSend = jest.fn().mockResolvedValue({ id: 'test-email-id' });

      process.env.DISCORD_ALERTS_ENABLED = 'true';      mockResend.Resend.mockImplementation(() => ({

      process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/test';        emails: { send: mockSend },

      }));

      // Mock fetch: Slack fails, Discord succeeds

      let callCount = 0;      // Act: Send same alert twice

      global.fetch = jest.fn().mockImplementation(() => {      const alert = {

        callCount++;        id: 'duplicate-test',

        if (callCount === 1) {        severity: 'warning' as const,

          // Slack fails        category: 'health' as const,

          return Promise.resolve({ ok: false, status: 500 });        title: 'Test Alert',

        } else {        message: 'Testing cooldown',

          // Discord succeeds        timestamp: new Date(),

          return Promise.resolve({ ok: true, json: async () => ({}) });      };

        }

      });      const firstSend = await EmailAlertSystem.sendAlert(alert);

      const secondSend = await EmailAlertSystem.sendAlert(alert); // Should be blocked

      // Act: Send alert

      const alert = {      // Assert: First should succeed, second should be blocked

        id: 'test-alert-2',      expect(firstSend).toBe(true);

        severity: 'warning' as const,      expect(secondSend).toBe(false);

        category: 'performance' as const,      expect(mockSend).toHaveBeenCalledTimes(1); // Only called once

        title: 'High Memory',    });

        message: 'Memory usage at 85%',

        timestamp: new Date(),    it('should allow alerts after cooldown period expires', async () => {

      };      // Mock Resend

      const mockResend = require('resend');

      const results = await WebhookAlertSystem.sendToAll(alert);      const mockSend = jest.fn().mockResolvedValue({ id: 'test-email-id' });

      mockResend.Resend.mockImplementation(() => ({

      // Assert: Discord should succeed even though Slack failed        emails: { send: mockSend },

      expect(results.slack).toBe(false);      }));

      expect(results.discord).toBe(true);

    });      // Act: Send alert with 0 minute cooldown

  });      const alert = {

        id: 'cooldown-test',

  describe('Alert Cooldown & Deduplication', () => {        severity: 'info' as const,

    it('should not send duplicate alerts within cooldown period', async () => {        category: 'health' as const,

      // Mock Resend        title: 'Test Alert',

      const mockResend = require('resend');        message: 'Testing cooldown expiry',

      const mockSend = jest.fn().mockResolvedValue({ id: 'test-email-id' });        timestamp: new Date(),

      mockResend.Resend.mockImplementation(() => ({      };

        emails: { send: mockSend },

      }));      const config = {

        enabled: true,

      // Act: Send same alert twice        recipients: ['test@example.com'],

      const alert = {        severities: ['info' as const],

        id: 'duplicate-test',        categories: ['health' as const],

        severity: 'warning' as const,        cooldownMinutes: 0, // No cooldown

        category: 'health' as const,      };

        title: 'Test Alert',

        message: 'Testing cooldown',      const firstSend = await EmailAlertSystem.sendAlert(alert, config);

        timestamp: new Date(),      const secondSend = await EmailAlertSystem.sendAlert(alert, config);

      };

      // Assert: Both should succeed with 0 cooldown

      const config = {      expect(firstSend).toBe(true);

        enabled: true,      expect(secondSend).toBe(true);

        recipients: ['test@example.com'],      expect(mockSend).toHaveBeenCalledTimes(2);

        severities: ['warning' as const],    });

        categories: ['health' as const],  });

        cooldownMinutes: 15,

      };  describe('Health Check API Integration', () => {

    it('should return comprehensive health report', async () => {

      const firstSend = await EmailAlertSystem.sendAlert(alert, config);      // Arrange: Mock all health checkers

      const secondSend = await EmailAlertSystem.sendAlert(alert, config); // Should be blocked      jest.spyOn(DatabaseHealthChecker, 'checkHealth').mockResolvedValue({

        status: 'healthy',

      // Assert: First should succeed, second should be blocked        message: 'Database operational',

      expect(firstSend).toBe(true);        responseTime: 25,

      expect(secondSend).toBe(false);        timestamp: new Date(),

      expect(mockSend).toHaveBeenCalledTimes(1); // Only called once      });

    });

      jest.spyOn(ExternalServicesChecker, 'checkAuth').mockResolvedValue({

    it('should allow alerts after cooldown period expires', async () => {        status: 'healthy',

      // Mock Resend        message: 'Auth service operational',

      const mockResend = require('resend');        responseTime: 150,

      const mockSend = jest.fn().mockResolvedValue({ id: 'test-email-id' });        timestamp: new Date(),

      mockResend.Resend.mockImplementation(() => ({      });

        emails: { send: mockSend },

      }));      jest.spyOn(SystemResourceMonitor, 'collectMetrics').mockResolvedValue({

        memory: {

      // Act: Send alert with 0 minute cooldown          total: 16000000000,

      const alert = {          free: 8000000000,

        id: 'cooldown-test',          used: 8000000000,

        severity: 'info' as const,          usagePercent: 50,

        category: 'health' as const,        },

        title: 'Test Alert',        cpu: {

        message: 'Testing cooldown expiry',          loadAverage: [1.5, 1.2, 1.0],

        timestamp: new Date(),          cores: 8,

      };        },

        uptime: 86400,

      const config = {        timestamp: new Date(),

        enabled: true,      });

        recipients: ['test@example.com'],

        severities: ['info' as const],      // Act: Collect all health data (simulate /api/health endpoint)

        categories: ['health' as const],      const [database, auth, resources] = await Promise.all([

        cooldownMinutes: 0, // No cooldown        DatabaseHealthChecker.checkHealth(),

      };        ExternalServicesChecker.checkAuth(),

        SystemResourceMonitor.collectMetrics(),

      const firstSend = await EmailAlertSystem.sendAlert(alert, config);      ]);

      const secondSend = await EmailAlertSystem.sendAlert(alert, config);

      // Determine overall status

      // Assert: Both should succeed with 0 cooldown      const statuses = [database.status, auth.status];

      expect(firstSend).toBe(true);      const overallStatus = statuses.includes('unhealthy')

      expect(secondSend).toBe(true);        ? 'unhealthy'

      expect(mockSend).toHaveBeenCalledTimes(2);        : statuses.includes('degraded')

    });        ? 'degraded'

  });        : 'healthy';



  describe('Health Check API Integration', () => {      // Assert

    it('should return comprehensive health report', async () => {      expect(overallStatus).toBe('healthy');

      // Arrange: Mock all health checkers      expect(database.status).toBe('healthy');

      jest.spyOn(DatabaseHealthChecker, 'checkHealth').mockResolvedValue({      expect(auth.status).toBe('healthy');

        status: 'healthy',      expect(resources.memory.usagePercent).toBeLessThan(80);

        message: 'Database operational',    });

        responseTime: 25,

        timestamp: new Date(),    it('should reflect overall unhealthy status when any service fails', async () => {

      });      // Arrange: Database healthy, Auth unhealthy

      jest.spyOn(DatabaseHealthChecker, 'checkHealth').mockResolvedValue({

      jest.spyOn(ExternalServicesHealthChecker, 'checkAuth').mockResolvedValue({        status: 'healthy',

        status: 'healthy',        message: 'Database operational',

        message: 'Auth service operational',        responseTime: 25,

        responseTime: 150,        timestamp: new Date(),

        timestamp: new Date(),      });

      });

      jest.spyOn(ExternalServicesChecker, 'checkAuth').mockResolvedValue({

      jest.spyOn(SystemResourceMonitor, 'collectMetrics').mockResolvedValue({        status: 'unhealthy',

        memory: {        message: 'Auth service unavailable',

          total: '16.00 GB',        responseTime: 5000,

          free: '8.00 GB',        timestamp: new Date(),

          used: '8.00 GB',      });

          usagePercent: 50,

          process: {      // Act: Collect all health data

            heapUsed: '100 MB',      const [database, auth] = await Promise.all([

            heapTotal: '200 MB',        DatabaseHealthChecker.checkHealth(),

            external: '10 MB',        ExternalServicesChecker.checkAuth(),

            rss: '150 MB',      ]);

          },

        },      const statuses = [database.status, auth.status];

        cpu: {      const overallStatus = statuses.includes('unhealthy')

          cores: 8,        ? 'unhealthy'

          model: 'Test CPU',        : statuses.includes('degraded')

          speed: 2400,        ? 'degraded'

          usage: 45.5,        : 'healthy';

          loadAverage: {

            '1min': 1.5,      // Assert

            '5min': 1.2,      expect(overallStatus).toBe('unhealthy');

            '15min': 1.0,      expect(auth.status).toBe('unhealthy');

          },    });

        },  });

        uptime: 86400,

        nodeVersion: 'v18.0.0',  describe('Error Tracking Integration', () => {

        platform: 'linux',    it('should log errors and send alerts', async () => {

        arch: 'x64',      // Mock Resend

        processId: 1234,      const mockResend = require('resend');

      });      mockResend.Resend.mockImplementation(() => ({

        emails: {

      // Act: Collect all health data (simulate /api/health endpoint)          send: jest.fn().mockResolvedValue({ id: 'test-email-id' }),

      const [database, auth, resources] = await Promise.all([        },

        DatabaseHealthChecker.checkHealth(),      }));

        ExternalServicesHealthChecker.checkAuth(),

        SystemResourceMonitor.collectMetrics(),      // Act: Send error alert

      ]);      const error = new Error('Test error for integration');

      error.stack = 'Error: Test error\n  at test.ts:123:45';

      // Determine overall status

      const statuses = [database.status, auth.status];      const alertSent = await EmailAlertSystem.sendErrorAlert(error, {

      const overallStatus = statuses.includes('unhealthy')        component: 'IntegrationTest',

        ? 'unhealthy'        action: 'testError',

        : statuses.includes('degraded')      });

        ? 'degraded'

        : 'healthy';      // Assert

      expect(alertSent).toBe(true);

      // Assert      expect(Logger.error).toHaveBeenCalledWith(

      expect(overallStatus).toBe('healthy');        'Email alert sent',

      expect(database.status).toBe('healthy');        expect.objectContaining({

      expect(auth.status).toBe('healthy');          alertId: expect.any(String),

      expect(resources.memory.usagePercent).toBeLessThan(80);          severity: 'critical',

    });        })

      );

    it('should reflect overall unhealthy status when any service fails', async () => {    });

      // Arrange: Database healthy, Auth unhealthy  });

      jest.spyOn(DatabaseHealthChecker, 'checkHealth').mockResolvedValue({

        status: 'healthy',  describe('Alert Statistics & Monitoring', () => {

        message: 'Database operational',    it('should track alert statistics', async () => {

        responseTime: 25,      // Mock Resend

        timestamp: new Date(),      const mockResend = require('resend');

      });      mockResend.Resend.mockImplementation(() => ({

        emails: {

      jest.spyOn(ExternalServicesHealthChecker, 'checkAuth').mockResolvedValue({          send: jest.fn().mockResolvedValue({ id: 'test-email-id' }),

        status: 'unhealthy',        },

        message: 'Auth service unavailable',      }));

        responseTime: 5000,

        timestamp: new Date(),      // Act: Send multiple alerts

      });      await EmailAlertSystem.sendAlert({

        id: 'stats-test-1',

      // Act: Collect all health data        severity: 'critical',

      const [database, auth] = await Promise.all([        category: 'health',

        DatabaseHealthChecker.checkHealth(),        title: 'Alert 1',

        ExternalServicesHealthChecker.checkAuth(),        message: 'Test alert 1',

      ]);        timestamp: new Date(),

      });

      const statuses = [database.status, auth.status];

      const overallStatus = statuses.includes('unhealthy')      await EmailAlertSystem.sendAlert({

        ? 'unhealthy'        id: 'stats-test-2',

        : statuses.includes('degraded')        severity: 'warning',

        ? 'degraded'        category: 'performance',

        : 'healthy';        title: 'Alert 2',

        message: 'Test alert 2',

      // Assert        timestamp: new Date(),

      expect(overallStatus).toBe('unhealthy');      });

      expect(auth.status).toBe('unhealthy');

    });      // Act: Get statistics

  });      const stats = EmailAlertSystem.getStats();



  describe('Error Tracking Integration', () => {      // Assert

    it('should log errors and send alerts', async () => {      expect(stats.total).toBeGreaterThanOrEqual(2);

      // Mock Resend      expect(stats.oldestAlert).toBeDefined();

      const mockResend = require('resend');      expect(stats.newestAlert).toBeDefined();

      mockResend.Resend.mockImplementation(() => ({    });

        emails: {  });

          send: jest.fn().mockResolvedValue({ id: 'test-email-id' }),});

        },
      }));

      // Act: Send error alert
      const error = new Error('Test error for integration');
      error.stack = 'Error: Test error\n  at test.ts:123:45';

      const alertSent = await EmailAlertSystem.sendErrorAlert(error, {
        component: 'IntegrationTest',
        action: 'testError',
      });

      // Assert
      expect(alertSent).toBe(true);
      expect(Logger.error).toHaveBeenCalledWith(
        'Email alert sent',
        expect.objectContaining({
          alertId: expect.any(String),
          severity: 'critical',
        })
      );
    });
  });

  describe('Alert Statistics & Monitoring', () => {
    it('should track alert statistics', async () => {
      // Mock Resend
      const mockResend = require('resend');
      mockResend.Resend.mockImplementation(() => ({
        emails: {
          send: jest.fn().mockResolvedValue({ id: 'test-email-id' }),
        },
      }));

      const config = {
        enabled: true,
        recipients: ['test@example.com'],
        severities: ['critical' as const, 'warning' as const],
        categories: ['health' as const, 'performance' as const],
        cooldownMinutes: 0,
      };

      // Act: Send multiple alerts
      await EmailAlertSystem.sendAlert({
        id: 'stats-test-1',
        severity: 'critical',
        category: 'health',
        title: 'Alert 1',
        message: 'Test alert 1',
        timestamp: new Date(),
      }, config);

      await EmailAlertSystem.sendAlert({
        id: 'stats-test-2',
        severity: 'warning',
        category: 'performance',
        title: 'Alert 2',
        message: 'Test alert 2',
        timestamp: new Date(),
      }, config);

      // Act: Get statistics
      const stats = EmailAlertSystem.getStats();

      // Assert
      expect(stats.totalAlerts).toBeGreaterThanOrEqual(2);
      expect(stats.oldestAlert).toBeDefined();
      expect(stats.newestAlert).toBeDefined();
    });
  });
});

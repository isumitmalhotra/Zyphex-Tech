// Proactive Client Notification System
// Handles automated notifications for error events, resolutions, and system status

import { ErrorMetric, ClientNotificationPreference } from './error-analytics';
import { errorAnalytics } from './error-analytics';

export interface NotificationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: {
    errorType?: string[];
    severity: ('low' | 'medium' | 'high' | 'critical')[];
    route?: string[];
    impactThreshold: number; // minimum users impacted
    timeWindow: number; // minutes
    frequency: number; // max notifications per time window
  };
  actions: {
    notifyClients: boolean;
    notifyAdmins: boolean;
    escalateToSupport: boolean;
    createTicket: boolean;
  };
  template: {
    subject: string;
    body: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
  };
}

export interface NotificationHistory {
  id: string;
  timestamp: Date;
  clientId?: string;
  type: 'error_occurred' | 'error_resolved' | 'maintenance_scheduled' | 'performance_impact';
  method: 'email' | 'sms' | 'inApp' | 'webhook';
  status: 'pending' | 'sent' | 'failed' | 'bounced';
  errorId?: string;
  content: {
    subject: string;
    body: string;
  };
  metadata: {
    retryCount: number;
    lastAttempt?: Date;
    failureReason?: string;
  };
}

export interface SystemStatusUpdate {
  id: string;
  timestamp: Date;
  status: 'operational' | 'degraded' | 'partial_outage' | 'major_outage';
  component: string;
  description: string;
  estimatedResolution?: Date;
  affectedServices: string[];
}

export class NotificationEngine {
  private static instance: NotificationEngine;
  private rules: NotificationRule[] = [];
  private history: NotificationHistory[] = [];
  private clientPreferences: Map<string, ClientNotificationPreference> = new Map();
  private statusUpdates: SystemStatusUpdate[] = [];
  private emailQueue: NotificationHistory[] = [];
  private isProcessingQueue = false;

  public static getInstance(): NotificationEngine {
    if (!NotificationEngine.instance) {
      NotificationEngine.instance = new NotificationEngine();
      NotificationEngine.instance.initialize();
    }
    return NotificationEngine.instance;
  }

  private initialize(): void {
    // Subscribe to error analytics events
    errorAnalytics.subscribe((metric) => {
      this.processErrorEvent(metric);
    });

    // Initialize default notification rules
    this.setupDefaultRules();

    // Start background processing
    this.startQueueProcessor();
  }

  // Process new error events for notification triggers
  private async processErrorEvent(metric: ErrorMetric): Promise<void> {
    const applicableRules = this.rules.filter(rule => 
      rule.enabled && this.doesErrorMatchRule(metric, rule)
    );

    for (const rule of applicableRules) {
      await this.executeNotificationRule(rule, metric);
    }

    // Check for system status changes
    await this.updateSystemStatus(metric);
  }

  // Check if error matches notification rule conditions
  private doesErrorMatchRule(metric: ErrorMetric, rule: NotificationRule): boolean {
    const { conditions } = rule;

    // Check severity
    if (!conditions.severity.includes(metric.severity)) {
      return false;
    }

    // Check error type
    if (conditions.errorType && !conditions.errorType.includes(metric.errorType)) {
      return false;
    }

    // Check route
    if (conditions.route && !conditions.route.some(route => metric.route.includes(route))) {
      return false;
    }

    // Check impact threshold
    if (metric.impactedUsers < conditions.impactThreshold) {
      return false;
    }

    // Check frequency limits
    if (!this.isWithinFrequencyLimit(rule, metric)) {
      return false;
    }

    return true;
  }

  // Execute notification rule actions
  private async executeNotificationRule(rule: NotificationRule, metric: ErrorMetric): Promise<void> {
    const { actions, template } = rule;

    if (actions.notifyClients) {
      await this.notifyAffectedClients(metric, template);
    }

    if (actions.notifyAdmins) {
      await this.notifyAdmins(metric, template);
    }

    if (actions.escalateToSupport) {
      await this.escalateToSupport(metric, template);
    }

    if (actions.createTicket) {
      await this.createSupportTicket(metric, template);
    }
  }

  // Notify clients affected by error
  private async notifyAffectedClients(
    metric: ErrorMetric, 
    template: NotificationRule['template']
  ): Promise<void> {
    // Get clients who might be affected by this error
    const affectedClients = await this.getAffectedClients(metric);
    
    for (const client of affectedClients) {
      const preferences = this.clientPreferences.get(client.id);
      if (!preferences || !preferences.notificationTypes.errorOccurred) {
        continue;
      }

      // Check severity threshold
      if (!this.meetsSeverityThreshold(metric.severity, preferences.severityThreshold)) {
        continue;
      }

      // Check quiet hours
      if (this.isInQuietHours(preferences)) {
        continue;
      }

      const notification = this.createNotification({
        clientId: client.id,
        type: 'error_occurred',
        errorId: metric.id,
        template: {
          subject: this.personalizeTemplate(template.subject, client, metric),
          body: this.personalizeTemplate(template.body, client, metric),
        },
        methods: preferences.deliveryMethods,
      });

      await this.queueNotification(notification);
    }
  }

  // Notify system administrators
  private async notifyAdmins(
    metric: ErrorMetric, 
    template: NotificationRule['template']
  ): Promise<void> {
    const adminNotification = this.createNotification({
      type: 'error_occurred',
      errorId: metric.id,
      template: {
        subject: `[ADMIN ALERT] ${template.subject}`,
        body: this.createAdminErrorBody(metric, template.body),
      },
      methods: ['email', 'inApp'],
    });

    await this.queueNotification(adminNotification);
  }

  // Send error resolution notifications
  public async notifyErrorResolution(errorId: string, resolutionDetails: {
    resolvedAt: Date;
    resolutionTime: number;
    description: string;
  }): Promise<void> {
    const errorNotifications = this.history.filter(n => 
      n.errorId === errorId && n.type === 'error_occurred' && n.status === 'sent'
    );

    for (const originalNotification of errorNotifications) {
      if (!originalNotification.clientId) continue;

      const preferences = this.clientPreferences.get(originalNotification.clientId);
      if (!preferences?.notificationTypes.errorResolved) continue;

      const resolutionNotification = this.createNotification({
        clientId: originalNotification.clientId,
        type: 'error_resolved',
        errorId: errorId,
        template: {
          subject: 'Issue Resolved - Your Service is Back to Normal',
          body: this.createResolutionBody(resolutionDetails),
        },
        methods: preferences.deliveryMethods,
      });

      await this.queueNotification(resolutionNotification);
    }
  }

  // Send scheduled maintenance notifications
  public async notifyScheduledMaintenance(maintenance: {
    title: string;
    description: string;
    scheduledStart: Date;
    estimatedDuration: number;
    affectedServices: string[];
  }): Promise<void> {
    // Notify all clients who have maintenance notifications enabled
    for (const [clientId, preferences] of this.clientPreferences) {
      if (!preferences.notificationTypes.maintenanceScheduled) continue;

      const notification = this.createNotification({
        clientId,
        type: 'maintenance_scheduled',
        template: {
          subject: `Scheduled Maintenance: ${maintenance.title}`,
          body: this.createMaintenanceBody(maintenance),
        },
        methods: preferences.deliveryMethods,
      });

      await this.queueNotification(notification);
    }
  }

  // Update system status and notify if needed
  private async updateSystemStatus(metric: ErrorMetric): Promise<void> {
    const currentStatus = this.getCurrentSystemStatus();
    const newStatus = this.calculateSystemStatus(metric);

    if (currentStatus !== newStatus) {
      const statusUpdate: SystemStatusUpdate = {
        id: `status_${Date.now()}`,
        timestamp: new Date(),
        status: newStatus,
        component: this.getComponentFromRoute(metric.route),
        description: this.generateStatusDescription(newStatus, metric),
        affectedServices: [metric.route],
      };

      this.statusUpdates.push(statusUpdate);
      await this.broadcastStatusUpdate(statusUpdate);
    }
  }

  // Queue notification for delivery
  private async queueNotification(notification: NotificationHistory): Promise<void> {
    this.emailQueue.push(notification);
    this.history.push(notification);
  }

  // Process notification queue
  private startQueueProcessor(): void {
    setInterval(async () => {
      if (!this.isProcessingQueue && this.emailQueue.length > 0) {
        this.isProcessingQueue = true;
        await this.processEmailQueue();
        this.isProcessingQueue = false;
      }
    }, 10000); // Process every 10 seconds
  }

  private async processEmailQueue(): Promise<void> {
    const batch = this.emailQueue.splice(0, 10); // Process 10 at a time
    
    for (const notification of batch) {
      try {
        await this.sendNotification(notification);
        notification.status = 'sent';
      } catch (error) {
        notification.status = 'failed';
        notification.metadata.failureReason = error instanceof Error ? error.message : 'Unknown error';
        notification.metadata.retryCount++;
        notification.metadata.lastAttempt = new Date();

        // Retry logic
        if (notification.metadata.retryCount < 3) {
          setTimeout(() => {
            this.emailQueue.push(notification);
          }, Math.pow(2, notification.metadata.retryCount) * 60000); // Exponential backoff
        }
      }
    }
  }

  // Send notification via appropriate method
  private async sendNotification(notification: NotificationHistory): Promise<void> {
    switch (notification.method) {
      case 'email':
        await this.sendEmail(notification);
        break;
      case 'sms':
        await this.sendSMS(notification);
        break;
      case 'inApp':
        await this.sendInAppNotification(notification);
        break;
      case 'webhook':
        await this.sendWebhook(notification);
        break;
    }
  }

  // Notification delivery methods
  private async sendEmail(notification: NotificationHistory): Promise<void> {
    // Integration with email service (SendGrid, Amazon SES, etc.)
    console.log('Sending email notification:', {
      to: notification.clientId,
      subject: notification.content.subject,
      body: notification.content.body,
    });
    
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private async sendSMS(_notification: NotificationHistory): Promise<void> {
    // Integration with SMS service (Twilio, AWS SNS, etc.)
    console.log('Sending SMS notification');
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private async sendInAppNotification(notification: NotificationHistory): Promise<void> {
    // Send real-time notification via WebSocket
    console.log('Sending in-app notification:', notification.content.subject);
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async sendWebhook(_notification: NotificationHistory): Promise<void> {
    // Send webhook to client's endpoint
    console.log('Sending webhook notification');
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Client preference management
  public setClientNotificationPreferences(
    clientId: string, 
    preferences: ClientNotificationPreference
  ): void {
    this.clientPreferences.set(clientId, preferences);
  }

  public getClientNotificationPreferences(clientId: string): ClientNotificationPreference | undefined {
    return this.clientPreferences.get(clientId);
  }

  // Notification rule management
  public addNotificationRule(rule: NotificationRule): void {
    this.rules.push(rule);
  }

  public updateNotificationRule(ruleId: string, updates: Partial<NotificationRule>): void {
    const ruleIndex = this.rules.findIndex(r => r.id === ruleId);
    if (ruleIndex !== -1) {
      this.rules[ruleIndex] = { ...this.rules[ruleIndex], ...updates };
    }
  }

  public getNotificationRules(): NotificationRule[] {
    return [...this.rules];
  }

  // Get notification history and analytics
  public getNotificationHistory(clientId?: string, limit = 50): NotificationHistory[] {
    let history = [...this.history];
    
    if (clientId) {
      history = history.filter(n => n.clientId === clientId);
    }
    
    return history
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  public getNotificationAnalytics() {
    const total = this.history.length;
    const sent = this.history.filter(n => n.status === 'sent').length;
    const failed = this.history.filter(n => n.status === 'failed').length;
    const pending = this.history.filter(n => n.status === 'pending').length;

    return {
      total,
      sent,
      failed,
      pending,
      successRate: total > 0 ? (sent / total) * 100 : 0,
      byType: this.groupHistoryByType(),
      byMethod: this.groupHistoryByMethod(),
      recentActivity: this.getRecentNotificationActivity(),
    };
  }

  // Helper methods
  private setupDefaultRules(): void {
    const defaultRules: NotificationRule[] = [
      {
        id: 'critical_errors',
        name: 'Critical Error Alert',
        description: 'Notify immediately for critical errors affecting multiple users',
        enabled: true,
        conditions: {
          severity: ['critical'],
          impactThreshold: 1,
          timeWindow: 5,
          frequency: 3,
        },
        actions: {
          notifyClients: true,
          notifyAdmins: true,
          escalateToSupport: true,
          createTicket: true,
        },
        template: {
          subject: 'Critical Issue Detected - We\'re Working on a Fix',
          body: 'We\'ve detected a critical issue that may be affecting your service. Our team has been automatically notified and is working on a resolution.',
          priority: 'urgent',
        },
      },
      {
        id: 'high_error_volume',
        name: 'High Error Volume',
        description: 'Alert when error volume exceeds normal thresholds',
        enabled: true,
        conditions: {
          severity: ['high', 'medium'],
          impactThreshold: 5,
          timeWindow: 15,
          frequency: 1,
        },
        actions: {
          notifyClients: false,
          notifyAdmins: true,
          escalateToSupport: false,
          createTicket: true,
        },
        template: {
          subject: 'High Error Volume Detected',
          body: 'We\'re experiencing higher than normal error rates. Our team is investigating.',
          priority: 'high',
        },
      },
    ];

    this.rules.push(...defaultRules);
  }

  private createNotification(params: {
    clientId?: string;
    type: NotificationHistory['type'];
    errorId?: string;
    template: { subject: string; body: string };
    methods: ('email' | 'sms' | 'inApp' | 'webhook')[];
  }): NotificationHistory {
    return {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      clientId: params.clientId,
      type: params.type,
      method: params.methods[0], // Use first method for now
      status: 'pending',
      errorId: params.errorId,
      content: params.template,
      metadata: {
        retryCount: 0,
      },
    };
  }

  private personalizeTemplate(template: string, client: { id: string; name: string }, metric: ErrorMetric): string {
    return template
      .replace('{client.name}', client.name || 'Valued Client')
      .replace('{error.type}', metric.errorType)
      .replace('{error.route}', metric.route)
      .replace('{error.severity}', metric.severity)
      .replace('{timestamp}', new Date().toLocaleString());
  }

  private createAdminErrorBody(metric: ErrorMetric, template: string): string {
    return `${template}

TECHNICAL DETAILS:
- Error ID: ${metric.id}
- Type: ${metric.errorType}
- Route: ${metric.route}
- Severity: ${metric.severity}
- Users Impacted: ${metric.impactedUsers}
- Session: ${metric.sessionId}
- Timestamp: ${metric.timestamp.toISOString()}

PERFORMANCE IMPACT:
- Load Time: ${metric.performanceImpact.loadTime}ms
- Memory Usage: ${metric.performanceImpact.memoryUsage}MB
- CPU Usage: ${metric.performanceImpact.cpuUsage}%

CONTEXT:
- URL: ${metric.errorContext.url}
- User Agent: ${metric.userAgent}
- Recent Actions: ${metric.errorContext.userActions.join(', ')}`;
  }

  private createResolutionBody(details: { resolvedAt: Date; resolutionTime: number; description: string }): string {
    return `Good news! The issue affecting your service has been resolved.

Resolution Details:
- Resolved at: ${details.resolvedAt.toLocaleString()}
- Total downtime: ${Math.round(details.resolutionTime / 60000)} minutes
- Resolution: ${details.description}

Your service should now be operating normally. If you continue to experience any issues, please don't hesitate to contact our support team.

Thank you for your patience.`;
  }

  private createMaintenanceBody(maintenance: { title: string; description: string; scheduledStart: Date; estimatedDuration: number; affectedServices: string[] }): string {
    return `We have scheduled maintenance that may temporarily affect your service.

Maintenance Details:
- Title: ${maintenance.title}
- Scheduled Start: ${maintenance.scheduledStart.toLocaleString()}
- Estimated Duration: ${maintenance.estimatedDuration} minutes
- Affected Services: ${maintenance.affectedServices.join(', ')}

Description:
${maintenance.description}

We'll send another notification once the maintenance is complete. Thank you for your understanding.`;
  }

  private async getAffectedClients(_metric: ErrorMetric): Promise<{ id: string; name: string }[]> {
    // This would typically query your user database
    // For now, return mock data
    return [
      { id: 'client1', name: 'Acme Corp' },
      { id: 'client2', name: 'Beta Industries' },
    ];
  }

  private isWithinFrequencyLimit(rule: NotificationRule, _metric: ErrorMetric): boolean {
    const { timeWindow, frequency } = rule.conditions;
    const cutoff = new Date(Date.now() - timeWindow * 60000);
    
    const recentNotifications = this.history.filter(n => 
      n.timestamp >= cutoff && n.type === 'error_occurred'
    );
    
    return recentNotifications.length < frequency;
  }

  private meetsSeverityThreshold(errorSeverity: string, threshold: string): boolean {
    const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
    return severityLevels[errorSeverity as keyof typeof severityLevels] >= 
           severityLevels[threshold as keyof typeof severityLevels];
  }

  private isInQuietHours(preferences: ClientNotificationPreference): boolean {
    if (!preferences.quietHours) return false;
    
    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();
    const [startHour, startMin] = preferences.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = preferences.quietHours.end.split(':').map(Number);
    const startTime = startHour * 100 + startMin;
    const endTime = endHour * 100 + endMin;
    
    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  private getCurrentSystemStatus(): SystemStatusUpdate['status'] {
    const recent = this.statusUpdates
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
    return recent?.status || 'operational';
  }

  private calculateSystemStatus(_metric: ErrorMetric): SystemStatusUpdate['status'] {
    // Simplified status calculation
    const recentErrors = errorAnalytics.getRealTimeDashboardData().realTime;
    
    if (recentErrors.criticalErrors > 0) return 'major_outage';
    if (recentErrors.activeErrors > 5) return 'partial_outage';
    if (recentErrors.activeErrors > 2) return 'degraded';
    return 'operational';
  }

  private getComponentFromRoute(route: string): string {
    if (route.includes('/admin')) return 'Admin Panel';
    if (route.includes('/dashboard')) return 'User Dashboard';
    if (route.includes('/client')) return 'Client Portal';
    if (route.includes('/api')) return 'API Services';
    return 'Web Application';
  }

  private generateStatusDescription(status: SystemStatusUpdate['status'], metric: ErrorMetric): string {
    const descriptions = {
      operational: 'All systems operational',
      degraded: `Experiencing elevated error rates in ${this.getComponentFromRoute(metric.route)}`,
      partial_outage: `Partial service disruption affecting ${this.getComponentFromRoute(metric.route)}`,
      major_outage: `Major service disruption - ${metric.errorType} affecting multiple users`,
    };
    return descriptions[status];
  }

  private async escalateToSupport(_metric: ErrorMetric, _template: NotificationRule['template']): Promise<void> {
    // Integration with support ticketing system
    console.log('Escalating to support team');
  }

  private async createSupportTicket(_metric: ErrorMetric, _template: NotificationRule['template']): Promise<void> {
    // Create support ticket automatically
    console.log('Creating support ticket');
  }

  private async broadcastStatusUpdate(_statusUpdate: SystemStatusUpdate): Promise<void> {
    // Broadcast to all connected clients via WebSocket
    console.log('Broadcasting status update');
  }

  private groupHistoryByType(): Record<string, number> {
    return this.history.reduce((acc, notification) => {
      acc[notification.type] = (acc[notification.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupHistoryByMethod(): Record<string, number> {
    return this.history.reduce((acc, notification) => {
      acc[notification.method] = (acc[notification.method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private getRecentNotificationActivity() {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.history
      .filter(n => n.timestamp >= last24Hours)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);
  }
}

// Export singleton instance
export const notificationEngine = NotificationEngine.getInstance();
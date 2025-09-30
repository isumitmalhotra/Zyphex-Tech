/**
 * PSA Core Module - Central Nervous System for IT Services Platform
 * 
 * This module serves as the main orchestrator for the Professional Services Automation
 * system, bringing together dashboard, automation, integration, and business intelligence
 * capabilities into a unified interface.
 */

import { PSADashboard } from './dashboard';
import { WorkflowEngine } from './automation';
import { IntegrationHub } from './integration';
import { BusinessIntelligence } from './business-intelligence';
import {
  PSAConfig,
  DashboardMetrics,
  WorkflowTemplate,
  IntegrationEndpoint,
  BIReport,
  AlertRule,
  SystemHealth
} from './types';

export class PSACore {
  private static instance: PSACore;
  private config: PSAConfig;
  private dashboard: PSADashboard;
  private automation: WorkflowEngine;
  private integration: IntegrationHub;
  private businessIntelligence: BusinessIntelligence;
  private isInitialized: boolean = false;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.dashboard = PSADashboard.getInstance();
    this.automation = WorkflowEngine.getInstance();
    this.integration = IntegrationHub.getInstance();
    this.businessIntelligence = BusinessIntelligence.getInstance();
  }

  static getInstance(): PSACore {
    if (!PSACore.instance) {
      PSACore.instance = new PSACore();
    }
    return PSACore.instance;
  }

  /**
   * Initialize the PSA Core system with configuration
   */
  async initialize(config?: Partial<PSAConfig>): Promise<void> {
    try {
      console.log('🚀 Initializing PSA Core Module...');

      if (config) {
        this.config = { ...this.config, ...config };
      }

      // Initialize all subsystems
      await Promise.all([
        this.initializeDashboard(),
        this.initializeAutomation(),
        this.initializeIntegration(),
        this.initializeBusinessIntelligence()
      ]);

      // Set up cross-module communication
      await this.setupModuleCommunication();

      // Start background monitoring
      await this.startBackgroundServices();

      this.isInitialized = true;
      console.log('✅ PSA Core Module initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize PSA Core Module:', error);
      throw new Error(`PSA Core initialization failed: ${error.message}`);
    }
  }

  /**
   * Get comprehensive system dashboard data
   */
  async getDashboardData(): Promise<DashboardMetrics> {
    this.ensureInitialized();
    
    try {
      const [
        projectHealth,
        resourceMetrics,
        financialSummary,
        clientSatisfaction,
        activeAlerts
      ] = await Promise.all([
        this.dashboard.getProjectHealth(),
        this.dashboard.getResourceUtilization(),
        this.dashboard.getFinancialSummary(),
        this.dashboard.getClientSatisfaction(),
        this.dashboard.getActiveAlerts()
      ]);

      return {
        projectHealth,
        resourceMetrics,
        financialSummary,
        clientSatisfaction,
        alerts: activeAlerts,
        systemHealth: await this.getSystemHealth(),
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw new Error('Failed to fetch dashboard data');
    }
  }

  /**
   * Execute workflow with full PSA integration
   */
  async executeWorkflow(templateId: string, context: Record<string, unknown>): Promise<{
    workflowId: string;
    status: 'STARTED' | 'COMPLETED' | 'FAILED';
    steps: Array<{ name: string; status: string; result?: unknown }>;
    notifications: string[];
  }> {
    this.ensureInitialized();

    try {
      console.log(`🔄 Executing workflow: ${templateId}`);

      // Execute the workflow
      const result = await this.automation.executeWorkflow(templateId, context);

      // Update dashboard metrics
      await this.dashboard.refreshMetrics();

      // Send notifications if configured
      if (this.config.notifications.enabled) {
        await this.sendWorkflowNotifications(templateId, result);
      }

      // Log for business intelligence
      await this.logWorkflowExecution(templateId, result);

      return result;
    } catch (error) {
      console.error(`Error executing workflow ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * Process integration webhook with full context
   */
  async processWebhook(endpoint: string, payload: unknown, headers: Record<string, string>): Promise<{
    success: boolean;
    processed: boolean;
    actions: string[];
    updates: string[];
  }> {
    this.ensureInitialized();

    try {
      console.log(`📨 Processing webhook: ${endpoint}`);

      // Process through integration hub
      const result = await this.integration.processWebhook(endpoint, payload, headers);

      // Check if dashboard refresh is needed
      if (result.actions.some(action => action.includes('project') || action.includes('task'))) {
        await this.dashboard.refreshMetrics();
      }

      // Trigger automated workflows if configured
      if (result.success && this.config.automation.enabled) {
        await this.triggerAutomatedWorkflows(endpoint, payload);
      }

      return result;
    } catch (error) {
      console.error(`Error processing webhook ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Generate comprehensive business report
   */
  async generateBusinessReport(type: 'profitability' | 'resource_efficiency' | 'client_value' | 'predictive', options?: Record<string, unknown>): Promise<unknown> {
    this.ensureInitialized();

    try {
      console.log(`📊 Generating ${type} business report`);

      let report;
      switch (type) {
        case 'profitability':
          report = await this.businessIntelligence.generateProjectProfitabilityReport(options || {});
          break;
        case 'resource_efficiency':
          report = await this.businessIntelligence.generateResourceEfficiencyReport();
          break;
        case 'client_value':
          report = await this.businessIntelligence.calculateClientLifetimeValue(options?.clientId as string);
          break;
        case 'predictive':
          report = await this.businessIntelligence.generateProjectCompletionPredictions(options?.projectId as string);
          break;
        default:
          throw new Error(`Unknown report type: ${type}`);
      }

      // Log report generation
      console.log(`✅ ${type} report generated successfully`);

      return report;
    } catch (error) {
      console.error(`Error generating ${type} report:`, error);
      throw error;
    }
  }

  /**
   * Get real-time system health status
   */
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const [
        dashboardHealth,
        automationHealth,
        integrationHealth,
        biHealth
      ] = await Promise.all([
        this.checkDashboardHealth(),
        this.checkAutomationHealth(),
        this.checkIntegrationHealth(),
        this.checkBusinessIntelligenceHealth()
      ]);

      const overall = this.calculateOverallHealth([
        dashboardHealth,
        automationHealth,
        integrationHealth,
        biHealth
      ]);

      return {
        overall,
        components: {
          dashboard: dashboardHealth,
          automation: automationHealth,
          integration: integrationHealth,
          businessIntelligence: biHealth
        },
        lastChecked: new Date(),
        uptime: this.getSystemUptime(),
        version: this.config.version
      };
    } catch (error) {
      console.error('Error checking system health:', error);
      return {
        overall: 'ERROR',
        components: {
          dashboard: 'ERROR',
          automation: 'ERROR',
          integration: 'ERROR',
          businessIntelligence: 'ERROR'
        },
        lastChecked: new Date(),
        uptime: 0,
        version: this.config.version,
        error: error.message
      };
    }
  }

  /**
   * Configure PSA system settings
   */
  async updateConfiguration(newConfig: Partial<PSAConfig>): Promise<void> {
    try {
      this.config = { ...this.config, ...newConfig };
      
      // Apply configuration to subsystems
      if (newConfig.dashboard) {
        await this.dashboard.updateConfiguration(newConfig.dashboard);
      }
      
      if (newConfig.automation) {
        await this.automation.updateConfiguration(newConfig.automation);
      }
      
      if (newConfig.integration) {
        await this.integration.updateConfiguration(newConfig.integration);
      }

      console.log('✅ PSA configuration updated successfully');
    } catch (error) {
      console.error('Error updating PSA configuration:', error);
      throw error;
    }
  }

  // Private initialization methods
  private async initializeDashboard(): Promise<void> {
    console.log('📊 Initializing Dashboard module...');
    await this.dashboard.initialize(this.config.dashboard);
  }

  private async initializeAutomation(): Promise<void> {
    console.log('⚙️ Initializing Automation module...');
    await this.automation.initialize(this.config.automation);
  }

  private async initializeIntegration(): Promise<void> {
    console.log('🔗 Initializing Integration module...');
    await this.integration.initialize(this.config.integration);
  }

  private async initializeBusinessIntelligence(): Promise<void> {
    console.log('📈 Initializing Business Intelligence module...');
    // BI module doesn't require specific initialization in current implementation
  }

  private async setupModuleCommunication(): Promise<void> {
    console.log('🔗 Setting up inter-module communication...');
    
    // Set up event listeners for cross-module notifications
    // In a real implementation, this would use an event bus or message queue
    
    // Dashboard notifications to automation
    // Automation results to dashboard
    // Integration events to all modules
    // BI insights to dashboard
  }

  private async startBackgroundServices(): Promise<void> {
    console.log('🚀 Starting background services...');

    // Start periodic metric refresh
    if (this.config.dashboard.autoRefresh) {
      setInterval(async () => {
        try {
          await this.dashboard.refreshMetrics();
        } catch (error) {
          console.error('Background metric refresh failed:', error);
        }
      }, this.config.dashboard.refreshInterval || 300000); // 5 minutes default
    }

    // Start automation scheduler
    if (this.config.automation.enabled) {
      await this.automation.startScheduler();
    }

    // Start integration monitoring
    if (this.config.integration.monitoringEnabled) {
      await this.integration.startMonitoring();
    }
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('PSA Core must be initialized before use. Call initialize() first.');
    }
  }

  private getDefaultConfig(): PSAConfig {
    return {
      version: '1.0.0',
      environment: 'production',
      dashboard: {
        autoRefresh: true,
        refreshInterval: 300000, // 5 minutes
        alertThresholds: {
          projectHealth: 70,
          resourceUtilization: 80,
          budgetVariance: 15
        }
      },
      automation: {
        enabled: true,
        maxConcurrentWorkflows: 10,
        defaultTimeout: 3600000, // 1 hour
        retryAttempts: 3
      },
      integration: {
        webhookTimeout: 30000,
        maxPayloadSize: 10485760, // 10MB
        rateLimiting: {
          enabled: true,
          requestsPerMinute: 100
        },
        monitoringEnabled: true
      },
      businessIntelligence: {
        cacheResults: true,
        cacheDuration: 3600000, // 1 hour
        enablePredictiveAnalytics: true
      },
      notifications: {
        enabled: true,
        channels: ['email', 'slack'],
        escalationRules: []
      },
      security: {
        enableAuditLog: true,
        enableEncryption: true,
        sessionTimeout: 28800000 // 8 hours
      }
    };
  }

  private async sendWorkflowNotifications(templateId: string, result: unknown): Promise<void> {
    // Implementation would send notifications based on workflow results
    console.log(`📧 Sending notifications for workflow: ${templateId}`, result);
  }

  private async logWorkflowExecution(templateId: string, result: unknown): Promise<void> {
    // Implementation would log workflow execution for BI analysis
    console.log(`📝 Logging workflow execution: ${templateId}`, result);
  }

  private async triggerAutomatedWorkflows(endpoint: string, payload: unknown): Promise<void> {
    // Implementation would trigger relevant automated workflows based on webhook events
    console.log(`🔄 Triggering automated workflows for: ${endpoint}`, payload);
  }

  private async checkDashboardHealth(): Promise<'HEALTHY' | 'WARNING' | 'ERROR'> {
    try {
      await this.dashboard.getProjectHealth();
      return 'HEALTHY';
    } catch (error) {
      console.error('Dashboard health check failed:', error);
      return 'ERROR';
    }
  }

  private async checkAutomationHealth(): Promise<'HEALTHY' | 'WARNING' | 'ERROR'> {
    try {
      await this.automation.getActiveWorkflows();
      return 'HEALTHY';
    } catch (error) {
      console.error('Automation health check failed:', error);
      return 'ERROR';
    }
  }

  private async checkIntegrationHealth(): Promise<'HEALTHY' | 'WARNING' | 'ERROR'> {
    try {
      await this.integration.getActiveIntegrations();
      return 'HEALTHY';
    } catch (error) {
      console.error('Integration health check failed:', error);
      return 'ERROR';
    }
  }

  private async checkBusinessIntelligenceHealth(): Promise<'HEALTHY' | 'WARNING' | 'ERROR'> {
    try {
      // Simple health check for BI module
      return 'HEALTHY';
    } catch (error) {
      console.error('Business Intelligence health check failed:', error);
      return 'ERROR';
    }
  }

  private calculateOverallHealth(componentHealths: Array<'HEALTHY' | 'WARNING' | 'ERROR'>): 'HEALTHY' | 'WARNING' | 'ERROR' {
    const errorCount = componentHealths.filter(h => h === 'ERROR').length;
    const warningCount = componentHealths.filter(h => h === 'WARNING').length;

    if (errorCount > 0) return 'ERROR';
    if (warningCount > 0) return 'WARNING';
    return 'HEALTHY';
  }

  private getSystemUptime(): number {
    // In real implementation, would track actual system uptime
    return Date.now() - (this.config as unknown as { startTime: number }).startTime || 0;
  }
}

// Export singleton instance for easy access
export const psaCore = PSACore.getInstance();

// Export individual modules for direct access if needed
export { PSADashboard } from './dashboard';
export { WorkflowEngine } from './automation';
export { IntegrationHub } from './integration';
export { BusinessIntelligence } from './business-intelligence';
export * from './types';
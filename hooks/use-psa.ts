/**
 * PSA Dashboard Hook
 * Custom hook for managing PSA dashboard data and actions
 */

import { useState, useEffect } from 'react';
import {
  ProjectHealthMetrics,
  ResourceMetrics,
  FinancialMetrics,
  ClientSatisfactionMetrics,
  Alert
} from '@/lib/psa/types';

// Additional interfaces for hook functionality
interface CreateAlertData {
  type: 'PROJECT_RISK' | 'DEADLINE_WARNING' | 'BUDGET_OVERRUN' | 'RESOURCE_CONFLICT' | 'CLIENT_ISSUE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  projectId?: string;
  clientId?: string;
  resourceId?: string;
}

interface WorkflowExecutionContext {
  projectId?: string;
  clientId?: string;
  userId?: string;
  data?: Record<string, unknown>;
}

interface WorkflowTemplateData {
  name: string;
  description: string;
  category: string;
  steps: Array<{
    name: string;
    type: 'ACTION' | 'CONDITION' | 'DELAY' | 'APPROVAL' | 'NOTIFICATION';
    action: string;
    parameters: Record<string, unknown>;
  }>;
}

interface ReportOptions {
  dateRange?: {
    start: Date;
    end: Date;
  };
  projectIds?: string[];
  clientIds?: string[];
  filters?: Record<string, unknown>;
}

interface ReportsState {
  [reportType: string]: {
    data: unknown;
    generated: Date;
    status: 'generating' | 'completed' | 'error';
  };
}

interface WebhookData {
  name: string;
  url: string;
  events: string[];
  active: boolean;
  secret?: string;
}

export interface PSADashboardData {
  projectHealth: ProjectHealthMetrics[];
  resourceUtilization: ResourceMetrics;
  financialMetrics: FinancialMetrics;
  clientSatisfaction: ClientSatisfactionMetrics;
  alerts: Alert[];
  lastUpdated: string;
}

export function usePSADashboard() {
  const [data, setData] = useState<PSADashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/psa/dashboard');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('Error fetching PSA dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const refreshMetrics = async () => {
    try {
      const response = await fetch('/api/psa/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh-metrics' })
      });

      if (response.ok) {
        await fetchDashboardData();
      } else {
        throw new Error('Failed to refresh metrics');
      }
    } catch (err) {
      console.error('Error refreshing metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh metrics');
    }
  };

  const createAlert = async (alertData: CreateAlertData) => {
    try {
      const response = await fetch('/api/psa/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'create-alert',
          data: alertData 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create alert');
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      console.error('Error creating alert:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    data,
    loading,
    error,
    fetchDashboardData,
    refreshMetrics,
    createAlert
  };
}

/**
 * Workflow Management Hook
 */
export function useWorkflowManagement() {
  const [workflows, setWorkflows] = useState([]);
  const [executions, _setExecutions] = useState([]);
  const [loading, setLoading] = useState(false);

  const executeWorkflow = async (workflowId: string, context: WorkflowExecutionContext) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/psa/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
          data: { workflowId, context }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to execute workflow');
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      console.error('Error executing workflow:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createWorkflowTemplate = async (template: WorkflowTemplateData) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/psa/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-template',
          data: template
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create workflow template');
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      console.error('Error creating workflow template:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/psa/automation?action=templates');
      if (response.ok) {
        const result = await response.json();
        setWorkflows(result.data);
      }
    } catch (err) {
      console.error('Error fetching workflows:', err);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  return {
    workflows,
    executions,
    loading,
    executeWorkflow,
    createWorkflowTemplate,
    fetchWorkflows
  };
}

/**
 * Business Intelligence Hook
 */
export function useBusinessIntelligence() {
  const [reports, setReports] = useState<ReportsState>({});
  const [loading, setLoading] = useState(false);

  const generateReport = async (reportType: string, options?: ReportOptions) => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({ type: reportType });
      if (options?.dateRange) {
        params.set('startDate', options.dateRange.start.toISOString());
        params.set('endDate', options.dateRange.end.toISOString());
      }
      if (options?.projectIds) {
        params.set('projectIds', options.projectIds.join(','));
      }
      if (options?.clientIds) {
        params.set('clientIds', options.clientIds.join(','));
      }

      const response = await fetch(`/api/psa/business-intelligence?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const result = await response.json();
      
      setReports((prev: ReportsState) => ({
        ...prev,
        [reportType]: result.data
      }));
      
      return result.data;
    } catch (err) {
      console.error('Error generating report:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (reportType: string, format: string, options?: ReportOptions) => {
    try {
      const response = await fetch('/api/psa/business-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'export-data',
          data: { reportType, format, options }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      console.error('Error exporting data:', err);
      throw err;
    }
  };

  return {
    reports,
    loading,
    generateReport,
    exportData
  };
}

/**
 * Integration Management Hook
 */
export function useIntegrationManagement() {
  const [integrations, setIntegrations] = useState([]);
  const [webhookLogs, _setWebhookLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('/api/psa/integration?action=endpoints');
      if (response.ok) {
        const result = await response.json();
        setIntegrations(result.data);
      }
    } catch (err) {
      console.error('Error fetching integrations:', err);
    }
  };

  const registerWebhook = async (webhookData: WebhookData) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/psa/integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register-webhook',
          data: webhookData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to register webhook');
      }

      const result = await response.json();
      await fetchIntegrations(); // Refresh the list
      return result.data;
    } catch (err) {
      console.error('Error registering webhook:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const testIntegration = async (endpointId: string) => {
    try {
      const response = await fetch('/api/psa/integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test-integration',
          data: { endpointId }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to test integration');
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      console.error('Error testing integration:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  return {
    integrations,
    webhookLogs,
    loading,
    registerWebhook,
    testIntegration,
    fetchIntegrations
  };
}

const PSAHooks = {
  usePSADashboard,
  useWorkflowManagement,
  useBusinessIntelligence,
  useIntegrationManagement
};

export default PSAHooks;
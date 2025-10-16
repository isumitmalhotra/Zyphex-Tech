import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { WorkflowEngine } from '@/lib/psa/automation';

// Webhook payload types
interface GitHubWebhookPayload {
  repository?: { name: string };
  ref?: string;
  commits?: unknown[];
  pusher?: unknown;
  pull_request?: { 
    user?: { login?: string };
    [key: string]: unknown;
  };
  issue?: { 
    user?: { login?: string };
    [key: string]: unknown;
  };
  action?: string;
  [key: string]: unknown;
}

interface SlackWebhookPayload {
  text?: string;
  channel?: string;
  user?: string;
  event?: {
    channel?: string;
    user?: string;
    text?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface FormSubmissionPayload {
  name?: string;
  email?: string;
  company?: string;
  phone?: string;
  requirements?: string;
  project?: unknown;
  urgency?: string;
  title?: string;
  description?: string;
  budget?: string;
  timeline?: string;
  clientId?: string;
  requestedBy?: string;
  subject?: string;
  priority?: string;
  category?: string;
  [key: string]: unknown;
}

interface ScheduledTaskPayload {
  recipients?: string[];
  weekStartDate?: string;
  monthStartDate?: string;
  [key: string]: unknown;
}

/**
 * Webhook endpoint for external integrations
 * Handles incoming webhooks and triggers appropriate workflows
 */
// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const event = searchParams.get('event');
    
    if (!source || !event) {
      return NextResponse.json({ error: 'Source and event are required' }, { status: 400 });
    }

    const payload = await request.json();
    const workflowEngine = WorkflowEngine.getInstance();

    // Route webhook to appropriate workflow based on source and event
    switch (source) {
      case 'github':
        await handleGitHubWebhook(event, payload, workflowEngine);
        break;
      
      case 'slack':
        await handleSlackWebhook(event, payload, workflowEngine);
        break;
      
      case 'form':
        await handleFormSubmission(event, payload, workflowEngine);
        break;
      
      case 'cron':
        await handleScheduledTask(event, payload, workflowEngine);
        break;
      
      default:
        // Unhandled webhook source
        break;
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      source,
      event
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle GitHub webhooks
 */
async function handleGitHubWebhook(event: string, payload: GitHubWebhookPayload, workflowEngine: WorkflowEngine) {
  switch (event) {
    case 'push':
      // Trigger deployment workflow
      await workflowEngine.executeWorkflow('github-push-deployment', {
        repository: payload.repository?.name,
        branch: payload.ref?.replace('refs/heads/', ''),
        commits: payload.commits,
        pusher: payload.pusher
      });
      break;
    
    case 'pull_request':
      // Trigger code review workflow
      if (payload.action === 'opened') {
        await workflowEngine.executeWorkflow('pull-request-review', {
          pullRequest: payload.pull_request,
          repository: payload.repository?.name,
          author: payload.pull_request?.user?.login
        });
      }
      break;
    
    case 'issues':
      // Trigger issue management workflow
      if (payload.action === 'opened') {
        await workflowEngine.executeWorkflow('issue-triage', {
          issue: payload.issue,
          repository: payload.repository?.name,
          reporter: payload.issue?.user?.login
        });
      }
      break;
  }
}

/**
 * Handle Slack webhooks
 */
async function handleSlackWebhook(event: string, payload: SlackWebhookPayload, workflowEngine: WorkflowEngine) {
  switch (event) {
    case 'message':
      // Process slash commands or mentions
      if (payload.text?.includes('/project-status')) {
        await workflowEngine.executeWorkflow('slack-project-status', {
          channel: payload.channel,
          user: payload.user,
          text: payload.text
        });
      }
      break;
    
    case 'app_mention':
      // Handle app mentions
      await workflowEngine.executeWorkflow('slack-app-mention', {
        channel: payload.event?.channel,
        user: payload.event?.user,
        text: payload.event?.text
      });
      break;
  }
}

/**
 * Handle form submissions (client requests, project inquiries, etc.)
 */
async function handleFormSubmission(event: string, payload: FormSubmissionPayload, workflowEngine: WorkflowEngine) {
  switch (event) {
    case 'client-inquiry':
      // Trigger client onboarding workflow
      await workflowEngine.executeWorkflow('client-onboarding', {
        clientData: {
          name: payload.name,
          email: payload.email,
          company: payload.company,
          phone: payload.phone,
          requirements: payload.requirements
        },
        source: 'website-form',
        timestamp: new Date()
      });
      break;
    
    case 'project-request':
      // Trigger project setup workflow
      await workflowEngine.executeWorkflow('project-setup', {
        projectData: {
          title: payload.title,
          description: payload.description,
          budget: payload.budget,
          timeline: payload.timeline,
          clientId: payload.clientId
        },
        requestedBy: payload.requestedBy
      });
      break;
    
    case 'support-ticket':
      // Trigger support workflow
      await workflowEngine.executeWorkflow('support-ticket-processing', {
        ticket: {
          subject: payload.subject,
          description: payload.description,
          priority: payload.priority,
          category: payload.category,
          clientId: payload.clientId
        }
      });
      break;
  }
}

/**
 * Handle scheduled tasks (cron jobs)
 */
async function handleScheduledTask(event: string, payload: ScheduledTaskPayload, workflowEngine: WorkflowEngine) {
  switch (event) {
    case 'daily-reports':
      // Generate and send daily reports
      await workflowEngine.executeWorkflow('daily-report-generation', {
        reportDate: new Date(),
        recipients: payload.recipients || ['admin@zyphextech.com']
      });
      break;
    
    case 'weekly-invoicing':
      // Generate weekly invoices
      await workflowEngine.executeWorkflow('weekly-invoice-generation', {
        weekStartDate: payload.weekStartDate,
        weekEndDate: payload.weekEndDate
      });
      break;
    
    case 'monthly-metrics':
      // Calculate monthly metrics
      await workflowEngine.executeWorkflow('monthly-metrics-calculation', {
        month: payload.month,
        year: payload.year
      });
      break;
    
    case 'project-health-check':
      // Check project health and send alerts
      await workflowEngine.executeWorkflow('project-health-monitoring', {
        checkDate: new Date()
      });
      break;
  }
}

/**
 * Manual workflow trigger endpoint
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workflowId, context } = body;

    if (!workflowId) {
      return NextResponse.json({ error: 'Workflow ID is required' }, { status: 400 });
    }

    const workflowEngine = WorkflowEngine.getInstance();
    const execution = await workflowEngine.executeWorkflow(workflowId, {
      ...context,
      triggeredBy: session.user.id,
      triggerType: 'manual',
      timestamp: new Date()
    });

    return NextResponse.json({
      success: true,
      execution,
      message: `Workflow ${workflowId} executed successfully`
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Get webhook status and logs
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const limit = parseInt(searchParams.get('limit') || '50');

    // In a real implementation, this would fetch from a database
    const webhookLogs = [
      {
        id: 'wh_001',
        source: source || 'github',
        event: 'push',
        status: 'processed',
        timestamp: new Date(),
        executionTime: 150,
        workflowsTriggered: ['github-push-deployment']
      },
      {
        id: 'wh_002',
        source: 'slack',
        event: 'message',
        status: 'processed', 
        timestamp: new Date(Date.now() - 3600000),
        executionTime: 75,
        workflowsTriggered: ['slack-project-status']
      }
    ];

    return NextResponse.json({
      success: true,
      logs: webhookLogs.slice(0, limit),
      total: webhookLogs.length
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
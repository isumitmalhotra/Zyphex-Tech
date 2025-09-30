import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { WorkflowEngine } from '@/lib/psa/automation';
import { hasPermission, Permission } from '@/lib/auth/permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canViewWorkflows = await hasPermission(session.user.id, Permission.VIEW_WORKFLOWS);
    if (!canViewWorkflows) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const workflowId = searchParams.get('workflowId');
    const status = searchParams.get('status');

    const workflowEngine = WorkflowEngine.getInstance();

    switch (action) {
      case 'templates':
        const templates = await workflowEngine.getWorkflowTemplates();
        return NextResponse.json({
          success: true,
          data: templates
        });

      case 'executions':
        const executions = await workflowEngine.getWorkflowExecutions(
          workflowId || undefined,
          status as any
        );
        return NextResponse.json({
          success: true,
          data: executions
        });

      case 'scheduled':
        const scheduled = await workflowEngine.getScheduledWorkflows();
        return NextResponse.json({
          success: true,
          data: scheduled
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Automation GET Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canManageWorkflows = await hasPermission(session.user.id, Permission.MANAGE_WORKFLOWS);
    if (!canManageWorkflows) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { action, data } = body;

    const workflowEngine = WorkflowEngine.getInstance();

    switch (action) {
      case 'create-template':
        const template = await workflowEngine.createWorkflowTemplate(data);
        return NextResponse.json({
          success: true,
          data: template,
          message: 'Workflow template created successfully'
        });

      case 'execute':
        const execution = await workflowEngine.executeWorkflow(data.workflowId, data.context);
        return NextResponse.json({
          success: true,
          data: execution,
          message: 'Workflow executed successfully'
        });

      case 'schedule-tasks':
        await workflowEngine.scheduleAutomatedTasks(data.projectId);
        return NextResponse.json({
          success: true,
          message: 'Automated tasks scheduled successfully'
        });

      case 'create-invoice-automation':
        const invoiceWorkflow = await workflowEngine.createInvoiceAutomation(data);
        return NextResponse.json({
          success: true,
          data: invoiceWorkflow,
          message: 'Invoice automation created successfully'
        });

      case 'client-onboarding':
        const onboardingWorkflow = await workflowEngine.executeClientOnboarding(data);
        return NextResponse.json({
          success: true,
          data: onboardingWorkflow,
          message: 'Client onboarding initiated successfully'
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Automation POST Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canManageWorkflows = await hasPermission(session.user.id, Permission.MANAGE_WORKFLOWS);
    if (!canManageWorkflows) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { workflowId, updates } = body;

    const workflowEngine = WorkflowEngine.getInstance();
    const updatedWorkflow = await workflowEngine.updateWorkflowTemplate(workflowId, updates);

    return NextResponse.json({
      success: true,
      data: updatedWorkflow,
      message: 'Workflow template updated successfully'
    });

  } catch (error) {
    console.error('Automation PUT Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canManageWorkflows = await hasPermission(session.user.id, Permission.MANAGE_WORKFLOWS);
    if (!canManageWorkflows) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflowId');

    if (!workflowId) {
      return NextResponse.json({ error: 'Workflow ID is required' }, { status: 400 });
    }

    const workflowEngine = WorkflowEngine.getInstance();
    await workflowEngine.deleteWorkflowTemplate(workflowId);

    return NextResponse.json({
      success: true,
      message: 'Workflow template deleted successfully'
    });

  } catch (error) {
    console.error('Automation DELETE Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
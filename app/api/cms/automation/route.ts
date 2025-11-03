/**
 * Automation Rules API
 * 
 * GET /api/cms/automation - Get all automation rules
 * POST /api/cms/automation - Create automation rule
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import {
  createAutomation,
  getAutomations,
  getAutomationTemplates,
} from '@/lib/cms/automation-service';

// ============================================================================
// Validation Schemas
// ============================================================================

const createAutomationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  trigger: z.object({
    type: z.enum([
      'page_created', 'page_updated', 'page_published', 'page_unpublished', 'page_deleted',
      'section_created', 'section_updated', 'section_deleted',
      'schedule_due', 'version_created', 'status_changed', 'manual'
    ]),
    config: z.record(z.unknown()),
  }),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum([
      'equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with',
      'greater_than', 'less_than', 'in', 'not_in', 'is_empty', 'is_not_empty'
    ]),
    value: z.unknown().default(null),
    logic: z.enum(['AND', 'OR']).optional(),
  })).optional(),
  actions: z.array(z.object({
    type: z.enum([
      'publish_page', 'unpublish_page', 'update_status', 'send_notification',
      'create_version', 'assign_category', 'add_tag', 'remove_tag',
      'set_metadata', 'trigger_webhook', 'run_script', 'create_backup', 'send_email'
    ]),
    config: z.record(z.unknown()),
    order: z.number(),
  })),
});

// ============================================================================
// GET - Get Automation Rules
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only Super Admin can view automation rules
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const triggerType = searchParams.get('triggerType');
    const templates = searchParams.get('templates');

    // Return templates if requested
    if (templates === 'true') {
      const templateList = getAutomationTemplates();
      return NextResponse.json({
        success: true,
        data: templateList,
      });
    }

    const filters: Parameters<typeof getAutomations>[0] = {};

    if (isActive !== null) {
      filters.isActive = isActive === 'true';
    }

    if (triggerType) {
      filters.triggerType = triggerType as never;
    }

    const automations = await getAutomations(filters);

    return NextResponse.json({
      success: true,
      data: automations,
    });
  } catch (error) {
    console.error('Error getting automation rules:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get automation rules',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create Automation Rule
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only Super Admin can create automation rules
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createAutomationSchema.parse(body);

    const automation = await createAutomation({
      ...validatedData,
      createdBy: session.user.id,
    } as Parameters<typeof createAutomation>[0]);

    return NextResponse.json({
      success: true,
      message: 'Automation rule created successfully',
      data: automation,
    });
  } catch (error) {
    console.error('Error creating automation rule:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create automation rule',
      },
      { status: 500 }
    );
  }
}

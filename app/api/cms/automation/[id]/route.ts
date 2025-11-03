/**
 * Automation Rule Management API
 * 
 * GET /api/cms/automation/[id] - Get automation rule
 * PATCH /api/cms/automation/[id] - Update automation rule
 * DELETE /api/cms/automation/[id] - Delete automation rule
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import {
  getAutomation,
  updateAutomation,
  deleteAutomation,
} from '@/lib/cms/automation-service';

// ============================================================================
// Validation Schema
// ============================================================================

const updateAutomationSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  trigger: z.object({
    type: z.enum([
      'page_created', 'page_updated', 'page_published', 'page_unpublished', 'page_deleted',
      'section_created', 'section_updated', 'section_deleted',
      'schedule_due', 'version_created', 'status_changed', 'manual'
    ]),
    config: z.record(z.unknown()),
  }).optional(),
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
  })).optional(),
});

// ============================================================================
// GET - Get Automation Rule
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const automation = await getAutomation(params.id);

    if (!automation) {
      return NextResponse.json(
        { success: false, error: 'Automation rule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: automation,
    });
  } catch (error) {
    console.error('Error getting automation rule:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get automation rule',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update Automation Rule
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only Super Admin can update automation rules
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateAutomationSchema.parse(body);

    const automation = await updateAutomation(params.id, validatedData as Parameters<typeof updateAutomation>[1]);

    return NextResponse.json({
      success: true,
      message: 'Automation rule updated successfully',
      data: automation,
    });
  } catch (error) {
    console.error('Error updating automation rule:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update automation rule',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete Automation Rule
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only Super Admin can delete automation rules
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }

    await deleteAutomation(params.id);

    return NextResponse.json({
      success: true,
      message: 'Automation rule deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting automation rule:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete automation rule',
      },
      { status: 500 }
    );
  }
}

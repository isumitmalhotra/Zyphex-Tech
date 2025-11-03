/**
 * Preview Token Management API
 * 
 * POST /api/cms/preview/token - Create preview token
 * DELETE /api/cms/preview/token - Revoke preview token
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import {
  createPreviewToken,
  revokePreviewToken,
} from '@/lib/cms/preview-service';

// ============================================================================
// Validation Schemas
// ============================================================================

const createTokenSchema = z.object({
  pageId: z.string().min(1, 'Page ID is required'),
  versionId: z.string().optional(),
  expiresInMinutes: z.number().min(1).max(1440).optional(),
  device: z.enum(['desktop', 'tablet', 'mobile', 'all']).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const revokeTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

// ============================================================================
// POST - Create Preview Token
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

    // Only Super Admin can create preview tokens
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createTokenSchema.parse(body);

    const previewToken = await createPreviewToken({
      pageId: validatedData.pageId,
      versionId: validatedData.versionId,
      userId: session.user.id,
      expiresInMinutes: validatedData.expiresInMinutes,
      device: validatedData.device,
      metadata: validatedData.metadata,
    });

    return NextResponse.json({
      success: true,
      message: 'Preview token created successfully',
      data: {
        token: previewToken.token,
        expiresAt: previewToken.expiresAt,
        previewUrl: `/api/cms/preview?token=${previewToken.token}`,
      },
    });
  } catch (error) {
    console.error('Error creating preview token:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create preview token',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Revoke Preview Token
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only Super Admin can revoke preview tokens
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = revokeTokenSchema.parse(body);

    const revoked = await revokePreviewToken(validatedData.token);

    return NextResponse.json({
      success: true,
      message: revoked
        ? 'Preview token revoked successfully'
        : 'Preview token not found or already expired',
    });
  } catch (error) {
    console.error('Error revoking preview token:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to revoke preview token',
      },
      { status: 500 }
    );
  }
}

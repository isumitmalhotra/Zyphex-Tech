import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getBackup,
  deleteBackup,
  restoreFromBackup,
  verifyBackup,
  updateRetentionPolicy,
  RestoreOptions,
} from '@/lib/cms/backup-service';
import { z } from 'zod';

const restoreSchema = z.object({
  restorePoint: z.string().optional(),
  includeMedia: z.boolean().optional().default(true),
  createBackupBefore: z.boolean().optional().default(true),
});

const retentionSchema = z.object({
  retentionDays: z.number().int().positive(),
});

/**
 * GET /api/cms/backups/[id]
 * Get backup details or verify backup
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const verify = searchParams.get('verify') === 'true';

    if (verify) {
      const verification = await verifyBackup(params.id);
      return NextResponse.json({
        success: true,
        data: verification,
      });
    }

    const backup = await getBackup(params.id);

    if (!backup) {
      return NextResponse.json(
        { success: false, error: 'Backup not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: backup,
    });
  } catch (error) {
    console.error('Error fetching backup:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch backup',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cms/backups/[id]
 * Restore from backup
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = restoreSchema.parse(body);

    const options: RestoreOptions = {
      backupId: params.id,
      restorePoint: validatedData.restorePoint ? new Date(validatedData.restorePoint) : undefined,
      includeMedia: validatedData.includeMedia,
      createBackupBefore: validatedData.createBackupBefore,
      restoreBy: session.user.id,
    };

    await restoreFromBackup(options);

    return NextResponse.json({
      success: true,
      message: 'Backup restored successfully',
    });
  } catch (error) {
    console.error('Error restoring backup:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to restore backup',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/cms/backups/[id]
 * Update backup retention policy
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = retentionSchema.parse(body);

    const backup = await updateRetentionPolicy(params.id, validatedData.retentionDays);

    return NextResponse.json({
      success: true,
      data: backup,
      message: 'Retention policy updated successfully',
    });
  } catch (error) {
    console.error('Error updating retention:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update retention policy',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cms/backups/[id]
 * Delete a backup
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await deleteBackup(params.id);

    return NextResponse.json({
      success: true,
      message: 'Backup deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting backup:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete backup',
      },
      { status: 500 }
    );
  }
}

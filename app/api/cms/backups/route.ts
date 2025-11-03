import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  createBackup,
  listBackups,
  getBackupStats,
  cleanupExpiredBackups,
  CreateBackupInput,
} from '@/lib/cms/backup-service';
import { z } from 'zod';

const createBackupSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['full', 'incremental', 'manual']),
  includeMedia: z.boolean().optional().default(true),
  compress: z.boolean().optional().default(true),
  retentionDays: z.number().int().positive().optional().default(30),
});

/**
 * GET /api/cms/backups
 * List backups or get statistics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const stats = searchParams.get('stats') === 'true';
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const includeExpired = searchParams.get('includeExpired') === 'true';
    const limit = searchParams.get('limit');

    if (stats) {
      const backupStats = await getBackupStats();
      return NextResponse.json({
        success: true,
        data: backupStats,
      });
    }

    const backups = await listBackups({
      type: type as 'full' | 'incremental' | 'manual' | undefined,
      status: status as 'pending' | 'in_progress' | 'completed' | 'failed' | 'expired' | undefined,
      includeExpired,
      limit: limit ? parseInt(limit) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: backups,
    });
  } catch (error) {
    console.error('Error fetching backups:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch backups',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cms/backups
 * Create a new backup
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createBackupSchema.parse(body);

    const input: CreateBackupInput = {
      ...validatedData,
      createdBy: session.user.id,
    };

    const backup = await createBackup(input);

    return NextResponse.json({
      success: true,
      data: backup,
      message: 'Backup created successfully. Processing in background.',
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    
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
        error: error instanceof Error ? error.message : 'Failed to create backup',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cms/backups
 * Cleanup expired backups
 */
export async function DELETE(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const deletedCount = await cleanupExpiredBackups();

    return NextResponse.json({
      success: true,
      data: { deletedCount },
      message: `Cleaned up ${deletedCount} expired backups`,
    });
  } catch (error) {
    console.error('Error cleaning up backups:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cleanup backups',
      },
      { status: 500 }
    );
  }
}

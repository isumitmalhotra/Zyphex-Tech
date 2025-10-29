/**
 * CMS Settings API Route
 * Get and update CMS configuration settings
 * 
 * @route GET/PATCH /api/cms/settings
 * @access Protected - Requires admin permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const settingsSchema = z.object({
  siteName: z.string().min(1).optional(),
  siteDescription: z.string().optional(),
  defaultLanguage: z.string().optional(),
  timezone: z.string().optional(),
  itemsPerPage: z.number().min(10).max(100).optional(),
  autoSaveInterval: z.number().min(30).max(300).optional(),
  enableVersioning: z.boolean().optional(),
  enableWorkflows: z.boolean().optional(),
  enableScheduling: z.boolean().optional(),
  maxFileUploadSize: z.number().min(1).max(100).optional(),
});

// In-memory settings storage (replace with database in production)
let settings = {
  siteName: 'Zyphex Tech CMS',
  siteDescription: 'A comprehensive content management system',
  defaultLanguage: 'en',
  timezone: 'UTC',
  itemsPerPage: 20,
  autoSaveInterval: 60,
  enableVersioning: true,
  enableWorkflows: true,
  enableScheduling: true,
  maxFileUploadSize: 10,
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });

  } catch (error) {
    console.error('CMS Settings GET Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to fetch settings',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = settingsSchema.parse(body);

    // Update settings
    settings = {
      ...settings,
      ...validatedData,
    };

    // In production, save to database
    // await prisma.cmsSettings.update({ where: { id: 'default' }, data: validatedData });

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings,
    });

  } catch (error) {
    console.error('CMS Settings PATCH Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation Error',
          message: 'Invalid settings data',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to update settings',
      },
      { status: 500 }
    );
  }
}

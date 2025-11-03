/**
 * Preview Content API
 * 
 * GET /api/cms/preview - Get preview content using token
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPreviewContent } from '@/lib/cms/preview-service';

// ============================================================================
// GET - Preview Content
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Preview token is required' },
        { status: 400 }
      );
    }

    // Get user agent and IP for tracking
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      undefined;

    const previewContent = await getPreviewContent(token, {
      userAgent,
      ipAddress,
    });

    if (!previewContent) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired preview token' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: previewContent,
    });
  } catch (error) {
    console.error('Error getting preview content:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get preview content',
      },
      { status: 500 }
    );
  }
}

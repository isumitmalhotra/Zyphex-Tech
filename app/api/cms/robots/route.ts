/**
 * CMS Robots.txt API
 * 
 * @route GET /api/cms/robots
 */

import { NextRequest, NextResponse } from 'next/server';
import seoService from '@/lib/cms/seo-service';

// ============================================================================
// GET - Generate robots.txt
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Get base URL from request or environment
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host') || process.env.NEXT_PUBLIC_APP_URL || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    // Get default robots configuration
    const robotsConfig = seoService.getDefaultRobotsConfig(baseUrl);

    // Generate robots.txt content
    const robotsTxt = seoService.generateRobotsTxt(robotsConfig);

    return new NextResponse(robotsTxt, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });

  } catch (error) {
    console.error('CMS Robots.txt Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to generate robots.txt',
      },
      { status: 500 }
    );
  }
}

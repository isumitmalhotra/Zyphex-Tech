/**
 * CMS Sitemap API
 * 
 * @route GET /api/cms/sitemap
 */

import { NextRequest, NextResponse } from 'next/server';
import seoService from '@/lib/cms/seo-service';

// ============================================================================
// GET - Generate sitemap XML
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Get base URL from request or environment
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host') || process.env.NEXT_PUBLIC_APP_URL || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    // Check if JSON format requested
    const { searchParams } = request.nextUrl;
    const format = searchParams.get('format');

    if (format === 'json') {
      // Return JSON format
      const sitemap = await seoService.generateSitemap(baseUrl);
      return NextResponse.json({
        success: true,
        data: sitemap,
      });
    } else {
      // Return XML format (default)
      const sitemapXml = await seoService.generateSitemapXml(baseUrl);
      
      return new NextResponse(sitemapXml, {
        headers: {
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
      });
    }

  } catch (error) {
    console.error('CMS Sitemap Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to generate sitemap',
      },
      { status: 500 }
    );
  }
}

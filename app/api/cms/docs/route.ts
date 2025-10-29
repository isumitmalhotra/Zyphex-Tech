import { NextResponse } from 'next/server';
import { cmsApiSpec } from '@/lib/cms/api-spec';

/**
 * GET /api/cms/docs
 * Serves OpenAPI 3.0 specification for CMS API
 * Can be used with Swagger UI or other API documentation tools
 */
export async function GET() {
  return NextResponse.json(cmsApiSpec, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

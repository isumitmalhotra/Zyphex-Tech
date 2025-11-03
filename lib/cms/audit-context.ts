/**
 * Audit Context Helpers
 * Extract IP address, user agent, and session info from Next.js requests
 */

import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { AuditContext } from './audit-service';

/**
 * Extract IP address from Next.js request
 */
export function getClientIp(request: NextRequest): string | undefined {
  // Try various headers where IP might be stored
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = request.headers.get('cf-connecting-ip'); // Cloudflare
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return request.ip || undefined;
}

/**
 * Extract IP address from Next.js headers (for Route Handlers)
 */
export async function getClientIpFromHeaders(): Promise<string | undefined> {
  const headersList = await headers();
  
  const forwarded = headersList.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = headersList.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = headersList.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return undefined;
}

/**
 * Extract user agent from Next.js request
 */
export function getUserAgent(request: NextRequest): string | undefined {
  return request.headers.get('user-agent') || undefined;
}

/**
 * Extract user agent from Next.js headers (for Route Handlers)
 */
export async function getUserAgentFromHeaders(): Promise<string | undefined> {
  const headersList = await headers();
  return headersList.get('user-agent') || undefined;
}

/**
 * Create audit context from Next.js request
 */
export async function createAuditContext(
  request: NextRequest,
  userId?: string
): Promise<AuditContext> {
  const session = userId ? null : await getServerSession(authOptions);
  
  return {
    userId: userId || session?.user?.id || 'unknown',
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
    sessionId: session?.user?.id,
    requestId: crypto.randomUUID(),
  };
}

/**
 * Create audit context from Route Handler (using headers())
 */
export async function createAuditContextFromHeaders(
  userId?: string
): Promise<AuditContext> {
  const session = userId ? null : await getServerSession(authOptions);
  
  return {
    userId: userId || session?.user?.id || 'unknown',
    ipAddress: await getClientIpFromHeaders(),
    userAgent: await getUserAgentFromHeaders(),
    sessionId: session?.user?.id,
    requestId: crypto.randomUUID(),
  };
}

/**
 * Simple audit context for internal operations (no request context)
 */
export function createSystemAuditContext(userId: string): AuditContext {
  return {
    userId,
    ipAddress: 'system',
    userAgent: 'internal-operation',
    requestId: crypto.randomUUID(),
  };
}

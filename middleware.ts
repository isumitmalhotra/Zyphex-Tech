import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequestWithAuth } from 'next-auth/middleware';

// Security headers configuration
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')
};

// Define protected routes and their required roles
const protectedRoutes = [
  {
    path: '/super-admin',
    roles: ['SUPER_ADMIN'],
  },
  {
    path: '/admin',
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    path: '/project-manager',
    roles: ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'],
  },
  {
    path: '/team-member',
    roles: ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER'],
  },
  {
    path: '/client',
    roles: ['SUPER_ADMIN', 'ADMIN', 'CLIENT'],
  },
  {
    path: '/user',
    roles: ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER', 'CLIENT', 'USER'],
  },
  {
    path: '/api/super-admin',
    roles: ['SUPER_ADMIN'],
  },
  {
    path: '/api/project-manager',
    roles: ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'],
  },
  {
    path: '/api/team-member',
    roles: ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER'],
  },
  {
    path: '/api/client',
    roles: ['SUPER_ADMIN', 'ADMIN', 'CLIENT'],
  },
  {
    path: '/api/projects',
    roles: ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER', 'CLIENT'],
  },
  {
    path: '/api/clients',
    roles: ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'],
  },
  {
    path: '/api/teams',
    roles: ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'],
  },
  {
    path: '/api/admin',
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
];

// Rate limiting storage (in production, use Redis)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

function getRateLimitKey(req: NextRequestWithAuth): string {
  const ip = req.headers.get('x-forwarded-for') || 
           req.headers.get('x-real-ip') || 
           req.ip || 
           'unknown';
  return `rate_limit:${ip}`;
}

function checkRateLimit(req: NextRequestWithAuth): boolean {
  const key = getRateLimitKey(req);
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  
  // More generous rate limits for development and production
  const isDevelopment = process.env.NODE_ENV === 'development';
  const maxRequests = req.nextUrl.pathname.startsWith('/api/') 
    ? (isDevelopment ? 1000 : 500) // API: 1000 dev, 500 prod (increased from 100)
    : (isDevelopment ? 5000 : 2000); // Pages: 5000 dev, 2000 prod (increased from 1000)
  
  const record = requestCounts.get(key);
  
  if (!record || now > record.resetTime) {
    // Reset or create new record
    requestCounts.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

export default async function middleware(req: NextRequestWithAuth) {
  const path = req.nextUrl.pathname;
  
  // Skip rate limiting for NextAuth.js internal endpoints
  const isNextAuthInternal = path.startsWith('/api/auth/') && (
    path.includes('/_log') ||
    path.includes('/session') ||
    path.includes('/providers') ||
    path.includes('/error') ||
    path.includes('/csrf')
  );
  
  // Apply rate limiting (except for NextAuth internal endpoints)
  if (!isNextAuthInternal && !checkRateLimit(req)) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': '900', // 15 minutes
        ...securityHeaders
      }
    });
  }

  // Get authentication token
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isAuthenticated = !!token;

  // Allow access to auth-related routes and public routes
  if (
    path.startsWith('/api/auth') || 
    path === '/login' || 
    path === '/register' ||
    path === '/forgot-password' ||
    path === '/reset-password' ||
    path === '/verify-email' ||
    path.startsWith('/api/public') ||
    path === '/' ||
    path === '/about' ||
    path === '/contact' ||
    path === '/services' ||
    path === '/portfolio' ||
    path === '/blog' ||
    path === '/privacy' ||
    path === '/terms' ||
    path === '/cookies'
  ) {
    const response = NextResponse.next();
    
    // Apply security headers to all responses
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }

  // Check if the route is protected
  const protectedRoute = protectedRoutes.find((route) =>
    path.startsWith(route.path)
  );

  // If the route is not protected, allow access with security headers
  if (!protectedRoute) {
    const response = NextResponse.next();
    
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }

  // If the user is not authenticated, redirect to login
  if (!isAuthenticated) {
    const url = new URL('/login', req.url);
    url.searchParams.set('callbackUrl', encodeURI(req.url));
    return NextResponse.redirect(url);
  }

  // Check if the user has the required role
  const userRole = token.role as string;
  if (!protectedRoute.roles.includes(userRole)) {
    // Redirect to unauthorized page or appropriate dashboard
    const dashboardRoutes: Record<string, string> = {
      'USER': '/user',
      'CLIENT': '/client',
      'TEAM_MEMBER': '/team-member',
      'PROJECT_MANAGER': '/project-manager',
      'ADMIN': '/admin',
      'SUPER_ADMIN': '/super-admin'
    };
    
    const redirectPath = dashboardRoutes[userRole] || '/';
    return NextResponse.redirect(new URL(redirectPath, req.url));
  }

  // Allow access with security headers
  const response = NextResponse.next();
  
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};

// Cleanup rate limit records periodically
if (typeof window === 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of requestCounts.entries()) {
      if (now > record.resetTime) {
        requestCounts.delete(key);
      }
    }
  }, 5 * 60 * 1000); // Cleanup every 5 minutes
}
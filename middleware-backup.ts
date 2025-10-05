import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequestWithAuth } from 'next-auth/middleware';

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

export default async function middleware(req: NextRequestWithAuth) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isAuthenticated = !!token;
  const path = req.nextUrl.pathname;

  // Allow access to auth-related routes
  if (path.startsWith('/api/auth') || path === '/login' || path === '/register') {
    return NextResponse.next();
  }

  // Check if the route is protected
  const protectedRoute = protectedRoutes.find((route) =>
    path.startsWith(route.path)
  );

  // If the route is not protected, allow access
  if (!protectedRoute) {
    return NextResponse.next();
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
    // Redirect to unauthorized page or home page
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Allow access
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/super-admin/:path*',
    '/admin/:path*',
    '/project-manager/:path*',
    '/team-member/:path*',
    '/client/:path*',
    '/user/:path*',
    '/api/super-admin/:path*',
    '/api/project-manager/:path*',
    '/api/team-member/:path*',
    '/api/client/:path*',
    '/api/projects/:path*',
    '/api/clients/:path*',
    '/api/teams/:path*',
    '/api/admin/:path*',
  ],
};
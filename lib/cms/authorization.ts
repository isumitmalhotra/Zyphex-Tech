/**
 * CMS Authorization Utilities
 * Functions for checking permissions and authorizing actions
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  type CMSPermission,
  type CMSRoleId,
  CMS_ROLES,
  roleHasPermission,
  roleHasAnyPermission,
  roleHasAllPermissions,
} from './permissions';
import { CmsApiError } from './error-handler';

/**
 * ============================================================================
 * Session & User Types
 * ============================================================================
 */

export interface CMSUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  cmsRole?: CMSRoleId;
  permissions?: CMSPermission[];
}

export interface CMSSession {
  user: CMSUser;
}

/**
 * ============================================================================
 * Session Management
 * ============================================================================
 */

/**
 * Get current session with CMS user info
 */
export async function getCMSSession(): Promise<CMSSession | null> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return null;
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.name || null,
      role: session.user.role || 'USER',
      cmsRole: getCMSRoleFromUserRole(session.user.role),
    },
  };
}

/**
 * Require authenticated session
 */
export async function requireSession(): Promise<CMSSession> {
  const session = await getCMSSession();
  if (!session) {
    throw new CmsApiError('You must be logged in to perform this action', 401);
  }
  return session;
}

/**
 * Map user role to CMS role
 */
export function getCMSRoleFromUserRole(userRole: string): CMSRoleId {
  // Map existing roles to CMS roles
  switch (userRole) {
    case 'SUPER_ADMIN':
      return 'SUPER_ADMIN';
    case 'ADMIN':
      return 'ADMIN';
    case 'PROJECT_MANAGER':
      return 'PROJECT_MANAGER';
    case 'CLIENT':
      return 'VIEWER';
    case 'TEAM_MEMBER':
      return 'CONTENT_EDITOR';
    case 'USER':
    default:
      return 'VIEWER';
  }
}

/**
 * ============================================================================
 * Permission Checking
 * ============================================================================
 */

/**
 * Check if user has a specific permission
 */
export function userHasPermission(user: CMSUser, permission: CMSPermission): boolean {
  if (!user.cmsRole) return false;
  
  // Super admin always has all permissions
  if (user.cmsRole === 'SUPER_ADMIN') return true;
  
  return roleHasPermission(user.cmsRole, permission);
}

/**
 * Check if user has any of the specified permissions
 */
export function userHasAnyPermission(
  user: CMSUser,
  permissions: CMSPermission[]
): boolean {
  if (!user.cmsRole) return false;
  
  // Super admin always has all permissions
  if (user.cmsRole === 'SUPER_ADMIN') return true;
  
  return roleHasAnyPermission(user.cmsRole, permissions);
}

/**
 * Check if user has all of the specified permissions
 */
export function userHasAllPermissions(
  user: CMSUser,
  permissions: CMSPermission[]
): boolean {
  if (!user.cmsRole) return false;
  
  // Super admin always has all permissions
  if (user.cmsRole === 'SUPER_ADMIN') return true;
  
  return roleHasAllPermissions(user.cmsRole, permissions);
}

/**
 * ============================================================================
 * Authorization Guards
 * ============================================================================
 */

/**
 * Require specific permission or throw error
 */
export async function requirePermission(permission: CMSPermission): Promise<CMSUser> {
  const session = await requireSession();
  
  if (!userHasPermission(session.user, permission)) {
    throw new CmsApiError(
      `You do not have permission to perform this action. Required: ${permission}`,
      403
    );
  }
  
  return session.user;
}

/**
 * Require any of the specified permissions
 */
export async function requireAnyPermission(
  permissions: CMSPermission[]
): Promise<CMSUser> {
  const session = await requireSession();
  
  if (!userHasAnyPermission(session.user, permissions)) {
    throw new CmsApiError(
      `You do not have permission to perform this action. Required one of: ${permissions.join(', ')}`,
      403
    );
  }
  
  return session.user;
}

/**
 * Require all of the specified permissions
 */
export async function requireAllPermissions(
  permissions: CMSPermission[]
): Promise<CMSUser> {
  const session = await requireSession();
  
  if (!userHasAllPermissions(session.user, permissions)) {
    throw new CmsApiError(
      `You do not have permission to perform this action. Required all of: ${permissions.join(', ')}`,
      403
    );
  }
  
  return session.user;
}

/**
 * Require specific CMS role
 */
export async function requireRole(roleId: CMSRoleId): Promise<CMSUser> {
  const session = await requireSession();
  
  if (session.user.cmsRole !== roleId) {
    throw new CmsApiError(
      `You must have ${CMS_ROLES[roleId]?.name} role to perform this action`,
      403
    );
  }
  
  return session.user;
}

/**
 * Require minimum role level
 */
export async function requireMinimumRole(roleId: CMSRoleId): Promise<CMSUser> {
  const session = await requireSession();
  
  const userRole = session.user.cmsRole;
  if (!userRole) {
    throw new CmsApiError('User role not found', 403);
  }
  
  const requiredRole = CMS_ROLES[roleId];
  const currentRole = CMS_ROLES[userRole];
  
  if (!currentRole || !requiredRole || currentRole.level < requiredRole.level) {
    throw new CmsApiError(
      `You must have at least ${requiredRole.name} role to perform this action`,
      403
    );
  }
  
  return session.user;
}

/**
 * ============================================================================
 * Resource Ownership Checks
 * ============================================================================
 */

/**
 * Check if user is the owner of a resource
 */
export function isResourceOwner(userId: string, resourceOwnerId: string | null): boolean {
  return resourceOwnerId === userId;
}

/**
 * Check if user can edit a resource (owner or has permission)
 */
export async function canEditResource(
  resourceOwnerId: string | null,
  permission: CMSPermission
): Promise<{ canEdit: boolean; user: CMSUser }> {
  const session = await requireSession();
  
  // Check if user is owner
  if (isResourceOwner(session.user.id, resourceOwnerId)) {
    return { canEdit: true, user: session.user };
  }
  
  // Check if user has permission
  const hasPermission = userHasPermission(session.user, permission);
  return { canEdit: hasPermission, user: session.user };
}

/**
 * Require user to be owner or have permission
 */
export async function requireOwnerOrPermission(
  resourceOwnerId: string | null,
  permission: CMSPermission
): Promise<CMSUser> {
  const { canEdit, user } = await canEditResource(resourceOwnerId, permission);
  
  if (!canEdit) {
    throw new CmsApiError(
      'You do not have permission to edit this resource',
      403
    );
  }
  
  return user;
}

/**
 * ============================================================================
 * Page-Specific Authorization
 * ============================================================================
 */

/**
 * Check if user can edit a specific page
 */
export async function canEditPage(pageId: string): Promise<boolean> {
  const session = await getCMSSession();
  if (!session) return false;
  
  // Get page owner
  const page = await prisma.cmsPage.findUnique({
    where: { id: pageId },
    select: { authorId: true },
  });
  
  if (!page) return false;
  
  // Check if owner or has permission
  if (isResourceOwner(session.user.id, page.authorId)) {
    return true;
  }
  
  return userHasPermission(session.user, 'cms.pages.edit');
}

/**
 * Check if user can publish a page
 */
export async function canPublishPage(): Promise<boolean> {
  const session = await getCMSSession();
  if (!session) return false;
  
  return userHasPermission(session.user, 'cms.pages.publish');
}

/**
 * Check if user can delete a page
 */
export async function canDeletePage(pageId: string): Promise<boolean> {
  const session = await getCMSSession();
  if (!session) return false;
  
  // Get page owner
  const page = await prisma.cmsPage.findUnique({
    where: { id: pageId },
    select: { authorId: true },
  });
  
  if (!page) return false;
  
  // Only users with explicit delete permission can delete
  return userHasPermission(session.user, 'cms.pages.delete');
}

/**
 * ============================================================================
 * Workflow Authorization
 * ============================================================================
 */

/**
 * Check if user can approve/reject workflows
 */
export async function canApproveWorkflow(): Promise<boolean> {
  const session = await getCMSSession();
  if (!session) return false;
  
  return userHasPermission(session.user, 'cms.workflows.approve');
}

/**
 * Check if user can submit for review
 */
export async function canSubmitForReview(): Promise<boolean> {
  const session = await getCMSSession();
  if (!session) return false;
  
  return userHasPermission(session.user, 'cms.workflows.submit');
}

/**
 * ============================================================================
 * Permission Info Utilities
 * ============================================================================
 */

/**
 * Get all permissions for current user
 */
export async function getCurrentUserPermissions(): Promise<CMSPermission[]> {
  const session = await getCMSSession();
  if (!session || !session.user.cmsRole) return [];
  
  const role = CMS_ROLES[session.user.cmsRole];
  return role ? role.permissions : [];
}

/**
 * Get permission info for current user
 */
export async function getCurrentUserPermissionInfo() {
  const session = await getCMSSession();
  if (!session || !session.user.cmsRole) {
    return {
      role: null,
      roleName: null,
      permissions: [],
      level: 0,
    };
  }
  
  const role = CMS_ROLES[session.user.cmsRole];
  return {
    role: session.user.cmsRole,
    roleName: role?.name || null,
    permissions: role?.permissions || [],
    level: role?.level || 0,
  };
}

/**
 * ============================================================================
 * Authorization Middleware Wrapper
 * ============================================================================
 */

/**
 * Wrap an API handler with permission check
 */
export function withPermission<T extends unknown[]>(
  permission: CMSPermission,
  handler: (user: CMSUser, ...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    const user = await requirePermission(permission);
    return handler(user, ...args);
  };
}

/**
 * Wrap an API handler with any permission check
 */
export function withAnyPermission<T extends unknown[]>(
  permissions: CMSPermission[],
  handler: (user: CMSUser, ...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    const user = await requireAnyPermission(permissions);
    return handler(user, ...args);
  };
}

/**
 * Wrap an API handler with role check
 */
export function withRole<T extends unknown[]>(
  roleId: CMSRoleId,
  handler: (user: CMSUser, ...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    const user = await requireRole(roleId);
    return handler(user, ...args);
  };
}

/**
 * Wrap an API handler with minimum role check
 */
export function withMinimumRole<T extends unknown[]>(
  roleId: CMSRoleId,
  handler: (user: CMSUser, ...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    const user = await requireMinimumRole(roleId);
    return handler(user, ...args);
  };
}

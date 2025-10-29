/**
 * CMS Permissions Hook
 * React hook for checking CMS permissions in client components
 */

'use client';

import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import type { CMSPermission, CMSRoleId } from '@/lib/cms/permissions';
import { 
  CMS_ROLES, 
  roleHasPermission, 
  roleHasAnyPermission,
  roleHasAllPermissions,
  roleHasHigherLevelThan,
} from '@/lib/cms/permissions';

/**
 * Map user role to CMS role (client-side)
 */
function getCMSRoleFromUserRole(userRole: string): CMSRoleId {
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
 * Hook for CMS permission checking
 */
export function useCMSPermissions() {
  const { data: session, status } = useSession();

  const permissions = useMemo(() => {
    if (!session?.user) {
      return {
        isLoading: status === 'loading',
        isAuthenticated: false,
        cmsRole: null,
        roleName: null,
        roleLevel: 0,
        permissions: [] as CMSPermission[],
        hasPermission: () => false,
        hasAnyPermission: () => false,
        hasAllPermissions: () => false,
        hasRole: () => false,
        hasMinimumRole: () => false,
        isSuperAdmin: false,
        isAdmin: false,
        isProjectManager: false,
        isContentEditor: false,
        isViewer: false,
      };
    }

    const userRole = session.user.role || 'USER';
    const cmsRole = getCMSRoleFromUserRole(userRole);
    const roleConfig = CMS_ROLES[cmsRole];

    return {
      isLoading: false,
      isAuthenticated: true,
      cmsRole,
      roleName: roleConfig?.name || null,
      roleLevel: roleConfig?.level || 0,
      permissions: roleConfig?.permissions || [],

      /**
       * Check if user has a specific permission
       */
      hasPermission: (permission: CMSPermission): boolean => {
        return roleHasPermission(cmsRole, permission);
      },

      /**
       * Check if user has any of the specified permissions
       */
      hasAnyPermission: (permissionList: CMSPermission[]): boolean => {
        return roleHasAnyPermission(cmsRole, permissionList);
      },

      /**
       * Check if user has all of the specified permissions
       */
      hasAllPermissions: (permissionList: CMSPermission[]): boolean => {
        return roleHasAllPermissions(cmsRole, permissionList);
      },

      /**
       * Check if user has a specific role
       */
      hasRole: (roleId: CMSRoleId): boolean => {
        return cmsRole === roleId;
      },

      /**
       * Check if user has at least the specified role level
       */
      hasMinimumRole: (roleId: CMSRoleId): boolean => {
        return roleHasHigherLevelThan(cmsRole, roleId) || cmsRole === roleId;
      },

      // Role shortcuts
      isSuperAdmin: cmsRole === 'SUPER_ADMIN',
      isAdmin: cmsRole === 'ADMIN',
      isProjectManager: cmsRole === 'PROJECT_MANAGER',
      isContentEditor: cmsRole === 'CONTENT_EDITOR',
      isViewer: cmsRole === 'VIEWER',
    };
  }, [session, status]);

  return permissions;
}

/**
 * Hook to check if user is resource owner
 */
export function useIsResourceOwner(resourceOwnerId: string | null): boolean {
  const { data: session } = useSession();
  
  if (!session?.user || !resourceOwnerId) {
    return false;
  }
  
  return session.user.id === resourceOwnerId;
}

/**
 * Hook to check if user can edit a resource (owner or has permission)
 */
export function useCanEditResource(
  resourceOwnerId: string | null,
  permission: CMSPermission
): boolean {
  const { hasPermission } = useCMSPermissions();
  const isOwner = useIsResourceOwner(resourceOwnerId);
  
  return isOwner || hasPermission(permission);
}

/**
 * Hook to get permission groups for UI
 */
export function useCMSPermissionGroups() {
  const { permissions } = useCMSPermissions();
  
  return useMemo(() => {
    const groups: Record<string, CMSPermission[]> = {
      pages: [],
      sections: [],
      templates: [],
      media: [],
      versions: [],
      workflows: [],
      schedules: [],
      analytics: [],
      settings: [],
    };
    
    permissions.forEach((permission) => {
      if (permission.startsWith('cms.pages.')) groups.pages.push(permission);
      else if (permission.startsWith('cms.sections.')) groups.sections.push(permission);
      else if (permission.startsWith('cms.templates.')) groups.templates.push(permission);
      else if (permission.startsWith('cms.media.')) groups.media.push(permission);
      else if (permission.startsWith('cms.versions.')) groups.versions.push(permission);
      else if (permission.startsWith('cms.workflows.')) groups.workflows.push(permission);
      else if (permission.startsWith('cms.schedules.')) groups.schedules.push(permission);
      else if (permission.startsWith('cms.analytics.')) groups.analytics.push(permission);
      else if (permission.startsWith('cms.settings.')) groups.settings.push(permission);
    });
    
    return groups;
  }, [permissions]);
}

/**
 * CMS Permissions & Role Definitions
 * Defines all CMS-specific permissions and role configurations
 */

/**
 * ============================================================================
 * CMS Permission Definitions
 * ============================================================================
 */

export const CMS_PERMISSIONS = {
  // Page Management
  'cms.pages.view': 'View CMS pages',
  'cms.pages.create': 'Create new pages',
  'cms.pages.edit': 'Edit existing pages',
  'cms.pages.delete': 'Delete pages',
  'cms.pages.publish': 'Publish pages',
  'cms.pages.unpublish': 'Unpublish pages',
  'cms.pages.restore': 'Restore deleted pages',

  // Section Management
  'cms.sections.view': 'View page sections',
  'cms.sections.create': 'Create new sections',
  'cms.sections.edit': 'Edit sections',
  'cms.sections.delete': 'Delete sections',
  'cms.sections.reorder': 'Reorder sections',

  // Template Management
  'cms.templates.view': 'View templates',
  'cms.templates.create': 'Create new templates',
  'cms.templates.edit': 'Edit templates',
  'cms.templates.delete': 'Delete templates',

  // Media Management
  'cms.media.view': 'View media library',
  'cms.media.upload': 'Upload media files',
  'cms.media.edit': 'Edit media metadata',
  'cms.media.delete': 'Delete media files',
  'cms.media.manage_folders': 'Manage media folders',

  // Version Control
  'cms.versions.view': 'View version history',
  'cms.versions.rollback': 'Rollback to previous versions',

  // Workflow Management
  'cms.workflows.submit': 'Submit content for review',
  'cms.workflows.review': 'Review submitted content',
  'cms.workflows.approve': 'Approve content',
  'cms.workflows.reject': 'Reject content',

  // Schedule Management
  'cms.schedules.view': 'View schedules',
  'cms.schedules.create': 'Create schedules',
  'cms.schedules.edit': 'Edit schedules',
  'cms.schedules.delete': 'Delete schedules',
  'cms.schedules.cancel': 'Cancel schedules',

  // Activity & Analytics
  'cms.activity.view': 'View activity logs',
  'cms.analytics.view': 'View analytics',

  // System Administration
  'cms.settings.view': 'View CMS settings',
  'cms.settings.edit': 'Edit CMS settings',
  'cms.users.manage': 'Manage CMS user roles',
} as const;

export type CMSPermission = keyof typeof CMS_PERMISSIONS;

/**
 * ============================================================================
 * CMS Role Definitions
 * ============================================================================
 */

export interface CMSRole {
  id: string;
  name: string;
  description: string;
  permissions: CMSPermission[];
  level: number; // Higher number = more access
  isSystem: boolean;
}

export const CMS_ROLES: Record<string, CMSRole> = {
  SUPER_ADMIN: {
    id: 'SUPER_ADMIN',
    name: 'Super Admin',
    description: 'Full access to all CMS features and settings',
    level: 100,
    isSystem: true,
    permissions: Object.keys(CMS_PERMISSIONS) as CMSPermission[],
  },

  ADMIN: {
    id: 'ADMIN',
    name: 'Admin',
    description: 'Full CMS access except system settings',
    level: 90,
    isSystem: false,
    permissions: [
      // All page permissions
      'cms.pages.view',
      'cms.pages.create',
      'cms.pages.edit',
      'cms.pages.delete',
      'cms.pages.publish',
      'cms.pages.unpublish',
      'cms.pages.restore',

      // All section permissions
      'cms.sections.view',
      'cms.sections.create',
      'cms.sections.edit',
      'cms.sections.delete',
      'cms.sections.reorder',

      // All template permissions
      'cms.templates.view',
      'cms.templates.create',
      'cms.templates.edit',
      'cms.templates.delete',

      // All media permissions
      'cms.media.view',
      'cms.media.upload',
      'cms.media.edit',
      'cms.media.delete',
      'cms.media.manage_folders',

      // Version control
      'cms.versions.view',
      'cms.versions.rollback',

      // Workflow management
      'cms.workflows.submit',
      'cms.workflows.review',
      'cms.workflows.approve',
      'cms.workflows.reject',

      // Schedule management
      'cms.schedules.view',
      'cms.schedules.create',
      'cms.schedules.edit',
      'cms.schedules.delete',
      'cms.schedules.cancel',

      // Activity and analytics
      'cms.activity.view',
      'cms.analytics.view',

      // Settings (view only)
      'cms.settings.view',
    ],
  },

  PROJECT_MANAGER: {
    id: 'PROJECT_MANAGER',
    name: 'Project Manager',
    description: 'Can manage content and workflows, approve submissions',
    level: 70,
    isSystem: false,
    permissions: [
      // Page management (no delete)
      'cms.pages.view',
      'cms.pages.create',
      'cms.pages.edit',
      'cms.pages.publish',
      'cms.pages.unpublish',

      // Section management
      'cms.sections.view',
      'cms.sections.create',
      'cms.sections.edit',
      'cms.sections.delete',
      'cms.sections.reorder',

      // Templates (view and use)
      'cms.templates.view',

      // Media management
      'cms.media.view',
      'cms.media.upload',
      'cms.media.edit',
      'cms.media.manage_folders',

      // Version control
      'cms.versions.view',
      'cms.versions.rollback',

      // Workflow management
      'cms.workflows.submit',
      'cms.workflows.review',
      'cms.workflows.approve',
      'cms.workflows.reject',

      // Schedule management
      'cms.schedules.view',
      'cms.schedules.create',
      'cms.schedules.edit',
      'cms.schedules.delete',
      'cms.schedules.cancel',

      // Activity and analytics
      'cms.activity.view',
      'cms.analytics.view',
    ],
  },

  CONTENT_EDITOR: {
    id: 'CONTENT_EDITOR',
    name: 'Content Editor',
    description: 'Can create and edit content, submit for review',
    level: 50,
    isSystem: false,
    permissions: [
      // Page management (create and edit own pages)
      'cms.pages.view',
      'cms.pages.create',
      'cms.pages.edit',

      // Section management
      'cms.sections.view',
      'cms.sections.create',
      'cms.sections.edit',
      'cms.sections.delete',
      'cms.sections.reorder',

      // Templates (view and use)
      'cms.templates.view',

      // Media management
      'cms.media.view',
      'cms.media.upload',
      'cms.media.edit',

      // Version control (view only)
      'cms.versions.view',

      // Workflow submission
      'cms.workflows.submit',

      // Schedules (view only)
      'cms.schedules.view',

      // Activity (own actions)
      'cms.activity.view',
    ],
  },

  VIEWER: {
    id: 'VIEWER',
    name: 'Viewer',
    description: 'Read-only access to CMS content',
    level: 10,
    isSystem: false,
    permissions: [
      'cms.pages.view',
      'cms.sections.view',
      'cms.templates.view',
      'cms.media.view',
      'cms.versions.view',
      'cms.schedules.view',
      'cms.activity.view',
    ],
  },
} as const;

export type CMSRoleId = keyof typeof CMS_ROLES;

/**
 * ============================================================================
 * Permission Check Utilities
 * ============================================================================
 */

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(roleId: CMSRoleId, permission: CMSPermission): boolean {
  const role = CMS_ROLES[roleId];
  if (!role) return false;
  return role.permissions.includes(permission);
}

/**
 * Check if a role has any of the specified permissions
 */
export function roleHasAnyPermission(
  roleId: CMSRoleId,
  permissions: CMSPermission[]
): boolean {
  return permissions.some((permission) => roleHasPermission(roleId, permission));
}

/**
 * Check if a role has all of the specified permissions
 */
export function roleHasAllPermissions(
  roleId: CMSRoleId,
  permissions: CMSPermission[]
): boolean {
  return permissions.every((permission) => roleHasPermission(roleId, permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(roleId: CMSRoleId): CMSPermission[] {
  const role = CMS_ROLES[roleId];
  return role ? role.permissions : [];
}

/**
 * Compare role levels
 */
export function roleHasHigherLevelThan(roleId1: CMSRoleId, roleId2: CMSRoleId): boolean {
  const role1 = CMS_ROLES[roleId1];
  const role2 = CMS_ROLES[roleId2];
  if (!role1 || !role2) return false;
  return role1.level > role2.level;
}

/**
 * Get role by ID
 */
export function getRole(roleId: CMSRoleId): CMSRole | undefined {
  return CMS_ROLES[roleId];
}

/**
 * Get all available roles
 */
export function getAllRoles(): CMSRole[] {
  return Object.values(CMS_ROLES);
}

/**
 * Get roles that can be assigned (non-system roles)
 */
export function getAssignableRoles(): CMSRole[] {
  return getAllRoles().filter((role) => !role.isSystem);
}

/**
 * ============================================================================
 * Permission Groups (for UI organization)
 * ============================================================================
 */

export const PERMISSION_GROUPS = {
  pages: {
    name: 'Page Management',
    description: 'Permissions for managing CMS pages',
    permissions: [
      'cms.pages.view',
      'cms.pages.create',
      'cms.pages.edit',
      'cms.pages.delete',
      'cms.pages.publish',
      'cms.pages.unpublish',
      'cms.pages.restore',
    ] as CMSPermission[],
  },
  sections: {
    name: 'Section Management',
    description: 'Permissions for managing page sections',
    permissions: [
      'cms.sections.view',
      'cms.sections.create',
      'cms.sections.edit',
      'cms.sections.delete',
      'cms.sections.reorder',
    ] as CMSPermission[],
  },
  templates: {
    name: 'Template Management',
    description: 'Permissions for managing templates',
    permissions: [
      'cms.templates.view',
      'cms.templates.create',
      'cms.templates.edit',
      'cms.templates.delete',
    ] as CMSPermission[],
  },
  media: {
    name: 'Media Management',
    description: 'Permissions for managing media files',
    permissions: [
      'cms.media.view',
      'cms.media.upload',
      'cms.media.edit',
      'cms.media.delete',
      'cms.media.manage_folders',
    ] as CMSPermission[],
  },
  versions: {
    name: 'Version Control',
    description: 'Permissions for version control',
    permissions: ['cms.versions.view', 'cms.versions.rollback'] as CMSPermission[],
  },
  workflows: {
    name: 'Workflow Management',
    description: 'Permissions for content workflows',
    permissions: [
      'cms.workflows.submit',
      'cms.workflows.review',
      'cms.workflows.approve',
      'cms.workflows.reject',
    ] as CMSPermission[],
  },
  schedules: {
    name: 'Schedule Management',
    description: 'Permissions for scheduling content',
    permissions: [
      'cms.schedules.view',
      'cms.schedules.create',
      'cms.schedules.edit',
      'cms.schedules.delete',
      'cms.schedules.cancel',
    ] as CMSPermission[],
  },
  analytics: {
    name: 'Analytics & Activity',
    description: 'Permissions for viewing analytics and activity',
    permissions: ['cms.activity.view', 'cms.analytics.view'] as CMSPermission[],
  },
  settings: {
    name: 'System Settings',
    description: 'Permissions for system configuration',
    permissions: [
      'cms.settings.view',
      'cms.settings.edit',
      'cms.users.manage',
    ] as CMSPermission[],
  },
} as const;

export type PermissionGroup = keyof typeof PERMISSION_GROUPS;

/**
 * Get permissions by group
 */
export function getPermissionsByGroup(group: PermissionGroup): CMSPermission[] {
  return PERMISSION_GROUPS[group]?.permissions || [];
}

/**
 * Get all permission groups
 */
export function getAllPermissionGroups() {
  return Object.entries(PERMISSION_GROUPS).map(([key, value]) => ({
    id: key as PermissionGroup,
    ...value,
  }));
}

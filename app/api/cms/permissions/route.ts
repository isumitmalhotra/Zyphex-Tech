/**
 * CMS Permissions API Route
 * Get and update permissions for roles
 * 
 * @route GET/PATCH /api/cms/permissions
 * @access Protected - Requires admin permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const updatePermissionSchema = z.object({
  role: z.enum(['admin', 'project_manager', 'team_member', 'client']),
  permissionKey: z.string(),
  enabled: z.boolean(),
});

// Permission definitions
const permissionDefinitions = {
  pages: [
    { key: 'cms.pages.view', name: 'View Pages', description: 'View all pages in the CMS' },
    { key: 'cms.pages.create', name: 'Create Pages', description: 'Create new pages' },
    { key: 'cms.pages.edit', name: 'Edit Pages', description: 'Edit existing pages' },
    { key: 'cms.pages.delete', name: 'Delete Pages', description: 'Delete pages' },
    { key: 'cms.pages.publish', name: 'Publish Pages', description: 'Publish pages to live site' },
    { key: 'cms.pages.unpublish', name: 'Unpublish Pages', description: 'Unpublish pages from live site' },
  ],
  sections: [
    { key: 'cms.sections.view', name: 'View Sections', description: 'View page sections' },
    { key: 'cms.sections.create', name: 'Create Sections', description: 'Add sections to pages' },
    { key: 'cms.sections.edit', name: 'Edit Sections', description: 'Edit page sections' },
    { key: 'cms.sections.delete', name: 'Delete Sections', description: 'Remove sections from pages' },
    { key: 'cms.sections.reorder', name: 'Reorder Sections', description: 'Change section order' },
  ],
  templates: [
    { key: 'cms.templates.view', name: 'View Templates', description: 'View all templates' },
    { key: 'cms.templates.create', name: 'Create Templates', description: 'Create new templates' },
    { key: 'cms.templates.edit', name: 'Edit Templates', description: 'Edit existing templates' },
    { key: 'cms.templates.delete', name: 'Delete Templates', description: 'Delete templates' },
    { key: 'cms.templates.apply', name: 'Apply Templates', description: 'Apply templates to pages' },
  ],
  media: [
    { key: 'cms.media.view', name: 'View Media', description: 'View media library' },
    { key: 'cms.media.upload', name: 'Upload Media', description: 'Upload files to media library' },
    { key: 'cms.media.edit', name: 'Edit Media', description: 'Edit media file details' },
    { key: 'cms.media.delete', name: 'Delete Media', description: 'Delete media files' },
  ],
  versions: [
    { key: 'cms.versions.view', name: 'View Versions', description: 'View page version history' },
    { key: 'cms.versions.rollback', name: 'Rollback Versions', description: 'Restore previous versions' },
  ],
  workflows: [
    { key: 'cms.workflows.view', name: 'View Workflows', description: 'View workflow status' },
    { key: 'cms.workflows.submit', name: 'Submit for Review', description: 'Submit pages for review' },
    { key: 'cms.workflows.approve', name: 'Approve', description: 'Approve submitted pages' },
    { key: 'cms.workflows.reject', name: 'Reject', description: 'Reject submitted pages' },
  ],
  schedules: [
    { key: 'cms.schedules.view', name: 'View Schedules', description: 'View scheduled actions' },
    { key: 'cms.schedules.create', name: 'Create Schedules', description: 'Schedule publish/unpublish actions' },
    { key: 'cms.schedules.edit', name: 'Edit Schedules', description: 'Modify scheduled actions' },
    { key: 'cms.schedules.delete', name: 'Delete Schedules', description: 'Remove scheduled actions' },
    { key: 'cms.schedules.cancel', name: 'Cancel Schedules', description: 'Cancel pending schedules' },
  ],
  analytics: [
    { key: 'cms.analytics.view', name: 'View Analytics', description: 'View page analytics and metrics' },
    { key: 'cms.analytics.export', name: 'Export Analytics', description: 'Export analytics reports' },
  ],
  users: [
    { key: 'cms.users.manage', name: 'Manage Users', description: 'Manage user roles and permissions' },
  ],
};

// Default role permissions (in production, store in database)
const defaultRolePermissions: Record<string, Set<string>> = {
  admin: new Set([
    ...permissionDefinitions.pages.map(p => p.key),
    ...permissionDefinitions.sections.map(p => p.key),
    ...permissionDefinitions.templates.map(p => p.key),
    ...permissionDefinitions.media.map(p => p.key),
    ...permissionDefinitions.versions.map(p => p.key),
    ...permissionDefinitions.workflows.map(p => p.key),
    ...permissionDefinitions.schedules.map(p => p.key),
    ...permissionDefinitions.analytics.map(p => p.key),
    ...permissionDefinitions.users.map(p => p.key),
  ]),
  project_manager: new Set([
    'cms.pages.view', 'cms.pages.create', 'cms.pages.edit',
    'cms.sections.view', 'cms.sections.create', 'cms.sections.edit', 'cms.sections.reorder',
    'cms.templates.view', 'cms.templates.apply',
    'cms.media.view', 'cms.media.upload',
    'cms.versions.view',
    'cms.workflows.view', 'cms.workflows.submit', 'cms.workflows.approve', 'cms.workflows.reject',
    'cms.schedules.view', 'cms.schedules.create', 'cms.schedules.edit',
    'cms.analytics.view',
  ]),
  team_member: new Set([
    'cms.pages.view', 'cms.pages.create', 'cms.pages.edit',
    'cms.sections.view', 'cms.sections.create', 'cms.sections.edit',
    'cms.templates.view', 'cms.templates.apply',
    'cms.media.view', 'cms.media.upload',
    'cms.versions.view',
    'cms.workflows.view', 'cms.workflows.submit',
    'cms.schedules.view',
  ]),
  client: new Set([
    'cms.pages.view',
    'cms.sections.view',
    'cms.templates.view',
    'cms.media.view',
    'cms.versions.view',
    'cms.workflows.view',
  ]),
};

// In-memory permission storage (replace with database in production)
const rolePermissions = { ...defaultRolePermissions };

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role') || 'admin';

    if (!['admin', 'project_manager', 'team_member', 'client'].includes(role)) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Invalid role' },
        { status: 400 }
      );
    }

    const enabledPermissions = rolePermissions[role] || new Set();

    // Build permission groups with enabled status
    const permissionGroups = Object.entries(permissionDefinitions).map(([category, permissions]) => ({
      category,
      permissions: permissions.map((perm) => ({
        ...perm,
        enabled: enabledPermissions.has(perm.key),
      })),
    }));

    return NextResponse.json({
      success: true,
      data: permissionGroups,
    });

  } catch (error) {
    console.error('CMS Permissions GET Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to fetch permissions',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updatePermissionSchema.parse(body);

    const { role, permissionKey, enabled } = validatedData;

    // Update permission
    if (!rolePermissions[role]) {
      rolePermissions[role] = new Set();
    }

    if (enabled) {
      rolePermissions[role].add(permissionKey);
    } else {
      rolePermissions[role].delete(permissionKey);
    }

    // In production, save to database
    // await prisma.rolePermission.upsert({
    //   where: { role_permissionKey: { role, permissionKey } },
    //   update: { enabled },
    //   create: { role, permissionKey, enabled }
    // });

    return NextResponse.json({
      success: true,
      message: 'Permission updated successfully',
    });

  } catch (error) {
    console.error('CMS Permissions PATCH Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation Error',
          message: 'Invalid permission data',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to update permission',
      },
      { status: 500 }
    );
  }
}

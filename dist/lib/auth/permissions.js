"use strict";
/**
 * Comprehensive Permission System for ZyphexTech Platform
 * Defines all granular permissions for role-based access control
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionDescriptions = exports.DefaultRolePermissions = exports.PermissionCategories = exports.Permission = void 0;
exports.getPermissionsForRole = getPermissionsForRole;
exports.roleHasPermission = roleHasPermission;
exports.hasPermission = hasPermission;
exports.isAdmin = isAdmin;
exports.isSuperAdmin = isSuperAdmin;
exports.hasAnyPermission = hasAnyPermission;
exports.hasAllPermissions = hasAllPermissions;
var Permission;
(function (Permission) {
    // System Administration
    Permission["MANAGE_SYSTEM"] = "manage_system";
    Permission["VIEW_AUDIT_LOGS"] = "view_audit_logs";
    Permission["MANAGE_BACKUPS"] = "manage_backups";
    // User Management
    Permission["CREATE_USER"] = "create_user";
    Permission["VIEW_USERS"] = "view_users";
    Permission["UPDATE_USER"] = "update_user";
    Permission["DELETE_USER"] = "delete_user";
    Permission["MANAGE_USER_ROLES"] = "manage_user_roles";
    Permission["MANAGE_USER_PERMISSIONS"] = "manage_user_permissions";
    // Client Management
    Permission["CREATE_CLIENT"] = "create_client";
    Permission["VIEW_CLIENTS"] = "view_clients";
    Permission["UPDATE_CLIENT"] = "update_client";
    Permission["DELETE_CLIENT"] = "delete_client";
    Permission["VIEW_CLIENT_DETAILS"] = "view_client_details";
    // Project Management
    Permission["CREATE_PROJECT"] = "create_project";
    Permission["VIEW_PROJECTS"] = "view_projects";
    Permission["UPDATE_PROJECT"] = "update_project";
    Permission["DELETE_PROJECT"] = "delete_project";
    Permission["MANAGE_PROJECT_TEAM"] = "manage_project_team";
    Permission["VIEW_PROJECT_DETAILS"] = "view_project_details";
    // Task Management
    Permission["CREATE_TASK"] = "create_task";
    Permission["VIEW_TASKS"] = "view_tasks";
    Permission["UPDATE_TASK"] = "update_task";
    Permission["DELETE_TASK"] = "delete_task";
    Permission["ASSIGN_TASKS"] = "assign_tasks";
    Permission["VIEW_ALL_TASKS"] = "view_all_tasks";
    // Time Tracking
    Permission["CREATE_TIME_ENTRY"] = "create_time_entry";
    Permission["VIEW_TIME_ENTRIES"] = "view_time_entries";
    Permission["UPDATE_TIME_ENTRY"] = "update_time_entry";
    Permission["DELETE_TIME_ENTRY"] = "delete_time_entry";
    Permission["APPROVE_TIME_ENTRIES"] = "approve_time_entries";
    Permission["VIEW_ALL_TIME_ENTRIES"] = "view_all_time_entries";
    // Financial Management
    Permission["VIEW_FINANCIALS"] = "view_financials";
    Permission["MANAGE_INVOICES"] = "manage_invoices";
    Permission["CREATE_INVOICE"] = "create_invoice";
    Permission["UPDATE_INVOICE"] = "update_invoice";
    Permission["DELETE_INVOICE"] = "delete_invoice";
    Permission["VIEW_REVENUE_REPORTS"] = "view_revenue_reports";
    Permission["MANAGE_BILLING"] = "manage_billing";
    // Team Management
    Permission["CREATE_TEAM"] = "create_team";
    Permission["VIEW_TEAMS"] = "view_teams";
    Permission["UPDATE_TEAM"] = "update_team";
    Permission["DELETE_TEAM"] = "delete_team";
    Permission["MANAGE_TEAM_MEMBERS"] = "manage_team_members";
    Permission["VIEW_TEAM_PERFORMANCE"] = "view_team_performance";
    // Document Management
    Permission["CREATE_DOCUMENT"] = "create_document";
    Permission["VIEW_DOCUMENTS"] = "view_documents";
    Permission["UPDATE_DOCUMENT"] = "update_document";
    Permission["DELETE_DOCUMENT"] = "delete_document";
    Permission["MANAGE_DOCUMENT_ACCESS"] = "manage_document_access";
    // Reporting & Analytics
    Permission["VIEW_REPORTS"] = "view_reports";
    Permission["CREATE_REPORTS"] = "create_reports";
    Permission["EXPORT_DATA"] = "export_data";
    Permission["VIEW_ANALYTICS"] = "view_analytics";
    Permission["VIEW_DASHBOARD"] = "view_dashboard";
    // Communication
    Permission["SEND_MESSAGES"] = "send_messages";
    Permission["VIEW_MESSAGES"] = "view_messages";
    Permission["MODERATE_MESSAGES"] = "moderate_messages";
    // Settings & Configuration
    Permission["MANAGE_SETTINGS"] = "manage_settings";
    Permission["UPDATE_COMPANY_INFO"] = "update_company_info";
    Permission["MANAGE_INTEGRATIONS"] = "manage_integrations";
    // Workflow & Automation
    Permission["VIEW_WORKFLOWS"] = "view_workflows";
    Permission["MANAGE_WORKFLOWS"] = "manage_workflows";
    Permission["EXECUTE_WORKFLOWS"] = "execute_workflows";
    Permission["CREATE_WORKFLOW_TEMPLATE"] = "create_workflow_template";
})(Permission || (exports.Permission = Permission = {}));
/**
 * Permission categories for organization and UI grouping
 */
exports.PermissionCategories = {
    SYSTEM: 'system',
    USERS: 'users',
    CLIENTS: 'clients',
    PROJECTS: 'projects',
    TASKS: 'tasks',
    TIME: 'time',
    FINANCIAL: 'financial',
    TEAMS: 'teams',
    DOCUMENTS: 'documents',
    REPORTS: 'reports',
    COMMUNICATION: 'communication',
    SETTINGS: 'settings',
};
/**
 * Default role-to-permissions mapping
 * This defines what permissions each role should have by default
 */
exports.DefaultRolePermissions = {
    SUPER_ADMIN: Object.values(Permission), // All permissions
    ADMIN: [
        // User Management
        Permission.CREATE_USER,
        Permission.VIEW_USERS,
        Permission.UPDATE_USER,
        Permission.DELETE_USER,
        Permission.MANAGE_USER_ROLES,
        // Client Management
        Permission.CREATE_CLIENT,
        Permission.VIEW_CLIENTS,
        Permission.UPDATE_CLIENT,
        Permission.DELETE_CLIENT,
        Permission.VIEW_CLIENT_DETAILS,
        // Project Management
        Permission.CREATE_PROJECT,
        Permission.VIEW_PROJECTS,
        Permission.UPDATE_PROJECT,
        Permission.DELETE_PROJECT,
        Permission.MANAGE_PROJECT_TEAM,
        Permission.VIEW_PROJECT_DETAILS,
        // Financial Management
        Permission.VIEW_FINANCIALS,
        Permission.MANAGE_INVOICES,
        Permission.CREATE_INVOICE,
        Permission.UPDATE_INVOICE,
        Permission.DELETE_INVOICE,
        Permission.VIEW_REVENUE_REPORTS,
        Permission.MANAGE_BILLING,
        // Team Management
        Permission.CREATE_TEAM,
        Permission.VIEW_TEAMS,
        Permission.UPDATE_TEAM,
        Permission.DELETE_TEAM,
        Permission.MANAGE_TEAM_MEMBERS,
        Permission.VIEW_TEAM_PERFORMANCE,
        // Reporting
        Permission.VIEW_REPORTS,
        Permission.CREATE_REPORTS,
        Permission.EXPORT_DATA,
        Permission.VIEW_ANALYTICS,
        Permission.VIEW_DASHBOARD,
        // Settings
        Permission.MANAGE_SETTINGS,
        Permission.UPDATE_COMPANY_INFO,
        Permission.MANAGE_INTEGRATIONS,
        // Workflow & Automation
        Permission.VIEW_WORKFLOWS,
        Permission.MANAGE_WORKFLOWS,
        Permission.EXECUTE_WORKFLOWS,
        Permission.CREATE_WORKFLOW_TEMPLATE,
    ],
    PROJECT_MANAGER: [
        // Client Management (View only)
        Permission.VIEW_CLIENTS,
        Permission.VIEW_CLIENT_DETAILS,
        // Project Management
        Permission.CREATE_PROJECT,
        Permission.VIEW_PROJECTS,
        Permission.UPDATE_PROJECT,
        Permission.MANAGE_PROJECT_TEAM,
        Permission.VIEW_PROJECT_DETAILS,
        // Task Management
        Permission.CREATE_TASK,
        Permission.VIEW_TASKS,
        Permission.UPDATE_TASK,
        Permission.DELETE_TASK,
        Permission.ASSIGN_TASKS,
        Permission.VIEW_ALL_TASKS,
        // Time Tracking
        Permission.VIEW_TIME_ENTRIES,
        Permission.APPROVE_TIME_ENTRIES,
        Permission.VIEW_ALL_TIME_ENTRIES,
        // Team Management
        Permission.VIEW_TEAMS,
        Permission.MANAGE_TEAM_MEMBERS,
        Permission.VIEW_TEAM_PERFORMANCE,
        // Communication
        Permission.SEND_MESSAGES,
        Permission.VIEW_MESSAGES,
        // Reporting
        Permission.VIEW_REPORTS,
        Permission.VIEW_DASHBOARD,
        // Workflow & Automation (Limited)
        Permission.VIEW_WORKFLOWS,
        Permission.EXECUTE_WORKFLOWS,
    ],
    TEAM_MEMBER: [
        // Project Management (Limited)
        Permission.VIEW_PROJECTS,
        Permission.VIEW_PROJECT_DETAILS,
        // Task Management
        Permission.CREATE_TASK,
        Permission.VIEW_TASKS,
        Permission.UPDATE_TASK,
        // Time Tracking
        Permission.CREATE_TIME_ENTRY,
        Permission.VIEW_TIME_ENTRIES,
        Permission.UPDATE_TIME_ENTRY,
        Permission.DELETE_TIME_ENTRY,
        // Document Management
        Permission.CREATE_DOCUMENT,
        Permission.VIEW_DOCUMENTS,
        Permission.UPDATE_DOCUMENT,
        // Communication
        Permission.SEND_MESSAGES,
        Permission.VIEW_MESSAGES,
        // Basic dashboard access
        Permission.VIEW_DASHBOARD,
    ],
    CLIENT: [
        // Project Management (View only)
        Permission.VIEW_PROJECTS,
        Permission.VIEW_PROJECT_DETAILS,
        // Task Management (View only)
        Permission.VIEW_TASKS,
        // Document Management (Limited)
        Permission.VIEW_DOCUMENTS,
        // Communication
        Permission.SEND_MESSAGES,
        Permission.VIEW_MESSAGES,
        // Basic reporting
        Permission.VIEW_REPORTS,
    ],
    USER: [
        // Minimal permissions for basic users
        Permission.VIEW_DASHBOARD,
    ],
};
/**
 * Helper function to get all permissions for a role
 */
function getPermissionsForRole(role) {
    return exports.DefaultRolePermissions[role] || [];
}
/**
 * Helper function to check if a role has a specific permission
 */
function roleHasPermission(role, permission) {
    const rolePermissions = getPermissionsForRole(role);
    return rolePermissions.includes(permission);
}
/**
 * Check if a user has a specific permission
 */
function hasPermission(user, permission) {
    if (!user)
        return false;
    // Check role-based permissions
    const rolePermissions = getPermissionsForRole(user.role);
    if (rolePermissions.includes(permission))
        return true;
    // Check user-specific permissions (if any)
    if (user.permissions && user.permissions.includes(permission))
        return true;
    return false;
}
/**
 * Check if user is admin or super admin
 */
function isAdmin(user) {
    return user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
}
/**
 * Check if user is super admin
 */
function isSuperAdmin(user) {
    return user?.role === 'SUPER_ADMIN';
}
/**
 * Check if user has any of the specified permissions
 */
function hasAnyPermission(user, permissions) {
    if (!user)
        return false;
    return permissions.some(permission => hasPermission(user, permission));
}
/**
 * Check if user has all of the specified permissions
 */
function hasAllPermissions(user, permissions) {
    if (!user)
        return false;
    return permissions.every(permission => hasPermission(user, permission));
}
/**
 * Permission descriptions for UI display
 */
exports.PermissionDescriptions = {
    [Permission.MANAGE_SYSTEM]: 'Full system administration access',
    [Permission.VIEW_AUDIT_LOGS]: 'View system audit logs and security events',
    [Permission.MANAGE_BACKUPS]: 'Manage system backups and restoration',
    [Permission.CREATE_USER]: 'Create new user accounts',
    [Permission.VIEW_USERS]: 'View user profiles and information',
    [Permission.UPDATE_USER]: 'Edit user profiles and information',
    [Permission.DELETE_USER]: 'Delete user accounts',
    [Permission.MANAGE_USER_ROLES]: 'Assign and modify user roles',
    [Permission.MANAGE_USER_PERMISSIONS]: 'Grant and revoke specific permissions',
    [Permission.CREATE_CLIENT]: 'Create new client accounts',
    [Permission.VIEW_CLIENTS]: 'View client information and profiles',
    [Permission.UPDATE_CLIENT]: 'Edit client information',
    [Permission.DELETE_CLIENT]: 'Delete client accounts',
    [Permission.VIEW_CLIENT_DETAILS]: 'Access detailed client information',
    [Permission.CREATE_PROJECT]: 'Create new projects',
    [Permission.VIEW_PROJECTS]: 'View project information',
    [Permission.UPDATE_PROJECT]: 'Edit project details and settings',
    [Permission.DELETE_PROJECT]: 'Delete projects',
    [Permission.MANAGE_PROJECT_TEAM]: 'Add/remove team members from projects',
    [Permission.VIEW_PROJECT_DETAILS]: 'Access detailed project information',
    [Permission.CREATE_TASK]: 'Create new tasks',
    [Permission.VIEW_TASKS]: 'View task information',
    [Permission.UPDATE_TASK]: 'Edit task details and status',
    [Permission.DELETE_TASK]: 'Delete tasks',
    [Permission.ASSIGN_TASKS]: 'Assign tasks to team members',
    [Permission.VIEW_ALL_TASKS]: 'View all tasks across projects',
    [Permission.CREATE_TIME_ENTRY]: 'Log time entries',
    [Permission.VIEW_TIME_ENTRIES]: 'View time tracking entries',
    [Permission.UPDATE_TIME_ENTRY]: 'Edit time entries',
    [Permission.DELETE_TIME_ENTRY]: 'Delete time entries',
    [Permission.APPROVE_TIME_ENTRIES]: 'Approve or reject time entries',
    [Permission.VIEW_ALL_TIME_ENTRIES]: 'View all time entries across projects',
    [Permission.VIEW_FINANCIALS]: 'Access financial data and reports',
    [Permission.MANAGE_INVOICES]: 'Full invoice management access',
    [Permission.CREATE_INVOICE]: 'Create new invoices',
    [Permission.UPDATE_INVOICE]: 'Edit existing invoices',
    [Permission.DELETE_INVOICE]: 'Delete invoices',
    [Permission.VIEW_REVENUE_REPORTS]: 'Access revenue and financial reports',
    [Permission.MANAGE_BILLING]: 'Manage billing settings and processes',
    [Permission.CREATE_TEAM]: 'Create new teams',
    [Permission.VIEW_TEAMS]: 'View team information',
    [Permission.UPDATE_TEAM]: 'Edit team details',
    [Permission.DELETE_TEAM]: 'Delete teams',
    [Permission.MANAGE_TEAM_MEMBERS]: 'Add/remove team members',
    [Permission.VIEW_TEAM_PERFORMANCE]: 'Access team performance metrics',
    [Permission.CREATE_DOCUMENT]: 'Upload and create documents',
    [Permission.VIEW_DOCUMENTS]: 'View and download documents',
    [Permission.UPDATE_DOCUMENT]: 'Edit document information',
    [Permission.DELETE_DOCUMENT]: 'Delete documents',
    [Permission.MANAGE_DOCUMENT_ACCESS]: 'Control document access permissions',
    [Permission.VIEW_REPORTS]: 'Access system reports',
    [Permission.CREATE_REPORTS]: 'Generate custom reports',
    [Permission.EXPORT_DATA]: 'Export data in various formats',
    [Permission.VIEW_ANALYTICS]: 'Access analytics and insights',
    [Permission.VIEW_DASHBOARD]: 'Access dashboard and overview',
    [Permission.SEND_MESSAGES]: 'Send messages to other users',
    [Permission.VIEW_MESSAGES]: 'Read messages and communications',
    [Permission.MODERATE_MESSAGES]: 'Moderate and manage communications',
    [Permission.MANAGE_SETTINGS]: 'Access and modify system settings',
    [Permission.UPDATE_COMPANY_INFO]: 'Edit company information',
    [Permission.MANAGE_INTEGRATIONS]: 'Manage third-party integrations',
    [Permission.VIEW_WORKFLOWS]: 'View workflow templates and executions',
    [Permission.MANAGE_WORKFLOWS]: 'Create, edit, and delete workflow templates',
    [Permission.EXECUTE_WORKFLOWS]: 'Execute workflow instances',
    [Permission.CREATE_WORKFLOW_TEMPLATE]: 'Create new workflow templates',
};

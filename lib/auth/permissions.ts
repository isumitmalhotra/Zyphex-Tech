/**
 * Comprehensive Permission System for ZyphexTech Platform
 * Defines all granular permissions for role-based access control
 */
import { Session } from 'next-auth'

export enum Permission {
  // System Administration
  MANAGE_SYSTEM = 'manage_system',
  VIEW_AUDIT_LOGS = 'view_audit_logs',
  MANAGE_BACKUPS = 'manage_backups',

  // User Management
  CREATE_USER = 'create_user',
  VIEW_USERS = 'view_users',
  UPDATE_USER = 'update_user',
  DELETE_USER = 'delete_user',
  MANAGE_USER_ROLES = 'manage_user_roles',
  MANAGE_USER_PERMISSIONS = 'manage_user_permissions',

  // Client Management
  CREATE_CLIENT = 'create_client',
  VIEW_CLIENTS = 'view_clients',
  UPDATE_CLIENT = 'update_client',
  DELETE_CLIENT = 'delete_client',
  VIEW_CLIENT_DETAILS = 'view_client_details',

  // Project Management
  CREATE_PROJECT = 'create_project',
  VIEW_PROJECTS = 'view_projects',
  UPDATE_PROJECT = 'update_project',
  DELETE_PROJECT = 'delete_project',
  MANAGE_PROJECT_TEAM = 'manage_project_team',
  VIEW_PROJECT_DETAILS = 'view_project_details',

  // Task Management
  CREATE_TASK = 'create_task',
  VIEW_TASKS = 'view_tasks',
  UPDATE_TASK = 'update_task',
  DELETE_TASK = 'delete_task',
  ASSIGN_TASKS = 'assign_tasks',
  VIEW_ALL_TASKS = 'view_all_tasks',

  // Time Tracking
  CREATE_TIME_ENTRY = 'create_time_entry',
  VIEW_TIME_ENTRIES = 'view_time_entries',
  UPDATE_TIME_ENTRY = 'update_time_entry',
  DELETE_TIME_ENTRY = 'delete_time_entry',
  APPROVE_TIME_ENTRIES = 'approve_time_entries',
  VIEW_ALL_TIME_ENTRIES = 'view_all_time_entries',

  // Financial Management
  VIEW_FINANCIALS = 'view_financials',
  MANAGE_INVOICES = 'manage_invoices',
  CREATE_INVOICE = 'create_invoice',
  UPDATE_INVOICE = 'update_invoice',
  DELETE_INVOICE = 'delete_invoice',
  VIEW_REVENUE_REPORTS = 'view_revenue_reports',
  MANAGE_BILLING = 'manage_billing',

  // Team Management
  CREATE_TEAM = 'create_team',
  VIEW_TEAMS = 'view_teams',
  UPDATE_TEAM = 'update_team',
  DELETE_TEAM = 'delete_team',
  MANAGE_TEAM_MEMBERS = 'manage_team_members',
  VIEW_TEAM_PERFORMANCE = 'view_team_performance',

  // Document Management
  CREATE_DOCUMENT = 'create_document',
  VIEW_DOCUMENTS = 'view_documents',
  UPDATE_DOCUMENT = 'update_document',
  DELETE_DOCUMENT = 'delete_document',
  MANAGE_DOCUMENT_ACCESS = 'manage_document_access',

  // Reporting & Analytics
  VIEW_REPORTS = 'view_reports',
  CREATE_REPORTS = 'create_reports',
  EXPORT_DATA = 'export_data',
  VIEW_ANALYTICS = 'view_analytics',
  VIEW_DASHBOARD = 'view_dashboard',

  // Communication
  SEND_MESSAGES = 'send_messages',
  VIEW_MESSAGES = 'view_messages',
  MODERATE_MESSAGES = 'moderate_messages',

  // Settings & Configuration
  MANAGE_SETTINGS = 'manage_settings',
  UPDATE_COMPANY_INFO = 'update_company_info',
  MANAGE_INTEGRATIONS = 'manage_integrations',
}

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'PROJECT_MANAGER' | 'TEAM_MEMBER' | 'CLIENT' | 'USER'

export interface ExtendedUser {
  id: string
  email: string
  name?: string
  role: Role
  permissions?: Permission[]
}

export interface ExtendedSession extends Session {
  user: ExtendedUser
}

/**
 * Permission categories for organization and UI grouping
 */
export const PermissionCategories = {
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
} as const;

/**
 * Default role-to-permissions mapping
 * This defines what permissions each role should have by default
 */
export const DefaultRolePermissions: Record<Role, Permission[]> = {
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
export function getPermissionsForRole(role: Role): Permission[] {
  return DefaultRolePermissions[role] || [];
}

/**
 * Helper function to check if a role has a specific permission
 */
export function roleHasPermission(role: Role, permission: Permission): boolean {
  const rolePermissions = getPermissionsForRole(role);
  return rolePermissions.includes(permission);
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(user: ExtendedUser | undefined, permission: Permission): boolean {
  if (!user) return false;
  
  // Check role-based permissions
  const rolePermissions = getPermissionsForRole(user.role);
  if (rolePermissions.includes(permission)) return true;
  
  // Check user-specific permissions (if any)
  if (user.permissions && user.permissions.includes(permission)) return true;
  
  return false;
}

/**
 * Check if user is admin or super admin
 */
export function isAdmin(user: ExtendedUser | undefined): boolean {
  return user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(user: ExtendedUser | undefined): boolean {
  return user?.role === 'SUPER_ADMIN';
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(user: ExtendedUser | undefined, permissions: Permission[]): boolean {
  if (!user) return false;
  return permissions.some(permission => hasPermission(user, permission));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(user: ExtendedUser | undefined, permissions: Permission[]): boolean {
  if (!user) return false;
  return permissions.every(permission => hasPermission(user, permission));
}

/**
 * Permission descriptions for UI display
 */
export const PermissionDescriptions: Record<Permission, string> = {
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
};
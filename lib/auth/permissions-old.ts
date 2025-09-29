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
  | 'projects:read'
  | 'projects:write'
  | 'projects:delete'
  | 'clients:read'
  | 'clients:write'
  | 'clients:delete'
  | 'team:read'
  | 'team:write'
  | 'team:delete'

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: ['admin:read', 'admin:write', 'admin:delete', 'projects:read', 'projects:write', 'projects:delete', 'clients:read', 'clients:write', 'clients:delete', 'team:read', 'team:write', 'team:delete'],
  manager: ['projects:read', 'projects:write', 'clients:read', 'clients:write', 'team:read', 'team:write'],
  developer: ['projects:read', 'projects:write', 'clients:read', 'team:read'],
  client: ['projects:read', 'clients:read'],
  user: ['projects:read'],
}

export function hasPermission(user: ExtendedUser | undefined, permission: Permission): boolean {
  if (!user) return false
  const userPermissions = ROLE_PERMISSIONS[user.role] || []
  return userPermissions.includes(permission)
}

export function isAdmin(user: ExtendedUser | undefined): boolean {
  return user?.role === 'admin'
}

export function hasAnyPermission(user: ExtendedUser | undefined, permissions: Permission[]): boolean {
  if (!user) return false
  return permissions.some(permission => hasPermission(user, permission))
}

export function hasAllPermissions(user: ExtendedUser | undefined, permissions: Permission[]): boolean {
  if (!user) return false
  return permissions.every(permission => hasPermission(user, permission))
}

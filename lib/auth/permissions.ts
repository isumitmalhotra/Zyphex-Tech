import { Session } from 'next-auth'

export type Role = 'admin' | 'user' | 'manager' | 'developer' | 'client'

export interface ExtendedUser {
  id: string
  email: string
  name?: string
  role: Role
  permissions?: string[]
}

export interface ExtendedSession extends Session {
  user: ExtendedUser
}

export type Permission = 
  | 'admin:read'
  | 'admin:write'
  | 'admin:delete'
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

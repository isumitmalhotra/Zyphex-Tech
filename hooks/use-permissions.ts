'use client'

import { useSession } from 'next-auth/react'
import { Permission, hasPermission, isAdmin, ExtendedUser } from '@/lib/auth/permissions'

export function usePermissions() {
  const { data: session } = useSession()
  const user = session?.user as ExtendedUser
  
  return {
    user,
    isAdmin: isAdmin(user),
    hasPermission: (permission: Permission) => hasPermission(user, permission),
    canAccessAdmin: hasPermission(user, 'admin:read'),
    canManageProjects: hasPermission(user, 'projects:write'),
    canManageClients: hasPermission(user, 'clients:write'),
    canManageTeam: hasPermission(user, 'team:write'),
  }
}

export function useHasPermission(permission: Permission) {
  const { hasPermission } = usePermissions()
  return hasPermission(permission)
}

export function useIsAdmin() {
  const { isAdmin } = usePermissions()
  return isAdmin
}

export function useHasAnyPermission(permissions: Permission[]) {
  const { hasPermission } = usePermissions()
  return permissions.some(permission => hasPermission(permission))
}

export function useHasAllPermissions(permissions: Permission[]) {
  const { hasPermission } = usePermissions()
  return permissions.every(permission => hasPermission(permission))
}

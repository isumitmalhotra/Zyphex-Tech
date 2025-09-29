/**
 * React hooks for permission-based UI control
 * Provides client-side permission checking and role-based UI rendering
 */
'use client'

import { useSession } from 'next-auth/react'
import { useMemo } from 'react'
import { Permission, hasPermission, hasAnyPermission, hasAllPermissions, isAdmin, isSuperAdmin, ExtendedUser } from '@/lib/auth/permissions'

/**
 * Hook to get current user with extended permissions
 */
export function useUser(): ExtendedUser | undefined {
  const { data: session } = useSession()
  return session?.user as ExtendedUser || undefined
}

/**
 * Hook to check if user has a specific permission
 */
export function usePermission(permission: Permission): boolean {
  const user = useUser()
  return useMemo(() => hasPermission(user, permission), [user, permission])
}

/**
 * Hook to check if user has any of the specified permissions
 */
export function useAnyPermission(permissions: Permission[]): boolean {
  const user = useUser()
  return useMemo(() => hasAnyPermission(user, permissions), [user, permissions])
}

/**
 * Hook to check if user has all of the specified permissions
 */
export function useAllPermissions(permissions: Permission[]): boolean {
  const user = useUser()
  return useMemo(() => hasAllPermissions(user, permissions), [user, permissions])
}

/**
 * Hook to check if user is admin
 */
export function useIsAdmin(): boolean {
  const user = useUser()
  return useMemo(() => isAdmin(user), [user])
}

/**
 * Hook to check if user is super admin
 */
export function useIsSuperAdmin(): boolean {
  const user = useUser()
  return useMemo(() => isSuperAdmin(user), [user])
}

/**
 * Hook to get user's role
 */
export function useUserRole(): string | null {
  const user = useUser()
  return user?.role || null
}

/**
 * Hook to check multiple permissions at once
 */
export function usePermissions(permissions: Permission[]) {
  const user = useUser()
  
  return useMemo(() => {
    const results: Record<string, boolean> = {}
    permissions.forEach(permission => {
      results[permission] = hasPermission(user, permission)
    })
    return results
  }, [user, permissions])
}

/**
 * Hook for conditional rendering based on permissions
 */
export function useConditionalRender() {
  const user = useUser()
  
  return {
    /**
     * Render content only if user has permission
     */
    ifPermission: (permission: Permission, content: React.ReactNode) => {
      return hasPermission(user, permission) ? content : null
    },
    
    /**
     * Render content only if user has any of the permissions
     */
    ifAnyPermission: (permissions: Permission[], content: React.ReactNode) => {
      return hasAnyPermission(user, permissions) ? content : null
    },
    
    /**
     * Render content only if user has all permissions
     */
    ifAllPermissions: (permissions: Permission[], content: React.ReactNode) => {
      return hasAllPermissions(user, permissions) ? content : null
    },
    
    /**
     * Render content only if user is admin
     */
    ifAdmin: (content: React.ReactNode) => {
      return isAdmin(user) ? content : null
    },
    
    /**
     * Render content only if user is super admin
     */
    ifSuperAdmin: (content: React.ReactNode) => {
      return isSuperAdmin(user) ? content : null
    },
    
    /**
     * Render different content based on role
     */
    byRole: (roleContent: Partial<Record<ExtendedUser['role'], React.ReactNode>>) => {
      const role = user?.role
      return role ? roleContent[role] || null : null
    }
  }
}

/**
 * Legacy compatibility hooks
 */
export function useHasPermission(permission: Permission) {
  return usePermission(permission)
}

export function useHasAnyPermission(permissions: Permission[]) {
  return useAnyPermission(permissions)
}

export function useHasAllPermissions(permissions: Permission[]) {
  return useAllPermissions(permissions)
}

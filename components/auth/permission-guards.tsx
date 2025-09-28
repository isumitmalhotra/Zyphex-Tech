'use client'

import { ReactNode } from 'react'
import { Permission } from '@/lib/auth/permissions'
import { usePermissions, useIsAdmin } from '@/hooks/use-permissions'

interface PermissionGuardProps {
  children: ReactNode
  permission?: Permission
  permissions?: Permission[]
  requireAll?: boolean
  adminOnly?: boolean
  fallback?: ReactNode
}

export function PermissionGuard({
  children,
  permission,
  permissions,
  requireAll = false,
  adminOnly = false,
  fallback = null
}: PermissionGuardProps) {
  const { hasPermission } = usePermissions()
  const isAdmin = useIsAdmin()

  // Admin only check
  if (adminOnly && !isAdmin) {
    return <>{fallback}</>
  }

  // Single permission check
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>
  }

  // Multiple permissions check
  if (permissions) {
    const hasAccess = requireAll
      ? permissions.every(p => hasPermission(p))
      : permissions.some(p => hasPermission(p))
    
    if (!hasAccess) {
      return <>{fallback}</>
    }
  }

  return <>{children}</>
}

export function AdminOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard adminOnly fallback={fallback}>
      {children}
    </PermissionGuard>
  )
}

export function RequirePermission({ 
  children, 
  permission, 
  fallback = null 
}: { 
  children: ReactNode
  permission: Permission
  fallback?: ReactNode 
}) {
  return (
    <PermissionGuard permission={permission} fallback={fallback}>
      {children}
    </PermissionGuard>
  )
}

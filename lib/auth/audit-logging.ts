export interface AuditEvent {
  userId?: string
  action: string
  resource: string
  resourceId?: string
  details?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  timestamp?: Date
}

export async function logAuthEvent(event: AuditEvent): Promise<void> {
  try {
    console.log('Audit event:', event)
  } catch (error) {
    console.error('Failed to log audit event:', error)
  }
}

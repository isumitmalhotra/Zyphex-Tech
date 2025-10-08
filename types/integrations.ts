import { IntegrationType, IntegrationCategory, IntegrationStatus } from '@prisma/client'

export interface Integration {
  id: string
  name: string
  type: IntegrationType
  category: IntegrationCategory
  description?: string | null
  isEnabled: boolean
  configuration?: any
  apiKey?: string | null
  webhookUrl?: string | null
  lastSyncAt?: Date | null
  status: IntegrationStatus
  errorMessage?: string | null
  syncFrequency?: string | null
  metadata?: any
  createdAt: Date
  updatedAt: Date
}

export interface IntegrationLog {
  id: string
  integrationId: string
  action: string
  status: string
  message?: string | null
  metadata?: any
  createdAt: Date
}

export interface IntegrationConfig {
  apiKey?: string
  apiSecret?: string
  webhookUrl?: string
  accessToken?: string
  refreshToken?: string
  channel?: string
  workspace?: string
  repository?: string
  projectId?: string
  [key: string]: any
}

export interface IntegrationTemplate {
  type: IntegrationType
  name: string
  category: IntegrationCategory
  description: string
  icon: string
  color: string
  features: string[]
  configFields: ConfigField[]
  setupInstructions: string[]
  documentationUrl: string
}

export interface ConfigField {
  name: string
  label: string
  type: 'text' | 'password' | 'url' | 'select' | 'textarea'
  required: boolean
  placeholder?: string
  description?: string
  options?: { label: string; value: string }[]
}

export interface IntegrationStats {
  totalIntegrations: number
  activeIntegrations: number
  errorIntegrations: number
  lastSyncedAt?: Date
  syncSuccess: number
  syncFailures: number
}

export interface TestConnectionResult {
  success: boolean
  message: string
  details?: any
}

export interface SyncResult {
  success: boolean
  message: string
  itemsSynced?: number
  errors?: string[]
}

import { ErrorAction, ErrorContext } from '@/components/error/ErrorTemplate'

export interface RouteErrorConfig {
  theme: 'default' | 'admin' | 'client' | 'dashboard'
  severity: 'low' | 'medium' | 'high' | 'critical'
  showDetails: boolean
  showReportButton: boolean
  defaultActions: Omit<ErrorAction, 'icon'>[]
  supportContact?: {
    email?: string
    phone?: string
    helpUrl?: string
  }
}

// Route-specific error configurations
export const ERROR_CONFIGS: Record<string, RouteErrorConfig> = {
  // Admin routes
  '/admin': {
    theme: 'admin',
    severity: 'high',
    showDetails: true,
    showReportButton: true,
    defaultActions: [
      {
        id: 'admin-home',
        label: 'Admin Dashboard',
        href: '/admin',
        variant: 'default'
      },
      {
        id: 'system-status',
        label: 'System Status',
        href: '/admin/system-status',
        variant: 'outline'
      },
      {
        id: 'error-logs',
        label: 'View Logs',
        href: '/admin/logs',
        variant: 'outline'
      }
    ],
    supportContact: {
      email: 'dev-team@zyphex-tech.com',
      helpUrl: '/admin/help'
    }
  },

  // Dashboard routes
  '/dashboard': {
    theme: 'dashboard',
    severity: 'medium',
    showDetails: false,
    showReportButton: true,
    defaultActions: [
      {
        id: 'dashboard-home',
        label: 'Back to Dashboard',
        href: '/dashboard',
        variant: 'default'
      },
      {
        id: 'support',
        label: 'Contact Support',
        href: '/support',
        variant: 'outline'
      }
    ],
    supportContact: {
      email: 'support@zyphex-tech.com',
      helpUrl: '/help'
    }
  },

  // Client portal routes
  '/client': {
    theme: 'client',
    severity: 'medium',
    showDetails: false,
    showReportButton: true,
    defaultActions: [
      {
        id: 'client-portal',
        label: 'Client Portal',
        href: '/client',
        variant: 'default'
      },
      {
        id: 'projects',
        label: 'My Projects',
        href: '/client/projects',
        variant: 'outline'
      },
      {
        id: 'client-support',
        label: 'Get Help',
        href: '/client/support',
        variant: 'outline'
      }
    ],
    supportContact: {
      email: 'client-success@zyphex-tech.com',
      phone: '+1 (555) 123-4567',
      helpUrl: '/client/help'
    }
  },

  // API routes
  '/api': {
    theme: 'default',
    severity: 'high',
    showDetails: true,
    showReportButton: true,
    defaultActions: [
      {
        id: 'home',
        label: 'Go Home',
        href: '/',
        variant: 'default'
      },
      {
        id: 'api-docs',
        label: 'API Documentation',
        href: '/docs/api',
        variant: 'outline'
      }
    ],
    supportContact: {
      email: 'api-support@zyphex-tech.com'
    }
  },

  // Default fallback
  '/': {
    theme: 'default',
    severity: 'medium',
    showDetails: false,
    showReportButton: true,
    defaultActions: [
      {
        id: 'home',
        label: 'Go Home',
        href: '/',
        variant: 'default'
      },
      {
        id: 'support',
        label: 'Contact Support',
        href: '/contact',
        variant: 'outline'
      }
    ],
    supportContact: {
      email: 'support@zyphex-tech.com',
      helpUrl: '/help'
    }
  }
}

// Error message templates based on error type and route
export const ERROR_MESSAGES = {
  network: {
    title: 'Connection Problem',
    description: 'Unable to connect to our servers. Please check your internet connection and try again.'
  },
  permission: {
    title: 'Access Denied',
    description: 'You don\'t have permission to access this resource. Please contact your administrator if you believe this is an error.'
  },
  validation: {
    title: 'Invalid Request',
    description: 'The information provided is invalid or incomplete. Please review your input and try again.'
  },
  server: {
    title: 'Server Error',
    description: 'We\'re experiencing technical difficulties. Our team has been notified and is working to resolve the issue.'
  },
  client: {
    title: 'Something Went Wrong',
    description: 'An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.'
  },
  unknown: {
    title: 'Unexpected Error',
    description: 'An unknown error occurred. Please try again or contact support if the problem continues.'
  }
}

// Utility function to get error configuration for a route
export function getErrorConfig(route: string): RouteErrorConfig {
  // Find the most specific matching route
  const routeKeys = Object.keys(ERROR_CONFIGS).sort((a, b) => b.length - a.length)
  
  for (const key of routeKeys) {
    if (route.startsWith(key)) {
      return ERROR_CONFIGS[key]
    }
  }
  
  // Fallback to default config
  return ERROR_CONFIGS['/']
}

// Utility function to get error message template
export function getErrorMessage(errorType: string) {
  return ERROR_MESSAGES[errorType as keyof typeof ERROR_MESSAGES] || ERROR_MESSAGES.unknown
}

// Utility function to create context-aware error actions
export function createContextualActions(
  context: ErrorContext,
  baseActions: ErrorAction[] = []
): ErrorAction[] {
  const config = getErrorConfig(context.route)
  const configActions = config.defaultActions.map(action => ({ ...action })) as ErrorAction[]
  const actions = [...baseActions, ...configActions]
  
  // Add retry action if appropriate
  if (shouldShowRetry(context)) {
    actions.unshift({
      id: 'retry',
      label: 'Try Again',
      variant: 'default',
      onClick: () => window.location.reload()
    })
  }
  
  // Remove duplicates based on ID
  const uniqueActions = actions.filter((action, index, arr) => 
    arr.findIndex(a => a.id === action.id) === index
  )
  
  return uniqueActions
}

// Utility function to determine if retry should be shown
export function shouldShowRetry(context: ErrorContext): boolean {
  const noRetryRoutes = ['/admin/logs', '/admin/system-status']
  const isAdminRoute = context.route.startsWith('/admin')
  const isSpecialRoute = noRetryRoutes.some(route => context.route.startsWith(route))
  
  // Show retry for most routes, but not for certain admin pages
  return !isSpecialRoute || !isAdminRoute
}

// Utility function to generate error codes
export function generateErrorCode(errorType: string, route: string): string {
  const routeCode = route.split('/').filter(Boolean)[0] || 'root'
  const timestamp = Date.now().toString().slice(-4)
  
  return `${errorType.toUpperCase()}_${routeCode.toUpperCase()}_${timestamp}`
}

// Utility function to get support contact based on route
export function getSupportContact(route: string) {
  const config = getErrorConfig(route)
  return config.supportContact
}
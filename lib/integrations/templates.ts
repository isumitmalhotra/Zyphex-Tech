import { IntegrationTemplate } from '@/types/integrations'

export const integrationTemplates: IntegrationTemplate[] = [
  {
    type: 'SLACK' as any,
    name: 'Slack',
    category: 'COMMUNICATION' as any,
    description: 'Connect your Slack workspace for real-time team communication and notifications',
    icon: '💬',
    color: '#4A154B',
    features: [
      'Real-time notifications',
      'Project updates',
      'Team messaging',
      'File sharing',
      'Bot commands'
    ],
    configFields: [
      {
        name: 'webhookUrl',
        label: 'Webhook URL',
        type: 'url',
        required: true,
        placeholder: 'https://hooks.slack.com/services/...',
        description: 'Your Slack webhook URL for sending messages'
      },
      {
        name: 'channel',
        label: 'Default Channel',
        type: 'text',
        required: false,
        placeholder: '#general',
        description: 'Default channel for notifications'
      }
    ],
    setupInstructions: [
      'Go to your Slack workspace settings',
      'Navigate to Apps & Integrations',
      'Create a new Incoming Webhook',
      'Copy the webhook URL and paste it above',
      'Select your default channel'
    ],
    documentationUrl: 'https://api.slack.com/messaging/webhooks'
  },
  {
    type: 'GITHUB' as any,
    name: 'GitHub',
    category: 'DEVELOPMENT' as any,
    description: 'Integrate GitHub repositories for code management and issue tracking',
    icon: '🐙',
    color: '#181717',
    features: [
      'Repository sync',
      'Issue tracking',
      'Pull request notifications',
      'Commit history',
      'Code review integration'
    ],
    configFields: [
      {
        name: 'accessToken',
        label: 'Personal Access Token',
        type: 'password',
        required: true,
        placeholder: 'ghp_xxxxxxxxxxxx',
        description: 'GitHub personal access token with repo permissions'
      },
      {
        name: 'repository',
        label: 'Repository',
        type: 'text',
        required: true,
        placeholder: 'owner/repo',
        description: 'Repository in format: owner/repository'
      }
    ],
    setupInstructions: [
      'Go to GitHub Settings > Developer settings > Personal access tokens',
      'Generate new token with repo permissions',
      'Copy the token and paste it above',
      'Enter your repository in owner/repo format'
    ],
    documentationUrl: 'https://docs.github.com/en/rest'
  },
  {
    type: 'GOOGLE_ANALYTICS' as any,
    name: 'Google Analytics',
    category: 'ANALYTICS' as any,
    description: 'Track website analytics and user behavior',
    icon: '📊',
    color: '#E37400',
    features: [
      'Real-time analytics',
      'User tracking',
      'Conversion tracking',
      'Custom reports',
      'Goal tracking'
    ],
    configFields: [
      {
        name: 'trackingId',
        label: 'Tracking ID',
        type: 'text',
        required: true,
        placeholder: 'UA-XXXXXXXXX-X or G-XXXXXXXXXX',
        description: 'Your Google Analytics tracking ID'
      },
      {
        name: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: false,
        placeholder: 'AIzaSy...',
        description: 'API key for advanced analytics features'
      }
    ],
    setupInstructions: [
      'Create a Google Analytics account',
      'Set up a new property',
      'Copy your tracking ID',
      'Optionally create an API key in Google Cloud Console'
    ],
    documentationUrl: 'https://analytics.google.com'
  },
  {
    type: 'TRELLO' as any,
    name: 'Trello',
    category: 'PROJECT_MANAGEMENT' as any,
    description: 'Sync Trello boards for visual project management',
    icon: '📋',
    color: '#0079BF',
    features: [
      'Board synchronization',
      'Card management',
      'List tracking',
      'Due date reminders',
      'Team collaboration'
    ],
    configFields: [
      {
        name: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'Your Trello API key',
        description: 'Trello API key from developer portal'
      },
      {
        name: 'token',
        label: 'Token',
        type: 'password',
        required: true,
        placeholder: 'Your Trello token',
        description: 'Trello authentication token'
      },
      {
        name: 'boardId',
        label: 'Board ID',
        type: 'text',
        required: false,
        placeholder: '5f8a1b2c3d4e5f6g7h8i9j0k',
        description: 'Specific board ID to sync'
      }
    ],
    setupInstructions: [
      'Visit https://trello.com/app-key',
      'Copy your API key',
      'Generate a token',
      'Enter both credentials above'
    ],
    documentationUrl: 'https://developer.atlassian.com/cloud/trello'
  },
  {
    type: 'ZOOM' as any,
    name: 'Zoom',
    category: 'MEETINGS' as any,
    description: 'Schedule and manage Zoom meetings directly',
    icon: '🎥',
    color: '#2D8CFF',
    features: [
      'Meeting scheduling',
      'Automatic invites',
      'Recording integration',
      'Participant tracking',
      'Recurring meetings'
    ],
    configFields: [
      {
        name: 'apiKey',
        label: 'JWT API Key',
        type: 'password',
        required: true,
        placeholder: 'Your Zoom API key',
        description: 'Zoom JWT API key'
      },
      {
        name: 'apiSecret',
        label: 'JWT API Secret',
        type: 'password',
        required: true,
        placeholder: 'Your Zoom API secret',
        description: 'Zoom JWT API secret'
      }
    ],
    setupInstructions: [
      'Go to Zoom App Marketplace',
      'Create a JWT app',
      'Copy API Key and Secret',
      'Enable required permissions'
    ],
    documentationUrl: 'https://marketplace.zoom.us'
  },
  {
    type: 'HUBSPOT' as any,
    name: 'HubSpot',
    category: 'CRM' as any,
    description: 'Connect HubSpot CRM for customer relationship management',
    icon: '🎯',
    color: '#FF7A59',
    features: [
      'Contact sync',
      'Deal tracking',
      'Email campaigns',
      'Sales pipeline',
      'Marketing automation'
    ],
    configFields: [
      {
        name: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'Your HubSpot API key',
        description: 'HubSpot private app API key'
      },
      {
        name: 'portalId',
        label: 'Portal ID',
        type: 'text',
        required: true,
        placeholder: '12345678',
        description: 'Your HubSpot portal ID'
      }
    ],
    setupInstructions: [
      'Go to HubSpot Settings',
      'Navigate to Integrations > Private Apps',
      'Create a new private app',
      'Copy the API key and portal ID'
    ],
    documentationUrl: 'https://developers.hubspot.com'
  },
  {
    type: 'JIRA' as any,
    name: 'Jira',
    category: 'PROJECT_MANAGEMENT' as any,
    description: 'Integrate Jira for advanced issue and project tracking',
    icon: '🎫',
    color: '#0052CC',
    features: [
      'Issue synchronization',
      'Sprint tracking',
      'Epic management',
      'Workflow automation',
      'Time tracking'
    ],
    configFields: [
      {
        name: 'domain',
        label: 'Jira Domain',
        type: 'text',
        required: true,
        placeholder: 'yourcompany.atlassian.net',
        description: 'Your Jira Cloud domain'
      },
      {
        name: 'email',
        label: 'Email',
        type: 'text',
        required: true,
        placeholder: 'your@email.com',
        description: 'Your Jira account email'
      },
      {
        name: 'apiToken',
        label: 'API Token',
        type: 'password',
        required: true,
        placeholder: 'Your Jira API token',
        description: 'Jira API token from account settings'
      },
      {
        name: 'projectKey',
        label: 'Project Key',
        type: 'text',
        required: false,
        placeholder: 'PROJ',
        description: 'Specific project key to sync'
      }
    ],
    setupInstructions: [
      'Go to Jira Account Settings',
      'Navigate to Security > API tokens',
      'Create new API token',
      'Copy token and your domain'
    ],
    documentationUrl: 'https://developer.atlassian.com/cloud/jira'
  },
  {
    type: 'DISCORD' as any,
    name: 'Discord',
    category: 'COMMUNICATION' as any,
    description: 'Connect Discord for team communication and notifications',
    icon: '🎮',
    color: '#5865F2',
    features: [
      'Server integration',
      'Channel notifications',
      'Bot commands',
      'Voice integration',
      'Activity tracking'
    ],
    configFields: [
      {
        name: 'webhookUrl',
        label: 'Webhook URL',
        type: 'url',
        required: true,
        placeholder: 'https://discord.com/api/webhooks/...',
        description: 'Discord webhook URL for notifications'
      },
      {
        name: 'botToken',
        label: 'Bot Token',
        type: 'password',
        required: false,
        placeholder: 'Your Discord bot token',
        description: 'Optional bot token for advanced features'
      }
    ],
    setupInstructions: [
      'Open Discord Server Settings',
      'Go to Integrations > Webhooks',
      'Create new webhook',
      'Copy webhook URL'
    ],
    documentationUrl: 'https://discord.com/developers/docs'
  }
]

export function getIntegrationTemplate(type: string): IntegrationTemplate | undefined {
  return integrationTemplates.find(t => t.type === type)
}

export function getIntegrationsByCategory(category: string): IntegrationTemplate[] {
  return integrationTemplates.filter(t => t.category === category)
}

export const integrationCategories = [
  { value: 'ALL', label: 'All Integrations' },
  { value: 'COMMUNICATION', label: 'Communication' },
  { value: 'DEVELOPMENT', label: 'Development' },
  { value: 'ANALYTICS', label: 'Analytics' },
  { value: 'PROJECT_MANAGEMENT', label: 'Project Management' },
  { value: 'CRM', label: 'CRM' },
  { value: 'MEETINGS', label: 'Meetings' },
  { value: 'DESIGN', label: 'Design' },
  { value: 'PAYMENTS', label: 'Payments' },
  { value: 'MARKETING', label: 'Marketing' }
]

/**
 * Microsoft Teams Service Integration for Workflow Actions
 * 
 * Integrates with Microsoft Teams via incoming webhooks for sending
 * messages and cards to Teams channels.
 */

import axios from 'axios';

export interface TeamsMessageOptions {
  webhookUrl: string;
  title?: string;
  text: string;
  color?: string; // Hex color for the card accent
  sections?: Array<{
    activityTitle?: string;
    activitySubtitle?: string;
    activityImage?: string;
    facts?: Array<{ name: string; value: string }>;
    text?: string;
  }>;
  potentialAction?: Array<{
    '@type': 'OpenUri' | 'HttpPOST';
    name: string;
    targets?: Array<{ os: string; uri: string }>;
    body?: string;
  }>;
}

export interface TeamsResult {
  success: boolean;
  error?: string;
}

/**
 * Send a message to Microsoft Teams channel
 */
export async function sendTeamsMessage(
  options: TeamsMessageOptions
): Promise<TeamsResult> {
  try {
    // Validate webhook URL
    if (!options.webhookUrl) {
      return {
        success: false,
        error: 'Webhook URL is required',
      };
    }

    // Build message card
    const card: Record<string, unknown> = {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: options.title || 'Notification',
      themeColor: options.color || '0078D4',
      title: options.title,
      text: options.text,
    };

    // Add sections if provided
    if (options.sections && options.sections.length > 0) {
      card.sections = options.sections;
    }

    // Add actions if provided
    if (options.potentialAction && options.potentialAction.length > 0) {
      card.potentialAction = options.potentialAction;
    }

    // Send to Teams webhook
    const response = await axios.post(options.webhookUrl, card, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    if (response.status === 200) {
      return { success: true };
    }

    return {
      success: false,
      error: `Unexpected status code: ${response.status}`,
    };
  } catch (error) {
    console.error('Teams message error:', error);

    let errorMessage = 'Unknown error';
    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.error || error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Create a simple Teams card
 */
export function createSimpleTeamsCard(
  title: string,
  text: string,
  color?: string
): Omit<TeamsMessageOptions, 'webhookUrl'> {
  return {
    title,
    text,
    color: color || '0078D4',
  };
}

/**
 * Create a Teams card with facts (key-value pairs)
 */
export function createTeamsCardWithFacts(
  title: string,
  text: string,
  facts: Array<{ name: string; value: string }>,
  color?: string
): Omit<TeamsMessageOptions, 'webhookUrl'> {
  return {
    title,
    text,
    color: color || '0078D4',
    sections: [
      {
        facts,
      },
    ],
  };
}

/**
 * Create a Teams card with action buttons
 */
export function createTeamsCardWithActions(
  title: string,
  text: string,
  actions: Array<{ name: string; url: string }>,
  color?: string
): Omit<TeamsMessageOptions, 'webhookUrl'> {
  return {
    title,
    text,
    color: color || '0078D4',
    potentialAction: actions.map(action => ({
      '@type': 'OpenUri' as const,
      name: action.name,
      targets: [{ os: 'default', uri: action.url }],
    })),
  };
}

/**
 * Create a notification card for project updates
 */
export function createProjectNotificationCard(options: {
  projectName: string;
  status: string;
  description?: string;
  updatedBy?: string;
  url?: string;
}): Omit<TeamsMessageOptions, 'webhookUrl'> {
  const facts: Array<{ name: string; value: string }> = [
    { name: 'Status', value: options.status },
  ];

  if (options.updatedBy) {
    facts.push({ name: 'Updated By', value: options.updatedBy });
  }

  const card: Omit<TeamsMessageOptions, 'webhookUrl'> = {
    title: `Project Update: ${options.projectName}`,
    text: options.description || 'Project status has been updated',
    color: getStatusColor(options.status),
    sections: [{ facts }],
  };

  // Add action button if URL provided
  if (options.url) {
    card.potentialAction = [
      {
        '@type': 'OpenUri',
        name: 'View Project',
        targets: [{ os: 'default', uri: options.url }],
      },
    ];
  }

  return card;
}

/**
 * Create a notification card for task assignments
 */
export function createTaskAssignmentCard(options: {
  taskTitle: string;
  projectName: string;
  assignedTo: string;
  priority?: string;
  dueDate?: string;
  url?: string;
}): Omit<TeamsMessageOptions, 'webhookUrl'> {
  const facts: Array<{ name: string; value: string }> = [
    { name: 'Project', value: options.projectName },
    { name: 'Assigned To', value: options.assignedTo },
  ];

  if (options.priority) {
    facts.push({ name: 'Priority', value: options.priority });
  }

  if (options.dueDate) {
    facts.push({ name: 'Due Date', value: options.dueDate });
  }

  const card: Omit<TeamsMessageOptions, 'webhookUrl'> = {
    title: `New Task Assignment: ${options.taskTitle}`,
    text: 'A new task has been assigned',
    color: getPriorityColor(options.priority),
    sections: [{ facts }],
  };

  // Add action button if URL provided
  if (options.url) {
    card.potentialAction = [
      {
        '@type': 'OpenUri',
        name: 'View Task',
        targets: [{ os: 'default', uri: options.url }],
      },
    ];
  }

  return card;
}

/**
 * Get color based on status
 */
function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PLANNING: '0078D4', // Blue
    IN_PROGRESS: 'FFA500', // Orange
    ON_HOLD: 'FFD700', // Gold
    COMPLETED: '28A745', // Green
    CANCELLED: 'DC3545', // Red
  };

  return colors[status.toUpperCase()] || '0078D4';
}

/**
 * Get color based on priority
 */
function getPriorityColor(priority?: string): string {
  if (!priority) return '0078D4';

  const colors: Record<string, string> = {
    LOW: '28A745', // Green
    MEDIUM: 'FFA500', // Orange
    HIGH: 'DC3545', // Red
    URGENT: '8B0000', // Dark Red
  };

  return colors[priority.toUpperCase()] || '0078D4';
}

/**
 * Replace template variables in Teams message
 */
export function replaceTeamsVariables(
  text: string,
  variables: Record<string, unknown>
): string {
  let result = text;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, String(value || ''));
  }

  return result;
}

/**
 * Validate Teams webhook URL format
 */
export function isValidTeamsWebhook(url: string): boolean {
  return url.startsWith('https://') && url.includes('webhook.office.com');
}

/**
 * Test Teams webhook configuration
 */
export async function testTeamsWebhook(webhookUrl: string): Promise<{
  valid: boolean;
  error?: string;
}> {
  if (!webhookUrl) {
    return {
      valid: false,
      error: 'Webhook URL is required',
    };
  }

  if (!isValidTeamsWebhook(webhookUrl)) {
    return {
      valid: false,
      error: 'Invalid Teams webhook URL format',
    };
  }

  try {
    const result = await sendTeamsMessage({
      webhookUrl,
      title: 'Test Message',
      text: 'This is a test message from the workflow automation system.',
      color: '0078D4',
    });

    return {
      valid: result.success,
      error: result.error,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

const teamsService = {
  sendTeamsMessage,
  createSimpleTeamsCard,
  createTeamsCardWithFacts,
  createTeamsCardWithActions,
  createProjectNotificationCard,
  createTaskAssignmentCard,
  replaceTeamsVariables,
  isValidTeamsWebhook,
  testTeamsWebhook,
};

export default teamsService;

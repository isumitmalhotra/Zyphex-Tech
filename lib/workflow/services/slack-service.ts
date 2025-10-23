/**
 * Slack Service Integration for Workflow Actions
 * 
 * Integrates with Slack Web API for sending messages to channels,
 * users, and posting rich message blocks.
 */

import { WebClient, LogLevel } from '@slack/web-api';

// Initialize Slack client
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN || '';
const slackClient = SLACK_BOT_TOKEN
  ? new WebClient(SLACK_BOT_TOKEN, {
      logLevel: LogLevel.INFO,
    })
  : null;

export interface SlackMessageOptions {
  channel: string; // Channel ID, channel name (#general), or user ID (@user)
  text: string;
  blocks?: Array<Record<string, unknown>>;
  threadTs?: string; // For replying in threads
  username?: string; // Custom bot name
  iconEmoji?: string; // Custom bot emoji
  iconUrl?: string; // Custom bot avatar URL
  attachments?: Array<Record<string, unknown>>;
}

export interface SlackResult {
  success: boolean;
  messageId?: string;
  channel?: string;
  timestamp?: string;
  error?: string;
}

/**
 * Send a message to Slack
 */
export async function sendSlackMessage(
  options: SlackMessageOptions
): Promise<SlackResult> {
  try {
    // Validate Slack is configured
    if (!slackClient) {
      console.warn('Slack bot token not configured, message not sent');
      return {
        success: false,
        error: 'Slack bot token not configured',
      };
    }

    // Normalize channel name
    let channel = options.channel;
    if (channel.startsWith('#')) {
      channel = channel.substring(1);
    } else if (channel.startsWith('@')) {
      // Look up user ID from username
      const username = channel.substring(1);
      const user = await findUserByUsername(username);
      if (user) {
        channel = user.id;
      }
    }

    // Post message
    // @ts-expect-error - Slack block types are complex, options are compatible
    const result = await slackClient.chat.postMessage({
      channel,
      text: options.text,
      blocks: options.blocks,
      thread_ts: options.threadTs,
      username: options.username,
      icon_emoji: options.iconEmoji,
      icon_url: options.iconUrl,
      ...(options.attachments && { attachments: options.attachments }),
    });

    return {
      success: true,
      messageId: result.ts,
      channel: result.channel,
      timestamp: result.ts,
    };
  } catch (error) {
    console.error('Slack message error:', error);

    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Find user by username or email
 */
export async function findUserByUsername(username: string): Promise<{
  id: string;
  name: string;
  email?: string;
} | null> {
  if (!slackClient) return null;

  try {
    const result = await slackClient.users.list({});
    const user = result.members?.find(
      (m: { name?: string; real_name?: string; profile?: { email?: string } }) =>
        m.name === username ||
        m.real_name === username ||
        m.profile?.email === username
    );

    if (user) {
      return {
        id: user.id as string,
        name: user.name as string,
        email: user.profile?.email as string | undefined,
      };
    }

    return null;
  } catch (error) {
    console.error('Slack user lookup error:', error);
    return null;
  }
}

/**
 * Find channel by name
 */
export async function findChannelByName(channelName: string): Promise<{
  id: string;
  name: string;
} | null> {
  if (!slackClient) return null;

  try {
    // Remove # prefix if present
    const name = channelName.startsWith('#')
      ? channelName.substring(1)
      : channelName;

    const result = await slackClient.conversations.list({
      types: 'public_channel,private_channel',
    });

    const channel = result.channels?.find((c: { name?: string; id?: string }) => c.name === name);

    if (channel) {
      return {
        id: channel.id as string,
        name: channel.name as string,
      };
    }

    return null;
  } catch (error) {
    console.error('Slack channel lookup error:', error);
    return null;
  }
}

/**
 * Send a direct message to a user
 */
export async function sendDirectMessage(
  userId: string,
  text: string
): Promise<SlackResult> {
  if (!slackClient) {
    return {
      success: false,
      error: 'Slack bot token not configured',
    };
  }

  try {
    // Open a conversation with the user
    const conversation = await slackClient.conversations.open({
      users: userId,
    });

    if (!conversation.channel?.id) {
      return {
        success: false,
        error: 'Could not open conversation with user',
      };
    }

    // Send message
    return await sendSlackMessage({
      channel: conversation.channel.id,
      text,
    });
  } catch (error) {
    console.error('Slack DM error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create a formatted Slack message with blocks
 */
export function createSlackBlocks(options: {
  title?: string;
  text: string;
  fields?: Array<{ title: string; value: string; short?: boolean }>;
  color?: 'good' | 'warning' | 'danger' | string;
  footer?: string;
  timestamp?: Date;
}): Array<Record<string, unknown>> {
  const blocks: Array<Record<string, unknown>> = [];

  // Add header if title provided
  if (options.title) {
    blocks.push({
      type: 'header',
      text: {
        type: 'plain_text',
        text: options.title,
      },
    });
  }

  // Add main text
  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: options.text,
    },
  });

  // Add fields if provided
  if (options.fields && options.fields.length > 0) {
    blocks.push({
      type: 'section',
      fields: options.fields.map(field => ({
        type: 'mrkdwn',
        text: `*${field.title}*\n${field.value}`,
      })),
    });
  }

  // Add footer context
  if (options.footer) {
    const contextElements: Array<Record<string, unknown>> = [
      {
        type: 'mrkdwn',
        text: options.footer,
      },
    ];

    if (options.timestamp) {
      contextElements.push({
        type: 'mrkdwn',
        text: `<!date^${Math.floor(options.timestamp.getTime() / 1000)}^{date_short_pretty} at {time}|${options.timestamp.toISOString()}>`,
      });
    }

    blocks.push({
      type: 'context',
      elements: contextElements,
    });
  }

  return blocks;
}

/**
 * Replace template variables in Slack message
 */
export function replaceSlackVariables(
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
 * Test Slack configuration
 */
export async function testSlackConfiguration(): Promise<{
  configured: boolean;
  botInfo?: { id: string; name: string };
  error?: string;
}> {
  if (!SLACK_BOT_TOKEN) {
    return {
      configured: false,
      error: 'SLACK_BOT_TOKEN environment variable not set',
    };
  }

  if (!slackClient) {
    return {
      configured: false,
      error: 'Slack client not initialized',
    };
  }

  try {
    const auth = await slackClient.auth.test();

    return {
      configured: true,
      botInfo: {
        id: auth.user_id as string,
        name: auth.user as string,
      },
    };
  } catch (error) {
    return {
      configured: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

const slackService = {
  sendSlackMessage,
  sendDirectMessage,
  findUserByUsername,
  findChannelByName,
  createSlackBlocks,
  replaceSlackVariables,
  testSlackConfiguration,
};

export default slackService;

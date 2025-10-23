/**
 * Message & Notification Cache Manager
 * 
 * Handles caching for:
 * - Direct messages (user-to-user)
 * - Channel messages (team/project channels)
 * - Message threads (parent-child replies)
 * - Message read status (unread counts)
 * - Notifications (user notifications)
 * - Notification counts (unread notification counts)
 * 
 * Features:
 * - Multi-level caching (L1 Memory + L2 Redis)
 * - Real-time unread count caching (1min TTL for accuracy)
 * - Channel message history caching
 * - Message thread caching
 * - Notification deduplication
 * - Pattern-based invalidation
 */

import { 
  getMultiLevelCache, 
  type MultiLevelCache 
} from '../multi-level-cache'
import { CacheNamespace } from '../cache-keys'
import { prisma } from '@/lib/prisma'
import type { Message, Notification, User, Channel, NotificationType } from '@prisma/client'

/**
 * TTL Configuration for Message & Notification Caching
 */
export const MESSAGE_CACHE_TTL = {
  MESSAGE: 600,            // 10 minutes - Message details
  THREAD: 900,            // 15 minutes - Message threads
  CHANNEL_HISTORY: 300,   // 5 minutes - Channel message history
  DIRECT_HISTORY: 300,    // 5 minutes - Direct message history
  UNREAD_COUNT: 60,       // 1 minute - Unread counts (real-time feel)
  NOTIFICATION: 300,      // 5 minutes - Notification details
  NOTIFICATION_LIST: 180, // 3 minutes - Notification lists
  NOTIFICATION_COUNT: 60, // 1 minute - Unread notification count
  SEARCH: 600,            // 10 minutes - Message search results
  
  // L1 (Memory) Cache TTL - Shorter for real-time data
  L1: {
    MESSAGE: 120,         // 2 minutes
    UNREAD_COUNT: 30,     // 30 seconds (highly volatile)
    NOTIFICATION_COUNT: 30, // 30 seconds (highly volatile)
    CHANNEL_HISTORY: 60,  // 1 minute
  }
} as const

/**
 * Extended Message type with relations
 */
type MessageWithRelations = Message & {
  sender: Pick<User, 'id' | 'name' | 'email' | 'image'>
  receiver?: Pick<User, 'id' | 'name' | 'email' | 'image'> | null
  channel?: Pick<Channel, 'id' | 'name' | 'type'> | null
  replies?: Message[]
  parent?: Message | null
}

/**
 * Extended Notification type with relations
 */
type NotificationWithRelations = Notification & {
  user: Pick<User, 'id' | 'name' | 'email'>
}

/**
 * Message statistics type
 */
type MessageStats = {
  total: number
  unread: number
  byType: Record<string, number>
  byPriority: Record<string, number>
}

/**
 * Notification statistics type
 */
type NotificationStats = {
  total: number
  unread: number
  byType: Record<string, number>
}

/**
 * Message Cache Manager
 * Singleton for managing message and notification caching
 */
export class MessageCacheManager {
  private static instance: MessageCacheManager | null = null
  private cache: MultiLevelCache

  private constructor() {
    this.cache = getMultiLevelCache()
  }

  /**
   * Get singleton instance
   */
  static getInstance(): MessageCacheManager {
    if (!MessageCacheManager.instance) {
      MessageCacheManager.instance = new MessageCacheManager()
    }
    return MessageCacheManager.instance
  }

  /**
   * MESSAGE CACHING METHODS
   */

  /**
   * Get message by ID with sender/receiver info
   * TTL: L1: 2min, L2: 10min
   */
  async getMessage(messageId: string): Promise<MessageWithRelations | null> {
    const cacheKey = `${CacheNamespace.MESSAGE}:details:${messageId}`
    
    // Try cache first
    const cached = await this.cache.get<MessageWithRelations>(cacheKey)
    if (cached) return cached
    
    // Fetch from database
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        channel: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        }
      }
    })
    
    if (!message) return null
    
    // Cache and return
    await this.cache.set(cacheKey, message, {
      l1Ttl: MESSAGE_CACHE_TTL.L1.MESSAGE,
      l2Ttl: MESSAGE_CACHE_TTL.MESSAGE,
    })
    
    return message as MessageWithRelations
  }

  /**
   * Get message thread (parent + all replies)
   * TTL: L1: 2min, L2: 15min
   */
  async getMessageThread(messageId: string): Promise<MessageWithRelations | null> {
    const cacheKey = `${CacheNamespace.MESSAGE}:thread:${messageId}`
    
    // Try cache first
    const cached = await this.cache.get<MessageWithRelations>(cacheKey)
    if (cached) return cached
    
    // Fetch from database
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        channel: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              }
            }
          }
        },
        parent: true,
      }
    })
    
    if (!message) return null
    
    // Cache and return
    await this.cache.set(cacheKey, message, {
      l1Ttl: MESSAGE_CACHE_TTL.L1.MESSAGE,
      l2Ttl: MESSAGE_CACHE_TTL.THREAD,
    })
    
    return message as MessageWithRelations
  }

  /**
   * Get channel message history
   * TTL: L1: 1min, L2: 5min
   */
  async getChannelMessages(
    channelId: string, 
    limit: number = 50,
    before?: Date
  ): Promise<MessageWithRelations[]> {
    const beforeKey = before ? `:before:${before.getTime()}` : ''
    const cacheKey = `${CacheNamespace.MESSAGE}:channel:${channelId}:limit:${limit}${beforeKey}`
    
    // Try cache first
    const cached = await this.cache.get<MessageWithRelations[]>(cacheKey)
    if (cached) return cached
    
    // Fetch from database
    const messages = await prisma.message.findMany({
      where: {
        channelId,
        ...(before && { createdAt: { lt: before } }),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        replies: {
          take: 3, // Only include first 3 replies preview
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    
    // Cache and return
    await this.cache.set(cacheKey, messages, {
      l1Ttl: MESSAGE_CACHE_TTL.L1.CHANNEL_HISTORY,
      l2Ttl: MESSAGE_CACHE_TTL.CHANNEL_HISTORY,
    })
    
    return messages as MessageWithRelations[]
  }

  /**
   * Get direct messages between two users
   * TTL: L1: 1min, L2: 5min
   */
  async getDirectMessages(
    userId1: string,
    userId2: string,
    limit: number = 50
  ): Promise<MessageWithRelations[]> {
    // Normalize user order for consistent cache key
    const [user1, user2] = [userId1, userId2].sort()
    const cacheKey = `${CacheNamespace.MESSAGE}:direct:${user1}:${user2}:limit:${limit}`
    
    // Try cache first
    const cached = await this.cache.get<MessageWithRelations[]>(cacheKey)
    if (cached) return cached
    
    // Fetch from database
    const messages = await prisma.message.findMany({
      where: {
        messageType: 'DIRECT',
        OR: [
          { senderId: user1, receiverId: user2 },
          { senderId: user2, receiverId: user1 },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    
    // Cache and return
    await this.cache.set(cacheKey, messages, {
      l1Ttl: MESSAGE_CACHE_TTL.L1.CHANNEL_HISTORY,
      l2Ttl: MESSAGE_CACHE_TTL.DIRECT_HISTORY,
    })
    
    return messages as MessageWithRelations[]
  }

  /**
   * Get user's unread message count
   * TTL: L1: 30sec, L2: 1min (real-time accuracy)
   */
  async getUserUnreadMessageCount(userId: string): Promise<number> {
    const cacheKey = `${CacheNamespace.MESSAGE}:unread:count:${userId}`
    
    // Try cache first
    const cached = await this.cache.get<number>(cacheKey)
    if (cached !== null) return cached
    
    // Fetch from database
    const count = await prisma.message.count({
      where: {
        OR: [
          { receiverId: userId },
          {
            channel: {
              members: {
                some: { id: userId }
              }
            }
          }
        ],
        readAt: null,
        senderId: { not: userId }, // Don't count own messages
      }
    })
    
    // Cache and return
    await this.cache.set(cacheKey, count, {
      l1Ttl: MESSAGE_CACHE_TTL.L1.UNREAD_COUNT,
      l2Ttl: MESSAGE_CACHE_TTL.UNREAD_COUNT,
    })
    
    return count
  }

  /**
   * Get user's unread messages
   * TTL: L1: 30sec, L2: 1min
   */
  async getUserUnreadMessages(userId: string, limit: number = 20): Promise<MessageWithRelations[]> {
    const cacheKey = `${CacheNamespace.MESSAGE}:unread:list:${userId}:limit:${limit}`
    
    // Try cache first
    const cached = await this.cache.get<MessageWithRelations[]>(cacheKey)
    if (cached) return cached
    
    // Fetch from database
    const messages = await prisma.message.findMany({
      where: {
        receiverId: userId,
        readAt: null,
        senderId: { not: userId },
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        channel: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    
    // Cache and return
    await this.cache.set(cacheKey, messages, {
      l1Ttl: MESSAGE_CACHE_TTL.L1.UNREAD_COUNT,
      l2Ttl: MESSAGE_CACHE_TTL.UNREAD_COUNT,
    })
    
    return messages as MessageWithRelations[]
  }

  /**
   * Search messages by content
   * TTL: L1: 2min, L2: 10min
   */
  async searchMessages(
    query: string,
    userId: string,
    limit: number = 20
  ): Promise<MessageWithRelations[]> {
    const cacheKey = `${CacheNamespace.MESSAGE}:search:${userId}:${query}:limit:${limit}`
    
    // Try cache first
    const cached = await this.cache.get<MessageWithRelations[]>(cacheKey)
    if (cached) return cached
    
    // Fetch from database
    const messages = await prisma.message.findMany({
      where: {
        AND: [
          {
            OR: [
              { content: { contains: query, mode: 'insensitive' } },
              { subject: { contains: query, mode: 'insensitive' } },
            ],
          },
          {
            OR: [
              { senderId: userId },
              { receiverId: userId },
              {
                channel: {
                  members: {
                    some: { id: userId }
                  }
                }
              }
            ],
          },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        channel: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    
    // Cache and return
    await this.cache.set(cacheKey, messages, {
      l1Ttl: MESSAGE_CACHE_TTL.L1.MESSAGE,
      l2Ttl: MESSAGE_CACHE_TTL.SEARCH,
    })
    
    return messages as MessageWithRelations[]
  }

  /**
   * Get message statistics for user
   * TTL: L1: 30sec, L2: 1min
   */
  async getUserMessageStats(userId: string): Promise<MessageStats> {
    const cacheKey = `${CacheNamespace.MESSAGE}:stats:user:${userId}`
    
    // Try cache first
    const cached = await this.cache.get<MessageStats>(cacheKey)
    if (cached) return cached
    
    // Fetch from database
    const [total, unread, byType, byPriority] = await Promise.all([
      // Total messages
      prisma.message.count({
        where: {
          OR: [
            { senderId: userId },
            { receiverId: userId },
          ]
        }
      }),
      // Unread messages
      prisma.message.count({
        where: {
          receiverId: userId,
          readAt: null,
          senderId: { not: userId },
        }
      }),
      // Messages by type
      prisma.message.groupBy({
        by: ['messageType'],
        where: {
          OR: [
            { senderId: userId },
            { receiverId: userId },
          ]
        },
        _count: true,
      }),
      // Messages by priority
      prisma.message.groupBy({
        by: ['priority'],
        where: {
          OR: [
            { senderId: userId },
            { receiverId: userId },
          ]
        },
        _count: true,
      }),
    ])

    const stats = {
      total,
      unread,
      byType: Object.fromEntries(
        byType.map(item => [item.messageType, item._count])
      ),
      byPriority: Object.fromEntries(
        byPriority.map(item => [item.priority, item._count])
      ),
    }
    
    // Cache and return
    await this.cache.set(cacheKey, stats, {
      l1Ttl: MESSAGE_CACHE_TTL.L1.UNREAD_COUNT,
      l2Ttl: MESSAGE_CACHE_TTL.UNREAD_COUNT,
    })
    
    return stats
  }

  /**
   * NOTIFICATION CACHING METHODS
   */

  /**
   * Get notification by ID
   * TTL: L1: 2min, L2: 5min
   */
  async getNotification(notificationId: string): Promise<NotificationWithRelations | null> {
    const cacheKey = `${CacheNamespace.MESSAGE}:notification:details:${notificationId}`
    
    // Try cache first
    const cached = await this.cache.get<NotificationWithRelations>(cacheKey)
    if (cached) return cached
    
    // Fetch from database
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })
    
    if (!notification) return null
    
    // Cache and return
    await this.cache.set(cacheKey, notification, {
      l1Ttl: MESSAGE_CACHE_TTL.L1.MESSAGE,
      l2Ttl: MESSAGE_CACHE_TTL.NOTIFICATION,
    })
    
    return notification as NotificationWithRelations
  }

  /**
   * Get user notifications
   * TTL: L1: 1min, L2: 3min
   */
  async getUserNotifications(
    userId: string,
    unreadOnly: boolean = false,
    limit: number = 20
  ): Promise<Notification[]> {
    const unreadKey = unreadOnly ? ':unread' : ''
    const cacheKey = `${CacheNamespace.MESSAGE}:notification:list:${userId}${unreadKey}:limit:${limit}`
    
    // Try cache first
    const cached = await this.cache.get<Notification[]>(cacheKey)
    if (cached) return cached
    
    // Fetch from database
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly && { read: false }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    
    // Cache and return
    await this.cache.set(cacheKey, notifications, {
      l1Ttl: MESSAGE_CACHE_TTL.L1.MESSAGE,
      l2Ttl: MESSAGE_CACHE_TTL.NOTIFICATION_LIST,
    })
    
    return notifications
  }

  /**
   * Get user's unread notification count
   * TTL: L1: 30sec, L2: 1min (real-time accuracy)
   */
  async getUserUnreadNotificationCount(userId: string): Promise<number> {
    const cacheKey = `${CacheNamespace.MESSAGE}:notification:unread:count:${userId}`
    
    // Try cache first
    const cached = await this.cache.get<number>(cacheKey)
    if (cached !== null) return cached
    
    // Fetch from database
    const count = await prisma.notification.count({
      where: {
        userId,
        read: false,
      }
    })
    
    // Cache and return
    await this.cache.set(cacheKey, count, {
      l1Ttl: MESSAGE_CACHE_TTL.L1.NOTIFICATION_COUNT,
      l2Ttl: MESSAGE_CACHE_TTL.NOTIFICATION_COUNT,
    })
    
    return count
  }

  /**
   * Get notifications by type
   * TTL: L1: 1min, L2: 3min
   */
  async getUserNotificationsByType(
    userId: string,
    type: NotificationType,
    limit: number = 20
  ): Promise<Notification[]> {
    const cacheKey = `${CacheNamespace.MESSAGE}:notification:type:${userId}:${type}:limit:${limit}`
    
    // Try cache first
    const cached = await this.cache.get<Notification[]>(cacheKey)
    if (cached) return cached
    
    // Fetch from database
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        type,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    
    // Cache and return
    await this.cache.set(cacheKey, notifications, {
      l1Ttl: MESSAGE_CACHE_TTL.L1.MESSAGE,
      l2Ttl: MESSAGE_CACHE_TTL.NOTIFICATION_LIST,
    })
    
    return notifications
  }

  /**
   * Get notification statistics for user
   * TTL: L1: 30sec, L2: 1min
   */
  async getUserNotificationStats(userId: string): Promise<NotificationStats> {
    const cacheKey = `${CacheNamespace.MESSAGE}:notification:stats:${userId}`
    
    // Try cache first
    const cached = await this.cache.get<NotificationStats>(cacheKey)
    if (cached) return cached
    
    // Fetch from database
    const [total, unread, byType] = await Promise.all([
      // Total notifications
      prisma.notification.count({
        where: { userId }
      }),
      // Unread notifications
      prisma.notification.count({
        where: {
          userId,
          read: false,
        }
      }),
      // Notifications by type
      prisma.notification.groupBy({
        by: ['type'],
        where: { userId },
        _count: true,
      }),
    ])

    const stats = {
      total,
      unread,
      byType: Object.fromEntries(
        byType.map(item => [item.type, item._count])
      ),
    }
    
    // Cache and return
    await this.cache.set(cacheKey, stats, {
      l1Ttl: MESSAGE_CACHE_TTL.L1.NOTIFICATION_COUNT,
      l2Ttl: MESSAGE_CACHE_TTL.NOTIFICATION_COUNT,
    })
    
    return stats
  }

  /**
   * CACHE INVALIDATION METHODS
   */

  /**
   * Invalidate all message caches for a specific message
   */
  async invalidateMessage(messageId: string): Promise<void> {
    await Promise.all([
      this.cache.delete(`${CacheNamespace.MESSAGE}:details:${messageId}`),
      this.cache.delete(`${CacheNamespace.MESSAGE}:thread:${messageId}`),
    ])
  }

  /**
   * Invalidate channel message caches
   */
  async invalidateChannelMessages(channelId: string): Promise<void> {
    await this.cache.invalidatePattern(
      `${CacheNamespace.MESSAGE}:channel:${channelId}*`
    )
  }

  /**
   * Invalidate direct message caches between two users
   */
  async invalidateDirectMessages(userId1: string, userId2: string): Promise<void> {
    const [user1, user2] = [userId1, userId2].sort()
    await this.cache.invalidatePattern(
      `${CacheNamespace.MESSAGE}:direct:${user1}:${user2}*`
    )
  }

  /**
   * Invalidate user's unread message caches
   */
  async invalidateUserUnreadMessages(userId: string): Promise<void> {
    await Promise.all([
      this.cache.invalidatePattern(`${CacheNamespace.MESSAGE}:unread:*:${userId}*`),
      this.cache.invalidatePattern(`${CacheNamespace.MESSAGE}:stats:user:${userId}`),
    ])
  }

  /**
   * Invalidate user's message search caches
   */
  async invalidateUserMessageSearch(userId: string): Promise<void> {
    await this.cache.invalidatePattern(
      `${CacheNamespace.MESSAGE}:search:${userId}*`
    )
  }

  /**
   * Invalidate notification caches
   */
  async invalidateNotification(notificationId: string): Promise<void> {
    await this.cache.delete(
      `${CacheNamespace.MESSAGE}:notification:details:${notificationId}`
    )
  }

  /**
   * Invalidate user's notification caches
   */
  async invalidateUserNotifications(userId: string): Promise<void> {
    await Promise.all([
      this.cache.invalidatePattern(`${CacheNamespace.MESSAGE}:notification:list:${userId}*`),
      this.cache.invalidatePattern(`${CacheNamespace.MESSAGE}:notification:type:${userId}*`),
      this.cache.delete(`${CacheNamespace.MESSAGE}:notification:unread:count:${userId}`),
      this.cache.delete(`${CacheNamespace.MESSAGE}:notification:stats:${userId}`),
    ])
  }

  /**
   * Warm cache with message data
   */
  async warmMessageCache(messageId: string): Promise<void> {
    await Promise.all([
      this.getMessage(messageId),
      this.getMessageThread(messageId),
    ])
  }

  /**
   * Warm cache with notification data
   */
  async warmNotificationCache(userId: string): Promise<void> {
    await Promise.all([
      this.getUserNotifications(userId, false, 20),
      this.getUserUnreadNotificationCount(userId),
      this.getUserNotificationStats(userId),
    ])
  }
}

/**
 * Get MessageCacheManager singleton instance
 */
export function getMessageCacheManager(): MessageCacheManager {
  return MessageCacheManager.getInstance()
}

/**
 * Convenience functions for direct access
 */

// Message functions
export const getMessage = (messageId: string) => 
  getMessageCacheManager().getMessage(messageId)

export const getMessageThread = (messageId: string) => 
  getMessageCacheManager().getMessageThread(messageId)

export const getChannelMessages = (channelId: string, limit?: number, before?: Date) => 
  getMessageCacheManager().getChannelMessages(channelId, limit, before)

export const getDirectMessages = (userId1: string, userId2: string, limit?: number) => 
  getMessageCacheManager().getDirectMessages(userId1, userId2, limit)

export const getUserUnreadMessageCount = (userId: string) => 
  getMessageCacheManager().getUserUnreadMessageCount(userId)

export const getUserUnreadMessages = (userId: string, limit?: number) => 
  getMessageCacheManager().getUserUnreadMessages(userId, limit)

export const searchMessages = (query: string, userId: string, limit?: number) => 
  getMessageCacheManager().searchMessages(query, userId, limit)

export const getUserMessageStats = (userId: string) => 
  getMessageCacheManager().getUserMessageStats(userId)

// Notification functions
export const getNotification = (notificationId: string) => 
  getMessageCacheManager().getNotification(notificationId)

export const getUserNotifications = (userId: string, unreadOnly?: boolean, limit?: number) => 
  getMessageCacheManager().getUserNotifications(userId, unreadOnly, limit)

export const getUserUnreadNotificationCount = (userId: string) => 
  getMessageCacheManager().getUserUnreadNotificationCount(userId)

export const getUserNotificationsByType = (userId: string, type: NotificationType, limit?: number) => 
  getMessageCacheManager().getUserNotificationsByType(userId, type, limit)

export const getUserNotificationStats = (userId: string) => 
  getMessageCacheManager().getUserNotificationStats(userId)

// Invalidation functions
export const invalidateMessage = (messageId: string) => 
  getMessageCacheManager().invalidateMessage(messageId)

export const invalidateChannelMessages = (channelId: string) => 
  getMessageCacheManager().invalidateChannelMessages(channelId)

export const invalidateDirectMessages = (userId1: string, userId2: string) => 
  getMessageCacheManager().invalidateDirectMessages(userId1, userId2)

export const invalidateUserUnreadMessages = (userId: string) => 
  getMessageCacheManager().invalidateUserUnreadMessages(userId)

export const invalidateUserMessageSearch = (userId: string) => 
  getMessageCacheManager().invalidateUserMessageSearch(userId)

export const invalidateNotification = (notificationId: string) => 
  getMessageCacheManager().invalidateNotification(notificationId)

export const invalidateUserNotifications = (userId: string) => 
  getMessageCacheManager().invalidateUserNotifications(userId)

// Cache warming functions
export const warmMessageCache = (messageId: string) => 
  getMessageCacheManager().warmMessageCache(messageId)

export const warmNotificationCache = (userId: string) => 
  getMessageCacheManager().warmNotificationCache(userId)

/**
 * Invoice & Message Query Library
 * 
 * Optimized queries for Invoice and Message models
 */

import { prisma } from '@/lib/prisma';
import {
  InvoiceFilter,
  InvoiceMinimal,
  InvoiceWithClient,
  InvoiceFull,
  invoiceSelectMinimal,
  invoiceSelectWithClient,
  invoiceSelectFull,
  MessageFilter,
  MessageMinimal,
  MessageWithUsers,
  MessageFull,
  messageSelectMinimal,
  messageSelectWithUsers,
  messageSelectFull,
  PaginationInput,
  PaginatedResponse,
} from './types';
import {
  buildSoftDeleteWhere,
  calculatePagination,
  buildPaginatedResponse,
  buildSearchConditions,
  buildStatusFilter,
  buildDateRangeFilter,
  buildNumericRangeFilter,
  withQueryMetrics,
  batchLoadByForeignKey,
} from './common';
import { Prisma } from '@prisma/client';

// ============================================================================
// INVOICE QUERIES
// ============================================================================

/**
 * Get invoice by ID (minimal fields)
 * Uses: Invoice_id_deletedAt_idx
 */
export async function getInvoiceById(
  id: string,
  includeDeleted: boolean = false
): Promise<InvoiceMinimal | null> {
  return withQueryMetrics('getInvoiceById', async () => {
    return prisma.invoice.findFirst({
      where: {
        id,
        ...buildSoftDeleteWhere({ includeDeleted }),
      },
      select: invoiceSelectMinimal,
    });
  });
}

/**
 * Get invoice by ID with client
 * Uses: Invoice_id_deletedAt_idx
 */
export async function getInvoiceWithClient(
  id: string,
  includeDeleted: boolean = false
): Promise<InvoiceWithClient | null> {
  return withQueryMetrics('getInvoiceWithClient', async () => {
    return prisma.invoice.findFirst({
      where: {
        id,
        ...buildSoftDeleteWhere({ includeDeleted }),
      },
      select: invoiceSelectWithClient,
    });
  });
}

/**
 * Get invoices with filtering and pagination
 * Uses: Various indexes depending on filter
 * - status: Invoice_status_deletedAt_idx
 * - clientId: Invoice_clientId_status_idx
 * - dueDate: Invoice_dueDate_status_idx
 */
export async function getInvoices(
  filter?: InvoiceFilter,
  pagination?: PaginationInput
): Promise<PaginatedResponse<InvoiceWithClient>> {
  return withQueryMetrics('getInvoices', async () => {
    const { skip, take, page, limit } = calculatePagination(pagination);

    // Build where clause
    const where: Prisma.InvoiceWhereInput = {
      ...buildSoftDeleteWhere(filter),
    };

    // Add status filter
    if (filter?.status) {
      where.status = buildStatusFilter(filter.status);
    }

    // Add client filter
    if (filter?.clientId) {
      where.clientId = filter.clientId;
    }

    // Add project filter
    if (filter?.projectId) {
      where.projectId = filter.projectId;
    }

    // Add due date filter
    if (filter?.dueDate) {
      const dueDateFilter = buildDateRangeFilter(filter.dueDate);
      if (dueDateFilter) {
        where.dueDate = dueDateFilter;
      }
    }

    // Add issue date filter
    if (filter?.issueDate) {
      const issueDateFilter = buildDateRangeFilter(filter.issueDate);
      if (issueDateFilter) {
        where.issueDate = issueDateFilter;
      }
    }

    // Add amount range filter
    if (filter?.amountRange) {
      const amountFilter = buildNumericRangeFilter(filter.amountRange);
      if (amountFilter) {
        where.amount = amountFilter;
      }
    }

    // Add search filter
    if (filter?.search) {
      const searchConditions = buildSearchConditions(filter.search, ['invoiceNumber']);
      if (searchConditions) {
        where.OR = searchConditions;
      }
    }

    // Execute query with count
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        select: invoiceSelectWithClient,
        skip,
        take,
        orderBy: [
          { dueDate: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.invoice.count({ where }),
    ]);

    return buildPaginatedResponse(invoices, total, { page, limit });
  });
}

/**
 * Get invoices by client
 * Uses: Invoice_clientId_status_idx
 */
export async function getInvoicesByClient(
  clientId: string,
  pagination?: PaginationInput
): Promise<PaginatedResponse<InvoiceWithClient>> {
  return getInvoices({ clientId }, pagination);
}

/**
 * Get invoices by status
 * Uses: Invoice_status_deletedAt_idx
 */
export async function getInvoicesByStatus(
  status: string | string[],
  pagination?: PaginationInput
): Promise<PaginatedResponse<InvoiceWithClient>> {
  return getInvoices({ status: status as 'DRAFT' }, pagination);
}

/**
 * Get overdue invoices
 * Uses: Invoice_dueDate_status_idx
 */
export async function getOverdueInvoices(
  pagination?: PaginationInput
): Promise<PaginatedResponse<InvoiceWithClient>> {
  return withQueryMetrics('getOverdueInvoices', async () => {
    const { skip, take, page, limit } = calculatePagination(pagination);

    const where: Prisma.InvoiceWhereInput = {
      deletedAt: null,
      status: { notIn: ['PAID', 'CANCELLED'] },
      dueDate: { lt: new Date() },
    };

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        select: invoiceSelectWithClient,
        skip,
        take,
        orderBy: { dueDate: 'asc' },
      }),
      prisma.invoice.count({ where }),
    ]);

    return buildPaginatedResponse(invoices, total, { page, limit });
  });
}

/**
 * Batch load invoices by project IDs
 */
export async function batchGetInvoicesByProjectIds(
  projectIds: string[]
): Promise<Map<string, InvoiceMinimal[]>> {
  return withQueryMetrics('batchGetInvoicesByProjectIds', async () => {
    return batchLoadByForeignKey<InvoiceMinimal>(
      prisma.invoice,
      'projectId',
      projectIds,
      invoiceSelectMinimal
    );
  });
}

/**
 * Get invoice statistics
 */
export async function getInvoiceStats(filter?: { clientId?: string; projectId?: string }) {
  return withQueryMetrics('getInvoiceStats', async () => {
    const where: Prisma.InvoiceWhereInput = {
      deletedAt: null,
      ...(filter?.clientId && { clientId: filter.clientId }),
      ...(filter?.projectId && { projectId: filter.projectId }),
    };

    const [
      total,
      byStatus,
      totalAmount,
      paidAmount,
      overdueCount,
    ] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      prisma.invoice.aggregate({
        where,
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: {
          ...where,
          status: 'PAID',
        },
        _sum: { total: true },
      }),
      prisma.invoice.count({
        where: {
          ...where,
          status: { notIn: ['PAID', 'CANCELLED'] },
          dueDate: { lt: new Date() },
        },
      }),
    ]);

    return {
      total,
      byStatus: Object.fromEntries(
        byStatus.map((s) => [s.status, s._count])
      ),
      totalAmount: totalAmount._sum.total || 0,
      paidAmount: paidAmount._sum.total || 0,
      unpaidAmount: (totalAmount._sum.total || 0) - (paidAmount._sum.total || 0),
      overdueCount,
      collectionRate: totalAmount._sum.total
        ? ((paidAmount._sum.total || 0) / totalAmount._sum.total) * 100
        : 0,
    };
  });
}

/**
 * Update invoice status
 */
export async function updateInvoiceStatus(
  id: string,
  status: string,
  paidAt?: Date
): Promise<InvoiceFull> {
  return withQueryMetrics('updateInvoiceStatus', async () => {
    return prisma.invoice.update({
      where: { id },
      data: {
        status,
        ...(paidAt && { paidAt }),
        updatedAt: new Date(),
      },
      select: invoiceSelectFull,
    });
  });
}

// ============================================================================
// MESSAGE QUERIES
// ============================================================================

/**
 * Get message by ID (minimal fields)
 * Uses: Message_id_deletedAt_idx
 */
export async function getMessageById(
  id: string,
  includeDeleted: boolean = false
): Promise<MessageMinimal | null> {
  return withQueryMetrics('getMessageById', async () => {
    return prisma.message.findFirst({
      where: {
        id,
        ...buildSoftDeleteWhere({ includeDeleted }),
      },
      select: messageSelectMinimal,
    });
  });
}

/**
 * Get message by ID with users
 * Uses: Message_id_deletedAt_idx
 */
export async function getMessageWithUsers(
  id: string,
  includeDeleted: boolean = false
): Promise<MessageWithUsers | null> {
  return withQueryMetrics('getMessageWithUsers', async () => {
    return prisma.message.findFirst({
      where: {
        id,
        ...buildSoftDeleteWhere({ includeDeleted }),
      },
      select: messageSelectWithUsers,
    });
  });
}

/**
 * Get messages with filtering and pagination
 * Uses: Various indexes depending on filter
 * - senderId: Message_senderId_createdAt_idx
 * - receiverId: Message_receiverId_readAt_idx
 * - channelId: Message_channelId_createdAt_idx
 */
export async function getMessages(
  filter?: MessageFilter,
  pagination?: PaginationInput
): Promise<PaginatedResponse<MessageWithUsers>> {
  return withQueryMetrics('getMessages', async () => {
    const { skip, take, page, limit } = calculatePagination(pagination);

    // Build where clause
    const where: Prisma.MessageWhereInput = {
      ...buildSoftDeleteWhere(filter),
    };

    // Add sender filter
    if (filter?.senderId) {
      where.senderId = filter.senderId;
    }

    // Add receiver filter
    if (filter?.receiverId) {
      where.receiverId = filter.receiverId;
    }

    // Add project filter
    if (filter?.projectId) {
      where.projectId = filter.projectId;
    }

    // Add channel filter
    if (filter?.channelId) {
      where.channelId = filter.channelId;
    }

    // Add unread filter
    if (filter?.unreadOnly) {
      where.readAt = null;
    }

    // Add date range filter
    if (filter?.dateRange) {
      const dateFilter = buildDateRangeFilter(filter.dateRange);
      if (dateFilter) {
        where.createdAt = dateFilter;
      }
    }

    // Execute query with count
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        select: messageSelectWithUsers,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.message.count({ where }),
    ]);

    return buildPaginatedResponse(messages, total, { page, limit });
  });
}

/**
 * Get conversation between two users
 * Uses: Message_senderId_createdAt_idx, Message_receiverId_readAt_idx
 */
export async function getConversation(
  userId1: string,
  userId2: string,
  pagination?: PaginationInput
): Promise<PaginatedResponse<MessageWithUsers>> {
  return withQueryMetrics('getConversation', async () => {
    const { skip, take, page, limit } = calculatePagination(pagination);

    const where: Prisma.MessageWhereInput = {
      deletedAt: null,
      OR: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ],
    };

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        select: messageSelectWithUsers,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.message.count({ where }),
    ]);

    return buildPaginatedResponse(messages, total, { page, limit });
  });
}

/**
 * Get unread messages for user
 * Uses: Message_receiverId_readAt_idx
 */
export async function getUnreadMessages(
  userId: string,
  pagination?: PaginationInput
): Promise<PaginatedResponse<MessageWithUsers>> {
  return getMessages({
    receiverId: userId,
    unreadOnly: true,
  }, pagination);
}

/**
 * Get unread message count for user
 * Uses: Message_receiverId_readAt_idx
 */
export async function getUnreadMessageCount(userId: string): Promise<number> {
  return withQueryMetrics('getUnreadMessageCount', async () => {
    return prisma.message.count({
      where: {
        receiverId: userId,
        readAt: null,
        deletedAt: null,
      },
    });
  });
}

/**
 * Mark message as read
 * Uses: Message_id_deletedAt_idx
 */
export async function markMessageAsRead(id: string): Promise<MessageFull> {
  return withQueryMetrics('markMessageAsRead', async () => {
    return prisma.message.update({
      where: { id },
      data: {
        readAt: new Date(),
        updatedAt: new Date(),
      },
      select: messageSelectFull,
    });
  });
}

/**
 * Mark all messages as read for user
 * Uses: Message_receiverId_readAt_idx
 */
export async function markAllMessagesAsRead(userId: string): Promise<{ count: number }> {
  return withQueryMetrics('markAllMessagesAsRead', async () => {
    return prisma.message.updateMany({
      where: {
        receiverId: userId,
        readAt: null,
        deletedAt: null,
      },
      data: {
        readAt: new Date(),
        updatedAt: new Date(),
      },
    });
  });
}

/**
 * Batch load messages by channel IDs
 */
export async function batchGetMessagesByChannelIds(
  channelIds: string[]
): Promise<Map<string, MessageMinimal[]>> {
  return withQueryMetrics('batchGetMessagesByChannelIds', async () => {
    return batchLoadByForeignKey<MessageMinimal>(
      prisma.message,
      'channelId',
      channelIds,
      messageSelectMinimal
    );
  });
}

/**
 * Get message statistics
 */
export async function getMessageStats(userId: string) {
  return withQueryMetrics('getMessageStats', async () => {
    const [sent, received, unread, recent] = await Promise.all([
      prisma.message.count({
        where: {
          senderId: userId,
          deletedAt: null,
        },
      }),
      prisma.message.count({
        where: {
          receiverId: userId,
          deletedAt: null,
        },
      }),
      prisma.message.count({
        where: {
          receiverId: userId,
          readAt: null,
          deletedAt: null,
        },
      }),
      prisma.message.count({
        where: {
          receiverId: userId,
          deletedAt: null,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      sent,
      received,
      unread,
      recent,
      readRate: received > 0 ? ((received - unread) / received) * 100 : 0,
    };
  });
}

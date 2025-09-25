// Bulk Operations API for CMS
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { APIResponse, BulkOperationResult } from '@/types/cms'

const bulkOperationSchema = z.object({
  action: z.enum(['delete', 'publish', 'unpublish', 'updateStatus', 'updateCategory', 'updateTags']),
  itemIds: z.array(z.string()).min(1, 'At least one item ID is required'),
  data: z.record(z.unknown()).optional()
})

async function checkPermissions() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return { authorized: false, user: null }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true }
  })

  if (!user || user.role !== 'ADMIN') {
    return { authorized: false, user: null }
  }

  return { authorized: true, user }
}

function createAPIResponse<T>(
  success: boolean,
  data?: T,
  error?: string,
  message?: string
): APIResponse<T> {
  return {
    success,
    data,
    error,
    message,
    timestamp: new Date().toISOString()
  }
}

// POST /api/admin/cms/content/bulk - Perform bulk operations
export async function POST(request: NextRequest) {
  try {
    const { authorized } = await checkPermissions()
    if (!authorized) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Unauthorized'),
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, itemIds, data } = bulkOperationSchema.parse(body)

    const result: BulkOperationResult = {
      success: 0,
      failed: 0,
      errors: []
    }

    // Process each item
    for (const itemId of itemIds) {
      try {
        switch (action) {
          case 'delete':
            await prisma.dynamicContentItem.delete({
              where: { id: itemId }
            })
            break

          case 'publish':
            await prisma.dynamicContentItem.update({
              where: { id: itemId },
              data: {
                status: 'published',
                publishedAt: new Date()
              }
            })
            break

          case 'unpublish':
            await prisma.dynamicContentItem.update({
              where: { id: itemId },
              data: {
                status: 'draft',
                publishedAt: null
              }
            })
            break

          case 'updateStatus':
            if (!data?.status) {
              throw new Error('Status is required for updateStatus action')
            }
            await prisma.dynamicContentItem.update({
              where: { id: itemId },
              data: { status: data.status as string }
            })
            break

          case 'updateCategory':
            await prisma.dynamicContentItem.update({
              where: { id: itemId },
              data: {
                categories: data?.categories ? JSON.stringify(data.categories) : null
              }
            })
            break

          case 'updateTags':
            await prisma.dynamicContentItem.update({
              where: { id: itemId },
              data: {
                tags: data?.tags ? JSON.stringify(data.tags) : null
              }
            })
            break

          default:
            throw new Error(`Unsupported action: ${action}`)
        }

        result.success++
      } catch (error) {
        result.failed++
        result.errors.push({
          itemId,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json(
      createAPIResponse(
        true,
        result,
        undefined,
        `Bulk operation completed: ${result.success} successful, ${result.failed} failed`
      )
    )
  } catch (error) {
    console.error('Error performing bulk operation:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Validation error: ' + error.errors.map(e => e.message).join(', ')),
        { status: 400 }
      )
    }
    return NextResponse.json(
      createAPIResponse(false, null, 'Failed to perform bulk operation'),
      { status: 500 }
    )
  }
}
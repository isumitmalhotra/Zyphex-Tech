// GET /api/reports/templates - Get all report templates

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only PROJECT_MANAGER and ADMIN can access reports
    if (session.user.role !== 'PROJECT_MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const type = searchParams.get('type')
    const isBuiltIn = searchParams.get('isBuiltIn')

    const where: any = { isActive: true }
    
    if (category) {
      where.category = category
    }
    
    if (type) {
      where.type = type
    }
    
    if (isBuiltIn !== null && isBuiltIn !== undefined) {
      where.isBuiltIn = isBuiltIn === 'true'
    }

    const [templates, total, categoryCounts] = await Promise.all([
      prisma.reportTemplate.findMany({
        where,
        orderBy: [
          { isBuiltIn: 'desc' },
          { name: 'asc' }
        ],
        include: {
          _count: {
            select: {
              reports: true,
              schedules: true
            }
          }
        }
      }),
      prisma.reportTemplate.count({ where }),
      prisma.reportTemplate.groupBy({
        by: ['category'],
        where: { isActive: true },
        _count: { id: true }
      })
    ])

    const categories = categoryCounts.map(c => ({
      category: c.category,
      count: c._count.id
    }))

    return NextResponse.json({
      templates,
      total,
      categories
    })
  } catch (error) {
    console.error('Error fetching report templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

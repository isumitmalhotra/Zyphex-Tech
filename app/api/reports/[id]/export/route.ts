// GET /api/reports/[id]/export - Export a report in various formats

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { reportService } from '@/lib/services/report-service'
import { z } from 'zod'

const exportSchema = z.object({
  format: z.enum(['PDF', 'EXCEL', 'CSV', 'JSON']),
  includeSummary: z.boolean().optional().default(true),
  includeCharts: z.boolean().optional().default(true),
  includeRawData: z.boolean().optional().default(true),
  branding: z.object({
    logo: z.string().optional(),
    companyName: z.string().optional(),
    colors: z.object({
      primary: z.string().optional(),
      secondary: z.string().optional(),
      accent: z.string().optional()
    }).optional(),
    headerText: z.string().optional(),
    footerText: z.string().optional()
  }).optional()
})

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PROJECT_MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const reportId = params.id
    const { searchParams } = new URL(request.url)
    
    const format = (searchParams.get('format') || 'PDF') as 'PDF' | 'EXCEL' | 'CSV' | 'JSON'
    const includeSummary = searchParams.get('includeSummary') !== 'false'
    const includeCharts = searchParams.get('includeCharts') !== 'false'
    const includeRawData = searchParams.get('includeRawData') !== 'false'

    const validatedOptions = exportSchema.parse({
      format,
      includeSummary,
      includeCharts,
      includeRawData
    })

    const exportResult = await reportService.exportReport(
      reportId,
      validatedOptions.format,
      validatedOptions
    )

    // Update download count
    await prisma.report.update({
      where: { id: reportId },
      data: {
        downloadCount: { increment: 1 }
      }
    })

    // Return file as download
    return new NextResponse(exportResult.buffer, {
      status: 200,
      headers: {
        'Content-Type': exportResult.mimeType,
        'Content-Disposition': `attachment; filename="${exportResult.fileName}"`,
        'Content-Length': exportResult.buffer.length.toString()
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error exporting report:', error)
    return NextResponse.json(
      {
        error: 'Failed to export report',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// GET /api/careers - Get all active job postings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const department = searchParams.get('department')
    const type = searchParams.get('type')
    const remote = searchParams.get('remote')

    const where: any = {
      isActive: true,
    }

    if (department && department !== 'All') {
      where.department = department
    }

    if (type && type !== 'All') {
      where.type = type
    }

    if (remote !== null && remote !== undefined) {
      where.remote = remote === 'true'
    }

    const jobs = await prisma.jobPosting.findMany({
      where,
      orderBy: [
        { postedDate: 'desc' }
      ]
    })

    // Transform JSON fields for frontend
    const transformedJobs = jobs.map(job => ({
      ...job,
      requirements: Array.isArray(job.requirements) ? job.requirements : JSON.parse(job.requirements as string),
      responsibilities: Array.isArray(job.responsibilities) ? job.responsibilities : JSON.parse(job.responsibilities as string),
    }))

    return NextResponse.json(transformedJobs)
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job postings' },
      { status: 500 }
    )
  }
}

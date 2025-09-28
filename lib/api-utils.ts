import { NextResponse } from 'next/server'

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginationResult {
  total: number
  page: number
  limit: number
  totalPages: number
}

export function getPaginationParams(searchParams: URLSearchParams): { skip: number; take: number; page: number; limit: number } {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')))
  const skip = (page - 1) * limit
  
  return { skip, take: limit, page, limit }
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }
}

export function handleApiError(error: unknown, context: string = 'API Error') {
  console.error(`${context}:`, error)
  
  // Type guard for Prisma errors
  const prismaError = error as { code?: string }
  
  if (prismaError.code === 'P2002') {
    return NextResponse.json(
      { error: 'A record with this information already exists' },
      { status: 409 }
    )
  }
  
  if (prismaError.code === 'P2025') {
    return NextResponse.json(
      { error: 'Record not found' },
      { status: 404 }
    )
  }
  
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}

export function validateRequiredFields(data: Record<string, unknown>, requiredFields: string[]): string | null {
  for (const field of requiredFields) {
    if (!data[field]) {
      return `${field} is required`
    }
  }
  return null
}
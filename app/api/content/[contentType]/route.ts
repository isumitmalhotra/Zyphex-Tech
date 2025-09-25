import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateField, generateSlug, getDefaultFieldValue } from '@/types/content'

// GET /api/content/[contentType] - Fetch content items by type
export async function GET(
  request: NextRequest,
  { params }: { params: { contentType: string } }
) {
  try {
    const { contentType } = params
    const url = new URL(request.url)
    
    // Parse query parameters
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const status = url.searchParams.get('status') || 'published'
    const featured = url.searchParams.get('featured')
    const search = url.searchParams.get('search')
    const category = url.searchParams.get('category')
    const tag = url.searchParams.get('tag')
    const sortBy = url.searchParams.get('sortBy') || 'order'
    const sortOrder = url.searchParams.get('sortOrder') || 'asc'

    const skip = (page - 1) * limit

    // Dynamic content routing based on content type
    let result: any = { success: false, error: 'Unknown content type' }

    switch (contentType) {
      case 'services':
        result = await getServices({ page, limit, status, featured, search, sortBy, sortOrder, skip })
        break
      case 'portfolio':
        result = await getPortfolio({ page, limit, status, featured, search, category, tag, sortBy, sortOrder, skip })
        break
      case 'blog':
        result = await getBlog({ page, limit, status, featured, search, category, tag, sortBy, sortOrder, skip })
        break
      case 'content-sections':
        result = await getContentSections({ search, sortBy, sortOrder })
        break
      default:
        // Try to fetch from dynamic content system
        result = await getDynamicContent(contentType, { page, limit, status, featured, search, category, tag, sortBy, sortOrder, skip })
        break
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error(`Content API error for ${params.contentType}:`, error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch content' },
      { status: 500 }
    )
  }
}

// POST /api/content/[contentType] - Create new content item
export async function POST(
  request: NextRequest,
  { params }: { params: { contentType: string } }
) {
  try {
    const { contentType } = params
    const body = await request.json()

    let result: any = { success: false, error: 'Unknown content type' }

    switch (contentType) {
      case 'services':
        result = await createService(body)
        break
      case 'portfolio':
        result = await createPortfolio(body)
        break
      case 'blog':
        result = await createBlog(body)
        break
      case 'content-sections':
        result = await createContentSection(body)
        break
      default:
        // Try to create in dynamic content system
        result = await createDynamicContent(contentType, body)
        break
    }

    return NextResponse.json(result, { 
      status: result.success ? 201 : 400 
    })

  } catch (error) {
    console.error(`Content creation error for ${params.contentType}:`, error)
    return NextResponse.json(
      { success: false, error: 'Failed to create content' },
      { status: 500 }
    )
  }
}

// Helper functions for existing content types
async function getServices(params: any) {
  const services = await prisma.service.findMany({
    where: {
      isActive: params.status === 'published',
      ...(params.featured && { featured: params.featured === 'true' }),
      ...(params.search && {
        OR: [
          { title: { contains: params.search, mode: 'insensitive' } },
          { description: { contains: params.search, mode: 'insensitive' } }
        ]
      })
    },
    orderBy: { [params.sortBy]: params.sortOrder },
    skip: params.skip,
    take: params.limit
  })

  const total = await prisma.service.count({
    where: {
      isActive: params.status === 'published',
      ...(params.featured && { featured: params.featured === 'true' })
    }
  })

  return {
    success: true,
    data: services.map(service => ({
      ...service,
      features: service.features ? JSON.parse(service.features) : []
    })),
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      pages: Math.ceil(total / params.limit)
    }
  }
}

async function getPortfolio(params: any) {
  const items = await prisma.portfolioItem.findMany({
    where: {
      published: params.status === 'published',
      ...(params.featured && { featured: params.featured === 'true' }),
      ...(params.category && { category: params.category }),
      ...(params.search && {
        OR: [
          { title: { contains: params.search, mode: 'insensitive' } },
          { description: { contains: params.search, mode: 'insensitive' } }
        ]
      })
    },
    orderBy: { [params.sortBy]: params.sortOrder },
    skip: params.skip,
    take: params.limit
  })

  const total = await prisma.portfolioItem.count({
    where: {
      published: params.status === 'published',
      ...(params.featured && { featured: params.featured === 'true' }),
      ...(params.category && { category: params.category })
    }
  })

  return {
    success: true,
    data: items.map(item => ({
      ...item,
      technologies: item.technologies ? JSON.parse(item.technologies) : []
    })),
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      pages: Math.ceil(total / params.limit)
    }
  }
}

async function getBlog(params: any) {
  const posts = await prisma.blogPost.findMany({
    where: {
      published: params.status === 'published',
      ...(params.search && {
        OR: [
          { title: { contains: params.search, mode: 'insensitive' } },
          { content: { contains: params.search, mode: 'insensitive' } },
          { excerpt: { contains: params.search, mode: 'insensitive' } }
        ]
      })
    },
    orderBy: { [params.sortBy]: params.sortOrder },
    skip: params.skip,
    take: params.limit
  })

  const total = await prisma.blogPost.count({
    where: {
      published: params.status === 'published'
    }
  })

  return {
    success: true,
    data: posts.map(post => ({
      ...post,
      tags: post.tags ? JSON.parse(post.tags) : []
    })),
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      pages: Math.ceil(total / params.limit)
    }
  }
}

async function getContentSections(params: any) {
  const sections = await prisma.contentSection.findMany({
    where: {
      isActive: true,
      ...(params.search && {
        OR: [
          { title: { contains: params.search, mode: 'insensitive' } },
          { content: { contains: params.search, mode: 'insensitive' } }
        ]
      })
    },
    orderBy: { [params.sortBy]: params.sortOrder }
  })

  return {
    success: true,
    data: sections.map(section => ({
      ...section,
      content: section.content ? JSON.parse(section.content) : null
    }))
  }
}

// Dynamic content functions (for future extensibility)
async function getDynamicContent(contentType: string, params: any) {
  // This would work with the new ContentType system once the models are properly recognized
  // For now, return an error
  return {
    success: false,
    error: `Dynamic content type '${contentType}' not yet implemented`
  }
}

async function createService(data: any) {
  const service = await prisma.service.create({
    data: {
      title: data.title,
      description: data.description,
      icon: data.icon,
      imageUrl: data.imageUrl,
      features: data.features ? JSON.stringify(data.features) : null,
      isActive: data.isActive ?? true,
      order: data.order ?? 0
    }
  })

  return {
    success: true,
    data: {
      ...service,
      features: service.features ? JSON.parse(service.features) : []
    }
  }
}

async function createPortfolio(data: any) {
  const item = await prisma.portfolioItem.create({
    data: {
      title: data.title,
      slug: data.slug || generateSlug(data.title),
      description: data.description,
      category: data.category,
      client: data.client,
      technologies: data.technologies ? JSON.stringify(data.technologies) : null,
      imageUrl: data.imageUrl,
      featuredImage: data.featuredImage || data.imageUrl,
      projectUrl: data.projectUrl,
      liveUrl: data.liveUrl || data.projectUrl,
      githubUrl: data.githubUrl,
      featured: data.featured ?? false,
      published: data.published ?? true,
      isActive: data.isActive ?? true,
      order: data.order ?? 0
    }
  })

  return {
    success: true,
    data: {
      ...item,
      technologies: item.technologies ? JSON.parse(item.technologies) : []
    }
  }
}

async function createBlog(data: any) {
  const post = await prisma.blogPost.create({
    data: {
      title: data.title,
      slug: data.slug || generateSlug(data.title),
      excerpt: data.excerpt,
      content: data.content,
      author: data.author,
      imageUrl: data.imageUrl,
      tags: data.tags ? JSON.stringify(data.tags) : null,
      published: data.published ?? false,
      publishedAt: data.published ? new Date() : null
    }
  })

  return {
    success: true,
    data: {
      ...post,
      tags: post.tags ? JSON.parse(post.tags) : []
    }
  }
}

async function createContentSection(data: any) {
  const section = await prisma.contentSection.create({
    data: {
      sectionKey: data.sectionKey,
      title: data.title,
      subtitle: data.subtitle,
      content: data.content ? JSON.stringify(data.content) : null,
      imageUrl: data.imageUrl,
      isActive: data.isActive ?? true,
      order: data.order ?? 0
    }
  })

  return {
    success: true,
    data: {
      ...section,
      content: section.content ? JSON.parse(section.content) : null
    }
  }
}

async function createDynamicContent(contentType: string, data: any) {
  // This would work with the new ContentType system
  return {
    success: false,
    error: `Dynamic content creation for '${contentType}' not yet implemented`
  }
}
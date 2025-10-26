import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch all pages with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const pages = await prisma.page.findMany({
      where: {
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { slug: { contains: search, mode: 'insensitive' } },
            { path: { contains: search, mode: 'insensitive' } }
          ]
        }),
        ...(status === 'published' && { isActive: true }),
        ...(status === 'draft' && { isActive: false })
      },
      orderBy: [
        { order: 'asc' },
        { updatedAt: 'desc' }
      ]
    });

    // Transform pages to match frontend interface
    const transformedPages = pages.map(page => ({
      id: page.id,
      title: page.title,
      slug: page.slug,
      status: page.isActive ? 'published' : 'draft',
      author: 'Admin User', // Could be enhanced with user tracking
      lastModified: page.updatedAt.toISOString().replace('T', ' ').slice(0, 19),
      publishDate: page.createdAt.toISOString().replace('T', ' ').slice(0, 19),
      views: 0, // Could be enhanced with analytics tracking
      category: page.description || 'General',
      template: 'default-template',
      path: page.path,
      description: page.description,
      metaTitle: page.metaTitle,
      metaDescription: page.metaDescription,
      isSystem: page.isSystem,
      order: page.order
    }));

    // Calculate statistics
    const stats = {
      total: pages.length,
      published: pages.filter(p => p.isActive).length,
      draft: pages.filter(p => !p.isActive).length,
      archived: 0 // Could add archived status if needed
    };

    return NextResponse.json({
      success: true,
      pages: transformedPages,
      stats
    });

  } catch (error) {
    console.error('Error fetching pages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pages' },
      { status: 500 }
    );
  }
}

// POST - Create new page
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      title,
      slug,
      path,
      description,
      metaTitle,
      metaDescription,
      isActive = false,
      isSystem = false,
      order = 0
    } = body;

    if (!title || !slug) {
      return NextResponse.json(
        { error: 'Title and slug are required' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingPage = await prisma.page.findUnique({
      where: { slug }
    });

    if (existingPage) {
      return NextResponse.json(
        { error: 'A page with this slug already exists' },
        { status: 400 }
      );
    }

    const page = await prisma.page.create({
      data: {
        title,
        slug,
        path: path || `/${slug}`,
        description,
        metaTitle: metaTitle || title,
        metaDescription,
        isActive,
        isSystem,
        order
      }
    });

    return NextResponse.json({
      success: true,
      page,
      message: 'Page created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating page:', error);
    return NextResponse.json(
      { error: 'Failed to create page' },
      { status: 500 }
    );
  }
}

// PUT - Update page
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      id,
      title,
      slug,
      path,
      description,
      metaTitle,
      metaDescription,
      isActive,
      order
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Page ID is required' },
        { status: 400 }
      );
    }

    // Check if page is system page
    const existingPage = await prisma.page.findUnique({
      where: { id }
    });

    if (existingPage?.isSystem && slug !== existingPage.slug) {
      return NextResponse.json(
        { error: 'Cannot modify slug of system pages' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (path !== undefined) updateData.path = path;
    if (description !== undefined) updateData.description = description;
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (order !== undefined) updateData.order = order;

    const page = await prisma.page.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      page,
      message: 'Page updated successfully'
    });

  } catch (error) {
    console.error('Error updating page:', error);
    return NextResponse.json(
      { error: 'Failed to update page' },
      { status: 500 }
    );
  }
}

// DELETE - Delete page
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Page ID is required' },
        { status: 400 }
      );
    }

    // Check if page is system page
    const page = await prisma.page.findUnique({
      where: { id }
    });

    if (page?.isSystem) {
      return NextResponse.json(
        { error: 'Cannot delete system pages' },
        { status: 400 }
      );
    }

    await prisma.page.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Page deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting page:', error);
    return NextResponse.json(
      { error: 'Failed to delete page' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch all content items with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';

    // Fetch dynamic content items
    const contentItems = await prisma.dynamicContentItem.findMany({
      where: {
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { slug: { contains: search, mode: 'insensitive' } }
          ]
        }),
        ...(status && { status }),
        ...(category && {
          categories: {
            contains: category
          }
        })
      },
      include: {
        contentType: {
          select: {
            id: true,
            name: true,
            label: true,
            icon: true
          }
        }
      },
      orderBy: [
        { featured: 'desc' },
        { updatedAt: 'desc' }
      ]
    });

    // Fetch content types for filtering
    const contentTypes = await prisma.contentType.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        label: true,
        icon: true,
        category: true
      },
      orderBy: { name: 'asc' }
    });

    // Fetch content sections
    const contentSections = await prisma.dynamicContentSection.findMany({
      where: { isActive: true },
      include: {
        contentType: {
          select: {
            name: true,
            label: true
          }
        }
      },
      orderBy: { order: 'asc' }
    });

    // Transform content items to match frontend interface
    const transformedItems = contentItems.map(item => {
      let parsedData = {};
      let parsedCategories: string[] = [];
      let parsedTags: string[] = [];
      let parsedMetadata = {};

      try {
        parsedData = item.data ? JSON.parse(item.data) : {};
      } catch (_e) {
        console.error('Error parsing data:', _e);
      }

      try {
        parsedCategories = item.categories ? JSON.parse(item.categories) : [];
      } catch {
        parsedCategories = [];
      }

      try {
        parsedTags = item.tags ? JSON.parse(item.tags) : [];
      } catch {
        parsedTags = [];
      }

      try {
        parsedMetadata = item.metadata ? JSON.parse(item.metadata) : {};
      } catch {
        parsedMetadata = {};
      }

      const metadata = parsedMetadata as Record<string, unknown>;

      return {
        id: item.id,
        title: item.title,
        slug: item.slug || '',
        status: item.status,
        author: item.author || 'Unknown',
        lastModified: item.updatedAt.toISOString(),
        publishDate: item.publishedAt?.toISOString() || '',
        description: (metadata.description as string) || '',
        seoTitle: (metadata.seoTitle as string) || item.title,
        seoDescription: (metadata.seoDescription as string) || '',
        seoKeywords: (metadata.seoKeywords as string[]) || parsedTags,
        data: parsedData,
        categories: parsedCategories,
        tags: parsedTags,
        featured: item.featured,
        order: item.order,
        contentType: item.contentType,
        metadata: parsedMetadata
      };
    });

    // Calculate statistics
    const stats = {
      total: contentItems.length,
      published: contentItems.filter(i => i.status === 'published').length,
      draft: contentItems.filter(i => i.status === 'draft').length,
      archived: contentItems.filter(i => i.status === 'archived').length,
      featured: contentItems.filter(i => i.featured).length
    };

    return NextResponse.json({
      success: true,
      contentItems: transformedItems,
      contentTypes,
      contentSections,
      stats
    });

  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

// POST - Create new content item
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      contentTypeId,
      title,
      slug,
      data,
      status = 'draft',
      featured = false,
      categories = [],
      tags = [],
      metadata = {}
    } = body;

    if (!contentTypeId || !title) {
      return NextResponse.json(
        { error: 'Content type ID and title are required' },
        { status: 400 }
      );
    }

    const contentItem = await prisma.dynamicContentItem.create({
      data: {
        contentTypeId,
        title,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        data: JSON.stringify(data || {}),
        status,
        featured,
        categories: JSON.stringify(categories),
        tags: JSON.stringify(tags),
        metadata: JSON.stringify(metadata),
        author: session.user.name || session.user.email,
        publishedAt: status === 'published' ? new Date() : null
      },
      include: {
        contentType: true
      }
    });

    return NextResponse.json({
      success: true,
      contentItem,
      message: 'Content item created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating content:', error);
    return NextResponse.json(
      { error: 'Failed to create content item' },
      { status: 500 }
    );
  }
}

// PUT - Update content item
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
      data,
      status,
      featured,
      categories,
      tags,
      metadata
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Content item ID is required' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (data !== undefined) updateData.data = JSON.stringify(data);
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'published' && !await prisma.dynamicContentItem.findFirst({
        where: { id, NOT: { publishedAt: null } }
      })) {
        updateData.publishedAt = new Date();
      }
    }
    if (featured !== undefined) updateData.featured = featured;
    if (categories !== undefined) updateData.categories = JSON.stringify(categories);
    if (tags !== undefined) updateData.tags = JSON.stringify(tags);
    if (metadata !== undefined) updateData.metadata = JSON.stringify(metadata);

    const contentItem = await prisma.dynamicContentItem.update({
      where: { id },
      data: updateData,
      include: {
        contentType: true
      }
    });

    return NextResponse.json({
      success: true,
      contentItem,
      message: 'Content item updated successfully'
    });

  } catch (error) {
    console.error('Error updating content:', error);
    return NextResponse.json(
      { error: 'Failed to update content item' },
      { status: 500 }
    );
  }
}

// DELETE - Delete content item
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
        { error: 'Content item ID is required' },
        { status: 400 }
      );
    }

    await prisma.dynamicContentItem.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Content item deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting content:', error);
    return NextResponse.json(
      { error: 'Failed to delete content item' },
      { status: 500 }
    );
  }
}

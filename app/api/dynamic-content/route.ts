import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/dynamic-content - List dynamic content items with pagination, filtering, search
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '10');
  const search = searchParams.get('search') || '';
  const skip = (page - 1) * pageSize;
  const contentTypeId = searchParams.get('contentTypeId');

  const where: {
    OR?: Array<{
      title?: { contains: string; mode: 'insensitive' };
      slug?: { contains: string; mode: 'insensitive' };
      data?: { contains: string; mode: 'insensitive' };
    }>;
    contentTypeId?: string;
  } = {};
  
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
      { data: { contains: search, mode: 'insensitive' } }
    ];
  }
  if (contentTypeId) {
    where.contentTypeId = contentTypeId;
  }

  const [items, total] = await Promise.all([
    prisma.dynamicContentItem.findMany({ where, skip, take: pageSize, orderBy: { order: 'asc' } }),
    prisma.dynamicContentItem.count({ where })
  ]);

  return NextResponse.json({ data: items, total, page, pageSize });
}

// POST /api/dynamic-content - Create a new dynamic content item
export async function POST(request: NextRequest) {
  const data = await request.json();
  const item = await prisma.dynamicContentItem.create({ data });
  return NextResponse.json(item);
}

// PUT /api/dynamic-content?id= - Update a dynamic content item
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const data = await request.json();
  const item = await prisma.dynamicContentItem.update({ where: { id }, data });
  return NextResponse.json(item);
}

// DELETE /api/dynamic-content?id= - Delete a dynamic content item
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  await prisma.dynamicContentItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

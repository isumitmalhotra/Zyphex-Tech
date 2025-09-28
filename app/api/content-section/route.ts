import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/content-section - List content sections with pagination, filtering, search
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '10');
  const search = searchParams.get('search') || '';
  const skip = (page - 1) * pageSize;

  const where = search
    ? { OR: [ { title: { contains: search, mode: 'insensitive' as const } }, { subtitle: { contains: search, mode: 'insensitive' as const } }, { content: { contains: search, mode: 'insensitive' as const } } ] }
    : {};

  const [sections, total] = await Promise.all([
    prisma.contentSection.findMany({ where, skip, take: pageSize, orderBy: { order: 'asc' } }),
    prisma.contentSection.count({ where })
  ]);

  return NextResponse.json({ data: sections, total, page, pageSize });
}

// POST /api/content-section - Create a new content section
export async function POST(request: NextRequest) {
  const data = await request.json();
  const section = await prisma.contentSection.create({ data });
  return NextResponse.json(section);
}

// PUT /api/content-section?id= - Update a content section
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const data = await request.json();
  const section = await prisma.contentSection.update({ where: { id }, data });
  return NextResponse.json(section);
}

// DELETE /api/content-section?id= - Delete a content section
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  await prisma.contentSection.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

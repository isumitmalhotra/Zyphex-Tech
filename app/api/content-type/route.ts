import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/content-type - List content types with pagination, filtering, search
// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '10');
  const search = searchParams.get('search') || '';
  const skip = (page - 1) * pageSize;

  const where = search
    ? { OR: [ { name: { contains: search, mode: 'insensitive' as const } }, { label: { contains: search, mode: 'insensitive' as const } } ] }
    : {};

  const [types, total] = await Promise.all([
    prisma.contentType.findMany({ where, skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
    prisma.contentType.count({ where })
  ]);

  return NextResponse.json({ data: types, total, page, pageSize });
}

// POST /api/content-type - Create a new content type
export async function POST(request: NextRequest) {
  const data = await request.json();
  const type = await prisma.contentType.create({ data });
  return NextResponse.json(type);
}

// PUT /api/content-type?id= - Update a content type
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const data = await request.json();
  const type = await prisma.contentType.update({ where: { id }, data });
  return NextResponse.json(type);
}

// DELETE /api/content-type?id= - Delete a content type
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  await prisma.contentType.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

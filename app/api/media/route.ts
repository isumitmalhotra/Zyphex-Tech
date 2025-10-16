import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/media - List media assets with pagination, filtering, search
// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '10');
  const search = searchParams.get('search') || '';
  const skip = (page - 1) * pageSize;

  const where = search
    ? { OR: [ { filename: { contains: search, mode: 'insensitive' as const } }, { originalName: { contains: search, mode: 'insensitive' as const } }, { category: { contains: search, mode: 'insensitive' as const } } ] }
    : {};

  const [media, total] = await Promise.all([
    prisma.mediaAsset.findMany({ where, skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
    prisma.mediaAsset.count({ where })
  ]);

  return NextResponse.json({ data: media, total, page, pageSize });
}

// POST /api/media - Create a new media asset
export async function POST(request: NextRequest) {
  const data = await request.json();
  const asset = await prisma.mediaAsset.create({ data });
  return NextResponse.json(asset);
}

// PUT /api/media?id= - Update a media asset
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const data = await request.json();
  const asset = await prisma.mediaAsset.update({ where: { id }, data });
  return NextResponse.json(asset);
}

// DELETE /api/media?id= - Delete a media asset
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  await prisma.mediaAsset.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

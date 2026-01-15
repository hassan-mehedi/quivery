import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

// Higher rate limit for read operations (300 requests/minute)
export const GET = withAuth(
  async (request: NextRequest, userId: string, _context: { params: Promise<Record<string, never>> }) => {
    try {
      const tags = await prisma.tag.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(tags, {
      headers: {
        // Cache for 5 minutes (tags rarely change)
        'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('GET tags error:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
},
{ rateLimit: 300 }
);

export const POST = withAuth(async (request: NextRequest, userId: string, _context: { params: Promise<Record<string, never>> }) => {
  try {
    const { name, color } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const existing = await prisma.tag.findFirst({
      where: { name: name.trim(), userId },
    });

    if (existing) {
      return NextResponse.json({ error: 'Tag already exists' }, { status: 400 });
    }

    const tag = await prisma.tag.create({
      data: {
        name: name.trim(),
        color: color || '#8B5CF6',
        userId,
      },
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error('POST tag error:', error);
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
  }
});

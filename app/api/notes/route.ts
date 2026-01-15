import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

// Higher rate limit for read operations (300 requests/minute)
export const GET = withAuth(
  async (request: NextRequest, userId: string, _context: { params: Promise<Record<string, never>> }) => {
    try {
      const { searchParams } = new URL(request.url);

    // Pagination params
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Filter params
    const search = searchParams.get('search');
    const tagIds = searchParams.get('tags')?.split(',').filter(Boolean);

    const where: Record<string, unknown> = {
      userId,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(tagIds?.length && {
        tags: { some: { tagId: { in: tagIds } } },
      }),
    };

    // Fetch notes and count in parallel for pagination
    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        include: { tags: { include: { tag: true } } },
        orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.note.count({ where }),
    ]);

    return NextResponse.json({
      notes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + notes.length < total,
      },
    });
  } catch (error) {
    console.error('GET notes error:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
},
{ rateLimit: 300 }
);

export const POST = withAuth(async (request: NextRequest, userId: string, _context: { params: Promise<Record<string, never>> }) => {
  try {
    const { title, content, tagIds } = await request.json();

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const note = await prisma.note.create({
      data: {
        title: title.trim(),
        content: content || '',
        userId,
        ...(tagIds?.length && {
          tags: { create: tagIds.map((tagId: string) => ({ tagId })) },
        }),
      },
      include: { tags: { include: { tag: true } } },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('POST note error:', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
});

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const tagIds = searchParams.get('tags')?.split(',').filter(Boolean);

    const notes = await prisma.note.findMany({
      where: {
        userId: session.user.id,
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(tagIds?.length && {
          tags: { some: { tagId: { in: tagIds } } },
        }),
      },
      include: { tags: { include: { tag: true } } },
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error('GET notes error:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, content, tagIds } = await request.json();

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const note = await prisma.note.create({
      data: {
        title: title.trim(),
        content: content || '',
        userId: session.user.id,
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
}

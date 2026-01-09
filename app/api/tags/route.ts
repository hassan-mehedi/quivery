import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tags = await prisma.tag.findMany({
      where: { userId: session.user.id },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(tags);
  } catch (error) {
    console.error('GET tags error:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, color } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const existing = await prisma.tag.findFirst({
      where: { name: name.trim(), userId: session.user.id },
    });

    if (existing) {
      return NextResponse.json({ error: 'Tag already exists' }, { status: 400 });
    }

    const tag = await prisma.tag.create({
      data: {
        name: name.trim(),
        color: color || '#8B5CF6',
        userId: session.user.id,
      },
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error('POST tag error:', error);
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
  }
}

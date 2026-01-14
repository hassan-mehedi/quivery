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

    const projects = await prisma.project.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        _count: {
          select: { todos: true },
        },
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('GET projects error:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, color, icon } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        color: color || '#8B5CF6',
        icon: icon || null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('POST project error:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TodoStatus, Priority } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const priorityParam = searchParams.get('priority');

    const where: { userId: string; status?: TodoStatus; priority?: Priority } = {
      userId: session.user.id,
    };

    if (statusParam && statusParam !== 'ALL') {
      where.status = statusParam as TodoStatus;
    }
    if (priorityParam && priorityParam !== 'ALL') {
      where.priority = priorityParam as Priority;
    }

    const todos = await prisma.todo.findMany({
      where,
      orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(todos);
  } catch (error) {
    console.error('GET todos error:', error);
    return NextResponse.json({ error: 'Failed to fetch todos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, status, priority, dueDate } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const todo = await prisma.todo.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        status: status || 'PENDING',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    console.error('POST todo error:', error);
    return NextResponse.json({ error: 'Failed to create todo' }, { status: 500 });
  }
}

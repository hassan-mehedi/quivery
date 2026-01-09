import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const todo = await prisma.todo.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    return NextResponse.json(todo);
  } catch (error) {
    console.error('GET todo error:', error);
    return NextResponse.json({ error: 'Failed to fetch todo' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verify ownership
    const existing = await prisma.todo.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    const { title, description, status, priority, dueDate } = body;

    const todo = await prisma.todo.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      },
    });

    return NextResponse.json(todo);
  } catch (error) {
    console.error('PATCH todo error:', error);
    return NextResponse.json({ error: 'Failed to update todo' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const existing = await prisma.todo.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    await prisma.todo.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE todo error:', error);
    return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 });
  }
}

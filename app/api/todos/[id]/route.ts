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

    const {
      title,
      description,
      status,
      priority,
      dueDate,
      projectId,
      tagIds,
      parentId,
      sortOrder,
    } = body;

    // Update the todo
    const updateData: Record<string, unknown> = {
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(status !== undefined && { status }),
      ...(priority !== undefined && { priority }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(projectId !== undefined && { projectId: projectId || null }),
      ...(parentId !== undefined && { parentId: parentId || null }),
      ...(sortOrder !== undefined && { sortOrder }),
    };

    // Track completion time
    if (status === 'COMPLETED' && existing.status !== 'COMPLETED') {
      updateData.completedAt = new Date();
    } else if (status !== 'COMPLETED' && status !== undefined) {
      updateData.completedAt = null;
    }

    const todo = await prisma.todo.update({
      where: { id },
      data: updateData,
      include: {
        project: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // Update tags if provided
    if (tagIds !== undefined && Array.isArray(tagIds)) {
      // Delete existing tags
      await prisma.todoTag.deleteMany({
        where: { todoId: id },
      });

      // Add new tags
      if (tagIds.length > 0) {
        await prisma.todoTag.createMany({
          data: tagIds.map((tagId: string) => ({
            todoId: id,
            tagId,
          })),
          skipDuplicates: true,
        });
      }

      // Fetch the updated todo with new tags
      const updatedTodo = await prisma.todo.findUnique({
        where: { id },
        include: {
          project: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });

      return NextResponse.json(updatedTodo);
    }

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

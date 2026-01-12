import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TodoStatus, Priority } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ids, action, updates } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Todo IDs are required' }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    // Verify all todos belong to the user
    const userTodos = await prisma.todo.findMany({
      where: {
        id: { in: ids },
        userId: session.user.id,
      },
      select: { id: true },
    });

    if (userTodos.length !== ids.length) {
      return NextResponse.json({ error: 'Some todos not found or unauthorized' }, { status: 403 });
    }

    let result;

    switch (action) {
      case 'complete':
        result = await prisma.todo.updateMany({
          where: { id: { in: ids } },
          data: {
            status: 'COMPLETED' as TodoStatus,
            completedAt: new Date(),
          },
        });
        break;

      case 'uncomplete':
        result = await prisma.todo.updateMany({
          where: { id: { in: ids } },
          data: {
            status: 'PENDING' as TodoStatus,
            completedAt: null,
          },
        });
        break;

      case 'delete':
        result = await prisma.todo.deleteMany({
          where: { id: { in: ids } },
        });
        break;

      case 'update':
        if (!updates) {
          return NextResponse.json({ error: 'Updates are required for update action' }, { status: 400 });
        }

        const updateData: {
          status?: TodoStatus;
          priority?: Priority;
          projectId?: string | null;
        } = {};

        if (updates.status !== undefined) {
          updateData.status = updates.status as TodoStatus;
          if (updates.status === 'COMPLETED') {
            (updateData as any).completedAt = new Date();
          }
        }
        if (updates.priority !== undefined) {
          updateData.priority = updates.priority as Priority;
        }
        if (updates.projectId !== undefined) {
          updateData.projectId = updates.projectId || null;
        }

        result = await prisma.todo.updateMany({
          where: { id: { in: ids } },
          data: updateData,
        });
        break;

      case 'addTags':
        if (!updates?.tagIds || !Array.isArray(updates.tagIds)) {
          return NextResponse.json({ error: 'Tag IDs are required for addTags action' }, { status: 400 });
        }

        // Create TodoTag entries for each todo-tag combination
        const todoTagData = ids.flatMap(todoId =>
          updates.tagIds.map((tagId: string) => ({
            todoId,
            tagId,
          }))
        );

        await prisma.todoTag.createMany({
          data: todoTagData,
          skipDuplicates: true,
        });

        result = { count: ids.length };
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      count: result.count || 0,
    });
  } catch (error) {
    console.error('Bulk operation error:', error);
    return NextResponse.json({ error: 'Bulk operation failed' }, { status: 500 });
  }
}

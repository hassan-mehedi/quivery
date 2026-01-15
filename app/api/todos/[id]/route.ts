import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (request: NextRequest, userId: string, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;

    const todo = await prisma.todo.findFirst({
      where: {
        id,
        userId,
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
});

export const PATCH = withAuth(async (request: NextRequest, userId: string, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const body = await request.json();

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

    // Single transaction to verify ownership, update todo, and update tags
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify ownership
      const existing = await tx.todo.findFirst({
        where: { id, userId },
        select: { id: true, status: true },
      });

      if (!existing) {
        throw new Error('NOT_FOUND');
      }

      // 2. Prepare update data
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

      // 3. Update todo
      await tx.todo.update({
        where: { id },
        data: updateData,
      });

      // 4. Update tags if provided (differential sync - only update what changed)
      if (tagIds !== undefined && Array.isArray(tagIds)) {
        // Get existing tags
        const existingTags = await tx.todoTag.findMany({
          where: { todoId: id },
          select: { tagId: true },
        });

        const existingTagIds = existingTags.map(t => t.tagId);
        const tagsToAdd = tagIds.filter(tagId => !existingTagIds.includes(tagId));
        const tagsToRemove = existingTagIds.filter(tagId => !tagIds.includes(tagId));

        // Only execute operations for tags that actually changed
        const operations = [];

        if (tagsToRemove.length > 0) {
          operations.push(
            tx.todoTag.deleteMany({
              where: { todoId: id, tagId: { in: tagsToRemove } },
            })
          );
        }

        if (tagsToAdd.length > 0) {
          operations.push(
            tx.todoTag.createMany({
              data: tagsToAdd.map((tagId: string) => ({ todoId: id, tagId })),
              skipDuplicates: true,
            })
          );
        }

        if (operations.length > 0) {
          await Promise.all(operations);
        }
      }

      // 5. Fetch final state with relations
      return tx.todo.findUnique({
        where: { id },
        include: {
          project: true,
          tags: { include: { tag: true } },
        },
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }
    console.error('PATCH todo error:', error);
    return NextResponse.json({ error: 'Failed to update todo' }, { status: 500 });
  }
});

export const DELETE = withAuth(async (request: NextRequest, userId: string, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;

    // Verify ownership and delete in transaction
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.todo.findFirst({
        where: { id, userId },
        select: { id: true },
      });

      if (!existing) {
        throw new Error('NOT_FOUND');
      }

      await tx.todo.delete({ where: { id } });
      return { success: true };
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }
    console.error('DELETE todo error:', error);
    return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 });
  }
});

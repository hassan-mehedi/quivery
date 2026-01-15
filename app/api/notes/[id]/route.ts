import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (request: NextRequest, userId: string, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const note = await prisma.note.findFirst({
      where: { id, userId },
      include: { tags: { include: { tag: true } } },
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error('GET note error:', error);
    return NextResponse.json({ error: 'Failed to fetch note' }, { status: 500 });
  }
});

export const PATCH = withAuth(async (request: NextRequest, userId: string, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const { title, content, tagIds } = await request.json();

    const note = await prisma.$transaction(async tx => {
      // Verify ownership
      const existing = await tx.note.findFirst({
        where: { id, userId },
        select: { id: true },
      });

      if (!existing) {
        throw new Error('NOT_FOUND');
      }

      // Update note
      await tx.note.update({
        where: { id },
        data: {
          ...(title !== undefined && { title: title.trim() }),
          ...(content !== undefined && { content }),
        },
      });

      // Update tags if provided (differential sync - only update what changed)
      if (tagIds !== undefined && Array.isArray(tagIds)) {
        // Get existing tags
        const existingTags = await tx.noteTag.findMany({
          where: { noteId: id },
          select: { tagId: true },
        });

        const existingTagIds = existingTags.map(t => t.tagId);
        const tagsToAdd = tagIds.filter(tagId => !existingTagIds.includes(tagId));
        const tagsToRemove = existingTagIds.filter(tagId => !tagIds.includes(tagId));

        // Only execute operations for tags that actually changed
        const operations = [];

        if (tagsToRemove.length > 0) {
          operations.push(
            tx.noteTag.deleteMany({
              where: { noteId: id, tagId: { in: tagsToRemove } },
            })
          );
        }

        if (tagsToAdd.length > 0) {
          operations.push(
            tx.noteTag.createMany({
              data: tagsToAdd.map((tagId: string) => ({ noteId: id, tagId })),
            })
          );
        }

        if (operations.length > 0) {
          await Promise.all(operations);
        }
      }

      return tx.note.findUnique({
        where: { id },
        include: { tags: { include: { tag: true } } },
      });
    });

    return NextResponse.json(note);
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }
    console.error('PATCH note error:', error);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
});

export const DELETE = withAuth(async (request: NextRequest, userId: string, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;

    const result = await prisma.$transaction(async tx => {
      const existing = await tx.note.findFirst({
        where: { id, userId },
        select: { id: true },
      });

      if (!existing) {
        throw new Error('NOT_FOUND');
      }

      await tx.note.delete({ where: { id } });
      return { success: true };
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }
    console.error('DELETE note error:', error);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
});

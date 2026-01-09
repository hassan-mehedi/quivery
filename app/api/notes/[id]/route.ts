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
    const note = await prisma.note.findFirst({
      where: { id, userId: session.user.id },
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
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.note.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const { title, content, tagIds } = await request.json();

    const note = await prisma.$transaction(async tx => {
      await tx.note.update({
        where: { id },
        data: {
          ...(title !== undefined && { title: title.trim() }),
          ...(content !== undefined && { content }),
        },
      });

      if (tagIds !== undefined) {
        await tx.noteTag.deleteMany({ where: { noteId: id } });
        if (tagIds.length > 0) {
          await tx.noteTag.createMany({
            data: tagIds.map((tagId: string) => ({ noteId: id, tagId })),
          });
        }
      }

      return tx.note.findUnique({
        where: { id },
        include: { tags: { include: { tag: true } } },
      });
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error('PATCH note error:', error);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.note.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    await prisma.note.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE note error:', error);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}

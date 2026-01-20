import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (request: NextRequest, userId: string, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const document = await prisma.jsonDocument.findFirst({
      where: { id, userId },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error('GET json-document error:', error);
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 });
  }
});

export const PATCH = withAuth(async (request: NextRequest, userId: string, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const { title, content, description } = await request.json();

    const document = await prisma.$transaction(async tx => {
      // Verify ownership
      const existing = await tx.jsonDocument.findFirst({
        where: { id, userId },
        select: { id: true },
      });

      if (!existing) {
        throw new Error('NOT_FOUND');
      }

      // Validate JSON syntax if content is being updated
      if (content !== undefined) {
        try {
          JSON.parse(content);
        } catch (e) {
          throw new Error('INVALID_JSON');
        }
      }

      // Update document
      const updatedDocument = await tx.jsonDocument.update({
        where: { id },
        data: {
          ...(title !== undefined && { title: title.trim() }),
          ...(content !== undefined && { content }),
          ...(description !== undefined && { description: description?.trim() || null }),
        },
      });

      return updatedDocument;
    });

    return NextResponse.json(document);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'NOT_FOUND') {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      }
      if (error.message === 'INVALID_JSON') {
        return NextResponse.json({ error: 'Invalid JSON syntax' }, { status: 400 });
      }
    }
    console.error('PATCH json-document error:', error);
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
  }
});

export const DELETE = withAuth(async (request: NextRequest, userId: string, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;

    const result = await prisma.$transaction(async tx => {
      const existing = await tx.jsonDocument.findFirst({
        where: { id, userId },
        select: { id: true },
      });

      if (!existing) {
        throw new Error('NOT_FOUND');
      }

      await tx.jsonDocument.delete({ where: { id } });
      return { success: true };
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    console.error('DELETE json-document error:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
});

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

export const PATCH = withAuth(async (request: NextRequest, userId: string, _context: { params: Promise<Record<string, never>> }) => {
  try {
    const body = await request.json();
    const { updates } = body;

    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: 'Updates must be an array' }, { status: 400 });
    }

    // Validate updates array
    for (const update of updates) {
      if (!update.id || typeof update.order !== 'number') {
        return NextResponse.json(
          { error: 'Each update must have an id and order' },
          { status: 400 }
        );
      }
    }

    // Update all notes in a transaction (with ownership verification)
    await prisma.$transaction(
      updates.map(update =>
        prisma.note.update({
          where: {
            id: update.id,
            userId, // Ensure user owns the note
          },
          data: { sortOrder: update.order },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating note order:', error);
    return NextResponse.json({ error: 'Failed to update note order' }, { status: 500 });
  }
});

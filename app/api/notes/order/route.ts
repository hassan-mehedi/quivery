import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: NextRequest) {
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

    // Update all notes in a transaction
    await prisma.$transaction(
      updates.map(update =>
        prisma.note.update({
          where: { id: update.id },
          data: { sortOrder: update.order },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating note order:', error);
    return NextResponse.json({ error: 'Failed to update note order' }, { status: 500 });
  }
}

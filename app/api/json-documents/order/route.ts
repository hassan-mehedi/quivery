import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

export const PATCH = withAuth(async (request: NextRequest, userId: string, _context: { params: Promise<Record<string, never>> }) => {
  try {
    const { updates } = await request.json();

    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: 'Invalid updates format' }, { status: 400 });
    }

    // Update all documents in a transaction
    await prisma.$transaction(
      updates.map((update: { id: string; order: number }) =>
        prisma.jsonDocument.update({
          where: { id: update.id, userId },
          data: { sortOrder: update.order },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH json-documents/order error:', error);
    return NextResponse.json({ error: 'Failed to update document order' }, { status: 500 });
  }
});

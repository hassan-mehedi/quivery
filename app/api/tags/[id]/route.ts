import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.tag.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    await prisma.tag.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE tag error:', error);
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 });
  }
}

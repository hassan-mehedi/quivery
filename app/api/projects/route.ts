import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

// Higher rate limit for read operations (300 requests/minute)
export const GET = withAuth(
  async (request: NextRequest, userId: string, _context: { params: Promise<Record<string, never>> }) => {
    try {
      const projects = await prisma.project.findMany({
      where: {
        userId,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        _count: {
          select: { todos: true },
        },
      },
    });

    return NextResponse.json(projects, {
      headers: {
        // Cache for 5 minutes (projects rarely change)
        'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('GET projects error:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
},
{ rateLimit: 300 }
);

export const POST = withAuth(async (request: NextRequest, userId: string, _context: { params: Promise<Record<string, never>> }) => {
  try {
    const body = await request.json();
    const { name, color, icon } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        color: color || '#8B5CF6',
        icon: icon || null,
        userId,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('POST project error:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
});
